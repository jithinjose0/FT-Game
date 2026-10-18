import type { Input } from '@ft/shared';
export class TouchControls {
  input:Input={x:0,z:1,power:0};
  keys=new Set<string>();
  active=false;
  strength=0.8;
  firing=false;
  leaning=false;
  move=0;
  splitKeyboard=false;
  constructor(private joystick:HTMLElement,private trigger:HTMLElement,private knob:HTMLElement,private balance?:HTMLElement) {
    let pointer:number|undefined;
    const aim=(e:PointerEvent)=>{
      const rect=joystick.getBoundingClientRect();
      let x=(e.clientX-rect.left-rect.width/2)/(rect.width*0.34),z=-(e.clientY-rect.top-rect.height/2)/(rect.height*0.34);
      const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}
      if(length>0.12){this.input.x=x;this.input.z=z;}
      knob.style.transform=`translate(${x*38}px,${-z*38}px)`;
    };
    joystick.addEventListener('pointerdown',e=>{pointer=e.pointerId;joystick.setPointerCapture(pointer);aim(e);});
    joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointer)aim(e);});
    const release=()=>{pointer=undefined;knob.style.transform='translate(0,0)';};
    joystick.addEventListener('pointerup',release);joystick.addEventListener('pointercancel',release);
    trigger.addEventListener('pointerdown',e=>{trigger.setPointerCapture(e.pointerId);this.firing=true;if(e.pointerType==='pen')this.strength=Math.max(.1,e.pressure);});
    trigger.addEventListener('pointerup',()=>this.firing=false);trigger.addEventListener('pointercancel',()=>this.firing=false);
    trigger.addEventListener('lostpointercapture',()=>this.firing=false);
    balance?.addEventListener('pointerdown',e=>{balance.setPointerCapture(e.pointerId);this.leaning=true;});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])balance?.addEventListener(event,()=>this.leaning=false);
    for(const [id,direction] of [['shuffle-left',-1],['shuffle-right',1]] as const){const button=document.getElementById(id);button?.addEventListener('pointerdown',e=>{button.setPointerCapture(e.pointerId);this.move=direction;});for(const event of ['pointerup','pointercancel','lostpointercapture'])button?.addEventListener(event,()=>this.move=0);}
    window.addEventListener('keydown',e=>{
      if(!this.active || (e.target as HTMLElement)?.matches('input,select,textarea'))return;
      if(['KeyQ','KeyE','ShiftLeft','ShiftRight','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    const stop=()=>{this.keys.clear();this.firing=false;this.leaning=false;this.move=0;this.input.power=0;};
    window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  }
  read():Input {
    if(!this.active)return {x:0,z:0,power:0};
    const x=Number(this.keys.has('KeyD')||(!this.splitKeyboard&&this.keys.has('ArrowRight')))-Number(this.keys.has('KeyA')||(!this.splitKeyboard&&this.keys.has('ArrowLeft')));
    const z=Number(this.keys.has('KeyW')||(!this.splitKeyboard&&this.keys.has('ArrowUp')))-Number(this.keys.has('KeyS')||(!this.splitKeyboard&&this.keys.has('ArrowDown')));
    if(x||z){const l=Math.hypot(x,z);this.input.x=x/l;this.input.z=z/l;}
    this.input.power=this.firing||this.keys.has('Space')?this.strength:0;
    this.input.move=this.move||Number(this.keys.has('KeyE'))-Number(this.keys.has('KeyQ'));
    const lean=this.leaning||this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');
    this.input.leanX=lean?this.input.x:0;this.input.leanZ=lean?this.input.z:0;this.balance?.classList.toggle('leaning',lean);
    this.trigger.classList.toggle('firing',this.input.power>0);
    return {...this.input};
  }
}
