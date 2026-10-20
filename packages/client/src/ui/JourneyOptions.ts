import {FART_SOUNDS,journeyPreferences,saveJourneyPreferences,BOAT_COLORS,type FartSound} from '../core/JourneyPreferences';
import type {BoatColor} from '@ft/shared';

export function installJourneyOptions(){
  const panel=document.createElement('details');panel.className='journey-options';panel.setAttribute('aria-label','Customize your journey');
  const title=document.createElement('summary');title.textContent='SOUND & BOAT COLOUR ▾';
  const label=document.createElement('label');label.textContent='FART SOUND';
  const select=document.createElement('select');select.id='fart-sound';select.setAttribute('aria-label','Fart sound');
  for(const [id,sound] of Object.entries(FART_SOUNDS)){const option=document.createElement('option');option.value=id;option.textContent=sound.name;select.append(option);}
  select.value=journeyPreferences().sound;
  const preview=document.createElement('button');preview.type='button';preview.id='preview-fart';preview.textContent='▶ TEST SOUND';
  const status=document.createElement('span');status.id='sound-preview-status';status.setAttribute('role','status');
  const audio=document.createElement('audio');audio.id='fart-preview-audio';audio.preload='metadata';audio.hidden=true;audio.volume=.65;
  const stop=()=>{audio.pause();audio.currentTime=0;window.dispatchEvent(new Event('ft-preview-stop'));preview.textContent='▶ TEST SOUND';};
  window.addEventListener('ft-sound-error',event=>status.textContent=(event as CustomEvent<string>).detail);
  select.onchange=()=>{stop();saveJourneyPreferences({sound:select.value as FartSound});status.textContent='Sound saved.';};
  preview.onclick=async()=>{
    if(!audio.paused){stop();return;}
    const sound=FART_SOUNDS[select.value as FartSound];
    if(!sound.url){window.dispatchEvent(new Event('ft-preview-classic'));status.textContent='Playing classic sound.';return;}
    audio.src=sound.url;status.textContent='';
    try{await audio.play();preview.textContent='■ STOP';status.textContent=`Playing ${sound.name}.`;}catch{status.textContent='Could not play this sound. Tap TEST SOUND to retry.';}
  };
  audio.onended=()=>{preview.textContent='▶ TEST SOUND';status.textContent='Preview finished.';};
  audio.onerror=()=>{preview.textContent='▶ TEST SOUND';status.textContent='This sound could not be loaded.';};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});document.getElementById('play')?.addEventListener('click',stop);document.getElementById('join')?.addEventListener('click',stop);
  const row=document.createElement('div');row.className='sound-option-row';label.append(select);row.append(label,preview);
  const colors=document.createElement('div');colors.className='boat-swatches';colors.setAttribute('role','group');colors.setAttribute('aria-label','Boat colour');
  const colorLabel=document.createElement('span');colorLabel.className='option-label';colorLabel.textContent='BOAT COLOUR · HOST CHOOSES FOR THE CREW';
  for(const [id,color] of Object.entries(BOAT_COLORS)){
    const button=document.createElement('button');button.type='button';button.dataset.boatColor=id;button.title=color.name;button.setAttribute('aria-label',`${color.name} boat`);button.setAttribute('aria-pressed',String(id===journeyPreferences().boatColor));button.style.setProperty('--swatch',color.deck);
    button.onclick=()=>{saveJourneyPreferences({boatColor:id as BoatColor});for(const item of colors.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));};colors.append(button);
  }
  panel.append(title,row,status,colorLabel,colors,audio);document.querySelector('.character-choice')?.after(panel);
}
