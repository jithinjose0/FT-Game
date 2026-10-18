/** Fit both banks with 2m of context on either side. Radius is in world metres. */
export function courseCamera(aspect:number,width:number,lookaheadWidth:number,boatOffset:number,bird=false){
  const portrait=aspect<.8,fov=portrait?.82:.72;
  const visibleWidth=Math.max(width,lookaheadWidth)+4+Math.abs(boatOffset)*.5;
  const radius=Math.max(bird?27:22,visibleWidth/(2*Math.tan(fov/2)*Math.max(.2,aspect)));
  return {radius,fov,beta:bird?.12:portrait?.32:.52,lookahead:portrait?5:3};
}
