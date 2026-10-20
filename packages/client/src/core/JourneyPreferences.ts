import {BOAT_COLORS,isBoatColor,type BoatColor} from '@ft/shared';

export const FART_SOUNDS={perfect:{name:'Perfect fart',url:'/audio/perfect-fart.mp3'},dry:{name:'Dry fart',url:'/audio/dry-fart.mp3'},classic:{name:'Classic',url:''}} as const;
export type FartSound=keyof typeof FART_SOUNDS;
export function journeyPreferences():{sound:FartSound;boatColor:BoatColor}{
  try{const v=JSON.parse(localStorage.getItem('ft-journey-options')||'{}');return {sound:Object.hasOwn(FART_SOUNDS,v.sound)?v.sound:'perfect',boatColor:isBoatColor(v.boatColor)?v.boatColor:'wood'};}catch{return {sound:'perfect',boatColor:'wood'};}
}
export function saveJourneyPreferences(value:Partial<ReturnType<typeof journeyPreferences>>){
  const next={...journeyPreferences(),...value};localStorage.setItem('ft-journey-options',JSON.stringify(next));window.dispatchEvent(new Event('ft-journey-options'));
}
export {BOAT_COLORS};
