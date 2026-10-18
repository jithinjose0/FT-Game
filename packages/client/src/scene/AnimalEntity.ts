import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CHARACTERS, type CharacterId } from '@ft/shared';

/** Cartoon animals holding the rim: head/hands face +Z, hips hang behind. */
export function createAnimal(scene:Scene,kind:CharacterId,material:(hex:string)=>StandardMaterial){
  const root=new TransformNode(`animal-${kind}`,scene);
  const color=CHARACTERS[kind].color;
  const part=(name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,hex:string)=>{
    const mesh=MeshBuilder.CreateSphere(name,{diameter:1,segments:12},scene);
    mesh.position.set(x,y,z);mesh.scaling.set(sx,sy,sz);mesh.material=material(hex);mesh.parent=root;return mesh;
  };
  const dark='#26344c',cream=kind==='penguin'?'#fff9e1':'#ffdaa3';
  part('round tummy',0,.38,0,.92,.64,1.04,color);
  part('soft belly',0,.22,.25,.62,.25,.7,kind==='penguin'?'#fff9e1':color);
  for(const side of [-1,1])part('rounded cartoon haunch',side*.22,.43,-.42,.5,.55,.53,color);
  part('big head',0,1.15,.08,kind==='croc'?.8:1,kind==='frog'?.68:.92,.83,color);
  if(kind==='hippo'||kind==='capybara'||kind==='croc'||kind==='bear'){
    part('snout',0,1.05,.53,kind==='croc'?.72:.86,.43,kind==='croc'?.95:.56,kind==='bear'?cream:color);
    for(const x of [-.23,.23])part('nostril',x,1.21,kind==='croc'?1:.75,.095,.055,.09,dark);
    if(kind==='hippo'||kind==='croc'){
      part('smile',0,.89,.72,.55,.14,.12,dark);
      for(const x of [-.18,.18])part('tooth',x,.91,.79,.1,.15,.08,'#fff9e1');
    }
  }
  if(kind==='penguin'){
    for(const x of [-.2,.2])part('face patch',x,1.19,.39,.39,.48,.16,cream);
    part('beak',0,1.04,.57,.34,.18,.3,'#ffb639');
  }
  for(const side of [-1,1]){
    const eyeX=side*(kind==='frog'?.34:.25),eyeY=kind==='frog'?1.51:1.34;
    if(kind==='frog')part('eye mound',eyeX,eyeY,.18,.37,.38,.4,color);
    part('eye white',eyeX,eyeY,.43,.25,.29,.15,'#fffdf2');
    part('pupil',eyeX,eyeY,.515,.115,.17,.075,dark);
    part('eye shine',eyeX-.025,eyeY+.045,.55,.035,.045,.03,'#ffffff');
    if(kind!=='frog'&&kind!=='penguin'){
      part('ear',side*.4,1.55,-.02,.28,.32,.23,color);
      part('inner ear',side*.4,1.55,.08,.13,.17,.04,'#f9aeac');
    }
    const arm=part('reaching arm',side*.47,.36,.55,.29,.28,.82,color);arm.rotation.y=-side*.15;
    part('gripping hand',side*.5,.3,.92,.34,.25,.3,color);
    part('dangling leg',side*.3,.13,-.62,.31,.4,.4,color);
    part('foot',side*.3,-.02,-.79,.36,.22,.4,kind==='penguin'?'#ffb639':color);
  }
  if(kind==='croc')for(let i=0;i<4;i++)part('back spike',0,.75-i*.14,-.37-i*.08,.19,.23,.2,'#d8ee65');
  if(kind==='frog')part('happy mouth',0,1.04,.5,.46,.075,.09,dark);
  // Lower the face over the deck instead of making an upright seated figure.
  for(const mesh of root.getChildMeshes())if(!['round tummy','soft belly','rounded cartoon haunch','reaching arm','gripping hand','dangling leg','foot','back spike'].includes(mesh.name)){mesh.position.y-=.48;mesh.position.z+=.3;}
  root.metadata={kind};return root;
}
