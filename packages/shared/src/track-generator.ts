/** Metres, seconds, radians internally; Y up, +Z downstream. No engine dependency. */
export type V3 = [number,number,number];
export type Zone = 'SPAWN'|'S_CURVE'|'PATH_SPLIT'|'GAUNTLET'|'RAMP'|'FINISH';
export type Node = {id:string;edge:string;position:V3;tangent:V3;track_width:number;wall_banking_degrees:number};
export type Edge = {id:string;zone:Zone;from:string;to:string;nodes:string[];length:number;next:string[];profile:'CHANNEL'|'AIR_GAP'};
export type Hazard = {id:string;type:string;edge:string;position_along_spline:number;local_offset:V3;rotation:V3;scale:V3;high_impact:boolean;motion?:{axis:V3;amplitude:number;period:number};activation_group?:string;end_distance?:number};
export type Track = {version:number;units:string;raft_diameter:number;design_speed:number;spline_type:string;spline_nodes:Node[];hazards:Hazard[];track_segments:Edge[];routes:Record<string,string[]>;rules:Record<string,unknown>};
const add=(a:V3,b:V3):V3=>a.map((v,i)=>v+b[i]) as V3;
const sub=(a:V3,b:V3):V3=>a.map((v,i)=>v-b[i]) as V3;
const mul=(a:V3,t:number):V3=>a.map(v=>v*t) as V3;
const dot=(a:V3,b:V3)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=(a:V3)=>Math.hypot(...a);
const unit=(a:V3)=>mul(a,1/(norm(a)||1));
const mix=(a:V3,b:V3,t:number)=>add(mul(a,1-t),mul(b,t));
const smooth=(t:number)=>t*t*t*(10+t*(-15+6*t));
const round=(n:number)=>Math.round(n*10000)/10000;

/** Quintic Bezier with shared first derivatives and zero second derivatives.
 * Adjacent spans are C2, including the two entrances/exits of the branch. */
