import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {Client,type Room} from '@colyseus/sdk';
import type {Snapshot} from '../packages/shared/src/index.ts';

const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
test('four independent clients coordinate gas, turn by seat, and receive identical boat state',{timeout:45000},async()=>{
  const child=spawn(process.execPath,['--import','tsx','packages/server/src/index.ts'],{env:{...process.env,PORT:'2571',DATA_DIR:'test-results/four-player-data'},stdio:'pipe'});
  let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
  const rooms:Room[]=[],states=new Map<string,Snapshot>(),history=new Map<string,Map<number,Snapshot>>();
  let timer:ReturnType<typeof setInterval>|undefined;
  try{
    let ready=false;
    for(let i=0;i<200;i++){try{ready=(await fetch('http://localhost:2571/health')).ok;}catch{}if(ready)break;await delay(100);}
    assert.ok(ready,output);
    for(let i=0;i<4;i++){
      const client=new Client('ws://localhost:2571'),options={name:`Test Player ${i+1}`,character:['hippo','croc','frog','penguin'][i],course:'lagoon',boatColor:i===0?'coral':'forest'};
      const room=i===0?await client.create('raft',options):await client.joinById(rooms[0].roomId,options);
      rooms.push(room);const snapshots=new Map<number,Snapshot>();history.set(room.sessionId,snapshots);
      room.onMessage('snapshot',(s:Snapshot)=>{states.set(room.sessionId,s);snapshots.set(s.tick,s);if(snapshots.size>100)snapshots.delete(snapshots.keys().next().value!);});
      room.onMessage('notice',()=>{});room.onMessage('voice-left',()=>{});
    }
    await delay(200);assert.ok(rooms.every(r=>states.get(r.sessionId)?.players.length===4));
    assert.ok(rooms.every(r=>states.get(r.sessionId)?.boatColor==='coral'),'host colour is shared with every player, joiner preferences do not override it');
    rooms[0].send('start');
    for(let i=0;i<70;i++){if(states.get(rooms[0].sessionId)?.phase==='playing'&&states.get(rooms[0].sessionId)?.countdown===0)break;await delay(100);}
    assert.equal(states.get(rooms[0].sessionId)?.countdown,0);
    const sendAll=(power:(seat:number)=>number)=>{for(const room of rooms){const seat=states.get(room.sessionId)!.players.find(p=>p.id===room.sessionId)!.seat;room.send('input',{x:1,z:0,power:power(seat)});}};
    timer=setInterval(()=>sendAll(()=>1),40);await delay(1200);clearInterval(timer);timer=undefined;
    const straight=states.get(rooms[0].sessionId)!;
    assert.equal(straight.phase,'playing');assert.ok(Math.abs(straight.z-5)<.1,'opposing inward forces cancel');
    assert.ok(Math.abs(straight.angle)<.05,'symmetric seat thrust balances turning');
    assert.ok(straight.players.every(p=>p.thrust>.9&&p.gas<90),'all four independent players fire and consume fuel');
    assert.ok(straight.players.filter(p=>p.seat<2).every(p=>p.z<-.7),'front animals push backward');
    assert.ok(straight.players.filter(p=>p.seat>=2).every(p=>p.z>.7),'rear animals push forward');
    const tick=[...history.get(rooms[0].sessionId)!.keys()].reverse().find(t=>rooms.every(r=>history.get(r.sessionId)!.has(t)))!;
    assert.ok(Number.isFinite(tick));const shared=history.get(rooms[0].sessionId)!.get(tick)!;
    for(const room of rooms)assert.deepEqual(history.get(room.sessionId)!.get(tick)!.boats,shared.boats,'all four clients receive identical authoritative boat state');
    timer=setInterval(()=>sendAll(seat=>seat>=2?1:0),40);await delay(1200);clearInterval(timer);timer=undefined;
    const turning=states.get(rooms[0].sessionId)!;
    assert.ok(turning.z>5.5,'rear pair propel the shared boat forward');
    assert.ok(turning.players.filter(p=>p.seat<2).every(p=>p.thrust===0),'front players can release independently');
    sendAll(()=>0);await delay(650);assert.ok(states.get(rooms[0].sessionId)!.players.every(p=>p.thrust===0));
    console.log(JSON.stringify({players:4,sharedTick:tick,straightZ:straight.z,straightAngle:straight.angle,turnAngle:turning.angle,allFourInputs:true,identicalBoatStates:true}));
  }finally{if(timer)clearInterval(timer);await Promise.race([Promise.allSettled(rooms.map(r=>r.leave())),delay(1000)]);child.kill();}
});
