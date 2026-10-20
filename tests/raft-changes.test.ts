import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {RaftRoom} from '../packages/server/src/rooms/RaftRoom.ts';
import {ServerPhysics} from '../packages/server/src/physics/ServerPhysics.ts';
import {courseFrame,gripOffset,sanitizeInput,obstaclePose,COURSES,raftHazardContact,hazardContact,raftBankContact,characterThrust} from '../packages/shared/src/index.ts';
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
 for(const [w,h] of [[390,844],[360,780],[844,390]])for(const width of [19,15,8.5]){const v=courseCamera(w/h,width,width,0);assert.ok(v.radius*Math.tan(v.fov/2)*(w/h)>=(width+8)/2-.001);assert.ok(v.beta<.7);}
});

test('mobile follow camera retains both banks, scenery margins and distance ahead',()=>{
 for(const aspect of [390/844,844/390]){
  const view=courseCamera(aspect,19,19,0,false,true);
  assert.ok(view.radius*Math.tan(view.fov/2)*aspect>=(19+10)/2-.001);
  assert.ok(view.lookahead>=4.5);assert.ok(view.beta>.5);
 }
});

test('spikes at the front of a rotated long raft hit even when the old centre circle misses',()=>{
 const o={x:0,z:69,radius:.75,kind:'mine' as const},pose=obstaclePose(o,0,'lagoon');
 for(const angle of [0,Math.PI/2,Math.PI*.7]){
  const x=pose.x-Math.sin(angle)*4,z=pose.z-Math.cos(angle)*4;
  assert.equal(hazardContact(o,0,'lagoon',x,z),false);
  assert.equal(raftHazardContact(o,0,'lagoon',x,z,angle,8),true);
  assert.equal(raftHazardContact(o,0,'lagoon',x-10,z-10,angle,8),false);
 }
});

test('bow contact with a bank spike counts before the raft centre enters the spike zone',()=>{
 const f=courseFrame('lagoon',14);
 assert.equal(raftBankContact('lagoon',f.x+f.width/2-1.5,12.5,0),true);
 assert.equal(raftBankContact('lagoon',f.x,12.5,0),false);
});

test('every moving spiked obstacle fails the round on contact before Havok can push the raft clear',async()=>{
 for(const o of COURSES.lagoon.obstacles.filter(o=>!['rock','island','buoy'].includes(o.kind))){
  const p=new ServerPhysics();await p.init('lagoon');try{
   p.time=o.kind==='pendulum'?-o.z/1.3:0;const pose=obstaclePose(o,p.time,'lagoon');p.reset(pose.x,pose.z);p.step(0);assert.equal(p.spikeHit,true,`${o.kind} at ${o.z}`);
  }finally{p.dispose();}
 }
});

test('thrust follows each animal facing rather than client aim, including rotated shuffled seats',async()=>{
 const r=await crew();try{
  r.acceptInput('p0','p0',{x:1,z:0,power:1});r.update();
  assert.ok(r.game.players[0].x>.7);assert.ok(r.game.players[0].z<-.7);
  for(let i=0;i<60;i++){r.acceptInput('p0','p0',{x:1,z:0,power:1});r.update();}
  assert.ok(r.game.players[0].gas>81&&r.game.players[0].gas<83);
  assert.ok(r.game.x>0);assert.ok(r.game.z<5);
 }finally{r.onDispose();r.clock.clear();}
});

test('rear exhaust and authoritative thrust stay opposite for every seat, shuffle and raft rotation',()=>{
 for(const capacity of [4,8])for(let seat=0;seat<capacity;seat++)for(const grip of [-1,0,1])for(const yaw of [0,.8,Math.PI]){
  const facing=gripOffset(seat,grip,capacity).angle+Math.PI+yaw,force=characterThrust(seat,grip,capacity,yaw);
  assert.ok(Math.abs(force.x-Math.sin(facing))<1e-9);assert.ok(Math.abs(force.z-Math.cos(facing))<1e-9);
  assert.ok(Math.abs(Math.hypot(force.x,force.z)-1)<1e-9);
 }
});
