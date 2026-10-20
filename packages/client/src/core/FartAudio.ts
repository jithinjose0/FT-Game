import type {Player} from '@ft/shared';
import {FART_SOUNDS,journeyPreferences,type FartSound} from './JourneyPreferences';

/** A low, fluttering raspberry with breath noise; no downloaded sound assets. */
export function fartSamples(sampleRate:number,variant=0){
  const data=new Float32Array(Math.floor(sampleRate*1.2));let phase=0,noise=0;
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,edge=Math.min(1,t/.025,(1.2-t)/.04);
    const pitch=57+variant*4+12*Math.sin(t*11)+5*Math.sin(t*31);
    phase+=pitch/sampleRate;
    noise=noise*.72+(Math.random()*2-1)*.28;
    const buzz=Math.sin(phase*Math.PI*2)+.42*Math.sin(phase*Math.PI*4)+.2*Math.sin(phase*Math.PI*6);
    const flutter=.28+.72*Math.pow((1+Math.sin(t*(24+variant)*Math.PI*2))*.5,2);
    data[i]=Math.tanh((buzz*.5+noise*.85)*1.6)*flutter*edge;
  }
  return data;
}

export class FartAudio {
  private context?:AudioContext;
  private buffers=new Map<number,AudioBuffer>();
  private samples=new Map<FartSound,AudioBuffer>();
  private loads=new Map<FartSound,Promise<void>>();
  private selected?:FartSound;
  private preview?:AudioBufferSourceNode;
  private voices=new Map<string,{source:AudioBufferSourceNode;gain:GainNode;filter:BiquadFilterNode}>();
  constructor(private enabled:()=>boolean){
    const unlock=()=>{if(!this.enabled())return;try{this.context??=new AudioContext();void this.context.resume().catch(()=>{});this.load(journeyPreferences().sound);}catch{}};
    document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
    window.addEventListener('blur',()=>this.stop());
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.stop();this.stopPreview();}});
    window.addEventListener('ft-preview-stop',()=>this.stopPreview());
    window.addEventListener('ft-preview-classic',()=>{
      try{
        this.stopPreview();this.context??=new AudioContext();const context=this.context;void context.resume();
        const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();
        source.buffer=context.createBuffer(1,Math.floor(context.sampleRate*1.2),context.sampleRate);source.buffer.getChannelData(0).set(fartSamples(context.sampleRate));filter.type='lowpass';filter.frequency.value=650;gain.gain.value=.13;
        source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start();this.preview=source;
        source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();if(this.preview===source)this.preview=undefined;};
      }catch{}
    });
  }
  private stopPreview(){if(this.preview){this.preview.stop();this.preview=undefined;}}
  private load(sound:FartSound){
    const context=this.context,url=FART_SOUNDS[sound].url;if(!context||!url||this.loads.has(sound))return;
    this.loads.set(sound,fetch(url).then(response=>{if(!response.ok)throw Error('Sound file unavailable');return response.arrayBuffer();}).then(data=>context.decodeAudioData(data)).then(buffer=>{this.samples.set(sound,buffer);}).catch(()=>{window.dispatchEvent(new CustomEvent('ft-sound-error',{detail:`Could not load ${FART_SOUNDS[sound].name}. Choose another sound or reload.`}));}));
  }
  update(players:Player[],playing:boolean){
    const context=this.context;
    if(!playing||!this.enabled()||document.hidden||!context||context.state!=='running'){this.stop();return;}
    const selected=journeyPreferences().sound;
    if(selected!==this.selected){this.stop();this.selected=selected;}
    this.load(selected);if(selected!=='classic'&&!this.samples.has(selected)){this.stop();return;}
    const firing=players.filter(p=>p.thrust>.01),active=new Set(firing.map(p=>p.id));
    for(const id of this.voices.keys())if(!active.has(id))this.remove(id);
    for(const player of firing){
      let voice=this.voices.get(player.id);
      if(!voice){
        const variant=player.seat%4;
        if(!this.buffers.has(variant)){const buffer=context.createBuffer(1,Math.floor(context.sampleRate*1.2),context.sampleRate);buffer.getChannelData(0).set(fartSamples(context.sampleRate,variant));this.buffers.set(variant,buffer);}
        const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();
        source.buffer=selected==='classic'?this.buffers.get(variant)!:this.samples.get(selected)!;source.loop=true;filter.type='lowpass';filter.frequency.value=selected==='classic'?650:18000;filter.Q.value=selected==='classic'?.8:.1;gain.gain.value=0;
        source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start();
        voice={source,gain,filter};this.voices.set(player.id,voice);
      }
      // Keep an eight-person crew comfortable and leave room for voice chat.
      voice.gain.gain.setTargetAtTime((selected==='classic'?.13:.38)*player.thrust/Math.sqrt(Math.max(1,firing.length)),context.currentTime,.025);
    }
  }
  private remove(id:string){
    const voice=this.voices.get(id);if(!voice||!this.context)return;
    this.voices.delete(id);const now=this.context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.012);voice.source.stop(now+.06);
    voice.source.onended=()=>{voice.source.disconnect();voice.filter.disconnect();voice.gain.disconnect();};
  }
  stop(){for(const id of this.voices.keys())this.remove(id);}
}
