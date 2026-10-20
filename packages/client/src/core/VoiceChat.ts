import type {Room} from '@colyseus/sdk';

/** One opted-in microphone per device; audio stays within the current crew. */
export class VoiceChat {
  private stream?:MediaStream;
  private peers=new Map<string,{pc:RTCPeerConnection;audio:HTMLAudioElement;candidates:RTCIceCandidateInit[]}>();
  private button=document.createElement('button');
  private status=document.createElement('span');
  private panel=document.createElement('div');
  private enabled=false;
  private busy=false;
  private disposed=false;
  private roomClosed=false;
  private iceServers:RTCIceServer[]=[];
  private queue=Promise.resolve();
  constructor(private room:Room){
    this.panel.className='crew-voice';this.button.textContent='ENABLE CREW VOICE';
    this.status.setAttribute('role','status');this.panel.append(this.button,this.status);document.body.append(this.panel);
    this.button.onclick=()=>void this.toggle();
    room.onMessage('voice-config',(value:{iceServers:RTCIceServer[]})=>{this.iceServers=value.iceServers;});
    room.onMessage('voice-peers',(ids:string[])=>{if(this.enabled)for(const id of ids)this.offer(id);});
    room.onMessage('voice-left',(id:string)=>this.drop(id));
    room.onMessage('voice-signal',(value:any)=>{this.queue=this.queue.then(()=>this.signal(value)).catch(()=>{this.status.textContent='Voice connection failed. Toggle voice to retry.';});});
    room.onLeave(()=>{this.roomClosed=true;this.dispose();});
    window.addEventListener('pagehide',this.stop);
    document.addEventListener('visibilitychange',this.onVisibility);
  }
  private onVisibility=()=>{if(document.hidden)this.stop();};
  private stop=()=>{this.enabled=false;this.stream?.getTracks().forEach(t=>t.stop());this.stream=undefined;for(const id of this.peers.keys())this.drop(id);if(!this.disposed&&!this.roomClosed)this.room.send('voice-ready',false);this.button.textContent='ENABLE CREW VOICE';this.button.onclick=()=>void this.toggle();this.button.setAttribute('aria-pressed','false');this.status.textContent='Microphone off';};
  private async toggle(){
    if(this.enabled){this.stop();return;}if(this.busy)return;
    this.busy=true;this.button.disabled=true;
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw Error('Voice needs the Android app or an HTTPS browser connection.');
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      if(this.disposed||document.hidden){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;this.enabled=true;this.button.textContent='MUTE / LEAVE VOICE';this.button.setAttribute('aria-pressed','true');this.status.textContent='Microphone on · crew only';
      this.room.send('voice-ready',true);
      for(const {audio} of this.peers.values())void audio.play().catch(()=>{});
    }catch(error){this.status.textContent=error instanceof Error?error.message:'Microphone permission denied';}
    finally{this.busy=false;this.button.disabled=false;}
  }
  private peer(id:string){
    const existing=this.peers.get(id);if(existing)return existing;
    const pc=new RTCPeerConnection({iceServers:this.iceServers}),audio=document.createElement('audio');audio.autoplay=true;this.panel.append(audio);
    const peer={pc,audio,candidates:[] as RTCIceCandidateInit[]};this.peers.set(id,peer);
    for(const track of this.stream?.getTracks()||[])pc.addTrack(track,this.stream!);
    pc.onicecandidate=e=>{if(e.candidate&&this.enabled)this.room.send('voice-signal',{to:id,candidate:e.candidate.toJSON()});};
    pc.ontrack=e=>{audio.srcObject=e.streams[0]||new MediaStream([e.track]);void audio.play().catch(()=>{this.status.textContent='Tap RESUME AUDIO to hear your crew';this.button.textContent='RESUME AUDIO';this.button.onclick=()=>{for(const p of this.peers.values())void p.audio.play().catch(()=>{});this.button.textContent='MUTE / LEAVE VOICE';this.button.onclick=()=>void this.toggle();};});};
    pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed')this.status.textContent='Voice could not connect. A TURN relay may be needed.';};return peer;
  }
  private offer(id:string){this.queue=this.queue.then(async()=>{if(!this.enabled||this.peers.has(id))return;const {pc}=this.peer(id);await pc.setLocalDescription(await pc.createOffer());if(this.enabled)this.room.send('voice-signal',{to:id,description:pc.localDescription});}).catch(()=>{this.status.textContent='Voice connection failed. Toggle voice to retry.';});}
  private async signal(value:any){
    if(!this.enabled||typeof value?.from!=='string')return;
    const {pc,candidates}=this.peer(value.from);
    if(value.description){await pc.setRemoteDescription(value.description);for(const candidate of candidates.splice(0))await pc.addIceCandidate(candidate);if(value.description.type==='offer'){await pc.setLocalDescription(await pc.createAnswer());if(this.enabled)this.room.send('voice-signal',{to:value.from,description:pc.localDescription});}}
    else if(value.candidate){if(pc.remoteDescription)await pc.addIceCandidate(value.candidate);else if(candidates.length<64)candidates.push(value.candidate);}
  }
  private drop(id:string){const peer=this.peers.get(id);if(peer){peer.pc.close();peer.audio.srcObject=null;peer.audio.remove();this.peers.delete(id);}}
  dispose(){if(this.disposed)return;this.stop();this.disposed=true;this.panel.remove();window.removeEventListener('pagehide',this.stop);document.removeEventListener('visibilitychange',this.onVisibility);}
}
