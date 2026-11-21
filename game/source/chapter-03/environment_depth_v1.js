/* Architectural volume and room-specific surfaces. Render only: no map/save edits.
 * drawGround and sortY are invoked by the compiler's existing world passes.
 */
'use strict';
const EnvironmentDepthV1=(()=>{
 const api={enabled:true,assets:__ENVIRONMENT_VOLUME_ASSETS__,manifest:__ENVIRONMENT_VOLUME_MANIFEST__,images:{}};
 api.image=function(sheet){
  if(!this.assets[sheet])return null;
  if(!this.images[sheet]){const image=new Image();image.src=this.assets[sheet];this.images[sheet]=image}
  return this.images[sheet];
 };
 api.ready=async function(){await Promise.all(Object.keys(this.assets).map(sheet=>this.image(sheet).decode()))};
 api.assetKey=function(p){
  if(p.type==='house')return 'c1_'+(['shop','inn','archive'].includes(p.kind)?p.kind:'house');
  if(p.type!=='voiceHouse')return null;
  const sign=(p.sign||'').toUpperCase();
  return 'c2_'+(sign.includes('BENTO')?'workshop':sign.includes('MERCADO')||sign.includes('DISCOS')?'shop':/R[ÁA]DIO|TORRE/.test(sign)?'radio':'home');
 };
 api.resource=function(p){const key=this.assetKey(p),item=key&&this.manifest.items?.[key],image=item&&this.image(item.sheet);return image?.complete&&image.naturalWidth?{key,item,image}:null};
 const profiles={
  studio:{style:'recording',ambient:.80,tint:'#21192b',lights:[[19,2,6,'#ffd3a0',.30],[12,3,4,'#a6d4cf',.18]],wall:['#332c36','#65504d','#a88b70']},
  corridor:{style:'passage',ambient:.58,tint:'#171727',lights:[[5,8,5,'#dbb290',.25],[31,8,5,'#b8d9df',.25]],wall:['#262633','#4b4755','#827885']},
  chamber:{style:'ceremony',ambient:.69,tint:'#17232b',lights:[[11.5,7,7,'#d7e8d3',.26]],wall:['#343e43','#697773','#b9c3aa']},
  celina_home:{style:'home',ambient:.88,tint:'#33231f',lights:[[4,3,6,'#ffe1ad',.30],[19,3,6,'#ffd9a0',.30],[20,7,4,'#f5c28b',.22]],wall:['#675149','#ac9175','#dbc8a1']},
  bento_shop:{style:'repair',ambient:.76,tint:'#1b2429',lights:[[12,6,5,'#c4e0d3',.30],[18,7,4,'#ffd192',.26]],wall:['#353d3c','#747d6f','#b5bd9e']},
  tape_market:{style:'records',ambient:.91,tint:'#34262c',lights:[[5,3,6,'#ffe4af',.25],[20,3,6,'#ffe4af',.25]],wall:['#58404a','#966776','#d5a38f']},
  radio9:{style:'broadcast',ambient:.64,tint:'#17232a',lights:[[12,4,5,'#b2d6ce',.25],[7,7,4,'#e2c08f',.24],[18,6,4,'#c8d6ba',.22]],wall:['#29343a','#586c6c','#95a29a']},
  voice_tower:{style:'transmission',ambient:.72,tint:'#1e2035',lights:[[14,11,10,'#b1c3d2',.18]],wall:['#252d3b','#526170','#8f9d9f']},
  contratempo:{style:'club',ambient:.56,tint:'#231b26',lights:[[14,4,8,'#edc18a',.26],[22,11,5,'#e8bb85',.29],[5,5,4,'#b9c2ad',.15]],wall:['#31282b','#6b4540','#ac795c']},
  ciro_workshop:{style:'instruments',ambient:.78,tint:'#272320',lights:[[14,5,6,'#f0d5a4',.29],[7,8,5,'#bdcdc0',.24]],wall:['#3d3830','#78644c','#ad9470']},
  power_plant:{style:'factory',ambient:.62,tint:'#1c2426',lights:[[9,6,7,'#c3d2b3',.22],[27,7,6,'#e2ba7c',.25],[27,18,6,'#becfbb',.20]],wall:['#2b3433','#58635a','#8e997e']},
  last_torii:{style:'sanctuary',ambient:.70,tint:'#24242b',lights:[[13,8,8,'#e2cf9e',.24],[4,6,5,'#d9c69a',.20],[22,6,5,'#d9c69a',.20]],wall:['#383a38','#757263','#a9a087']},
  silence_core:{style:'abyss',ambient:.57,tint:'#171c23',lights:[[17,11,12,'#b3bda9',.18],[6,17,5,'#d6b57b',.18],[28,17,5,'#d6b57b',.18]],wall:['#252c2d','#4b5350','#747c6e']}
 };
 api.profiles=profiles;
 api.profile=function(area=G?.area){return profiles[area]||null};
 api.lightingProfile=function(area=G?.area){
  const p=this.enabled&&profiles[area];
  return p?{ambient:p.ambient,tint:p.tint,lights:p.lights.map(([x,y,radius,color,intensity])=>({x,y,radius,color,intensity}))}:{ambient:1,tint:'#000000',lights:[]};
 };
 const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill()};
 const segment=(x1,y1,x2,y2,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(Math.round(x1),Math.round(y1));ctx.lineTo(Math.round(x2),Math.round(y2));ctx.stroke()};
 const floorTypes=new Set(['wood','rug','stone','marble','insidewood','insideworkshop','insidecarpet','radiofloor','towerfloor','towersignal','c3_indoor','c3_clubfloor','c3_factory','c3_sanctuary','c3_voidfloor']);
 function authored(item,x,y,xx,yy,alpha=1){
  if(typeof CenariosV2==='undefined'||typeof CenariosV2.material!=='function')return false;
  ctx.save();try{ctx.globalAlpha*=alpha;return CenariosV2.material(item,x,y,xx,yy)}finally{ctx.restore()}
 }
 function zone(item,x,y,xx,yy,left,top,width,height,edge){
  if(xx<left||yy<top||xx>=left+width||yy>=top+height)return false;
  authored(item,x,y,xx,yy);
  if(edge){ctx.save();ctx.globalAlpha*=.45;
   if(xx===left)rect(x+2,y,1,T,edge);if(xx===left+width-1)rect(x+T-3,y,1,T,edge);
   if(yy===top)rect(x,y+2,T,1,edge);if(yy===top+height-1)rect(x,y+T-3,T,1,edge);
   ctx.restore();
  }
  return true;
 }
 function ringTile(x,y,xx,yy,cx,cy,radius,color,width=1){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x+(cx-xx)*T,y+(cy-yy)*T,radius*T,0,Math.PI*2);ctx.stroke();
 }
 api.wallTile=function(p,x,y,xx,yy){
  const [dark,mid,light]=p.wall;
  rect(x,y,T,T,mid);rect(x,y+T-5,T,5,dark);rect(x,y+T-6,T,1,light);
  switch(p.style){
   case 'recording':case 'broadcast':case 'club':
    rect(x+2,y+2,T-4,T-10,dark);
    for(let i=4;i<T-3;i+=4)rect(x+i,y+4,1,T-14,mid);
    rect(x+2,y+2,T-4,1,light);break;
   case 'repair':case 'factory':case 'instruments':
    for(let i=3;i<T;i+=6)rect(x+i,y,1,T-6,dark);
    rect(x+3,y+4,2,2,light);rect(x+T-5,y+T-11,2,2,light);
    if(p.style==='factory'){rect(x,y+8,T,3,dark);rect(x,y+8,T,1,light)}break;
   case 'home':case 'records':
    rect(x,y+12,T,1,dark);rect(x+2,y+14,T-4,4,dark);
    rect(x+3,y+15,T-6,2,light);
    if(p.style==='home')rect(x+11,y+3,2,5,light);else segment(x+4,y+4,x+18,y+9,light);break;
   default:
    if(xx%2===0)rect(x+1,y+2,3,T-9,light);
    rect(x,y+8,T,1,dark);rect(x+12+(yy%2?5:-5),y,1,8,dark);break;
  }
 };
 api.floorTile=function(p,type,x,y,xx,yy){
  const style=p.style;
  if(style==='recording'){
   // The rich wood and woven studio rug remain the authored base, fully intact.
   if(type!=='rug'&&yy===6&&xx>=7&&xx<=18){rect(x,y+20,T,1,'#332b3155');rect(x,y+22,T,1,'#d4ad7922');}
  }else if(style==='home'){
   // Existing domestic wood remains. Stone kitchen and woven sleeping zone are real materials.
   zone('calcada_pedra',x,y,xx,yy,1,3,5,6,'#cab68a');
   zone('tapete_palco',x,y,xx,yy,18,4,5,5,'#b4b898');
   if(xx===6&&yy>=3&&yy<=8)rect(x+1,y,1,T,'#8f796466');
  }else if(style==='repair'){
   authored('calcada_pedra',x,y,xx,yy);
   zone('metal_industrial',x,y,xx,yy,16,5,6,6,'#b3aa77');
   if(xx===15&&yy>=5&&yy<=10){rect(x+17,y,4,T,'#bca76b88');for(let i=0;i<T;i+=8)segment(x+17,y+i,x+20,y+i+4,'#595d4b88',2);}
  }else if(style==='records'){
   authored('pedra_santuario',x,y,xx,yy);
   zone('tapete_palco',x,y,xx,yy,8,4,10,12,'#bda18e');
   if(xx===7||xx===18)rect(x+(xx===7?19:2),y,2,T,'#806d7866');
  }else if(style==='broadcast'){
   authored('madeira_clube',x,y,xx,yy);
   zone('tapete_palco',x,y,xx,yy,5,3,16,7,'#9baf9f');
   if(yy===10&&xx>=5&&xx<=20){rect(x,y+1,T,2,'#313f4066');rect(x,y+4,T,1,'#a9af9544');}
  }else if(style==='passage'){
   if(xx%5===0){rect(x+3,y,4,T,'#514c5c33');rect(x+4,y,1,T,'#b9b0ab44');}
   if(yy===5||yy===13){rect(x,y+(yy===5?0:21),T,3,'#373b4844');rect(x,y+(yy===5?3:20),T,1,'#b9b2a333');}
  }else if(style==='ceremony'){
   ringTile(x,y,xx,yy,11.5,8.5,4.4,'#6e929355',2);ringTile(x,y,xx,yy,11.5,8.5,4.65,'#d6d7b644');
   if((xx===7||xx===16)&&yy>=5&&yy<=12)rect(x+11,y,1,T,'#637d7b44');
  }else if(style==='transmission'){
   for(const radius of [4,7.5,9.4])ringTile(x,y,xx,yy,14,12,radius,'#a6b0a833');
   if(xx%6===2){rect(x+10,y,1,T,'#334a5533');rect(x+14,y,1,T,'#b2b5a322');}
  }else if(style==='club'){
   zone('madeira_oficina',x,y,xx,yy,5,3,19,4);
   if(yy===7&&xx>=5&&xx<=23){rect(x,y,T,3,'#322a2a77');rect(x,y+3,T,1,'#bb8a5a77');}
   if(xx>=10&&xx<=18&&yy>=8&&yy<=13&&((xx+yy)%2===0))poly([[x+12,y+6],[x+18,y+12],[x+12,y+18],[x+6,y+12]],'#b6956522');
   zone('tapete_palco',x,y,xx,yy,20,10,5,5,'#ac8863');
  }else if(style==='instruments'){
   zone('metal_industrial',x,y,xx,yy,4,6,6,5,'#b4a579');
   zone('metal_industrial',x,y,xx,yy,19,5,5,5,'#b4a579');
   if((yy===11||yy===6)&&xx>=10&&xx<=18){rect(x,y+9,T,3,'#3b3e3566');rect(x,y+10,T,1,'#9b956b66');}
   zone('metal_terminal',x,y,xx,yy,11,3,7,3,'#b99a63');
  }else if(style==='factory'){
   if(xx===17&&current?.blocked?.has(xx+','+yy))return;
   if((xx%5===0)||(yy%6===0)){rect(x,y+20,T,1,'#9e9e7633');rect(x+2,y+2,1,1,'#b5af8655');}
   if((xx===8||xx===28)&&yy>=4&&yy<=20){rect(x+10,y,4,T,'#ac945d88');for(let k=0;k<T;k+=8)segment(x+10,y+k,x+13,y+k+4,'#3c4a4388',2);}
   if(yy===19&&xx>=9&&xx<=27){rect(x,y+9,T,3,'#36433e55');rect(x,y+10,T,1,'#979e7555');}
  }else if(style==='sanctuary'){
   for(const radius of [3.5,5.8])ringTile(x,y,xx,yy,13,8,radius,'#b3ad8a44');
   if((xx===8||xx===18)&&yy>9&&yy<15)rect(x+10,y,2,T,'#383d3533');
  }else if(style==='abyss'){
   if(xx%4===0)rect(x,y,1,T,'#111b1f55');if(yy%4===0)rect(x,y,T,1,'#111b1f55');
   if((xx*11+yy*7)%13===0){segment(x+3,y+7,x+12,y+13,'#848b6b33');segment(x+12,y+13,x+18,y+20,'#848b6b33');}
  }
 };
 api.tile=function(type,x,y,xx,yy){
  const p=this.enabled&&this.profile();if(!p||!current||type==='void'||type==='c3_sky')return;
  ctx.save();ctx.beginPath();ctx.rect(x,y,T,T);ctx.clip();
  try{
   const boundary=xx===0||yy===0||xx===current.w-1||yy===current.h-1;
   if(type==='wall092'||boundary){ctx.globalAlpha*=.24;this.wallTile(p,x,y,xx,yy);}
   else if(floorTypes.has(type))this.floorTile(p,type,x,y,xx,yy);
  }finally{ctx.restore()}
 };
 api.facade=function(p){
  if(!p)return null;
  let legacy=null;
  if(p.type==='house'){
   const w=(p.w||5)*T,h=(p.h||4)*T,x=p.x*T,y=p.y*T;
   legacy={x:x-9,y:y-32,w:w+18,h:h+35,bottom:y+h+3,roof:y+24,side:'#655443',edge:'#ae8f68',depth:15};
  }
  if(p.type==='voiceHouse'){
   const index=p.sign?.includes('MERCADO')||p.sign?.includes('DISCOS')?2:p.sign?.includes('BENTO')?3:p.sign?.includes('CELINA')?0:1;
   const box=typeof ENV_BOXES092!=='undefined'&&ENV_BOXES092[index],w=(p.w||5)*T+16,h=Math.min((p.h||4)*T+120,Math.round(w*(box?box.h/box.w:1.05))),bottom=(p.y+(p.h||4))*T+6;
   legacy={x:p.x*T-8,y:bottom-h,w,h,bottom,roof:bottom-h*.65,side:'#65505a',edge:'#b58b78',depth:15};
  }
  if(legacy){
   const r=this.resource(p);if(!r)return legacy;
   const [, ,sw,sh]=r.item.content,[px,py]=r.item.pivot,k=Math.min(legacy.w/sw,legacy.h/sh),doorX=(p.x+(p.w||5)/2)*T;
   return {...legacy,x:doorX-px*k,y:legacy.bottom-py*k,w:sw*k,h:sh*k,newSprite:r,scale:k,doorX};
  }
  if(G?.area!=='distortion_district'||!['c3_house','c3_club','c3_workshop','c3_machine'].includes(p.type))return null;
  let item=null,display={c3_house:[168,164],c3_club:[220,176],c3_workshop:[190,132],c3_machine:[168,155]}[p.type];
  if(typeof CenariosDesertoV1!=='undefined'){const binding=CenariosDesertoV1.binding(p);if(binding){item=binding.item;display=binding.display}}
  if(!item&&typeof CenariosV2!=='undefined')item=CenariosV2.itemFor(p);
  const resource=item&&typeof CenariosV2!=='undefined'&&CenariosV2.available(item),r=resource?.a.content;
  const k=r?Math.min(display[0]/r[2],display[1]/r[3]):1,w=r?r[2]*k:display[0],h=r?r[3]*k:display[1],bottom=(p.y+.65)*T;
  return {x:(p.x+.5)*T-w/2,y:bottom-h,w,h,bottom,roof:bottom-h*.68,side:'#514d3f',edge:'#9b895f',depth:Math.min(18,Math.max(11,w*.10))};
 };
 api.sortY=function(p){const b=this.enabled&&this.facade(p);return b?b.bottom/T:(p.worldGroundY??p.y+.5)};
 api.occlusionAlpha=function(p,b){
  // CenariosV2 already fades C3 residences; avoid multiplying that fade twice.
  if(p.type==='c3_house')return 1;
  const actors=[G];if(typeof C3!=='undefined'&&C3.coopActive?.())actors.push(C3.coop);
  return actors.some(a=>a&&a.x*T>b.x+7&&a.x*T<b.x+b.w-7&&a.y*T>b.y+10&&a.y*T<b.bottom-12)?.58:1;
 };
 api.drawGround=function(){
  if(!this.enabled||!current||!G)return;
  ctx.save();
  try{
   for(const p of current.props||[]){const b=this.facade(p);if(!b)continue;
    const left=b.x-cam.x,right=left+b.w,bottom=b.bottom-cam.y;
    if(right<-50||left>VW+50||bottom<-60||bottom>VH+b.h+60)continue;
    const shift=Math.min(28,b.h*.15),spread=Math.min(11,b.w*.07);
    poly([[left+6,bottom-3],[right-3,bottom-3],[right+shift+spread,bottom+shift*.50],[left+shift-spread,bottom+shift*.50]],'#17172029');
    // Tight contact band anchors the sprite; unlike an oval shadow it follows its footprint.
    poly([[left+8,bottom-1],[right-4,bottom-1],[right-1,bottom+4],[left+5,bottom+4]],'#17171d6b');
   }
  }finally{ctx.restore()}
 };
 api.drawFacade=function(p,b,cx,cy){
  const r=b.newSprite;if(!r)return false;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(r.image,...r.item.content,Math.round(b.x-cx),Math.round(b.y-cy),Math.round(b.w),Math.round(b.h));
  if(p.type==='voiceHouse'&&p.sign){
   const width=Math.min(b.w*.79,Math.max(52,p.sign.length*4.6+12)),x=b.doorX-cx,y=b.bottom-cy-b.h*.43;
   rect(x-width/2-1,y-10,width+2,13,'#332a31dd');rect(x-width/2,y-10,width,1,'#a5826d');
   ctx.textAlign='center';ctx.font='bold 8px monospace';ctx.fillStyle='#f3dfb8';ctx.fillText(p.sign,x,Math.round(y),width-7);
  }
  return true;
 };
 api.drawVolume=function(b,cx,cy){
  const x=b.x-cx,y=b.roof-cy,w=b.w,h=b.bottom-b.roof,bottom=b.bottom-cy,d=b.depth;
  if(x+w<-50||x>VW+50||bottom<-50||y>VH+50)return;
  ctx.save();
  try{
   poly([[x+w-12,y],[x+w+d,y-d*.55],[x+w+d,bottom-d*.55],[x+w-12,bottom]],b.side);
   ctx.beginPath();ctx.moveTo(x+w-12,y);ctx.lineTo(x+w+d,y-d*.55);ctx.lineTo(x+w+d,bottom-d*.55);ctx.lineTo(x+w-12,bottom);ctx.closePath();ctx.clip();
   for(let yy=y+9;yy<bottom;yy+=13)segment(x+w-12,yy,x+w+d,yy-d*.55,'#201f2466');
   for(let yy=y+16;yy<bottom-7;yy+=26)rect(x+w+d*.5,yy,2,2,b.edge);
   segment(x+w+d,bottom-d*.55,x+w+d,y-d*.55,'#23252b',2);
  }finally{ctx.restore()}
  // Bevels are visible below/alongside the original image, not a second façade.
  poly([[x+8,bottom-2],[x+w-4,bottom-2],[x+w+2,bottom+3],[x+5,bottom+3]],'#4d4940');
  segment(x+7,bottom-1,x+w-4,bottom-1,b.edge);
  poly([[x+w-13,y],[x+w+d+2,y-d*.55-3],[x+w+d+2,y-d*.55+2],[x+w-13,y+5]],'#302e2e');
 };
 for(const sheet of Object.keys(api.assets))api.image(sheet); // Nonblocking; ready() is QA-only.
 return api;
})();
window.EnvironmentDepthV1=EnvironmentDepthV1;
const environmentDepthTileV1=drawTile;
drawTile=function(type,x,y,xx,yy){const result=environmentDepthTileV1(type,x,y,xx,yy);EnvironmentDepthV1.tile(type,x,y,xx,yy);return result};
const environmentDepthPropV1=drawProp;
drawProp=function(p,cx,cy){
 const b=EnvironmentDepthV1.enabled&&EnvironmentDepthV1.facade(p);
 if(!b)return environmentDepthPropV1(p,cx,cy);
 ctx.save();
 try{
  ctx.globalAlpha*=EnvironmentDepthV1.occlusionAlpha(p,b);
  if(EnvironmentDepthV1.drawFacade(p,b,cx,cy))return;
  EnvironmentDepthV1.drawVolume(b,cx,cy);return environmentDepthPropV1(p,cx,cy);
 }finally{ctx.restore()}
};
