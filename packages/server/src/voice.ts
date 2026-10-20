import {createHmac} from 'node:crypto';

const urls=(value:string|undefined)=>value?.split(',').map(s=>s.trim()).filter(Boolean)||[];
export function voiceConfiguration(){
  const meteredHost=process.env.VOICE_METERED_HOST?.trim(),meteredKey=process.env.VOICE_METERED_API_KEY?.trim();
  if(Boolean(meteredHost)!==Boolean(meteredKey))throw new Error('Set both VOICE_METERED_HOST and VOICE_METERED_API_KEY');
  if(meteredHost&&!/^[a-z0-9-]+\.metered\.(live|ca)$/i.test(meteredHost))throw new Error('VOICE_METERED_HOST must be your Metered hostname, without https:// or a path');
  const stun=urls(process.env.VOICE_STUN_URLS),turn=urls(process.env.VOICE_TURN_URLS);
  if(stun.some(url=>!/^stun:[^\s]+$/.test(url)))throw new Error('VOICE_STUN_URLS must contain comma-separated stun: URLs');
  if(turn.some(url=>!/^turns?:[^\s]+$/.test(url)))throw new Error('VOICE_TURN_URLS must contain comma-separated turn: or turns: URLs');
  if(Boolean(turn.length)!==Boolean(process.env.VOICE_TURN_SECRET))throw new Error('Set both VOICE_TURN_URLS and VOICE_TURN_SECRET, or leave both empty');
  return {stun,turn,meteredHost,meteredKey};
}
export function voiceStatus(){const {stun,turn,meteredHost}=voiceConfiguration();return {stunConfigured:stun.length>0,turnConfigured:turn.length>0||Boolean(meteredHost)};}

/** Fetch account-scoped relay credentials on the backend; never expose the API key. */
export async function configuredVoiceIceServers(sessionId:string){
  const {meteredHost,meteredKey}=voiceConfiguration();
  if(!meteredHost)return voiceIceServers(sessionId);
  const endpoint=new URL(`https://${meteredHost}/api/v1/turn/credentials`);endpoint.searchParams.set('apiKey',meteredKey!);
  let response:Response;
  try{response=await fetch(endpoint,{signal:AbortSignal.timeout(8000)});}catch{throw new Error('Voice relay provider could not be reached');}
  if(!response.ok)throw new Error('Voice relay provider rejected the credential request');
  let data:unknown;try{data=await response.json();}catch{throw new Error('Voice relay provider returned invalid credentials');}
  if(!Array.isArray(data)||!data.length||data.length>32)throw new Error('Voice relay provider returned invalid credentials');
  const servers=data.map(value=>{
    const urls=typeof value?.urls==='string'?[value.urls]:value?.urls;
    if(!Array.isArray(urls)||!urls.length||urls.some(url=>typeof url!=='string'||!/^stuns?:[^\s]+$|^turns?:[^\s]+$/.test(url)))throw new Error('Voice relay provider returned invalid server URLs');
    const turn=urls.some(url=>url.startsWith('turn'));
    if(turn&&(typeof value.username!=='string'||typeof value.credential!=='string'))throw new Error('Voice relay provider returned incomplete credentials');
    return {urls, ...(turn?{username:value.username,credential:value.credential}:{})};
  });
  if(!servers.some(server=>server.urls.some(url=>url.startsWith('turn'))))throw new Error('Voice relay provider returned no TURN servers');
  return servers;
}

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
