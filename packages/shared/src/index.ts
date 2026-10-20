export const TICK = 1 / 60;
export const BOAT_COLORS={wood:{name:'Timber',deck:'#c49a5e',hull:'#285c4c',rim:'#e8cd8f'},forest:{name:'Forest',deck:'#65976b',hull:'#214f40',rim:'#d9c79a'},lagoon:{name:'Lagoon',deck:'#6daec0',hull:'#275b79',rim:'#e3d7ac'},coral:{name:'Coral',deck:'#d98978',hull:'#8b4b4b',rim:'#eed7ad'},sunflower:{name:'Sunflower',deck:'#dcc46b',hull:'#85723c',rim:'#f1dfb5'},plum:{name:'Plum',deck:'#ae8abc',hull:'#62476f',rim:'#e1d4b7'}} as const;
export type BoatColor=keyof typeof BOAT_COLORS;
export const isBoatColor=(value:unknown):value is BoatColor=>typeof value==='string'&&Object.hasOwn(BOAT_COLORS,value);
export const SEATS = [{x:-1,z:1},{x:1,z:1},{x:-1,z:-1},{x:1,z:-1},{x:-1,z:2.2},{x:1,z:2.2},{x:-1,z:-2.2},{x:1,z:-2.2}];
export const COLORS = ['#ffc66b','#f48b97','#74d5bd','#aa9ee1','#d6b16a','#b8d676','#6dbcd4','#d795c8'];
export const FINISH = 178;
export type CourseId = 'lagoon' | 'rapids' | 'moonlight';
export type GameMode = 'coop';
export const CHARACTERS = {
  hippo:{name:'Bubbles',species:'Hippo',color:'#9471ed',emoji:'🦛'},
  croc:{name:'Chomps',species:'Crocodile',color:'#73ce53',emoji:'🐊'},
  frog:{name:'Sprout',species:'Frog',color:'#36cdb1',emoji:'🐸'},
  penguin:{name:'Waddles',species:'Penguin',color:'#4774c8',emoji:'🐧'},
  capybara:{name:'Biscuit',species:'Capybara',color:'#e5a552',emoji:'🦫'},
  bear:{name:'Mochi',species:'Bear',color:'#ed779d',emoji:'🐻'}
} as const;
export type CharacterId=keyof typeof CHARACTERS;
export const isCharacter=(value:unknown):value is CharacterId=>typeof value==='string'&&Object.hasOwn(CHARACTERS,value);
export type LocalPlayer={name:string;character:CharacterId;binding:string};
export type Input = { x: number; z: number; power: number; leanX?:number; leanZ?:number; move?:number };
export type Player = { id:string; name:string; seat:number; gas:number; thrust:number; x:number; z:number; skin:string; character?:CharacterId;boat?:number;owner?:string;grip?:number };
export type BoatState={id:number;x:number;y:number;z:number;angle:number;vx:number;vz:number;penalties:number;checkpoint:number;health?:number;roll?:number;pitch?:number;finishTime?:number;dnf?:boolean};
export type Snapshot = { room:string; phase:'lobby'|'playing'|'finished'|'failed'; course:CourseId; players:Player[]; x:number; z:number; angle:number; vx:number; vz:number; time:number; penalties:number; checkpoint:number; countdown:number; host:string; tick:number;mode?:GameMode;boats?:BoatState[];crewSize?:number;boatColor?:BoatColor;coins?:number;collected?:string[];damageTick?:number;failure?:string };
export type Score = { name:string; course:CourseId; time:number; date:string;mode?:GameMode };
export type Obstacle = { x:number; z:number; radius:number; kind:'rock'|'buoy'|'spinner'|'gate'|'pendulum'|'mine'|'roller'|'tentacle'|'island' };
export const COURSES: Record<CourseId,{name:string; subtitle:string; current:number; color:string; obstacles:Obstacle[]}> = {
  lagoon:{name:'Canyon Splash',subtitle:'Coral cliffs & splashy slides',current:0.65,color:'#18cbe3',obstacles:[{x:-3,z:27,radius:2,kind:'rock'},{x:4,z:62,radius:2,kind:'rock'},{x:0,z:77,radius:3.4,kind:'spinner'},{x:-4,z:93,radius:2,kind:'rock'},{x:0,z:122,radius:2.3,kind:'gate'},{x:-2,z:142,radius:3,kind:'spinner'},{x:5,z:161,radius:2,kind:'rock'}]},
  rapids:{name:'Jungle Rush',subtitle:'Boost, leap & dodge the jungle',current:0.85,color:'#24cbd0',obstacles:[{x:2,z:22,radius:2,kind:'rock'},{x:-3,z:65,radius:2,kind:'rock'},{x:2,z:78,radius:3.4,kind:'spinner'},{x:0,z:94,radius:2.2,kind:'gate'},{x:3,z:123,radius:3,kind:'spinner'},{x:-2,z:140,radius:2.5,kind:'rock'},{x:3,z:162,radius:3,kind:'spinner'}]},
  moonlight:{name:'Neon Grotto',subtitle:'Glow caves & midnight mayhem',current:0.7,color:'#4556c5',obstacles:[{x:-2,z:26,radius:2,kind:'rock'},{x:3,z:64,radius:3,kind:'spinner'},{x:0,z:80,radius:2.4,kind:'gate'},{x:2,z:94,radius:3,kind:'spinner'},{x:-3,z:124,radius:2.3,kind:'rock'},{x:3,z:141,radius:3.6,kind:'spinner'},{x:-2,z:163,radius:2,kind:'rock'}]}
};
// Route-relative positions are shared by rendering, collision and damage checks.
for(const course of Object.values(COURSES))course.obstacles.push(
  {x:0,z:23,radius:1,kind:'pendulum'},
  {x:-2,z:69,radius:.75,kind:'mine'},
  {x:1.8,z:88,radius:2.4,kind:'tentacle'},
  {x:0,z:134,radius:2.2,kind:'roller'},
  {x:0,z:153,radius:2.1,kind:'island'},
  {x:-4,z:169,radius:.8,kind:'mine'});
