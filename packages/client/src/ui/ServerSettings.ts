import {Capacitor} from '@capacitor/core';
import {configuredServer,setServer} from '../core/NetworkManager';

/** Native WebViews cannot infer the PC's multiplayer server from localhost. */
export function installServerSettings(){
  const button=document.getElementById('settings') as HTMLButtonElement;
  const previous=button.onclick;
  button.onclick=function(event){
    previous?.call(this,event);
    const host=document.getElementById('modal-content');if(!host)return;
    const section=document.createElement('section');section.className='server-settings';
    const title=document.createElement('h3');title.textContent='Multiplayer server';
    const hint=document.createElement('p');hint.textContent=Capacitor.isNativePlatform()?'FART CREW connects to its online server automatically. Only change this address for a custom server. Clear it and save to restore the default.':'Leave blank to use the current browser server. Android test builds can connect to your PC on the same Wi-Fi.';
    const label=document.createElement('label');label.textContent='SERVER ADDRESS';
    const input=document.createElement('input');input.id='backend-url';input.type='url';input.placeholder='wss://fc-game.onrender.com';input.value=configuredServer();input.autocomplete='off';input.spellcheck=false;label.append(input);
    const save=document.createElement('button');save.type='button';save.className='outline-button';save.id='save-backend';save.textContent='SAVE SERVER';
    const check=document.createElement('button');check.type='button';check.className='quiet-button';check.id='check-backend';check.textContent='TEST CONNECTION';
    const status=document.createElement('p');status.id='server-status';status.setAttribute('role','status');
    save.onclick=()=>{try{setServer(input.value);status.textContent='Server saved. New journeys will use this address.';}catch(error){status.textContent=error instanceof Error?error.message:String(error);}};
    check.onclick=async()=>{check.disabled=true;status.textContent='Checking server…';try{
      const value=input.value.trim();if(!value)throw Error('Enter the server address first.');
      const url=new URL(value.replace(/^ws/,'http'));if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Use a server origin such as ws://192.168.1.5:2567');
      const response=await fetch(url.origin+'/health',{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Server health check failed.');
      status.textContent='Server reachable. Save this address, then assemble or join a crew.';
    }catch{status.textContent='Could not reach the server. Check your internet connection. The free online server may take about a minute to wake; then retry.';}finally{check.disabled=false;}};
    section.append(title,hint,label,save,check,status);host.append(section);
  };
}
