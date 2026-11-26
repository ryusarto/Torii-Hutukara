/* Per-enemy health follows the actual rendered creature and native sprite pivot.
 * Presentation only: no hydration, damage, AI, progression or save mutation.
 * The builder removes only the old canvas bars; telegraphs remain intact. */
(function(){
'use strict';
const nodes=new Map(),boundsCache=new WeakMap();
let layer=null,bossPanel=null,lastBossLayout='',tracked=new Map(),lastGame=null,lastArea=null,latest=[],latestBoss=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function install(){
 if(layer?.isConnected)return layer;
 const canvas=document.getElementById('game');if(!canvas?.parentElement)return null;
 layer=document.createElement('div');layer.id='enemyHealthLayerV7';layer.setAttribute('aria-label','Vida dos inimigos');canvas.parentElement.appendChild(layer);
 const css=document.createElement('style');css.id='enemyHealthStyleV7';css.textContent=`
 .ui7 #actionHUD .action-label{display:none!important}
 #enemyHealthLayerV7{position:absolute;z-index:7;pointer-events:none;overflow:hidden;contain:layout style paint}
 #enemyHealthLayerV7[hidden]{display:none!important}
 .enemy-health-v7{position:absolute;left:0;top:0;box-sizing:border-box;border:1px solid #b08a5b;background:#191724;box-shadow:0 1px 0 #11111d;pointer-events:none}
 .enemy-health-v7 i{position:absolute;inset:1px;display:block;transform-origin:left center;background:#cf8b83;pointer-events:none}
 .enemy-health-v7[data-boss="true"]{border-color:#d0ad6e}.enemy-health-v7[data-boss="true"] i{background:#d8b16d}
 #bossHealthV10{position:absolute;isolation:isolate;box-sizing:border-box;padding:9px 14px 11px;color:#efdcba;background:#221c27;border:1px solid #b58c58;pointer-events:none;min-width:0}
 #bossHealthV10[hidden]{display:none!important}
 #bossHealthV10 .boss-health-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:7px;font:12px/1.3 var(--ui7-font-text,monospace)}
 #bossHealthV10 .boss-health-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#efcf95;font-weight:700;letter-spacing:.04em}
 #bossHealthV10 .boss-health-value{font-size:10px;white-space:nowrap;color:#cdb99c;font-variant-numeric:tabular-nums}
 #bossHealthV10 .boss-health-track{position:relative;height:15px;background:#100f19;border:1px solid #b38a57;box-shadow:inset 0 0 0 2px #2c1d29;overflow:hidden}
 #bossHealthV10 .boss-health-fill{position:absolute;inset:2px;transform-origin:left center;background:linear-gradient(#d8a486 0 25%,#ad5d64 25% 75%,#733e52 75%);image-rendering:pixelated}
 #bossHealthV10 .boss-health-ticks{position:absolute;inset:2px;background:repeating-linear-gradient(90deg,transparent 0 calc(25% - 1px),#221722aa calc(25% - 1px) 25%)}
 html.mobile121 #bossHealthV10{padding:7px 10px 9px}
 html.mobile121 #bossHealthV10 .boss-health-heading{font-size:11px;gap:8px;margin-bottom:5px}
 html.mobile121 #bossHealthV10 .boss-health-value{font-size:9px}
 html.mobile121 #bossHealthV10 .boss-health-track{height:12px}
 `;document.head.appendChild(css);return layer;
}
function installBoss(){
 if(bossPanel?.isConnected)return bossPanel;
 bossPanel=document.createElement('div');bossPanel.id='bossHealthV10';bossPanel.hidden=true;bossPanel.setAttribute('role','group');bossPanel.setAttribute('aria-labelledby','bossHealthNameV10');
 bossPanel.innerHTML='<div class="boss-health-heading"><span class="boss-health-name" id="bossHealthNameV10"></span><span class="boss-health-value"></span></div><div class="boss-health-track" role="meter" aria-valuemin="0"><i class="boss-health-fill"></i><i class="boss-health-ticks"></i></div>';
 lastBossLayout='';
 if(window.ToriiUI7){bossPanel.classList.add('ui7-machine');bossPanel.insertAdjacentHTML('afterbegin',ToriiUI7.skin('panel'))}
 layer.appendChild(bossPanel);return bossPanel;
}
function bossName(e){
 return e.endlessName||e.name||(typeof EnemyArtV1!=='undefined'&&EnemyArtV1.manifest.enemies[e.id]?.name)||enemyInfo[e.type]?.name||'Chefe';
}
function syncBoss(r){
 latestBoss=null;
 const e=bossActor,life=e&&health(e);
 if(!e||!life||life.hp<=0||mode!=='action'||G.defeated?.includes(e.id)||C3.finalPending&&e.id==='c3_silence'){
  if(bossPanel)bossPanel.hidden=true;return;
 }
 const panel=installBoss(),mobile=document.documentElement.classList.contains('mobile121'),height=mobile?52:62;
 const bottom=r.bottom-height-12;
 // Evaluate each possible band against ALL controls, including ones above the
 // first band. A fallback must not move the panel into another row of buttons.
 const obstacles=[];
 for(const node of document.querySelectorAll('#ui7Actions,#ui7Actions button,#tapeButton,#mobileStick121,#mobileDeck121 [data-mobile-action],#ui7Party,#ui7Objective,#ui7PausePC,#mobileReadout121,#mobileGoal121,#mobileCharge121')){
  if(!node.getClientRects().length||getComputedStyle(node).visibility==='hidden'||getComputedStyle(node).display==='none')continue;
  const b=node.getBoundingClientRect();if(b.width&&b.height&&b.bottom>r.top&&b.top<r.bottom&&b.right>r.left&&b.left<r.right)obstacles.push(b);
 }
 const candidates=[bottom,...obstacles.map(b=>b.top-height-8),r.top+8].filter(y=>y>=r.top+8&&y<=bottom).sort((a,b)=>b-a);
 let best=null;
 for(const top of candidates){
  let gaps=[[r.left+12,r.right-12]];
  for(const b of obstacles){
   if(b.bottom<=top-6||b.top>=top+height+6)continue;
   const blockedLeft=b.left-10,blockedRight=b.right+10;
   gaps=gaps.flatMap(([left,right])=>blockedRight<=left||blockedLeft>=right?[[left,right]]:[[left,Math.min(right,blockedLeft)],[Math.max(left,blockedRight),right]].filter(([a,z])=>z>a));
  }
  const gap=gaps.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];if(!gap)continue;
  const option={top,left:gap[0],right:gap[1],width:Math.min(620,gap[1]-gap[0])};
  if(!best||option.width>best.width)best=option;
  if(option.width>=Math.min(300,r.width*.32)){best=option;break}
 }
 if(!best){panel.hidden=true;return}
 const {width,left,right,top}=best,x=(left+right-width)/2-r.left,y=top-r.top;
 panel.hidden=false;panel.style.left=Math.round(x)+'px';panel.style.top=Math.round(y)+'px';panel.style.width=Math.round(width)+'px';panel.style.height=height+'px';
 const name=bossName(e),value=Math.ceil(life.hp)+' / '+Math.ceil(life.max),heading=panel.querySelector('.boss-health-name'),numbers=panel.querySelector('.boss-health-value'),meter=panel.querySelector('[role="meter"]');
 if(heading.textContent!==name)heading.textContent=name;if(numbers.textContent!==value)numbers.textContent=value;
 panel.dataset.enemyId=e.id||'';meter.setAttribute('aria-label',name);meter.setAttribute('aria-valuemax',String(life.max));meter.setAttribute('aria-valuenow',String(Math.ceil(life.hp)));panel.querySelector('.boss-health-fill').style.transform=`scaleX(${life.hp/life.max})`;
 const layout=[Math.round(width),height].join('/');if(layout!==lastBossLayout){lastBossLayout=layout;window.ToriiUI7?.paint(panel)}
 latestBoss={id:e.id,boss:true,presentation:'boss-screen',name,hp:life.hp,max:life.max,ratio:life.hp/life.max,left:x,top:y,width,height};latest.push({...latestBoss});
}
/* Cache the highest opaque pixel in all cells of an atlas. This keeps a meter
 * above the real silhouette, rather than inside today's much taller sprites.
 * Same-origin/data images only; manifests provide the fallback if readback fails. */
function opaqueTop(image,cell){
 if(!image?.complete||!image.naturalWidth)return null;
 let record=boundsCache.get(image);if(record?.cell===cell)return record.top;
 let top=null;
 try{
  const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
  const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0);const data=x.getImageData(0,0,c.width,c.height).data;
  scan:for(let y=0;y<cell;y++)for(let row=0;row<c.height;row+=cell)for(let col=0;col<c.width;col+=cell)for(let xx=0;xx<cell&&col+xx<c.width;xx++){
   if(row+y<c.height&&data[((row+y)*c.width+col+xx)*4+3]>24){top=y;break scan}
  }
 }catch{}
 boundsCache.set(image,{cell,top});return top;
}
function imageHead(image,cell,pivot,scale){const top=opaqueTop(image,cell);return top===null?pivot[1]*scale:Math.max(12,(pivot[1]-top)*scale)}
function visualKey(kind,e){
 let base=window.ToriiEncontros?.TIPOS[e?.type||kind]?.base||kind;
 if(typeof EnemyArtV1!=='undefined')return EnemyArtV1.key(base,e&&window.ToriiEncontros?.TIPOS[e.type]?{type:base}:e);
 return base;
}
function headHeight(kind,e){
 const own=window.EnemyVariantArtV2?.ready(e)?EnemyVariantArtV2.headHeight(e):null;if(Number.isFinite(own)&&own>0)return own;
 let height=kind==='boss'?68:54;
 if(typeof EnemyArtV1!=='undefined'){
  const key=visualKey(kind,e),m=EnemyArtV1.manifest,entry=m.enemies[key];
  if(entry){const cell=m.cell||256,pivot=m.pivot||[128,224],scale=entry.height/cell;height=imageHead(EnemyArtV1.images[key],cell,pivot,scale)}
 }
 // Animated bosses may have a different atlas size/pivot. Include only images
 // already requested by the original renderer; the UI never preloads new art.
 if(typeof BossChoreographyV2!=='undefined'&&BossChoreographyV2.ids.has(e?.id)){
  const art=BossChoreographyV2,m=art.manifest;
  for(const [key,entry]of Object.entries(m.clips||{}))if(entry.boss===e.id&&art.images[key]?.complete){
   const cell=entry.cell||m.cell||256,pivot=entry.pivot||m.pivot||[128,224],scale=Number.isFinite(entry.scale)?entry.scale:(entry.height||cell)/cell;
   height=Math.max(height,imageHead(art.images[key],cell,pivot,scale));
  }
 }
 return height;
}
function health(e){
 // Reading configured base health does not activate an unseen enemy or alter AI.
 const configured=typeof enemyInfo!=='undefined'?enemyInfo[e.type]||enemyInfo.hush:null;
 const max=Number(e.max??configured?.hp),hp=Number(e.hp??max);
 return Number.isFinite(hp)&&Number.isFinite(max)&&max>0?{hp:clamp(hp,0,max),max}:null;
}
function clear(){for(const node of nodes.values())node.remove();nodes.clear();latest=[];latestBoss=null;if(bossPanel)bossPanel.hidden=true;if(layer)layer.hidden=true}
function sync(){
 if(!install())return;
 if(lastGame!==G||lastArea!==G?.area){clear();lastGame=G;lastArea=G?.area}
 if(!G||!['walk','action'].includes(mode)){layer.hidden=true;latest=[];latestBoss=null;if(bossPanel)bossPanel.hidden=true;return}
 const canvas=document.getElementById('game'),parent=layer.parentElement,r=canvas.getBoundingClientRect(),pr=parent.getBoundingClientRect();
 if(!r.width||!r.height){layer.hidden=true;latest=[];return}
 const sx=r.width/canvas.width,sy=r.height/canvas.height;
 layer.style.left=(r.left-pr.left-parent.clientLeft)+'px';layer.style.top=(r.top-pr.top-parent.clientTop)+'px';layer.style.width=r.width+'px';layer.style.height=r.height+'px';layer.hidden=false;
 const seen=new Set();latest=[];
 for(const[e,render]of tracked){
  if(e===bossActor)continue;
  const life=health(e);if(!life||life.hp<=0||G.defeated?.includes(e.id))continue;
  const boss=false;
  const head=headHeight(render.kind,e),width=(boss?48:38)*sx,height=Math.max(4,6*sy),left=render.x*sx-width/2,top=(render.y-head-10)*sy-height;
  // Never pin an off-screen enemy's meter to the edge of the screen.
  if(left+width<=0||left>=r.width||top<0||top+height>r.height||render.y-head>canvas.height||render.y<0)continue;
  seen.add(e);let node=nodes.get(e);
  if(!node){node=document.createElement('div');node.className='enemy-health-v7';node.setAttribute('role','meter');node.innerHTML='<i></i>';layer.appendChild(node);nodes.set(e,node)}
  const name=window.ToriiEncontros?.TIPOS[e.type]?.nome||(typeof EnemyArtV1!=='undefined'&&EnemyArtV1.manifest.enemies[visualKey(render.kind,e)]?.name)||enemyInfo[e.type]?.name||'Inimigo';
  node.dataset.enemyId=e.id||'';node.dataset.boss=String(boss);node.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`;node.style.width=width+'px';node.style.height=height+'px';node.firstChild.style.transform=`scaleX(${life.hp/life.max})`;
  const label=name+' · '+Math.ceil(life.hp)+'/'+life.max;
  if(node.getAttribute('aria-label')!==label){node.setAttribute('aria-label',label);node.setAttribute('aria-valuemin','0');node.setAttribute('aria-valuemax',String(life.max));node.setAttribute('aria-valuenow',String(Math.ceil(life.hp)))}
  latest.push({id:e.id,boss,hp:life.hp,max:life.max,ratio:life.hp/life.max,x:render.x,y:render.y,head,left,top,width,height});
 }
 for(const[e,node]of nodes)if(!seen.has(e)){node.remove();nodes.delete(e)}
 syncBoss(r);
}
const beforeCreature=drawCreature;
drawCreature=function(x,y,kind,e,...args){const result=beforeCreature.call(this,x,y,kind,e,...args);if(e&&Number.isFinite(x)&&Number.isFinite(y))tracked.set(e,{x,y,kind});return result};
const beforeDraw=drawEnv;
drawEnv=function(...args){tracked=new Map();const result=beforeDraw.apply(this,args);sync();return result};
if(typeof init==='function'){const before=init;init=function(...args){const result=before.apply(this,args);install();return result}}
window.ToriiEnemyHealthV7={sync,clear,headHeight,snapshot:()=>latest.map(x=>({...x})),bossSnapshot:()=>latestBoss&&({...latestBoss})};
})();
