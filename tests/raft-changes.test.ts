import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {RaftRoom} from '../packages/server/src/rooms/RaftRoom.ts';
import {ServerPhysics} from '../packages/server/src/physics/ServerPhysics.ts';
import {courseFrame,gripOffset,sanitizeInput,obstaclePose,COURSES} from '../packages/shared/src/index.ts';
import {courseCamera} from '../packages/shared/src/camera.ts';

async function crew(){
 const r=new RaftRoom();r.setSimulationInterval=()=>{};r.lock=async()=>{};r.unlock=async()=>{};r.broadcast=()=>{};await r.onCreate({course:'lagoon'});
 r.game.players=Array.from({length:4},(_,seat)=>({id:`p${seat}`,owner:`p${seat}`,name:`Crew ${seat}`,seat,gas:100,thrust:0,x:0,z:1,skin:'classic',grip:0}));r.game.host='p0';r.game.phase='playing';return r;
}
test('four idle players do not propel the raft, even after ten seconds',async()=>{
 const r=await crew();try{for(let i=0;i<600;i++)r.update();assert.ok(Math.abs(r.game.z-5)<.001);assert.ok(Math.abs(r.game.x)<.001);assert.ok(r.game.players.every(p=>p.gas===100));}finally{r.onDispose();r.clock.clear();}
});
test('sideways rim movement is owned, bounded and independent of thrust',async()=>{
 const r=await crew();try{
  assert.equal(sanitizeInput({x:0,z:1,power:0,move:Infinity}).move,0);
  r.acceptInput('p0','p1',{x:0,z:1,power:0,move:1});assert.equal(r.inputs.has('p1'),false);
  for(let i=0;i<180;i++){for(let seat=0;seat<4;seat++)r.acceptInput(`p${seat}`,`p${seat}`,{x:0,z:1,power:0,move:seat%2?1:-1});r.update();}
  assert.deepEqual(r.game.players.map(p=>p.grip),[-1,1,-1,1]);assert.ok(Math.abs(r.game.z-5)<.001);
  for(let seat=0;seat<4;seat++){const a=gripOffset(seat,-1),b=gripOffset(seat,1);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>1.5);}
 }finally{r.onDispose();r.clock.clear();}
});
test('a single border spike immediately fails all four players and freezes the round until restart',async()=>{
 const r=await crew();try{
  const f=courseFrame('lagoon',18);r.physics.reset(f.x+f.width/2-2,18);r.game.boats![0].health=100;r.update();
  assert.equal(r.game.phase,'failed');assert.equal(r.game.boats![0].health,0);assert.equal(r.game.penalties,0);assert.match(r.game.failure!,/spike/i);assert.equal(r.game.boats![0].finishTime,undefined);
  assert.ok(r.game.players.every(p=>p.thrust===0));const z=r.game.z,time=r.game.time;
  for(let i=0;i<120;i++){r.acceptInput('p0','p0',{x:0,z:1,power:1,move:1});r.update();}
  assert.equal(r.game.z,z);assert.equal(r.game.time,time);
  r.restart();assert.equal(r.game.phase,'lobby');assert.equal(r.game.boats![0].health,100);assert.ok(r.game.players.every(p=>p.grip===0));
 }finally{r.onDispose();r.clock.clear();}
});
test('spiked mines pop on first contact, bypassing damage cooldown',async()=>{
 const p=new ServerPhysics();await p.init('lagoon');try{const mine=COURSES.lagoon.obstacles.find(o=>o.kind==='mine')!,pose=obstaclePose(mine,0,'lagoon');p.reset(pose.x,pose.z);p.step(0);assert.equal(p.spikeHit,true);}finally{p.dispose();}
});
test('shuffle changes the thrust lever arm',async()=>{
 const angles:number[]=[];
 for(const grip of [-1,1]){const p=new ServerPhysics();await p.init('lagoon');try{for(let i=0;i<60;i++){p.thrust(0,{x:0,z:1,power:1},grip);p.step(0);}angles.push(p.angle);}finally{p.dispose();}}
 assert.ok(Math.abs(angles[0]-angles[1])>.05);
});
test('portrait camera fits both banks at wide pools and narrow paths',()=>{
 for(const [w,h] of [[390,844],[360,780],[844,390]])for(const width of [19,15,8.5]){const v=courseCamera(w/h,width,width,0);assert.ok(v.radius*Math.tan(v.fov/2)*(w/h)>=(width+4)/2-.001);assert.ok(v.beta<.6);}
});
