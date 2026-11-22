/* The desert city and its sky are one world; the lift becomes a resonance portal. */
'use strict';
const CloudStoryV1={enabled:true,warned:new WeakSet()};
window.CloudStoryV1=CloudStoryV1;
C3.labels.distortion_district[1]='LADO B · DESERTO DA DISTORÇÃO';
C3.labels.sky_lift[1]='PORTAL DE RESSONÂNCIA';
C3.labels.cloud_sea[1]='ALÉM DA BORDA, NÃO HÁ CHÃO';
const cloudStoryCinemaV1=PB.cinemaPanel;
PB.cinemaPanel=function(area){
  if(CloudStoryV1.enabled&&area==='cloud'&&CloudWorldV1.assets.cinema)return CloudWorldV1.assets.cinema;
  return cloudStoryCinemaV1.call(this,area);
};
const cloudStoryAreaV1=C3.areaStory;
C3.areaStory=function(id){
  if(id==='cloud_sea'&&G?.c3?.cloudIntro&&!CloudStoryV1.warned.has(G))toast('NAS NUVENS · ESPERE O CHÃO SE FORMAR. FORA DA BORDA, QUEDA FATAL.');
  if(id==='cloud_sea'&&G)CloudStoryV1.warned.add(G);
  return cloudStoryAreaV1.call(this,id);
};
const cloudStoryObjectiveV1=C3.objective;
C3.objective=function(){
  const o=cloudStoryObjectiveV1.call(this);
  if(o?.area==='cloud_sea')return {...o,hint:o.hint+' Espere a nuvem ficar inteira. Cair da borda custa um quarto da vida.'};
  return o;
};
const cloudStoryPropV1=drawProp;
drawProp=function(p,cx,cy){
  const result=cloudStoryPropV1(p,cx,cy);
  if(!CloudStoryV1.enabled||p.type!=='c3_elevator'||G?.area!=='sky_lift'||!G.c3?.liftOpen)return result;
  const x=(p.x+.5)*T-cx,y=(p.y+.65)*T-cy-65;
  const phase=G.options10?.reducedMotion?0:EnvironmentAtmosphereV1.clock;
  ctx.save();ctx.translate(x,y);ctx.scale(.72,1);
  const light=ctx.createRadialGradient(0,0,3,0,0,34);light.addColorStop(0,'#d9f5dd80');light.addColorStop(.7,'#6dcabb3d');light.addColorStop(1,'#68b8ae00');
  ctx.fillStyle=light;ctx.beginPath();ctx.ellipse(0,0,31,34,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle='#a8e1ce';ctx.beginPath();ctx.ellipse(0,0,28,32,0,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='#ecddad';
  for(let i=0;i<3;i++){const start=phase*.5+i*Math.PI*2/3;ctx.beginPath();ctx.arc(0,0,19-i*3,start,start+Math.PI*.9);ctx.stroke()}
  ctx.restore();return result;
};
