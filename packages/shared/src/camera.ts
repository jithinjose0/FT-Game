/** Frame the navigable river plus both green banks, with space to see ahead. */
export function courseCamera(aspect:number,width:number,lookaheadWidth:number,boatOffset:number,bird=false,mobile=false){
  const portrait=aspect<.8,fov=portrait?.92:.8;
  const visibleWidth=Math.max(width,lookaheadWidth)+(mobile?10:8)+Math.abs(boatOffset)*.6;
  const radius=Math.max(bird?30:22,visibleWidth/(2*Math.tan(fov/2)*Math.max(.2,aspect)));
  return {radius,fov,beta:bird?.12:portrait?.56:.62,lookahead:portrait?5.2:4.5};
}