export function evaluateSpan(a:Node,b:Node,t:number){
  const p=[a.position,add(a.position,mul(a.tangent,.2)),add(a.position,mul(a.tangent,.4)),sub(b.position,mul(b.tangent,.4)),sub(b.position,mul(b.tangent,.2)),b.position];
  const d=p.slice(1).map((v,i)=>mul(sub(v,p[i]),5));
  const casteljau=(values:V3[])=>{while(values.length>1)values=values.slice(1).map((v,i)=>mix(values[i],v,t));return values[0];};
  return {position:casteljau(p),tangent:unit(casteljau(d)),width:a.track_width+(b.track_width-a.track_width)*smooth(t),bank:a.wall_banking_degrees+(b.wall_banking_degrees-a.wall_banking_degrees)*smooth(t)};
}
export function sampleEdge(track:Track,edgeId:string,resolution=.5){
  if(!Number.isFinite(resolution)||resolution<=0)throw Error('Resolution must be positive');
  const edge=track.track_segments.find(e=>e.id===edgeId);if(!edge)throw Error(`Unknown edge ${edgeId}`);
  const nodes=edge.nodes.map(id=>track.spline_nodes.find(n=>n.id===id)!);
  let distance=0,previous:V3|undefined;
  const samples:ReturnType<typeof evaluateSpan>[]=[];
  const result:(ReturnType<typeof evaluateSpan>&{distance:number})[]=[];
  for(let i=0;i<nodes.length-1;i++){
    const steps=Math.max(32,Math.ceil(norm(sub(nodes[i+1].position,nodes[i].position))*4/resolution));
    for(let j=i?1:0;j<=steps;j++)samples.push(evaluateSpan(nodes[i],nodes[i+1],j/steps));
  }
  for(const sample of samples){if(previous)distance+=norm(sub(sample.position,previous));previous=sample.position;result.push({...sample,distance});}
  return result;
}
export function atDistance(track:Track,edge:string,distance:number){
  const samples=sampleEdge(track,edge),s=Math.max(0,Math.min(samples.at(-1)!.distance,distance));
  let lo=0,hi=samples.length-1;while(lo<hi){const m=(lo+hi)>>1;if(samples[m].distance<s)lo=m+1;else hi=m;}
  const a=samples[Math.max(0,lo-1)],b=samples[lo],t=(s-a.distance)/(b.distance-a.distance||1);
  return {position:mix(a.position,b.position,t),tangent:unit(mix(a.tangent,b.tangent,t)),width:a.width+(b.width-a.width)*t,bank:a.bank+(b.bank-a.bank)*t};
}
export function generateTrack():Track{
  const D=4,speed=14;
  const track:Track={version:1,units:'metres_seconds_degrees',raft_diameter:D,design_speed:speed,spline_type:'QUINTIC_BEZIER_C2',spline_nodes:[],hazards:[],track_segments:[],routes:{A:['spawn','s-curves','branch-a','gauntlet','drop','launch','gap','basin','finish'],B:['spawn','s-curves','branch-b','gauntlet','drop','launch','gap','basin','finish']},rules:{width_ratios:{wide:[3.5,4],standard:[2,2.5],narrow:[1.5,1.5]},sharp_turn_degrees:30,bank_range_degrees:[15,35],high_impact_min_seconds:3,speed_cap:speed,spawn_safe_seconds:4,branch_a_distance_ratio:.75,gravity:9.81,collision:{banks:'STATIC_TRIANGLE_MESH',spikes:'STATIC_CONVEX_SEGMENTS_PLUS_DAMAGE_SENSOR',damage_per_second:18,damage_integrator:'damage_rate * fixed_dt while overlapping',bounce_retrigger_seconds:.9},mesh:{sample_spacing:.5,bank_strip_width:1.5,wall_height:1.2},gap:{edge:'gap',launch_speed:speed,vertical_speed:5,landing_height_delta:-6},finish:{edge:'finish',trigger:'ORIENTED_BOX',local_size:[16,6,3],requires_whole_raft:true}}};
  function edge(id:string,zone:Zone,points:V3[],width:number,next:string[],from=id+'-entry',to=id+'-exit',profile:Edge['profile']='CHANNEL'){
    const ids:string[]=[];
    points.forEach((position,i)=>{
      const prev=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
      const incoming=unit(sub(position,prev)),outgoing=unit(sub(after,position));
      const bend=i>0&&i<points.length-1?Math.acos(Math.max(-1,Math.min(1,dot(incoming,outgoing))))*180/Math.PI:0;
      // Sign identifies the outer bank; positive bends bank the left wall.
      const sign=Math.sign(incoming[2]*outgoing[0]-incoming[0]*outgoing[2])||1;
      const tangent=i===0||i===points.length-1?[0,0,20] as V3:mul(unit(sub(after,prev)),Math.min(norm(sub(position,prev)),norm(sub(after,position)))*.8);
      const node:Node={id:`${id}-${i}`,edge:id,position,tangent,track_width:width,wall_banking_degrees:bend>30?sign*Math.min(35,15+(bend-30)*.4):0};track.spline_nodes.push(node);ids.push(node.id);
    });
    const segment:Edge={id,zone,from,to,nodes:ids,length:0,next,profile};track.track_segments.push(segment);segment.length=sampleEdge(track,id).at(-1)!.distance;return segment;
  }
  edge('spawn','SPAWN',[[0,24,0],[0,24,56]],16,['s-curves'],'start','rapids');
  edge('s-curves','S_CURVE',[[0,24,56],[-24,24,88],[24,24,123],[0,24,158]],9,['branch-a','branch-b'],'rapids','split');
  const a=edge('branch-a','PATH_SPLIT',[[0,24,158],[-16,24,190],[-12,24,222],[0,24,250]],6,['gauntlet'],'split','merge');
  // Binary-search the safe route detour until A is exactly 25% shorter.
  let low=15,high=100,b:Edge|undefined;
  for(let i=0;i<32;i++){
    if(b){track.spline_nodes=track.spline_nodes.filter(n=>n.edge!==b!.id);track.track_segments=track.track_segments.filter(e=>e!==b);}
    const x=(low+high)/2;b=edge('branch-b','PATH_SPLIT',[[0,24,158],[x,24,187],[x,24,222],[0,24,250]],14,['gauntlet'],'split','merge');
    if(b.length<a.length/.75)low=x;else high=x;
  }
  edge('gauntlet','GAUNTLET',[[0,24,250],[0,24,295],[8,24,340],[0,24,395],[0,24,420]],6,['drop'],'merge','drop-start');
  edge('drop','RAMP',[[0,24,420],[0,24,440],[0,6,472],[0,6,482]],9,['launch'],'drop-start','ramp-start');
  edge('launch','RAMP',[[0,6,482],[0,10,494]],9,['gap'],'ramp-start','lip');
  edge('gap','RAMP',[[0,10,494],[0,4,508]],16,['basin'],'lip','landing','AIR_GAP');
  edge('basin','RAMP',[[0,4,508],[0,4,560]],16,['finish'],'landing','pool-end');
  edge('finish','FINISH',[[0,4,560],[25,4,590],[0,4,625],[0,4,650]],9,[],'pool-end','finish-trigger');
  // Expand catch basin and gate; derivative-zero width interpolation prevents seams.
  for(const e of track.track_segments)for(const index of [0,e.nodes.length-1]){const n=track.spline_nodes.find(n=>n.id===e.nodes[index])!;n.track_width=16;}
  const hazard=(type:string,edge:string,s:number,high=true,x=0):Hazard=>({id:`hazard-${track.hazards.length}`,type,edge,position_along_spline:s,local_offset:[x,0,0],rotation:[0,0,0],scale:[1,1,1],high_impact:high});
  const addHazard=(h:Hazard)=>{track.hazards.push(h);};
  addHazard(hazard('CENTRAL_LANDMASS','branch-a',a.length*.5,false,16));
  addHazard({...hazard('DRIFTING_MINE','branch-b',b!.length*.5),motion:{axis:[1,0,0],amplitude:2,period:7}});
  addHazard(hazard('ROTATING_BLADES','gauntlet',30));
  addHazard({...hazard('PENDULUM','gauntlet',78),motion:{axis:[1,0,0],amplitude:2.5,period:5}});
  addHazard(hazard('WALL_TENTACLE','gauntlet',126,true,2.6));
  addHazard(hazard('APEX_ROCK','s-curves',55,false,-1.5));
  track.rules.spike_runs=[{edge:'branch-a',from:18,to:a.length-18,sides:'BOTH',activation_group:'branch-spikes'},{edge:'gauntlet',from:0,to:165,sides:'BOTH',activation_group:'gauntlet-spikes'}];
  for(const run of track.rules.spike_runs as {edge:string;from:number;to:number;activation_group:string}[])addHazard({...hazard('SPIKED_BORDERS',run.edge,run.from,false),end_distance:run.to,activation_group:run.activation_group});
  track.rules.flow={base:'unit spline tangent * section current',rocks:'subtract upstream radial component within 6m; add bounded tangential eddy',eddy_max_speed:1.2};
  return track;
}
export function validateTrack(t:Track){
  const errors:string[]=[];const edge=(id:string)=>t.track_segments.find(e=>e.id===id)!;
  const a=edge('branch-a').length,b=edge('branch-b').length;
  if(Math.abs(a/b-.75)>.001)errors.push('Branch length ratio');
  for(const e of t.track_segments){
    if(e.length<=0)errors.push(`Empty ${e.id}`);
    const nodes=e.nodes.map(id=>t.spline_nodes.find(n=>n.id===id)!);
    for(const n of nodes){if(n.track_width<1.5*t.raft_diameter)errors.push(`Too narrow ${n.id}`);if(n.wall_banking_degrees&& (Math.abs(n.wall_banking_degrees)<15||Math.abs(n.wall_banking_degrees)>35))errors.push(`Bank ${n.id}`);}
    for(const next of e.next){const n=t.spline_nodes.find(n=>n.id===edge(next).nodes[0])!,end=nodes.at(-1)!;if(norm(sub(n.position,end.position))>1e-6||norm(sub(n.tangent,end.tangent))>1e-6||n.track_width!==end.track_width)errors.push(`Seam ${e.id}/${next}`);}
  }
  for(const route of Object.values(t.routes)){
    let offset=0;const hits:number[]=[];
    for(const id of route){for(const h of t.hazards.filter(h=>h.edge===id&&h.high_impact))hits.push(offset+h.position_along_spline);offset+=edge(id).length;}
    hits.sort((a,b)=>a-b);for(let i=1;i<hits.length;i++)if((hits[i]-hits[i-1])/t.design_speed<3)errors.push('Hazard recovery spacing');
  }
  for(const h of t.hazards){if(edge(h.edge).zone==='SPAWN'||h.position_along_spline<0||h.position_along_spline>edge(h.edge).length)errors.push(`Hazard placement ${h.id}`);}
  return errors;
}
export function serializeTrack(t:Track){return JSON.stringify(t,(_key,value)=>typeof value==='number'?round(value):value,2);}