export const SPIKE_ZONES=[[14,34],[56,83],[96,105],[121,174]];
export const openEdge=(z:number)=>z>=84&&z<=96;
export const spikedEdge=(z:number)=>SPIKE_ZONES.some(([from,to])=>z>=from&&z<=to);
export const RAMPS=[{start:35,lip:46,end:56,height:2.5},{start:101,lip:112,end:120,height:2}];
export const BOOSTS=[17,33,98,150];
export function surfaceAt(z:number):number|null {
  for(const r of RAMPS){if(z>=r.start&&z<=r.lip)return (z-r.start)/(r.lip-r.start)*r.height;if(z>r.lip&&z<r.lip+5)return null;if(z>=r.lip+5&&z<r.end)return r.height*(r.end-z)/(r.end-r.lip-5);}
  return 0;
}
type PathKnot={z:number;x:number;width:number;height:number};
const PATHS:Record<CourseId,PathKnot[]>={
  lagoon:[{z:-15,x:0,width:19,height:0},{z:12,x:0,width:19,height:0},{z:33,x:5,width:16,height:0},{z:58,x:7,width:15,height:0},{z:80,x:-1,width:9,height:6},{z:103,x:-7,width:8.5,height:6},{z:128,x:-3,width:14,height:0},{z:153,x:6,width:15,height:0},{z:190,x:1,width:18,height:0}],
  rapids:[{z:-15,x:0,width:18,height:0},{z:15,x:0,width:18,height:0},{z:37,x:-6,width:15,height:0},{z:58,x:-5,width:14,height:0},{z:80,x:6,width:9,height:8},{z:103,x:9,width:8.5,height:8},{z:127,x:0,width:13,height:0},{z:151,x:-8,width:12,height:0},{z:190,x:0,width:18,height:0}],
  moonlight:[{z:-15,x:0,width:18,height:0},{z:15,x:0,width:18,height:0},{z:35,x:6,width:15,height:0},{z:58,x:5,width:14,height:0},{z:80,x:-5,width:9.5,height:5},{z:103,x:-8,width:9,height:5},{z:127,x:0,width:14,height:0},{z:151,x:7,width:13,height:0},{z:190,x:0,width:18,height:0}]
};
export function courseFrame(course:CourseId,z:number){
  const knots=PATHS[course];let a=knots[0],b=knots[1];
  for(let i=0;i<knots.length-1;i++){a=knots[i];b=knots[i+1];if(z<=b.z)break;}
  const t=Math.max(0,Math.min(1,(z-a.z)/(b.z-a.z))),s=t*t*(3-2*t),dx=(b.x-a.x)*6*t*(1-t)/(b.z-a.z),length=Math.hypot(dx,1);
  return {x:a.x+(b.x-a.x)*s,z,width:a.width+(b.width-a.width)*s,height:a.height+(b.height-a.height)*s,tx:dx/length,tz:1/length,nx:1/length,nz:-dx/length,angle:Math.atan2(dx,1)};
}
export function courseSurface(course:CourseId,z:number){const surface=surfaceAt(z);return surface===null?null:courseFrame(course,z).height+surface;}
export function pathPoint(course:CourseId,z:number,across=0){const f=courseFrame(course,z);return {x:f.x+f.nx*across,z:z+f.nz*across,y:f.height};}
export function obstaclePose(o:Obstacle,time:number,course?:CourseId){
  const f=course?courseFrame(course,o.z):{x:0,width:22,nx:1,nz:0,angle:0};
  const travel=Math.max(.3,Math.min(5.5,f.width/2-o.radius-1));
  const swing=o.kind==='pendulum'?Math.sin(time*1.3+o.z)*1.05:0;
  const local=o.x+(o.kind==='gate'?Math.sin(time*1.1+o.z)*travel:o.kind==='pendulum'?Math.sin(swing)*4.5:0);
  return {x:f.x+f.nx*local,z:o.z+f.nz*local,angle:f.angle+(o.kind==='spinner'?time*.65+o.z:o.kind==='tentacle'?Math.sin(time*.8)*.3:0),lift:o.kind==='pendulum'?4.5*(1-Math.cos(swing)):0,swing};
}
export function sweeperPoints(radius:number){return Array.from({length:9},(_,i)=>{const t=-Math.PI*.75+i/8*Math.PI*1.4;return {x:Math.sin(t)*radius*.75,z:(1-Math.cos(t))*radius*.6};});}
export function hazardSegments(o:Obstacle){
  if(o.kind==='spinner')return [[{x:-o.radius,z:0},{x:o.radius,z:0}],[{x:0,z:-o.radius},{x:0,z:o.radius}]];
  if(o.kind==='tentacle'){const points=sweeperPoints(o.radius);return points.slice(1).map((p,i)=>[points[i],p]);}
  return [[{x:-o.radius,z:0},{x:o.radius,z:0}]];
}
export function hazardContact(o:Obstacle,time:number,course:CourseId,x:number,z:number,boatRadius=1.65){
  const pose=obstaclePose(o,time,course);if(pose.lift>1.5)return false;
  if(['rock','mine','pendulum','island','buoy'].includes(o.kind))return Math.hypot(x-pose.x,z-pose.z)<o.radius+boatRadius;
  const dx=x-pose.x,dz=z-pose.z,c=Math.cos(pose.angle),s=Math.sin(pose.angle),px=dx*c-dz*s,pz=dx*s+dz*c;
  return hazardSegments(o).some(([a,b])=>{const ex=b.x-a.x,ez=b.z-a.z,t=Math.max(0,Math.min(1,((px-a.x)*ex+(pz-a.z)*ez)/(ex*ex+ez*ez)));return Math.hypot(px-a.x-ex*t,pz-a.z-ez*t)<boatRadius+(o.kind==='gate'?.9:.45);});
}
export function courseCoins(course:CourseId){return [12,30,59,73,99,126,144,163,174].map((z,i)=>({id:`coin-${i}`,...pathPoint(course,z,i%2?2.7:-2.7)}));}
/** Visible hull dimensions, including the rim, shared with authoritative collision. */
export const RAFT_SCALE=1.15;
export function raftBankContact(course:CourseId,x:number,z:number,angle:number,capacity=4){
  const hw=1.875*RAFT_SCALE,hl=(capacity>4?3.125:2.175)*RAFT_SCALE;
  // Sample the hull rim so front/rear contacts at the ends of spike zones count.
  for(let i=0;i<48;i++){
    const a=i*Math.PI/24,lx=Math.sin(a)*hw,lz=Math.cos(a)*hl;
    const px=x+lx*Math.cos(angle)+lz*Math.sin(angle),pz=z-lx*Math.sin(angle)+lz*Math.cos(angle),f=courseFrame(course,pz);
    if(spikedEdge(pz)&&Math.abs((px-f.x)*f.nx)>f.width/2-.75)return true;
  }
  return false;
}
export function raftHazardContact(o:Obstacle,time:number,course:CourseId,x:number,z:number,angle:number,capacity=4){
  const pose=obstaclePose(o,time,course);
  if(pose.lift>1.5)return false;
  const hw=1.875*RAFT_SCALE,hl=(capacity>4?3.125:2.175)*RAFT_SCALE;
  const local=(px:number,pz:number)=>{const dx=px-x,dz=pz-z;return {x:dx*Math.cos(angle)-dz*Math.sin(angle),z:dx*Math.sin(angle)+dz*Math.cos(angle)};};
  const distance=(p:{x:number;z:number})=>Math.hypot(Math.max(0,Math.abs(p.x)-hw),Math.max(0,Math.abs(p.z)-hl));
  if(['mine','pendulum','buoy','rock','island'].includes(o.kind))return distance(local(pose.x,pose.z))<=o.radius+(['mine','pendulum'].includes(o.kind)?.72:0);
  const radius=o.kind==='gate'?1.25:.9;
  return hazardSegments(o).some(([a,b])=>{
    const world=(p:{x:number;z:number})=>local(pose.x+p.x*Math.cos(pose.angle)+p.z*Math.sin(pose.angle),pose.z-p.x*Math.sin(pose.angle)+p.z*Math.cos(pose.angle));
    const p=world(a),q=world(b),dx=q.x-p.x,dz=q.z-p.z;
    // Distance along a segment to a convex rectangle is convex. Find its minimum.
    let lo=0,hi=1;
    for(let i=0;i<32;i++){const u=(2*lo+hi)/3,v=(lo+2*hi)/3;const at=(t:number)=>distance({x:p.x+dx*t,z:p.z+dz*t});if(at(u)<at(v))hi=v;else lo=u;}
    const t=(lo+hi)/2;return Math.min(distance(p),distance(q),distance({x:p.x+dx*t,z:p.z+dz*t}))<=radius;
  });
}
export function sanitizeInput(value:unknown):Input {
  const v = value as Partial<Input> | null;
  if (!v || ![v.x,v.z,v.power].every(n => typeof n==='number' && Number.isFinite(n))) return {x:0,z:0,power:0};
  const length = Math.hypot(v.x!,v.z!);
  const result:Input={x:length>1?v.x!/length:v.x!,z:length>1?v.z!/length:v.z!,power:Math.max(0,Math.min(1,v.power!))};
  if(v.move!==undefined)result.move=typeof v.move==='number'&&Number.isFinite(v.move)?Math.max(-1,Math.min(1,v.move)):0;
  if(v.leanX!==undefined||v.leanZ!==undefined){let x=Number.isFinite(v.leanX)?Number(v.leanX):0,z=Number.isFinite(v.leanZ)?Number(v.leanZ):0;const scale=Math.max(1,Math.hypot(x,z));result.leanX=x/scale;result.leanZ=z/scale;}
  return result;
}
export function rotateOffset(seat:number,angle:number) {
  const r=SEATS[seat]; return {x:r.x*Math.cos(angle)+r.z*Math.sin(angle),z:-r.x*Math.sin(angle)+r.z*Math.cos(angle)};
}
/** Bounded sideways shuffling in each crew member's own section of the rim. */
export function gripOffset(seat:number,grip=0,capacity=4){
  const angle=capacity>4?-Math.PI/8+seat*Math.PI/4:Math.atan2(SEATS[seat].x,SEATS[seat].z);
  const a=angle+Math.max(-1,Math.min(1,grip))*(capacity>4?.22:.48);
  return {x:Math.sin(a)*1.95,z:Math.cos(a)*(capacity>4?3.15:2.05),angle:a};
}
/** Animals face the rim; their rear exhaust points outward, opposite the force. */
export function characterThrust(seat:number,grip=0,capacity=4,boatAngle=0){
  const angle=gripOffset(seat,grip,capacity).angle+boatAngle;
  return {x:-Math.sin(angle),z:-Math.cos(angle)};
}
export const formatTime = (seconds:number) => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toFixed(2).padStart(5,'0')}`;
