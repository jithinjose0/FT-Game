import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin.js';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate.js';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin.js';
import '@babylonjs/core/Physics/physicsEngineComponent.js';
import HavokPhysics from '@babylonjs/havok';
import {RAFT_SCALE,raftHazardContact,raftBankContact} from '@ft/shared';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { COURSES, RAMPS, courseFrame, courseSurface, pathPoint, obstaclePose, hazardSegments, hazardContact, openEdge, spikedEdge, rotateOffset, gripOffset, TICK, type CourseId, type Input, type Obstacle } from '@ft/shared';

let havok:Promise<any>;
function loadHavok(){
  const require=createRequire(import.meta.url);
  return havok??=readFile(require.resolve('@babylonjs/havok/lib/esm/HavokPhysics.wasm')).then(wasmBinary=>HavokPhysics({wasmBinary}));
}
export class ServerPhysics {
  engine=new NullEngine();scene=new Scene(this.engine);
  raft=MeshBuilder.CreateBox('raft',{width:3.75*RAFT_SCALE,height:.6,depth:4.35*RAFT_SCALE},this.scene);
  body!:PhysicsAggregate;
  height=0;verticalSpeed=0;airborne=false;time=0;lastBoost=-1;course:CourseId='lagoon';
  spikeHit=false;capacity=4;
  roll=0;pitch=0;rollSpeed=0;pitchSpeed=0;leanX=0;leanZ=0;leanCount=0;landingImpact=0;contactDamage=0;private lastHit=-2;private previousVelocity=Vector3.Zero();
  moving:{mesh:ReturnType<typeof MeshBuilder.CreateBox>;obstacle:Obstacle;lx:number;lz:number;angle:number}[]=[];
  async init(course:CourseId,capacity=4){
    this.course=course;
    this.capacity=capacity;
    this.scene.enablePhysics(Vector3.Zero(),new HavokPlugin(true,await loadHavok()));this.scene.getPhysicsEngine()!.setTimeStep(TICK);
    this.raft.scaling.z=capacity>4?1.45:1;this.raft.position.set(0,0,5);this.raft.rotationQuaternion=Quaternion.Identity();
    this.body=new PhysicsAggregate(this.raft,PhysicsShapeType.BOX,{mass:capacity>4?22:12,restitution:.25,friction:.12},this.scene);
    this.body.body.setLinearDamping(.65);this.body.body.setAngularDamping(2.8);
    for(const side of [-1,1])for(let z=-14;z<194;z+=2){
      if(openEdge(z+1))continue;
      const a=courseFrame(course,z),b=courseFrame(course,z+2),p=pathPoint(course,z,side*(a.width/2+.25)),q=pathPoint(course,z+2,side*(b.width/2+.25));
      const wall=MeshBuilder.CreateBox('curved bank',{width:1.1,height:10,depth:Math.hypot(q.x-p.x,q.z-p.z)+.3},this.scene);
      wall.position.set((p.x+q.x)/2,0,(p.z+q.z)/2);wall.rotationQuaternion=Quaternion.FromEulerAngles(0,Math.atan2(q.x-p.x,q.z-p.z),0);
      new PhysicsAggregate(wall,PhysicsShapeType.BOX,{mass:0,restitution:.5,friction:.12},this.scene);
    }
    for(const o of COURSES[course].obstacles){
      if(o.kind==='rock'||o.kind==='island'){
        const pose=obstaclePose(o,0,course),rock=MeshBuilder.CreateCylinder('rock',{diameter:o.radius*2,height:8,tessellation:12},this.scene);rock.position.set(pose.x,0,pose.z);
        new PhysicsAggregate(rock,PhysicsShapeType.CYLINDER,{mass:0,restitution:.4,friction:.18},this.scene);continue;
      }
      if(o.kind==='mine'||o.kind==='pendulum'||o.kind==='buoy'){
        const mesh=MeshBuilder.CreateBox('spiked ball collider',{width:o.radius*1.8,height:2,depth:o.radius*1.8},this.scene);mesh.rotationQuaternion=Quaternion.Identity();
        const body=new PhysicsAggregate(mesh,PhysicsShapeType.BOX,{mass:0,restitution:.7,friction:.1},this.scene);body.body.disablePreStep=false;
        this.moving.push({mesh,obstacle:o,lx:0,lz:0,angle:0});continue;
      }
      for(const [a,b] of hazardSegments(o)){
        const mesh=MeshBuilder.CreateBox('moving hazard',{width:o.kind==='gate'?1.8:.65,height:2,depth:Math.hypot(b.x-a.x,b.z-a.z)+.25},this.scene);
        mesh.rotationQuaternion=Quaternion.Identity();
        const body=new PhysicsAggregate(mesh,PhysicsShapeType.BOX,{mass:0,restitution:.55,friction:.1},this.scene);body.body.disablePreStep=false;
        this.moving.push({mesh,obstacle:o,lx:(a.x+b.x)/2,lz:(a.z+b.z)/2,angle:Math.atan2(b.x-a.x,b.z-a.z)});
      }
    }
    this.positionHazards();
  }
  positionHazards(){
    for(const {mesh,obstacle,lx,lz,angle} of this.moving){const p=obstaclePose(obstacle,this.time,this.course),s=Math.sin(p.angle),c=Math.cos(p.angle);mesh.position.set(p.x+lx*c+lz*s,p.lift>1.5?20:0,p.z-lx*s+lz*c);mesh.rotationQuaternion=Quaternion.FromEulerAngles(0,p.angle+angle,0);mesh.computeWorldMatrix(true);}
  }
  get angle(){return this.raft.rotationQuaternion!.toEulerAngles().y;}
  lean(input:Input){this.leanX+=input.leanX||0;this.leanZ+=input.leanZ||0;this.leanCount++;}
  thrust(seat:number,input:Input,grip?:number){
    const offset=grip===undefined?undefined:gripOffset(seat,grip,this.capacity),c=Math.cos(this.angle),s=Math.sin(this.angle);
    const r=offset?{x:offset.x*c+offset.z*s,z:-offset.x*s+offset.z*c}:rotateOffset(seat,this.angle);
    this.body.body.applyImpulse(new Vector3(input.x*input.power*38*TICK,0,input.z*input.power*38*TICK),this.raft.position.add(new Vector3(r.x,0,r.z)));
  }
  step(current:number){
    this.time+=TICK;this.positionHazards();this.landingImpact=0;this.contactDamage=0;this.spikeHit=false;
    const before=this.raft.position.z,frame=courseFrame(this.course,before),incomingSpeed=this.body.body.getLinearVelocity().length();
    const hitsSpike=()=>raftBankContact(this.course,this.raft.position.x,this.raft.position.z,this.angle,this.capacity)||COURSES[this.course].obstacles.some(o=>!['rock','island','buoy'].includes(o.kind)&&raftHazardContact(o,this.time,this.course,this.raft.position.x,this.raft.position.z,this.angle,this.capacity));
    const beforeSurface=courseSurface(this.course,before),beforeHit=beforeSurface!==null&&Math.abs(this.height-beforeSurface)<.9&&hitsSpike();
    // No river thrust or automatic boost pads. Motion comes from the crew,
    // retained momentum, collisions and gravity on a real downhill section.
    const slopeA=courseSurface(this.course,before),slopeB=courseSurface(this.course,before+.2);
    if(slopeA!==null&&slopeB!==null&&slopeB<slopeA)this.body.body.applyImpulse(new Vector3(frame.tx,0,frame.tz).scale((slopeA-slopeB)/.2*12*4*TICK),this.raft.position);
    this.scene.getPhysicsEngine()!._step(TICK);
    const velocity=this.body.body.getLinearVelocity();velocity.y=0;if(velocity.length()>8)velocity.normalize().scaleInPlace(8);this.body.body.setLinearVelocity(velocity);
    const angular=this.body.body.getAngularVelocity();angular.x=0;angular.z=0;this.body.body.setAngularVelocity(angular);this.raft.position.y=0;
    const z=this.raft.position.z,f=courseFrame(this.course,z),outside=Math.abs((this.raft.position.x-f.x)*f.nx)>f.width/2+.1;
    const surface=outside?null:courseSurface(this.course,z);
    for(const ramp of RAMPS)if(before<=ramp.lip&&z>ramp.lip&&velocity.z>2){this.airborne=true;this.height=ramp.height+courseFrame(this.course,z).height;this.verticalSpeed=5.8+velocity.z*.1;}
    if(this.airborne||surface===null){this.verticalSpeed-=9.8*TICK;this.height+=this.verticalSpeed*TICK;if(surface!==null&&this.height<=surface&&this.verticalSpeed<0){this.landingImpact=Math.max(0,-this.verticalSpeed-7);this.pitchSpeed+=this.verticalSpeed*.07;this.height=surface;this.verticalSpeed=0;this.airborne=false;}}
    else this.height=surface;
    // Damped buoyancy model: acceleration, slope and landings upset the raft;
    // shifting body weight provides an independent counterbalancing moment.
    const c=Math.cos(this.angle),s=Math.sin(this.angle),count=Math.max(1,this.leanCount);
    const lx=(this.leanX*c-this.leanZ*s)/count,lz=(this.leanX*s+this.leanZ*c)/count;
    const ax=(velocity.x-this.previousVelocity.x)/TICK,az=(velocity.z-this.previousVelocity.z)/TICK;
    this.rollSpeed+=(-this.roll*7-this.rollSpeed*2.8-(ax*c-az*s)*.045-lx*3.5)*TICK;
    this.pitchSpeed+=(-this.pitch*7-this.pitchSpeed*2.8+(ax*s+az*c)*.035+lz*3.5)*TICK;
    this.roll+=this.rollSpeed*TICK;this.pitch+=this.pitchSpeed*TICK;
    this.previousVelocity.copyFrom(velocity);this.leanX=0;this.leanZ=0;this.leanCount=0;
    if(surface!==null&&Math.abs(this.height-surface)<.9){
      const a=this.angle-f.angle,extent=(Math.abs(Math.cos(a))*1.875+Math.abs(Math.sin(a))*(this.capacity>4?3.125:2.175))*RAFT_SCALE;
      const bank=spikedEdge(z)&&Math.abs((this.raft.position.x-f.x)*f.nx)>f.width/2-extent-.6;
      this.spikeHit=bank||hitsSpike();
    }
    this.spikeHit=this.spikeHit||beforeHit;
    if(this.time-this.lastHit>.9&&surface!==null&&Math.abs(this.height-surface)<1){
      const impactSpeed=Math.max(velocity.length(),incomingSpeed);
      const obstacle=COURSES[this.course].obstacles.find(o=>hazardContact(o,this.time,this.course,this.raft.position.x,z));
      const bank=spikedEdge(z)&&Math.abs((this.raft.position.x-f.x)*f.nx)>f.width/2-1.85;
      if(obstacle||bank){const soft=obstacle?.kind==='rock'||obstacle?.kind==='island';this.contactDamage=(soft?4:12)+impactSpeed*(soft?1.1:2);this.rollSpeed+=(this.raft.position.x>f.x?-1:1)*.8;this.lastHit=this.time;}
    }
  }
  reset(x=0,z=5){
    this.height=courseSurface(this.course,z)??courseFrame(this.course,z).height;this.verticalSpeed=0;this.airborne=false;this.lastBoost=-1;
    this.spikeHit=false;
    this.roll=0;this.pitch=0;this.rollSpeed=0;this.pitchSpeed=0;this.leanX=0;this.leanZ=0;this.leanCount=0;this.landingImpact=0;this.contactDamage=0;this.previousVelocity.setAll(0);this.lastHit=this.time;
    this.raft.position.set(x,0,z);this.raft.rotationQuaternion=Quaternion.Identity();this.raft.computeWorldMatrix(true);
    this.body.body.disablePreStep=false;(this.scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin).setPhysicsBodyTransformation(this.body.body,this.raft);this.body.body.disablePreStep=true;
    this.body.body.setLinearVelocity(Vector3.Zero());this.body.body.setAngularVelocity(Vector3.Zero());
  }
  dispose(){this.scene.dispose();this.engine.dispose();}
}
