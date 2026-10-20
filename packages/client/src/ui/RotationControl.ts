import {Capacitor,registerPlugin} from '@capacitor/core';

const orientation=registerPlugin<{set(options:{orientation:'portrait'|'landscape'}):Promise<void>}>('GameOrientation');

export function installRotationControl(){
  const button=document.createElement('button');button.id='rotate-screen';button.type='button';
  const status=document.createElement('span');status.id='rotation-status';status.setAttribute('role','status');
  const label=()=>{const landscape=window.innerWidth>window.innerHeight;button.textContent=landscape?'▯ PORTRAIT':'▭ LANDSCAPE';button.setAttribute('aria-label',landscape?'Rotate to portrait':'Rotate to landscape');};
  label();document.body.append(button,status);window.addEventListener('resize',label);
  button.onclick=async()=>{
    button.disabled=true;status.textContent='';
    let enteredFullscreen=false;
    const target=window.innerWidth>window.innerHeight?'portrait':'landscape';
    try{
      if(Capacitor.isNativePlatform())await orientation.set({orientation:target});
      else{
        const screenOrientation=screen.orientation as ScreenOrientation & {lock?:(value:string)=>Promise<void>};
        if(!screenOrientation?.lock)throw Error('Use the Android app for manual rotation, or rotate your phone.');
        if(!document.fullscreenElement){await document.documentElement.requestFullscreen();enteredFullscreen=true;}
        await screenOrientation.lock(target);
      }
    }catch{if(enteredFullscreen&&document.fullscreenElement)await document.exitFullscreen().catch(()=>{});status.textContent=Capacitor.isNativePlatform()?'Could not rotate. Please try again.':'Manual rotation needs the Android app on this browser. You can also rotate your phone.';window.setTimeout(()=>status.textContent='',6000);}
    finally{button.disabled=false;label();}
  };
}
