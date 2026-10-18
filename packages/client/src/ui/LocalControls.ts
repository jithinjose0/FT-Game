import type { Input, LocalPlayer } from '@ft/shared';
export const KEYBOARDS=[
  {name:'Keyboard · WASD + Space',left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',fire:'Space',shuffleLeft:'KeyQ',shuffleRight:'KeyE'},
  {name:'Keyboard · Arrows + Enter',left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',fire:'Enter',shuffleLeft:'BracketLeft',shuffleRight:'BracketRight'},
  {name:'Keyboard · IJKL + U',left:'KeyJ',right:'KeyL',up:'KeyI',down:'KeyK',fire:'KeyU',shuffleLeft:'KeyO',shuffleRight:'KeyP'},
  {name:'Keyboard · TFGH + R',left:'KeyF',right:'KeyH',up:'KeyT',down:'KeyG',fire:'KeyR',shuffleLeft:'KeyY',shuffleRight:'KeyN'}
];
export const BINDINGS=[...KEYBOARDS.map((k,i)=>({id:`keyboard${i}`,name:k.name})),...Array.from({length:8},(_,i)=>({id:`gamepad${i}`,name:`Gamepad ${i+1} · left stick + RT / A`}))];
export class LocalControls {
  keys=new Set<string>();active=false;directions=new Map<number,{x:number;z:number}>();
  constructor(){
    window.addEventListener('keydown',event=>{if(!this.active||(event.target as HTMLElement)?.matches('input,select,textarea'))return;if(event.code.startsWith('Shift')||KEYBOARDS.some(k=>Object.values(k).includes(event.code))){event.preventDefault();this.keys.add(event.code);}});
    window.addEventListener('keyup',event=>this.keys.delete(event.code));
    const clear=()=>this.keys.clear();window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  }
  read(index:number,player:LocalPlayer,primary:Input):Input {
    if(!this.active)return {x:0,z:0,power:0};
    let x=0,z=0,power=0,lean=false,move=0;
    if(player.binding.startsWith('gamepad')){
      const pad=navigator.getGamepads?.()[Number(player.binding.slice(7))];
      if(pad){x=pad.axes[0]||0;z=-(pad.axes[1]||0);power=Math.max(pad.buttons[7]?.value||0,pad.buttons[0]?.value||0);lean=Boolean(pad.buttons[4]?.pressed);if(Math.hypot(x,z)<.18){x=0;z=0;}}
      if(pad)move=Math.abs(pad.axes[2]||0)>.2?Math.max(-1,Math.min(1,pad.axes[2])):0;
    }else{
      const k=KEYBOARDS[Number(player.binding.slice(8))]||KEYBOARDS[0];
      move=Number(this.keys.has(k.shuffleRight))-Number(this.keys.has(k.shuffleLeft));if(index===0&&player.binding==='keyboard0')move=primary.move||move;
      x=Number(this.keys.has(k.right))-Number(this.keys.has(k.left));z=Number(this.keys.has(k.up))-Number(this.keys.has(k.down));power=this.keys.has(k.fire)?primary.power||.8:0;
      if(index===0&&player.binding==='keyboard0'&&primary.power>0){x=primary.x;z=primary.z;power=primary.power;}
    }
    const length=Math.hypot(x,z);if(length>.1){x/=Math.max(1,length);z/=Math.max(1,length);this.directions.set(index,{x,z});}
    const dir=this.directions.get(index)||{x:0,z:1};lean=lean||this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');
    return {...dir,power,move,leanX:index===0&&primary.leanX?primary.leanX:lean?dir.x:0,leanZ:index===0&&primary.leanZ?primary.leanZ:lean?dir.z:0};
  }
}
