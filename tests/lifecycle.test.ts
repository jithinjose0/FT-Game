import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { FINISH } from '../packages/shared/src/index.ts';

test('checkpoint, finish, leaderboard persistence, and restart use authoritative simulation',async()=>{
  process.env.DATA_DIR='test-results/lifecycle';
  const { RaftRoom }=await import('../packages/server/src/rooms/RaftRoom.ts');
  const { scores }=await import('../packages/server/src/storage.ts');
  const room=new RaftRoom();
  room.setSimulationInterval=()=>{};
  room.lock=async()=>{};room.unlock=async()=>{};
  const messages:unknown[]=[];room.broadcast=(_type:any,data:any)=>{messages.push(data);};
  await room.onCreate({course:'lagoon'});
  try{
    room.game.players.push({id:'test',name:'Lifecycle test',seat:0,gas:100,thrust:0,x:0,z:1,skin:'classic'});
    room.game.phase='playing';room.game.time=40;
    room.game.players[0].gas=0;
    room.inputs.set('test',{input:{x:0,z:1,power:1},at:Date.now()});room.update();
    assert.equal(room.game.players[0].gas,0,'holding thrust at empty must not generate free fuel');
    assert.equal(room.game.players[0].thrust,0);
    room.inputs.clear();room.update();assert.ok(room.game.players[0].gas>0,'releasing thrust refills fuel');
    room.physics.reset(7,56);room.update();assert.equal(room.game.checkpoint,55);
    room.physics.reset(0,FINISH+.1);room.update();assert.equal(room.game.phase,'finished');
    for(let i=0;i<50;i++){if((await scores()).some(s=>s.name==='Lifecycle test'))break;await new Promise(r=>setTimeout(r,20));}
    assert.ok((await scores()).some(s=>s.name==='Lifecycle test'&&s.time>=40));
    room.restart();assert.equal(room.game.phase,'lobby');assert.equal(room.game.z,5);assert.equal(room.game.checkpoint,0);assert.equal(room.game.time,0);assert.equal(room.game.players[0].gas,100);
  }finally{room.onDispose();room.clock.clear();}
});

test('eight crewmates complete and restart the same boat together',async()=>{
  const {RaftRoom}=await import('../packages/server/src/rooms/RaftRoom.ts');
  const room=new RaftRoom();room.setSimulationInterval=()=>{};room.lock=async()=>{};room.unlock=async()=>{};room.broadcast=()=>{};
  await room.onCreate({course:'lagoon',crewSize:8});
  try{
    room.game.players=Array.from({length:8},(_,seat)=>({id:`crew${seat}`,name:`Crew ${seat}`,seat,boat:0,gas:100,thrust:0,x:0,z:1,skin:'classic',character:'hippo'}));
    room.game.phase='playing';room.game.time=40;room.game.penalties=10;
    room.physics.reset(0,FINISH+.1);room.update();
    assert.equal(room.game.phase,'finished');assert.equal(room.game.boats!.length,1);assert.ok(room.game.boats![0].finishTime!>50);
    assert.ok(room.game.players.every(p=>p.thrust===0));assert.ok(!('winner' in room.game));
    room.restart();assert.equal(room.game.phase,'lobby');assert.equal(room.game.boats![0].finishTime,undefined);assert.equal(room.game.players.length,8);
  }finally{room.onDispose();room.clock.clear();}
});
