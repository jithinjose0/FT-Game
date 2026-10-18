import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInput, rotateOffset } from '../packages/shared/src/index.ts';
import { ServerPhysics } from '../packages/server/src/physics/ServerPhysics.ts';
import { surfaceAt, obstaclePose, courseFrame } from '../packages/shared/src/index.ts';

test('untrusted inputs are finite, bounded, and normalized',()=>{
  assert.deepEqual(sanitizeInput({x:NaN,z:1,power:1}),{x:0,z:0,power:0});
  assert.deepEqual(sanitizeInput(null),{x:0,z:0,power:0});
  assert.deepEqual(sanitizeInput({x:0,z:1,power:-99}),{x:0,z:1,power:0});
  const input=sanitizeInput({x:300,z:400,power:100});assert.equal(input.power,1);assert.equal(Math.hypot(input.x,input.z),1);
});
test('seat offsets rotate with the raft',()=>{
  const seat=rotateOffset(0,Math.PI/2);assert.ok(Math.abs(seat.x-1)<1e-9);assert.ok(Math.abs(seat.z-1)<1e-9);
});

test('courses wind, narrow and rise continuously; distant colliders follow the path',async()=>{
  const samples=Array.from({length:179},(_,z)=>courseFrame('lagoon',z));
  assert.ok(Math.max(...samples.map(p=>p.x))-Math.min(...samples.map(p=>p.x))>12);
  assert.ok(courseFrame('lagoon',90).width<10);assert.ok(courseFrame('lagoon',90).height>5);
  for(let i=1;i<samples.length;i++){assert.ok(Math.abs(samples[i].x-samples[i-1].x)<1);assert.ok(Math.abs(samples[i].height-samples[i-1].height)<1);}
  const physics=new ServerPhysics();await physics.init('lagoon');
  try{physics.reset(courseFrame('lagoon',87).x,87);for(let i=0;i<360;i++){physics.thrust(0,{x:1,z:0,power:1});physics.thrust(2,{x:1,z:0,power:1});physics.step(0);}const frame=courseFrame('lagoon',physics.raft.position.z);assert.ok(Math.abs(physics.raft.position.x-frame.x)<frame.width/2+.3,'narrow curved banks must contain the boat');}finally{physics.dispose();}
});
test('Havok offset impulses move the raft and produce torque; opposite seats balance',async()=>{
  const physics=new ServerPhysics();await physics.init('lagoon');
  try{
    for(let i=0;i<60;i++){physics.thrust(0,{x:0,z:1,power:1});physics.step(0);}
    assert.ok(physics.raft.position.z>5.2,'thrust must move the raft');
    assert.ok(Math.abs(physics.angle)>.05,'an off-center force must turn the raft');
  }finally{physics.dispose();}
  const balanced=new ServerPhysics();await balanced.init('lagoon');
  try{
    for(let i=0;i<60;i++){balanced.thrust(0,{x:0,z:1,power:1});balanced.thrust(1,{x:0,z:1,power:1});balanced.step(0);}
    assert.ok(balanced.raft.position.z>5.5);assert.ok(Math.abs(balanced.angle)<.05);
  }finally{balanced.dispose();}
});
test('banks contain the raft and rescue resets body position and velocity',async()=>{
  const physics=new ServerPhysics();await physics.init('rapids');
  try{
    for(let i=0;i<600;i++){physics.thrust(0,{x:1,z:0,power:1});physics.thrust(2,{x:1,z:0,power:1});physics.step(0);}
    assert.ok(physics.raft.position.x<10.5,'raft must collide with bank');
    const center=courseFrame('rapids',55).x;physics.reset(center,55);physics.step(0);assert.ok(Math.abs(physics.raft.position.z-55)<.2);assert.ok(Math.abs(physics.raft.position.x-center)<.2);
  }finally{physics.dispose();}
});

test('ramps launch a moving raft, gaps punish slow entry, pads do not auto-thrust and hazards move',async()=>{
  assert.equal(surfaceAt(49),null);assert.ok(surfaceAt(45)!>2);
  const physics=new ServerPhysics();await physics.init('lagoon');
  try{
    physics.reset(courseFrame('lagoon',45.9).x,45.9);physics.body.body.setLinearVelocity(new (await import('@babylonjs/core/Maths/math.vector.js')).Vector3(0,0,7));
    for(let i=0;i<15;i++)physics.step(0);
    assert.ok(physics.height>2.5,'speed up a ramp should launch above the lip');assert.ok(physics.airborne);
    physics.reset(courseFrame('lagoon',48).x,48);for(let i=0;i<80;i++)physics.step(0);assert.ok(physics.height< -4,'an unpowered raft should fall into a gap');
    physics.reset(courseFrame('lagoon',17).x,17);for(let i=0;i<120;i++)physics.step(.65);assert.ok(physics.body.body.getLinearVelocity().length()<.01,'painted pads and current must never add automatic thrust');
    const gate={x:0,z:122,radius:2,kind:'gate' as const};assert.notEqual(obstaclePose(gate,0).x,obstaclePose(gate,1).x);
    assert.ok(physics.moving.length>0,'moving hazards need actual colliders');
  }finally{physics.dispose();}
});
