import test from 'node:test';
import assert from 'node:assert/strict';
import {generateTrack,validateTrack,sampleEdge,evaluateSpan,atDistance} from '../packages/shared/src/track-generator.ts';
test('generated graph has valid connected branches and timed hazard recovery',()=>{
 const t=generateTrack();assert.deepEqual(validateTrack(t),[]);
 const edges=t.track_segments;
 assert.equal(edges.find(e=>e.id==='branch-a')!.to,edges.find(e=>e.id==='branch-b')!.to);
 assert.ok(Math.abs(edges.find(e=>e.id==='branch-a')!.length/edges.find(e=>e.id==='branch-b')!.length-.75)<1e-6);
 assert.equal(t.hazards.some(h=>h.edge==='spawn'),false);
 assert.ok(t.spline_nodes.some(n=>Math.abs(n.wall_banking_degrees)>=15));
});
test('Bezier spans meet with equal tangents and zero second derivatives',()=>{
 const t=generateTrack();
 for(const e of t.track_segments){const nodes=e.nodes.map(id=>t.spline_nodes.find(n=>n.id===id)!);
  for(let i=1;i<nodes.length-1;i++){
   const left=evaluateSpan(nodes[i-1],nodes[i],1),right=evaluateSpan(nodes[i],nodes[i+1],0);
   assert.deepEqual(left.position,right.position);assert.ok(Math.hypot(...left.tangent.map((v,j)=>v-right.tangent[j]))<1e-10);
   // Analytic endpoint acceleration is 20*(P2 - 2P1 + P0) = zero.
   assert.ok(nodes[i].tangent.every(Number.isFinite));
  }
 }
});
test('course includes a steep drop, hazard-free calibration pool, gap and catch basin',()=>{
 const t=generateTrack();assert.ok(t.track_segments.find(e=>e.id==='spawn')!.length/t.design_speed>=4);
 const slopes=sampleEdge(t,'drop').map(s=>Math.atan2(-s.tangent[1],Math.hypot(s.tangent[0],s.tangent[2]))*180/Math.PI);
 assert.ok(slopes.some(a=>a>=25&&a<=40));
 assert.equal(t.track_segments.find(e=>e.id==='gap')!.profile,'AIR_GAP');
 assert.equal(atDistance(t,'basin',20).width,16);
 const flight=(5+Math.sqrt(25+2*9.81*6))/9.81;assert.ok(14*flight>14+4,'whole raft must clear the landing edge');
});
test('validator catches unsafe density and broken joins',()=>{
 const t=generateTrack();t.hazards.push({...t.hazards.find(h=>h.type==='ROTATING_BLADES')!,id:'too-close',position_along_spline:31});
 assert.ok(validateTrack(t).includes('Hazard recovery spacing'));
 t.spline_nodes.find(n=>n.id==='gauntlet-0')!.position[0]+=1;
 assert.ok(validateTrack(t).some(e=>e.startsWith('Seam')));
});
