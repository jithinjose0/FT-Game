import {createHmac} from 'node:crypto';

const urls=(value:string|undefined)=>value?.split(',').map(s=>s.trim()).filter(Boolean)||[];
export function voiceConfiguration(){
  const stun=urls(process.env.VOICE_STUN_URLS),turn=urls(process.env.VOICE_TURN_URLS);
  if(stun.some(url=>!/^stun:[^\s]+$/.test(url)))throw new Error('VOICE_STUN_URLS must contain comma-separated stun: URLs');
  if(turn.some(url=>!/^turns?:[^\s]+$/.test(url)))throw new Error('VOICE_TURN_URLS must contain comma-separated turn: or turns: URLs');
  if(Boolean(turn.length)!==Boolean(process.env.VOICE_TURN_SECRET))throw new Error('Set both VOICE_TURN_URLS and VOICE_TURN_SECRET, or leave both empty');
  return {stun,turn};
}
export function voiceStatus(){const {stun,turn}=voiceConfiguration();return {stunConfigured:stun.length>0,turnConfigured:turn.length>0};}

/** coturn REST credentials expire after one day; the shared secret stays on the server. */
export function voiceIceServers(sessionId:string){
  const {stun,turn}=voiceConfiguration();
  const servers:{urls:string[];username?:string;credential?:string}[]=[];
  if(stun.length)servers.push({urls:stun});
  if(turn.length){
    const username=`${Math.floor(Date.now()/1000)+86400}:${sessionId}`;
    servers.push({urls:turn,username,credential:createHmac('sha1',process.env.VOICE_TURN_SECRET!).update(username).digest('base64')});
  }
  return servers;
}
