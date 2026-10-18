import { Room, ServerError, type Client } from '@colyseus/core';
import { randomBytes } from 'node:crypto';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { COURSES, FINISH, TICK, courseFrame, courseCoins, sanitizeInput, isCharacter, type Snapshot, type Input, type CourseId } from '@ft/shared';
import { ServerPhysics } from '../physics/ServerPhysics.ts';
import { saveScore } from '../storage.ts';

export class RaftRoom extends Room {
  maxClients=4;
  physics!:ServerPhysics;
  game!:Snapshot;
  inputs=new Map<string,{input:Input;at:number}>();
  votes=new Set<string>();lastReset=0;accumulator=0;
  async onCreate(options:any){
    if(options.mode&&options.mode!=='coop')throw new ServerError(400,'This game is shared-boat co-op. Refresh the client to join a crew.');
    const course:CourseId=Object.hasOwn(COURSES,options.course)?options.course:'lagoon';
    this.maxClients=options.crewSize===8?8:4;
    this.roomId=randomBytes(4).toString('hex').slice(0,6).toUpperCase();
    this.physics=new ServerPhysics();await this.physics.init(course,this.maxClients);
    this.game={room:this.roomId,phase:'lobby',mode:'coop',crewSize:this.maxClients,boats:[{id:0,x:0,y:0,z:5,angle:0,vx:0,vz:0,penalties:0,checkpoint:0,health:100,roll:0,pitch:0}],coins:0,collected:[],damageTick:0,course,players:[],x:0,z:5,angle:0,vx:0,vz:0,time:0,penalties:0,checkpoint:0,countdown:0,host:'',tick:0};
    this.onMessage('input',(client,value)=>this.acceptInput(client.sessionId,client.sessionId,value));
    this.onMessage('localInputs',(client,value)=>{if(Array.isArray(value))for(const item of value.slice(0,8))if(item&&typeof item.id==='string')this.acceptInput(client.sessionId,item.id,item.input);});
    this.onMessage('character',(client,value)=>{if(this.game.phase!=='lobby'||!value||!isCharacter(value.character))return;const player=this.ownedPlayer(client.sessionId,value.id||client.sessionId);if(player)player.character=value.character;});
    this.onMessage('start',client=>{if(client.sessionId===this.game.host&&this.game.phase==='lobby'){this.game.phase='playing';this.game.countdown=3;this.votes.clear();}});
    this.onMessage('restart',client=>{if(client.sessionId===this.game.host&&['finished','failed'].includes(this.game.phase))this.restart();});
    this.onMessage('rescue',(client,value)=>{
      const id=typeof value?.id==='string'?value.id:client.sessionId;
      if(!this.ownedPlayer(client.sessionId,id)||this.game.phase!=='playing'||this.game.countdown>0||Date.now()-this.lastReset<3000)return;
      this.votes.add(id);
      if(this.votes.size>=Math.ceil(this.game.players.length/2))this.rescue();else client.send('notice','Rescue vote received. Half the crew must agree.');
    });
    this.setSimulationInterval(delta=>{this.accumulator+=Math.min(delta/1000,.25);while(this.accumulator>=TICK){this.update();this.accumulator-=TICK;}},1000/60);
  }
  ownedPlayer(owner:string,id:string){return this.game.players.find(p=>p.id===id&&(p.owner||p.id)===owner);}
  acceptInput(owner:string,id:string,value:unknown){if(this.ownedPlayer(owner,id))this.inputs.set(id,{input:sanitizeInput(value),at:Date.now()});}
  onJoin(client:Client,options:any){
    const requested=Array.isArray(options.localPlayers)?options.localPlayers.slice(0,9):[{name:options.name,character:options.character}];
    if(!requested.length||requested.length+this.game.players.length>this.maxClients)throw new ServerError(400,'Not enough free seats on this boat.');
    for(let i=0;i<requested.length;i++){
      const item=requested[i]||{},seat=Array.from({length:this.maxClients},(_,i)=>i).find(seat=>!this.game.players.some(p=>p.seat===seat))!;
      const name=String(item.name||options.name||'Captain').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,18)||'Captain';
      this.game.players.push({id:i===0?client.sessionId:`${client.sessionId}:${i}`,owner:client.sessionId,name,boat:0,seat,gas:100,thrust:0,x:0,z:1,skin:'classic',character:isCharacter(item.character)?item.character:'hippo'});
    }
    if(!this.game.host)this.game.host=client.sessionId;
    if(this.game.players.length>=this.maxClients)void this.lock();client.send('snapshot',this.game);
  }
  onLeave(client:Client){
    for(const p of this.game.players.filter(p=>(p.owner||p.id)===client.sessionId)){this.inputs.delete(p.id);this.votes.delete(p.id);}
    this.game.players=this.game.players.filter(p=>(p.owner||p.id)!==client.sessionId);
    if(this.game.host===client.sessionId)this.game.host=this.game.players[0]?.owner||this.game.players[0]?.id||'';
    if(!['finished','failed'].includes(this.game.phase))void this.unlock();
  }
  restart(){
    Object.assign(this.game,{phase:'lobby',time:0,penalties:0,checkpoint:0,countdown:0,x:0,z:5,angle:0,vx:0,vz:0,coins:0,collected:[],damageTick:0,failure:undefined});
    Object.assign(this.game.boats![0],{x:0,y:0,z:5,angle:0,vx:0,vz:0,penalties:0,checkpoint:0,health:100,roll:0,pitch:0,finishTime:undefined});
    this.physics.reset();this.physics.time=0;for(const p of this.game.players){p.gas=100;p.thrust=0;p.grip=0;}this.inputs.clear();this.votes.clear();this.lastReset=0;void this.unlock();
  }
  rescue(reason='Crew reset to checkpoint.'){
    const z=this.game.checkpoint||5,x=courseFrame(this.game.course,z).x;this.physics.reset(x,z);Object.assign(this.game,{x,z,angle:0,vx:0,vz:0});this.game.penalties+=5;this.lastReset=Date.now();this.votes.clear();
    this.game.boats![0].health=100;this.game.failure=reason;
    this.broadcast('notice',`${reason} +5 seconds. Raft repaired.`);
  }
  fail(reason:string){
    if(this.game.phase!=='playing')return;
    this.game.phase='failed';this.game.failure=reason;this.game.boats![0].health=0;
    this.inputs.clear();this.votes.clear();for(const p of this.game.players)p.thrust=0;
    this.physics.body.body.setLinearVelocity(Vector3.Zero());this.physics.body.body.setAngularVelocity(Vector3.Zero());
    this.game.vx=0;this.game.vz=0;void this.lock();this.broadcast('notice',reason);
  }
  update(){
    const g=this.game;g.tick++;
    if(g.phase==='playing'){
      if(g.countdown>0)g.countdown=Math.max(0,g.countdown-TICK);
      else{
        g.time+=TICK;
        for(const player of g.players){
          const entry=this.inputs.get(player.id),input=entry&&Date.now()-entry.at<350?entry.input:{x:0,z:0,power:0};
          this.physics.lean(input);
          player.grip=Math.max(-1,Math.min(1,(player.grip||0)+(input.move||0)*TICK*.9));
          const length=Math.hypot(input.x,input.z),requested=input.power*Math.min(1,length);
          player.thrust=Math.min(requested,player.gas/(TICK*26));player.x=input.x;player.z=input.z;
          if(player.thrust>0){player.gas=Math.max(0,player.gas-player.thrust*TICK*26);this.physics.thrust(player.seat,{x:input.x/length,z:input.z/length,power:player.thrust},player.grip);}
          else if(requested===0)player.gas=Math.min(100,player.gas+TICK*19);
        }
        this.physics.step(COURSES[g.course].current);
        const pos=this.physics.raft.position,v=this.physics.body.body.getLinearVelocity(),frame=courseFrame(g.course,pos.z);
        Object.assign(g,{x:pos.x,z:pos.z,angle:this.physics.angle,vx:v.x,vz:v.z});
        const boat=g.boats![0],damage=this.physics.contactDamage+this.physics.landingImpact*(2+Math.abs(this.physics.roll)*8+Math.abs(this.physics.pitch)*5);
        if(damage>0){boat.health=Math.max(0,(boat.health??100)-damage);g.damageTick=g.tick;}
        if(this.physics.spikeHit)this.fail('A spike popped the raft. The whole crew failed.');
        else if(!Number.isFinite(g.x)||!Number.isFinite(g.z)||g.z< -8||Math.abs(g.x-frame.x)>frame.width/2+4||this.physics.height<frame.height-4)this.rescue('The raft fell off the channel.');
        else if((boat.health??100)<=0)this.rescue('The raft burst after too much damage.');
        else if(Math.abs(this.physics.roll)>.9||Math.abs(this.physics.pitch)>1.05)this.rescue('The raft tipped over. Lean together to balance.');
        else{
          for(const coin of courseCoins(g.course))if(!g.collected!.includes(coin.id)&&Math.hypot(g.x-coin.x,g.z-coin.z)<2.15&&Math.abs(this.physics.height-coin.y)<2){g.collected!.push(coin.id);g.coins=(g.coins||0)+1;}
          for(const cp of [55,110,155])if(g.z>cp&&cp>g.checkpoint){g.checkpoint=cp;this.broadcast('notice','Checkpoint secured. The whole crew made it.');}
          if(g.z>=FINISH&&Math.abs((g.x-frame.x)*frame.nx)<frame.width/2&&Math.abs(this.physics.height-frame.height)<2){
            g.phase='finished';g.boats![0].finishTime=Number((g.time+g.penalties).toFixed(3));for(const p of g.players)p.thrust=0;void this.lock();
            saveScore({name:g.players.map(p=>p.name).join(' + '),mode:'coop',course:g.course,time:g.boats![0].finishTime!,date:new Date().toISOString()}).catch(error=>{console.error(error);this.broadcast('notice','Journey complete, but the completion record could not be saved.');});
          }
        }
      }
    }
    Object.assign(g.boats![0],{x:g.x,y:this.physics.height,z:g.z,angle:g.angle,vx:g.vx,vz:g.vz,penalties:g.penalties,checkpoint:g.checkpoint,roll:this.physics.roll,pitch:this.physics.pitch});
    if(g.tick%2===0)this.broadcast('snapshot',g);
  }
  onDispose(){this.physics?.dispose();}
}
