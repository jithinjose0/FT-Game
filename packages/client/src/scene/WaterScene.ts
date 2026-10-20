import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3, Matrix, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { COURSES, SEATS, SPIKE_ZONES, RAMPS, courseFrame, courseSurface, pathPoint, obstaclePose, sweeperPoints, hazardSegments, gripOffset, courseCoins, type Snapshot, type CourseId, type CharacterId, type Obstacle } from '@ft/shared';
import {courseCamera} from '../../../shared/src/camera';
import { createAnimal } from './AnimalEntity';
import {RAFT_SCALE,openEdge} from '@ft/shared';
import {ImageProcessingConfiguration} from '@babylonjs/core/Materials/imageProcessingConfiguration';
import {BOAT_COLORS,isBoatColor,type BoatColor} from '@ft/shared';
import {journeyPreferences} from '../core/JourneyPreferences';

export type NameTag={id:string;x:number;y:number;visible:boolean};
export class WaterScene {
  engine:Engine;scene:Scene;camera:ArcRotateCamera;raft:TransformNode;characters:TransformNode[]=[];
  state?:Snapshot;playing=false;course:CourseId='lagoon';time=0;reduced=false;
  cameraMode:'isometric'|'bird'='isometric';previewCharacter:CharacterId='hippo';
  onNames?:(tags:NameTag[])=>void;
  private materials=new Map<string,StandardMaterial>();private decor:Mesh[]=[];private casters:Mesh[]=[];private roots:TransformNode[]=[];
  private hazards:{mesh:TransformNode;obstacle:Obstacle}[]=[];private lastCourse='';private target=new Vector3(0,0,5);
  private shadow:ShadowGenerator;private water!:StandardMaterial;private flow?:StandardMaterial;private wood:StandardMaterial;private hull:Mesh;private deck:Mesh;private rim:Mesh;
  private effects:Mesh[]=[];private gasClock=0;private aim:Mesh;private longBoat=false;
  private popped=false;
  constructor(private canvas:HTMLCanvasElement){
    this.engine=new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true});
    const resize=()=>{this.engine.setHardwareScalingLevel(1/Math.min(2.5,window.devicePixelRatio||1));this.engine.resize();};resize();window.addEventListener('resize',resize);
    new ResizeObserver(resize).observe(canvas);window.visualViewport?.addEventListener('resize',resize);
    window.screen.orientation?.addEventListener('change',()=>requestAnimationFrame(()=>requestAnimationFrame(resize)));
    this.scene=new Scene(this.engine);this.scene.clearColor=Color4.FromHexString('#b9dfeaff');this.scene.ambientColor=new Color3(.08,.1,.13);
    this.scene.imageProcessingConfiguration.toneMappingEnabled=true;this.scene.imageProcessingConfiguration.toneMappingType=ImageProcessingConfiguration.TONEMAPPING_ACES;this.scene.imageProcessingConfiguration.exposure=1.05;this.scene.imageProcessingConfiguration.contrast=1.12;
    this.scene.fogMode=Scene.FOGMODE_LINEAR;this.scene.fogStart=70;this.scene.fogEnd=175;this.scene.fogColor=Color3.FromHexString('#b9dfea');
    this.camera=new ArcRotateCamera('camera',-1.18,.86,25,new Vector3(-4,0,7),this.scene);this.camera.fov=.68;this.camera.minZ=.1;this.camera.maxZ=300;
    const ambient=new HemisphericLight('sky',new Vector3(0,1,0),this.scene);ambient.intensity=.66;ambient.groundColor=Color3.FromHexString('#405461');
    const sun=new DirectionalLight('sun',new Vector3(-.7,-1.8,.7),this.scene);sun.position.set(25,60,-20);sun.intensity=1.05;sun.diffuse=Color3.FromHexString('#fff0d2');
    this.shadow=new ShadowGenerator(1024,sun);this.shadow.usePercentageCloserFiltering=true;this.shadow.bias=.001;this.shadow.normalBias=.025;this.shadow.getShadowMap()!.refreshRate=2;
    this.wood=this.makeWood();
    this.raft=new TransformNode('shared raft',this.scene);this.raft.position.z=5;this.raft.scaling.set(RAFT_SCALE,1,RAFT_SCALE);
    this.hull=this.sphere('buoyant base',new Vector3(0,-.03,0),1,'#285c4c');this.hull.scaling.set(3.75,.47,4.35);this.hull.parent=this.raft;
    this.deck=MeshBuilder.CreateCylinder('planked deck',{diameter:3.35,height:.22,tessellation:48},this.scene);this.deck.position.y=.18;this.deck.scaling.z=1.15;this.deck.material=this.wood;this.deck.parent=this.raft;
    this.rim=MeshBuilder.CreateTorus('rope bound rim',{diameter:3.55,thickness:.5,tessellation:48},this.scene);this.rim.position.y=.23;this.rim.scaling.z=1.18;this.rim.material=this.mat('#e8cd8f');this.rim.parent=this.raft;
    this.setBoatColor(journeyPreferences().boatColor);window.addEventListener('ft-journey-options',()=>{if(!this.playing)this.setBoatColor(journeyPreferences().boatColor);});
    for(const side of [-1,1])for(const z of [-1.18,1.18]){
      const handle=this.box('red grip',new Vector3(side*1.4,.36,z),new Vector3(.34,.28,.63),'#b74939');handle.rotation.y=side*.25;handle.parent=this.raft;
      const binding=MeshBuilder.CreateTorus('rope binding',{diameter:.38,thickness:.06,tessellation:12},this.scene);binding.rotation.x=Math.PI/2;binding.position.set(side*1.4,.32,z);binding.material=this.mat('#e3bd85');binding.parent=this.raft;
    }
    for(let i=0;i<8;i++){const kind=(['hippo','croc','frog','penguin','capybara','bear','hippo','croc'] as CharacterId[])[i];this.characters.push(this.character(i,kind));if(i>3)this.characters[i].setEnabled(false);}
    this.aim=MeshBuilder.CreateTorus('thrust marker',{diameter:1,thickness:.025,tessellation:20},this.scene);this.aim.material=this.mat('#e5f2b5');this.aim.isVisible=false;
    this.setCourse('lagoon');this.engine.runRenderLoop(()=>this.render());window.addEventListener('resize',()=>this.engine.resize());
  }
  rand(seed:number){const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);}
  mat(hex:string){if(!this.materials.has(hex)){const m=new StandardMaterial(hex,this.scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.12,.12,.12);m.specularPower=48;this.materials.set(hex,m);}return this.materials.get(hex)!;}
  box(name:string,position:Vector3,size:Vector3,color:string){const m=MeshBuilder.CreateBox(name,{width:size.x,height:size.y,depth:size.z},this.scene);m.position.copyFrom(position);m.material=this.mat(color);m.receiveShadows=true;return m;}
  sphere(name:string,position:Vector3,size:number,color:string){const m=MeshBuilder.CreateSphere(name,{diameter:size,segments:12},this.scene);m.position.copyFrom(position);m.material=this.mat(color);m.receiveShadows=true;return m;}
  terrain(kind:'grass'|'sand'|'rock',color:string){
    const key=`${kind}-${color}`;if(this.materials.has(key))return this.materials.get(key)!;
    const texture=new DynamicTexture(key,512,this.scene,true),ctx=texture.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
    for(let i=0;i<2400;i++){
      const x=this.rand(i*7+4)*512,y=this.rand(i*7+5)*512,light=i%3===0;
      ctx.fillStyle=light?'rgba(242,231,177,.12)':'rgba(24,49,35,.13)';
      if(kind==='grass'){ctx.fillRect(x,y,1+this.rand(i)*2,3+this.rand(i+1)*9);}
      else{ctx.beginPath();ctx.ellipse(x,y,1+this.rand(i)*4,1+this.rand(i+1)*2,0,0,Math.PI*2);ctx.fill();}
    }
    if(kind==='rock')for(let i=0;i<16;i++){ctx.strokeStyle=i%2?'rgba(57,42,29,.18)':'rgba(245,210,167,.15)';ctx.lineWidth=2+this.rand(i)*5;ctx.beginPath();ctx.moveTo(0,i*32);ctx.bezierCurveTo(160,i*32+12,340,i*32-9,512,i*32+2);ctx.stroke();}
    texture.wrapU=texture.wrapV=Texture.WRAP_ADDRESSMODE;texture.uScale=kind==='grass'?3:1.3;texture.vScale=kind==='grass'?3:1.3;texture.anisotropicFilteringLevel=4;texture.update();
    const material=new StandardMaterial(key,this.scene);material.diffuseTexture=texture;material.specularColor=new Color3(.025,.035,.025);this.materials.set(key,material);return material;
  }
  makeWood(){
    const texture=new DynamicTexture('weathered green planks',{width:512,height:512},this.scene,false),ctx=texture.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle='#e2ded4';ctx.fillRect(0,0,512,512);
    for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#ece8df':'#d5d1c8';ctx.fillRect(i*64,0,63,512);ctx.fillStyle='#655f53';ctx.fillRect(i*64,0,2,512);for(let j=0;j<26;j++){ctx.strokeStyle=`rgba(56,50,39,${.03+this.rand(i*50+j)*.12})`;ctx.beginPath();ctx.moveTo(i*64+6+this.rand(j)*50,this.rand(j+2)*512);ctx.bezierCurveTo(i*64+20,150,i*64+45,350,i*64+20+this.rand(j+4)*20,512);ctx.stroke();}}
    texture.update();const m=new StandardMaterial('stained wood',this.scene);m.diffuseTexture=texture;m.specularColor=new Color3(.15,.18,.11);return m;
  }
  makeWater(course:CourseId){
    const texture=new DynamicTexture('flowing water',{width:512,height:1024},this.scene,false),ctx=texture.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle=course==='moonlight'?'#3d817c':course==='rapids'?'#62ac88':'#69b79c';ctx.fillRect(0,0,512,1024);
    for(let i=0;i<180;i++){
      const x=this.rand(i*3)*512,y=this.rand(i*3+1)*1024,w=10+this.rand(i*3+2)*40;
      ctx.strokeStyle=`rgba(222,255,242,${.035+this.rand(i+8)*.10})`;ctx.lineWidth=.5+this.rand(i+2)*1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.3,y-5,x+w*.5,y);ctx.quadraticCurveTo(x+w*.8,y+5,x+w,y-2);ctx.stroke();
    }
    texture.wrapU=texture.wrapV=Texture.WRAP_ADDRESSMODE;texture.update();
    const normal=new DynamicTexture('water ripple normals',256,this.scene,true),normalCtx=normal.getContext() as CanvasRenderingContext2D,data=normalCtx.createImageData(256,256);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const u=x/256*Math.PI*2,v=y/256*Math.PI*2,i=(y*256+x)*4;
      data.data[i]=128+9*Math.cos(u*3+v*2+Math.sin(v*3)) +4*Math.sin(u*7-v*4);
      data.data[i+1]=128+8*Math.cos(v*3+u*2+Math.sin(u*2))+4*Math.sin(v*7-u*3);data.data[i+2]=254;data.data[i+3]=255;
    }
    normalCtx.putImageData(data,0,0);normal.update();normal.wrapU=normal.wrapV=Texture.WRAP_ADDRESSMODE;normal.uScale=1;normal.vScale=2;normal.level=.12;
    const m=new StandardMaterial('river water',this.scene);m.diffuseTexture=texture;m.bumpTexture=normal;m.specularColor=new Color3(.22,.32,.34);m.specularPower=80;m.diffuseColor=new Color3(.85,.98,1);m.emissiveColor=new Color3(.01,.035,.04);return m;
  }
  character(index:number,kind:CharacterId){const root=createAnimal(this.scene,kind,c=>this.mat(c)),p=gripOffset(index,0,this.longBoat?8:4);root.parent=this.raft;root.position.set(p.x,.3,p.z);root.scaling.setAll(1);root.rotation.y=p.angle+Math.PI;return root;}
  makeFlow(){
    const texture=new DynamicTexture('downstream current ribbons',{width:256,height:1024},this.scene,false),ctx=texture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0,0,256,1024);
    for(let i=0;i<22;i++){
      const x=this.rand(i*5)*256,y=this.rand(i*5+1)*850,length=60+this.rand(i*5+2)*130;
      const tint=ctx.createLinearGradient(0,y,0,y+length);tint.addColorStop(0,'rgba(201,255,224,0)');tint.addColorStop(.45,'rgba(201,255,224,.65)');tint.addColorStop(1,'rgba(201,255,224,0)');
      ctx.strokeStyle=tint;ctx.lineWidth=.8+this.rand(i+51)*1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-5,y+length*.3,x+5,y+length*.6,x+2,y+length);ctx.stroke();
    }
    texture.hasAlpha=true;texture.wrapU=texture.wrapV=Texture.WRAP_ADDRESSMODE;texture.update();
    const material=new StandardMaterial('flowing river highlights',this.scene);material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;material.disableLighting=true;material.emissiveColor=new Color3(.72,.95,.8);material.alpha=.24;material.backFaceCulling=false;material.disableDepthWrite=true;return material;
  }
  setBoatColor(id:BoatColor){const palette=BOAT_COLORS[id];this.wood.diffuseColor=Color3.FromHexString(palette.deck);this.hull.material=this.mat(palette.hull);this.rim.material=this.mat(palette.rim);}
  setCharacter(index:number,kind:CharacterId){if(this.characters[index]?.metadata?.kind===kind)return;this.characters[index]?.dispose();this.characters[index]=this.character(index,kind);this.refreshShadows();}
  setPreview(kind:CharacterId){this.previewCharacter=kind;this.setCharacter(0,kind);}
  refreshShadows(){if(this.shadow&&this.raft)this.shadow.getShadowMap()!.renderList=[...this.raft.getChildMeshes(),...this.casters];}
  strip(name:string,edgeA:(z:number)=>number,edgeB:(z:number)=>number,offset:number,material:StandardMaterial,holes=false,vertical=0){
    material.backFaceCulling=false;
    const positions:number[]=[],indices:number[]=[],uvs:number[]=[],colors:number[]=[];const water=name==='curving water channel',divisions=water?10:1;
    for(let z=-140;z<230;z+=.75){
      const next=z+.75;if(holes&&(courseSurface(this.course,z)===null||courseSurface(this.course,next)===null))continue;
      for(let division=0;division<divisions;division++){
      const start=positions.length/3;
      const edge=(t:number,part:number)=>edgeA(t)+(edgeB(t)-edgeA(t))*part/divisions;
      for(const [t,across,level] of [[z,edge(z,division),0],[z,edge(z,division+1),vertical],[next,edge(next,division),0],[next,edge(next,division+1),vertical]]){
        const p=pathPoint(this.course,t,across),height=courseSurface(this.course,t)??courseFrame(this.course,t).height;
        positions.push(p.x,height+offset+level,p.z);uvs.push(across/9,t/10);
        if(water){const shallow=Math.pow(Math.abs(across)/(courseFrame(this.course,t).width/2),3);colors.push(.42+shallow*.36,.77+shallow*.22,.96-shallow*.12,1);}
      }
      indices.push(start,start+1,start+2,start+1,start+3,start+2);
      }
    }
    const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);for(let i=0;i<normals.length;i+=3)if(normals[i+1]<0){normals[i]*=-1;normals[i+1]*=-1;normals[i+2]*=-1;}const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;
    if(water)data.colors=colors;
    const mesh=new Mesh(name,this.scene);data.applyToMesh(mesh);mesh.material=material;mesh.receiveShadows=true;this.decor.push(mesh);return mesh;
  }
  palm(x:number,y:number,z:number,seed:number){
    const trunk=MeshBuilder.CreateCylinder('palm trunk',{diameterTop:.24,diameterBottom:.48,height:4.5,tessellation:8},this.scene);trunk.position.set(x,y+2.2,z);trunk.rotation.z=.12*Math.sin(seed);trunk.material=this.mat('#9e7851');this.decor.push(trunk);this.casters.push(trunk);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,leaf=this.sphere('palm leaf',new Vector3(x+Math.sin(a)*1.1,y+4.4,z+Math.cos(a)*1.1),1,'#3e8852');leaf.scaling.set(.65,.18,3.3);leaf.rotation.y=a;leaf.rotation.x=.18;this.decor.push(leaf);}
  }
  riverGarden(side:number,z:number,night:boolean){
    const seed=z*3+side*17,f=courseFrame(this.course,z),height=courseSurface(this.course,z);if(height===null||openEdge(z))return;
    const p=pathPoint(this.course,z,side*(f.width/2+1.5+this.rand(seed)*1.3));
    // Keep decoration beyond the playable bank and the visible spike rail.
    for(let i=0;i<3;i++){
      const leaf=this.sphere('riverbank foliage',new Vector3(p.x+(this.rand(seed+i)-.5)*1.5,height+.25+this.rand(seed+i+5)*.25,p.z+(this.rand(seed+i+10)-.5)*1.3),.8+this.rand(seed+i+20)*.55,night?'#386c69':['#2e7144','#438349','#5e944d'][i]);leaf.scaling.y=.65;leaf.material=this.mat(night?'#386c69':['#2e7144','#438349','#5e944d'][i]);this.decor.push(leaf);
    }
    const stone=this.sphere('mossy bank stone',new Vector3(p.x-side*.6,height-.05,p.z+.7),.7,'#858d79');stone.scaling.set(1.4,.55,.8);stone.material=this.terrain('rock',night?'#536e72':'#92957c');this.decor.push(stone);
    if(this.rand(seed+31)>.6){
      for(let i=0;i<3;i++){
        const flower=this.sphere('river wildflower',new Vector3(p.x+(i-1)*.23,height+.68,p.z+.35),.22,night?'#9ac9c6':i%2?'#edc16a':'#d98f87');this.decor.push(flower);
      }
    }else{
      for(let i=0;i<3;i++){
        const reed=MeshBuilder.CreateCylinder('waterside reed',{height:.7+this.rand(seed+i)*.6,diameterTop:.025,diameterBottom:.065,tessellation:4},this.scene);reed.position.set(p.x-side*.8+i*.12,height+.3,p.z-.45);reed.rotation.z=(i-1)*.17;reed.material=this.mat(night?'#4d8278':'#7b9757');this.decor.push(reed);
      }
    }
  }
  spike(position:Vector3,direction:Vector3,parent?:TransformNode){
    const mesh=MeshBuilder.CreateCylinder('ivory spike',{diameterTop:0,diameterBottom:.34,height:.72,tessellation:6},this.scene);mesh.position.copyFrom(position);
    const axis=Vector3.Cross(Vector3.Up(),direction);if(axis.length()>.01)mesh.rotationQuaternion=Quaternion.RotationAxis(axis.normalize(),Math.acos(Vector3.Dot(Vector3.Up(),direction.normalize())));
    mesh.material=this.mat('#f4ead5');if(parent)mesh.parent=parent;return mesh;
  }
  setCourse(course:CourseId){
    if(this.lastCourse===course)return;this.lastCourse=course;this.course=course;
    for(const m of this.decor)m.dispose();for(const h of this.hazards)h.mesh.dispose();for(const root of this.roots)root.dispose();this.decor=[];this.hazards=[];this.casters=[];this.roots=[];
    if(this.water){this.water.diffuseTexture?.dispose();this.water.bumpTexture?.dispose();this.water.dispose();}this.water=this.makeWater(course);
    if(this.flow){this.flow.diffuseTexture?.dispose();this.flow.dispose();}this.flow=this.makeFlow();
    const night=course==='moonlight';this.scene.clearColor=Color4.FromHexString(night?'#617b91ff':'#b9dfeaff');this.scene.fogColor=Color3.FromHexString(night?'#617b91':'#b9dfea');
    const floor=this.box('canyon floor',new Vector3(0,-22,40),new Vector3(220,2,500),night?'#374d57':'#71815d');this.decor.push(floor);
    this.strip('curving water channel',z=>-courseFrame(course,z).width/2,z=>courseFrame(course,z).width/2,-.4,this.water,true);
    this.strip('visible downstream currents',z=>-courseFrame(course,z).width/2+.2,z=>courseFrame(course,z).width/2-.2,-.385,this.flow,true);
    this.strip('channel underside',z=>-courseFrame(course,z).width/2-1,z=>courseFrame(course,z).width/2+1,-1.1,this.mat('#b58d65'),true);
    for(const side of [-1,1]){
      this.strip('grass rim',z=>side*(courseFrame(course,z).width/2+.3),z=>side*(courseFrame(course,z).width/2+4.5),-.12,this.terrain('grass',night?'#476c66':course==='rapids'?'#3e7b45':'#5d8b49'),true);
      this.strip('pebbled sand bank',z=>side*(courseFrame(course,z).width/2+.02),z=>side*(courseFrame(course,z).width/2+.6),-.25,this.terrain('sand',night?'#758889':'#c7b68a'),true);
      this.strip('weathered bank wall',z=>side*(courseFrame(course,z).width/2+4.5),z=>side*(courseFrame(course,z).width/2+4.5),-.25,this.terrain('rock',night?'#526c74':'#ad9477'),true,-1.2);
      for(let z=-80;z<220;z+=6)this.riverGarden(side,z,night);
      for(let z=-120;z<230;z+=8){
        const f=courseFrame(course,z),p=pathPoint(course,z,side*(f.width/2+10));
        const cliff=MeshBuilder.CreateCylinder('layered canyon',{diameterTop:13+this.rand(z)*3,diameterBottom:17,height:26,tessellation:9},this.scene);cliff.position.set(p.x,f.height-11,p.z);cliff.rotation.y=z*.41;cliff.material=this.terrain('rock',night?'#526e7b':course==='rapids'?'#7f8b70':['#b88668','#c89a76','#a87e67'][Math.abs(Math.round(z/8))%3]);this.decor.push(cliff);this.casters.push(cliff);cliff.receiveShadows=true;
        const cap=MeshBuilder.CreateCylinder('grassy cliff top',{diameterTop:13+this.rand(z)*3,diameterBottom:13+this.rand(z)*3+.15,height:.24,tessellation:9},this.scene);cap.position.set(p.x,f.height+2.02,p.z);cap.rotation.y=cliff.rotation.y;cap.material=this.terrain('grass',night?'#476c66':course==='rapids'?'#3e7b45':'#5d8b49');cap.receiveShadows=true;this.decor.push(cap);
        for(let band=0;band<3;band++){const line=MeshBuilder.CreateCylinder('rock stratum',{diameter:15.3-band*.7,height:.12,tessellation:7},this.scene);line.position.set(p.x,f.height-6+band*2.8,p.z);line.rotation.y=cliff.rotation.y;line.material=this.mat(night?'#75838c':'#dfab8b');this.decor.push(line);}
        if(z%24===12||z%24===0){const palm=pathPoint(course,z,side*(f.width/2+5));this.palm(palm.x,f.height+1.8,palm.z,z);}
        if(z>65&&z<112){const support=pathPoint(course,z,side*(f.width/2-.6));const pillar=this.box('bridge pier',new Vector3(support.x,(f.height-21)/2,support.z),new Vector3(1.3,f.height+21,1.6),night?'#6a7980':'#b9a084');this.decor.push(pillar);this.casters.push(pillar);}
      }
      for(const [from,to] of SPIKE_ZONES){
        const path:Vector3[]=[];
        for(let z=from;z<=to;z+=.7){const f=courseFrame(course,z),p=pathPoint(course,z,side*(f.width/2-.12));path.push(new Vector3(p.x,(courseSurface(course,z)??f.height)+.1,p.z));}
        const rail=MeshBuilder.CreateTube('curved spiked rail',{path,radius:.35,tessellation:10},this.scene);rail.material=this.mat('#85536e');this.decor.push(rail);
        for(let z=from;z<=to;z+=.7){const f=courseFrame(course,z),p=pathPoint(course,z,side*(f.width/2-.12));this.decor.push(this.spike(new Vector3(p.x,(courseSurface(course,z)??f.height)+.35,p.z),new Vector3(-side*f.nx,.35,-side*f.nz).normalize()));}
      }
    }
    for(const obstacle of COURSES[course].obstacles){
      const pose=obstaclePose(obstacle,0,course),height=courseSurface(course,obstacle.z)??courseFrame(course,obstacle.z).height;
      if(['rock','island'].includes(obstacle.kind)){
        const rock=MeshBuilder.CreateSphere('water worn boulder',{diameter:obstacle.radius*2,segments:12,updatable:true},this.scene);
        const vertices=rock.getVerticesData('position')!;
        for(let i=0;i<vertices.length;i+=3){const factor=.88+.1*Math.sin(vertices[i]*2+vertices[i+1]*3+obstacle.z)+.06*Math.cos(vertices[i+2]*4);vertices[i]*=factor;vertices[i+1]*=factor;vertices[i+2]*=factor;}
        rock.updateVerticesData('position',vertices);const normals:number[]=[];VertexData.ComputeNormals(vertices,rock.getIndices()!,normals);rock.updateVerticesData('normal',normals);rock.refreshBoundingInfo();
        rock.position.set(pose.x,height+.05,pose.z);rock.scaling.y=.65;rock.rotation.y=obstacle.z;rock.material=this.terrain('rock',night?'#667988':'#929a81');rock.receiveShadows=true;this.decor.push(rock);this.casters.push(rock);continue;
      }
      const root=new TransformNode('moving obstacle',this.scene);root.position.set(pose.x,height+.2,pose.z);root.rotation.y=pose.angle;
      if(obstacle.kind==='mine'||obstacle.kind==='pendulum'){
        const ball=this.sphere('spiked ball',new Vector3(0,.4,0),obstacle.radius*2,'#815873');ball.parent=root;
        for(let i=0;i<12;i++){const a=i*Math.PI/6;this.spike(new Vector3(Math.sin(a)*obstacle.radius,.4,Math.cos(a)*obstacle.radius),new Vector3(Math.sin(a),.2,Math.cos(a)).normalize(),root);}
        if(obstacle.kind==='pendulum'){const chain=this.box('swing chain',new Vector3(0,2.8,0),new Vector3(.1,4.5,.1),'#b4b8b5');chain.parent=root;chain.metadata={chain:true};}
      }else if(obstacle.kind==='tentacle'){
        const points=sweeperPoints(obstacle.radius),path=points.map(p=>new Vector3(p.x,.35,p.z));
        const hose=MeshBuilder.CreateTube('curled sweeper',{path,radius:.32,tessellation:12},this.scene);hose.material=this.mat('#7f4869');hose.parent=root;
        points.forEach((p,i)=>{if(i%1===0)this.spike(new Vector3(p.x,.8,p.z),Vector3.Up(),root);});
      }else if(obstacle.kind==='spinner'){
        for(const [a,b] of hazardSegments(obstacle)){const bar=this.box('rotating spiked blade',new Vector3((a.x+b.x)/2,.35,(a.z+b.z)/2),new Vector3(.6,.6,Math.hypot(b.x-a.x,b.z-a.z)),'#87516e');bar.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);bar.parent=root;for(let t=0;t<=1;t+=.13)this.spike(new Vector3(a.x+(b.x-a.x)*t,.9,a.z+(b.z-a.z)*t),Vector3.Up(),root);}
      }else{
        const log=this.box('sliding barricade',new Vector3(0,.35,0),new Vector3(obstacle.radius*2,.8,1.7),'#8e596f');log.parent=root;
        for(let x=-obstacle.radius+.3;x<obstacle.radius;x+=.65)this.spike(new Vector3(x,.95,0),Vector3.Up(),root);
      }
      this.hazards.push({mesh:root,obstacle});this.casters.push(...root.getChildMeshes() as Mesh[]);
    }
    for(const ramp of RAMPS){
      const f=courseFrame(course,ramp.lip),height=courseSurface(course,ramp.lip)!;
      for(let x=-f.width/2;x<f.width/2;x+=.65){const p=pathPoint(course,ramp.lip,x);const lip=this.box('ramp lip',new Vector3(p.x,height-.3,p.z),new Vector3(.42,.12,.32),'#e5c478');lip.rotation.y=f.angle;this.decor.push(lip);}
      for(const side of [-1,1]){const p=pathPoint(course,ramp.lip,side*(f.width/2+.6));const marker=this.box('jump marker',new Vector3(p.x,height+.6,p.z),new Vector3(.13,2,.13),'#e5d2a8');this.decor.push(marker);}
    }
    for(const z of [] as number[]){
      const f=courseFrame(course,z),root=new TransformNode('water acceleration arrows',this.scene);root.position.set(f.x,(courseSurface(course,z)??f.height)-.36,z);root.rotation.y=f.angle;
      this.roots.push(root);
      for(let x=-f.width/2+2;x<f.width/2-1;x+=2.4)for(const side of [-1,1]){const arrow=this.box('painted current chevron',new Vector3(x+side*.18,.008,0),new Vector3(.1,.015,.65),'#b4dcb4');arrow.rotation.y=side*Math.PI/4;arrow.parent=root;}
      this.decor.push(...root.getChildMeshes() as Mesh[]);
    }
    for(const z of [55,110,155,178]){
      const f=courseFrame(course,z),height=courseSurface(course,z)??f.height;
      for(const side of [-1,1]){
        const p=pathPoint(course,z,side*(f.width/2+.55));this.decor.push(this.box('checkpoint post',new Vector3(p.x,height+1.7,p.z),new Vector3(.15,4,.15),'#d6bf8b'));
        const flag=this.box('checkpoint pennant',new Vector3(p.x-side*.5,height+3,p.z),new Vector3(.95,.65,.06),z===178?'#ddba68':'#668879');flag.rotation.y=f.angle;this.decor.push(flag);
      }
      if(z===178){const banner=this.box('destination',new Vector3(f.x,height+3.5,z),new Vector3(f.width+1,.7,.1),'#d9c9a3');banner.rotation.y=f.angle;this.decor.push(banner);}
    }
    for(const mesh of this.decor){mesh.isPickable=false;mesh.freezeWorldMatrix();}
    this.refreshShadows();
  }
  update(state:Snapshot){
    this.state=state;this.setCourse(state.course);
    this.setBoatColor(isBoatColor(state.boatColor)?state.boatColor:journeyPreferences().boatColor);
    this.popped=state.phase==='failed';
    this.hull.isVisible=!this.popped;this.deck.isVisible=!this.popped;this.rim.isVisible=!this.popped;
    const long=(state.crewSize||4)>4;if(long!==this.longBoat){this.longBoat=long;this.hull.scaling.z=long?6.25:4.35;this.deck.scaling.z=long?1.7:1.15;this.rim.scaling.z=long?1.72:1.18;}
    for(const p of state.players)this.setCharacter(p.seat,p.character||'hippo');
  }
  setAim(_x:number,_z:number,_power:number){this.aim.isVisible=false;}
  gas(position:Vector3,velocity:Vector3){
    const mesh=this.sphere('gas',Vector3.Zero(),.48,'#a1bf43');
    mesh.position.copyFrom(position);mesh.metadata={life:1.2,max:1.2,velocity};this.effects.push(mesh);
  }
  render(){
    const dt=Math.min(.05,this.engine.getDeltaTime()/1000);this.time+=dt;const s=this.state;
    if(this.playing&&s){
      const b=s.boats![0],alpha=1-Math.exp(-13*dt);if(Math.hypot(b.x-this.raft.position.x,b.z-this.raft.position.z)>12){this.raft.position.set(b.x,b.y,b.z);this.camera.target.set(b.x*.85,b.y+.15,b.z+2.2);}this.raft.position.x+=(b.x-this.raft.position.x)*alpha;this.raft.position.z+=(b.z-this.raft.position.z)*alpha;this.raft.position.y+=(b.y-this.raft.position.y)*alpha;
      const yaw=Math.atan2(Math.sin(b.angle-this.raft.rotation.y),Math.cos(b.angle-this.raft.rotation.y));this.raft.rotation.y+=yaw*alpha;
      const surface=courseSurface(s.course,b.z),nextSurface=courseSurface(s.course,b.z+.6),slope=surface!==null&&nextSurface!==null?(nextSurface-surface)/.6:0;
      this.raft.rotation.x+=(-Math.atan(slope)*.5+(b.pitch||0)-this.raft.rotation.x)*dt*7;this.raft.rotation.z+=((b.roll||0)-this.raft.rotation.z)*dt*7;
      this.gasClock+=dt;this.raft.computeWorldMatrix(true);
      for(let i=0;i<8;i++){
        const p=s.players.find(p=>p.seat===i),animal=this.characters[i];animal.setEnabled(Boolean(p));if(!p)continue;
        const grip=gripOffset(i,p.grip||0,s.crewSize||4),facing=grip.angle+Math.PI;
        animal.position.x+=(grip.x-animal.position.x)*alpha;animal.position.z+=(grip.z-animal.position.z)*alpha;animal.position.y+=((this.popped?-.6:.3)-animal.position.y)*alpha;
        animal.rotation.y=facing;
        animal.rotation.x=this.reduced?0:Math.sin(this.time*4+i)*.025+p.thrust*.08;
        if(p.thrust>.1&&this.gasClock>.085&&!this.reduced){
          animal.computeWorldMatrix(true);
          const world=animal.getWorldMatrix(),butt=Vector3.TransformCoordinates(new Vector3(0,.43,-.76),world),exhaust=Vector3.TransformNormal(new Vector3(0,0,-1),world).normalize();
          // Inherit raft motion so lateral drift cannot bend the jet away from the butt.
          this.gas(butt,exhaust.scale(4.2).add(new Vector3(b.vx,0,b.vz)));
        }
      }
      if(this.gasClock>.085)this.gasClock=0;
      const f=courseFrame(s.course,b.z),bird=this.cameraMode==='bird';
      const aspect=this.engine.getRenderWidth()/this.engine.getRenderHeight(),mobile=matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600,ahead=courseFrame(s.course,b.z+8),view=courseCamera(aspect,f.width,ahead.width,b.x-f.x,bird,mobile);
      this.camera.fov=view.fov;this.target.set(f.x*.6+this.raft.position.x*.4,this.raft.position.y+.15,this.raft.position.z+view.lookahead);
      this.camera.target=Vector3.Lerp(this.camera.target,this.target,1-Math.exp(-5*dt));
      this.camera.radius+=(view.radius-this.camera.radius)*Math.min(1,dt*6);this.camera.alpha+=(-Math.PI/2-this.camera.alpha)*dt*4;this.camera.beta+=(view.beta-this.camera.beta)*dt*3;
      if(this.onNames){
        const width=this.engine.getRenderWidth(),height=this.engine.getRenderHeight(),viewport=this.camera.viewport.toGlobal(width,height);
        const tags=s.players.map(p=>{const animal=this.characters[p.seat];animal.computeWorldMatrix(true);const projected=Vector3.Project(animal.getAbsolutePosition().add(new Vector3(0,1.2,0)),Matrix.Identity(),this.scene.getTransformMatrix(),viewport);return {id:p.id,x:projected.x/width*this.canvas.clientWidth,y:projected.y/height*this.canvas.clientHeight,visible:projected.z>0&&projected.z<1};});
        // Keep adjacent names readable as players shuffle toward each other.
        for(let i=0;i<tags.length;i++)for(let pass=0;pass<tags.length;pass++)for(let j=0;j<i;j++)if(Math.abs(tags[i].x-tags[j].x)<(s.players[i].name.length+s.players[j].name.length)*3+10&&Math.abs(tags[i].y-tags[j].y)<17)tags[i].y=tags[j].y-17;
        this.onNames(tags);
      }
    }else{
      this.hull.isVisible=true;this.deck.isVisible=true;this.rim.isVisible=true;
      this.raft.position.set(0,this.reduced?0:Math.sin(this.time*2)*.055,5);this.raft.rotation.set(0,-.3,0);this.setCharacter(0,this.previewCharacter);
      for(let i=0;i<8;i++)this.characters[i].setEnabled(i<4);this.hull.scaling.z=4.35;this.deck.scaling.z=1.15;this.rim.scaling.z=1.18;this.longBoat=false;
      this.camera.target=Vector3.Lerp(this.camera.target,new Vector3(-4,0,7),dt*3);this.camera.radius+=(24-this.camera.radius)*dt*3;this.camera.alpha+=(-1.18-this.camera.alpha)*dt*3;this.camera.beta+=(.86-this.camera.beta)*dt*3;this.aim.isVisible=false;
    }
    for(let i=this.effects.length-1;i>=0;i--){const mesh=this.effects[i],m=mesh.metadata;m.life-=dt;mesh.position.addInPlace(m.velocity.scale(dt));mesh.visibility=Math.max(0,m.life/m.max)*.65;mesh.scaling.scaleInPlace(1+dt*1.4);if(m.life<=0){mesh.dispose();this.effects.splice(i,1);}}
    const clock=this.playing&&s?s.time:0;for(const {mesh,obstacle} of this.hazards){const p=obstaclePose(obstacle,clock,this.course);mesh.position.x=p.x;mesh.position.z=p.z;mesh.position.y=(courseSurface(this.course,obstacle.z)??courseFrame(this.course,obstacle.z).height)+.2+p.lift;mesh.rotation.y=p.angle;for(const child of mesh.getChildMeshes())if(child.metadata?.chain)child.rotation.z=p.swing;}
    if(!this.reduced&&this.water?.diffuseTexture){const texture=this.water.diffuseTexture as DynamicTexture;texture.vOffset=-this.time*.10;texture.uOffset=Math.sin(this.time*.2)*.005;const normal=this.water.bumpTexture as DynamicTexture;normal.vOffset=-this.time*.07;normal.uOffset=this.time*.009;const flow=this.flow?.diffuseTexture as DynamicTexture|undefined;if(flow)flow.vOffset=-this.time*.18;}
    this.scene.render();
  }
}
