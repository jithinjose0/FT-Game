import { Client, type Room } from '@colyseus/sdk';
import type { Snapshot, CourseId, Input, CharacterId, LocalPlayer } from '@ft/shared';
import { Capacitor } from '@capacitor/core';
import { VoiceChat } from './VoiceChat';
import {journeyPreferences} from './JourneyPreferences';
export function defaultServer(){return import.meta.env.VITE_SERVER_URL||(Capacitor.isNativePlatform()?'wss://fc-game.onrender.com':'');}
export function configuredServer(){try{return localStorage.getItem('ft-server')||defaultServer();}catch{return defaultServer();}}
export function setServer(value:string){
  if(!value.trim()){localStorage.removeItem('ft-server');return;}
  const url=new URL(value.trim().replace(/^http/,'ws'));
  if(!['ws:','wss:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Use a server origin such as wss://game.example.com or ws://192.168.1.5:2567');
  localStorage.setItem('ft-server',url.origin);
}
export function serverURL() {
  const configured=configuredServer();
  if(configured)return configured.replace(/\/$/,'');
  if(Capacitor.isNativePlatform())throw new Error('Set the multiplayer server address in Settings before playing on Android or iOS.');
  const protocol=location.protocol==='https:'?'wss:':'ws:';
  return `${protocol}//${location.hostname}:${location.port==='5173'?'2567':location.port|| (location.protocol==='https:'?'443':'80')}`;
}
export class NetworkManager {
  room?:Room;
  voice?:VoiceChat;
  async connect(mode:'create'|'join'|'quick',name:string,course:CourseId,skin:string,code:string,onState:(s:Snapshot)=>void,onNotice:(s:string)=>void,onLeave:()=>void,setup?:{crewSize:number;character:CharacterId;localPlayers?:LocalPlayer[]}) {
    const client=new Client(serverURL());
    const options={name,course,skin,mode:'coop',boatColor:journeyPreferences().boatColor,...setup};
    this.room=mode==='join'?await client.joinById(code.trim().toUpperCase(),options):mode==='quick'?await client.joinOrCreate('raft',options):await client.create('raft',options);
    this.voice?.dispose();this.voice=new VoiceChat(this.room);
    this.room.onMessage('snapshot',onState);
    this.room.onMessage('notice',onNotice);
    this.room.onError((_code,message)=>onNotice(message||'Connection error'));
    this.room.onLeave(onLeave);
    return this.room;
  }
  input(input:Input){this.room?.send('input',input);}
  localInputs(inputs:{id:string;input:Input}[]){this.room?.send('localInputs',inputs);}
  action(action:string,payload?:unknown){this.room?.send(action,payload);}
  async leave(){this.voice?.dispose();this.voice=undefined;const room=this.room;this.room=undefined;if(room)await Promise.race([room.leave(),new Promise(resolve=>setTimeout(resolve,1000))]);}
}
