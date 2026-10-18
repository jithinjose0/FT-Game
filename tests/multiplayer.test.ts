import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { Client, type Room } from '@colyseus/sdk';
import type { Snapshot } from '../packages/shared/src/index.ts';

const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
test('real server: four/eight players share one boat, local crews, character choices and input ownership',{timeout:90000},async()=>{
  const child=spawn(process.execPath,['--import','tsx','packages/server/src/index.ts'],{env:{...process.env,PORT:'2568',DATA_DIR:'test-results/data'},stdio:'pipe'});
  let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
  const rooms:Room[]=[];
  try{
    let ready=false;
    for(let i=0;i<300;i++){try{const r=await fetch('http://localhost:2568/health');if(r.ok){ready=true;break;}}catch{}await delay(100);}
    assert.ok(ready,output);
    const clients=Array.from({length:5},()=>new Client('ws://localhost:2568'));
    const states=new Map<string,Snapshot>();
    function watch(room:Room){room.onMessage('snapshot',(s:Snapshot)=>states.set(room.sessionId,s));room.onMessage('notice',()=>{});rooms.push(room);}
    const host=await clients[0].create('raft',{name:'Captain',course:'lagoon'});watch(host);
    for(let i=1;i<4;i++)watch(await clients[i].joinById(host.roomId,{name:'Sailor '+i}));
    await assert.rejects(clients[4].joinById(host.roomId,{name:'Fifth'}));
    await delay(250);const initial=states.get(host.sessionId)!;
    assert.equal(initial.players.length,4);assert.equal(new Set(initial.players.map(p=>p.seat)).size,4);
    rooms[1].send('start');await delay(150);assert.equal(states.get(host.sessionId)!.phase,'lobby');
    host.send('start');
    for(let i=0;i<100;i++){if(states.get(host.sessionId)?.phase==='playing'&&states.get(host.sessionId)!.countdown===0)break;await delay(100);}
    assert.equal(states.get(host.sessionId)!.phase,'playing');assert.equal(states.get(host.sessionId)!.countdown,0);
    const timer=setInterval(()=>host.send('input',{x:0,z:1,power:1}),50);await delay(1200);clearInterval(timer);
    const a=states.get(host.sessionId)!,b=states.get(rooms[1].sessionId)!;
    assert.ok(a.players.find(p=>p.id===host.sessionId)!.gas<90,`fuel must drain: ${JSON.stringify(a)}`);assert.ok(a.z>5.1,`raft must move: ${JSON.stringify(a)}`);assert.ok(Math.abs(a.z-b.z)<.3,'clients must see the same authoritative boat');
    await delay(650);assert.equal(states.get(host.sessionId)!.players.find(p=>p.id===host.sessionId)!.thrust,0,'stale inputs must stop');
    host.send('rescue');await delay(100);assert.equal(states.get(host.sessionId)!.penalties,0,'one of four players cannot rescue alone');
    rooms[1].send('rescue');await delay(150);assert.equal(states.get(host.sessionId)!.penalties,5);
    await host.leave();await delay(250);assert.equal(states.get(rooms[1].sessionId)!.host,rooms[1].sessionId);assert.equal(states.get(rooms[1].sessionId)!.players.length,3);
    rooms.splice(0,1);
    const leaderboard=await fetch('http://localhost:2568/api/leaderboard');assert.equal(leaderboard.status,200);assert.ok(Array.isArray(await leaderboard.json()));

    const crewClients=Array.from({length:9},()=>new Client('ws://localhost:2568'));
    const crew=await crewClients[0].create('raft',{crewSize:8,course:'moonlight',name:'Crewmate 1',character:'frog'});watch(crew);
    const crewRooms=[crew];
    for(let i=1;i<8;i++){const r=await crewClients[i].joinById(crew.roomId,{name:`Crewmate ${i+1}`,character:i%2?'croc':'hippo'});watch(r);crewRooms.push(r);}
    await assert.rejects(crewClients[8].joinById(crew.roomId,{name:'Ninth'}));
    await delay(250);
    const crewState=states.get(crew.sessionId)!;
    assert.equal(crewState.mode,'coop');assert.equal(crewState.players.length,8);assert.equal(crewState.boats!.length,1);
    assert.ok(crewState.players.every(p=>p.boat===0));assert.equal(new Set(crewState.players.map(p=>p.seat)).size,8);
    assert.equal(crewState.players.find(p=>p.id===crew.sessionId)!.character,'frog');
    crew.send('character',{id:crewRooms[1].sessionId,character:'bear'});await delay(100);
    assert.equal(states.get(crew.sessionId)!.players.find(p=>p.id===crewRooms[1].sessionId)!.character,'croc','cannot change someone else’s character');
    crew.send('start');
    for(let i=0;i<100;i++){if(states.get(crew.sessionId)?.countdown===0&&states.get(crew.sessionId)?.phase==='playing')break;await delay(100);}
    const crewTimer=setInterval(()=>{crew.send('input',{x:0,z:1,power:1});crew.send('localInputs',[{id:crewRooms[1].sessionId,input:{x:0,z:-1,power:1}}]);},50);
    await delay(1000);clearInterval(crewTimer);
    const racing=states.get(crew.sessionId)!;
    assert.ok(racing.boats![0].vz>.4,'any crewmate must move the shared raft');assert.ok(Math.abs(racing.z-states.get(crewRooms[1].sessionId)!.z)<.3,'all crewmates must see the same boat');
    assert.equal(racing.players.find(p=>p.id===crewRooms[1].sessionId)!.gas,100,'forged crewmate inputs must be ignored');

    await assert.rejects(crewClients[8].create('raft',{mode:'race'}));
    const local=await crewClients[8].create('raft',{crewSize:8,course:'lagoon',localPlayers:Array.from({length:8},(_,i)=>({name:`Local ${i+1}`,character:i===7?'penguin':'bear'}))});watch(local);
    await delay(150);const couch=states.get(local.sessionId)!;assert.equal(couch.boats!.length,1);assert.ok(couch.players.every(p=>p.boat===0));
    assert.equal(couch.players.length,8);assert.ok(couch.players.every(p=>p.owner===local.sessionId));
    assert.equal(couch.players.find(p=>p.id===local.sessionId+':7')!.character,'penguin');
    await assert.rejects(crewClients[8].create('raft',{mode:'coop',localPlayers:Array.from({length:5},()=>({name:'Overflow'}))}));
    local.send('start');
    for(let i=0;i<100;i++){if(states.get(local.sessionId)?.countdown===0&&states.get(local.sessionId)?.phase==='playing')break;await delay(100);}
    const couchTimer=setInterval(()=>local.send('localInputs',[{id:local.sessionId+':7',input:{x:0,z:1,power:1}}]),50);
    await delay(800);clearInterval(couchTimer);
    const couchState=states.get(local.sessionId)!;
    assert.ok(couchState.players.find(p=>p.id===local.sessionId+':7')!.gas<95);assert.equal(couchState.players.find(p=>p.id===local.sessionId)!.gas,100);
  }finally{await Promise.race([Promise.allSettled(rooms.map(r=>r.leave())),delay(1000)]);child.kill();}
});
