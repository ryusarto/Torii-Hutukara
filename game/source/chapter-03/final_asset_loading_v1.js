/* Present a scene only after its approved art is decoded. The game state and
 * setArea remain synchronous; loading owns no simulation or animation clock. */
(function(){
'use strict';
const portraits=new Map(),games=new WeakMap();
let gameId=0,generation=0,key='',loading=false,failure=null,pending=Promise.resolve(),showTimer=null;
let resources=[],extraResources=[],failed=[],ui=null;
let inputGame=null,inputArea=null;
let observedGame=null;
function observeGame(){if(G&&G!==observedGame){const previous=observedGame;observedGame=G;if(previous)Narrativa.resetGame()}}
const scheduled=new Map();let scheduleId=0;
function scopeMatches(job){return job.game===G&&(job.area===null||job.area===G?.area)}
function arm(job){
 if(!scopeMatches(job)){scheduled.delete(job.id);return}
 job.due=performance.now()+job.remaining;
 job.timer=setTimeout(()=>{
  job.timer=null;
  if(loading){job.remaining=Math.max(0,job.due-performance.now());return}
  scheduled.delete(job.id);if(scopeMatches(job))job.callback();
 },job.remaining);
}
function schedule(callback,delay=0,options={}){
 const job={id:++scheduleId,callback,game:G,area:Object.hasOwn(options,'area')?options.area:null,remaining:Math.max(0,Number(delay)||0),due:0,timer:null};
 scheduled.set(job.id,job);if(!loading)arm(job);return job.id;
}
function scheduleCombat(callback,delay=0){return schedule(callback,delay,{area:G?.area})}
function clearSchedule(id){const job=scheduled.get(id);if(job&&job.timer!==null)clearTimeout(job.timer);scheduled.delete(id)}
function pauseScheduled(){
 const now=performance.now();
 for(const job of scheduled.values())if(job.timer!==null){clearTimeout(job.timer);job.timer=null;job.remaining=Math.max(0,job.due-now)}
}
function resumeScheduled(){
 for(const job of [...scheduled.values()].sort((a,b)=>a.remaining-b.remaining||a.id-b.id))if(job.timer===null)arm(job);
}
const source=image=>typeof image?.src==='string'?image.src:'';
const canvas=image=>typeof image?.getContext==='function';
const available=image=>!!image&&!image.edgePending&&(canvas(image)?image.width>0&&image.height>0:image.complete&&image.naturalWidth>0);
const known=available;
function signature(){
 if(!G||!current||current!==areas[G.area])return '';
 if(!games.has(G))games.set(G,++gameId);
 const team=typeof partyMembers==='function'?partyMembers():[G.active];
 return [games.get(G),G.area,team.join(','),!!G.flags?.masks,MusicianArtV1.variants.synth,MusicianArtV1.variants.percussion,current.npcs?.length||0,bossActor?.id||''].join('|');
}
function installUI(){
 if(ui)return ui;
 const style=document.createElement('style');
 style.textContent='#finalAssetLoadingV1{position:fixed;inset:0;z-index:100100;display:flex;align-items:center;justify-content:center;background:#181622f7;color:#efd8ad;font:14px/1.6 var(--ui7-font-text,monospace);padding:24px;box-sizing:border-box}#finalAssetLoadingV1[hidden]{display:none}#finalAssetLoadingV1>div{max-width:380px;text-align:center;border:2px solid #aa8058;background:#211d2b;padding:24px;box-shadow:0 0 0 3px #15121c}#finalAssetLoadingV1 p{margin:0}#finalAssetLoadingV1 button{margin-top:18px;min-height:44px;padding:8px 18px;border:2px solid #b88a58;background:#302633;color:#ffe5ad;font:inherit;cursor:pointer}';
 document.head.appendChild(style);
 ui=document.createElement('div');ui.id='finalAssetLoadingV1';ui.hidden=true;ui.setAttribute('aria-live','polite');
 ui.innerHTML='<div><p role="status">Preparando o cenário…</p><button type="button" hidden>Tentar novamente</button></div>';
 ui.querySelector('button').onclick=()=>retry();document.body.appendChild(ui);return ui;
}
function display(error=false){
 const node=installUI();node.hidden=false;
 node.querySelector('p').textContent=error?'Não foi possível carregar a arte desta cena. Verifique a conexão e tente novamente.':'Preparando o cenário…';
 node.querySelector('p').setAttribute('role',error?'alert':'status');node.querySelector('button').hidden=!error;
 if(error)node.querySelector('button').focus();
}
function releaseInput(){if(typeof releaseAll121==='function')releaseAll121()}
function collect(extra){
 const list=[],seen=new Set();
 const add=(image,label)=>{if(!image||seen.has(image))return;seen.add(image);list.push({image,label})};
 const task=(label,record)=>{if(!record?.bitmap)list.push({label,stride:record,hero:label.split(':')[1]})};
 const portrait=(src,label)=>{if(!src)return;let image=portraits.get(src);if(!image){image=new Image();image.src=src;portraits.set(src,image)}add(image,label)};
 function hero(id,npc=false){
  const art=ProtagonistArtV5.supports(id)?ProtagonistArtV5:NinjaArcherArtV1.supports(id)?NinjaArcherArtV1:MusicianArtV1.supports(id)?MusicianArtV1:null;
  if(!art)return;
  const variant=art===MusicianArtV1?art.variant(id):G.flags?.masks?'masked':'unmasked';
  const states=npc&&art===MusicianArtV1?['idle','performance']:npc?['idle']:['idle','walk','roll'];
  if(!npc&&art===ProtagonistArtV5&&G.flags?.masks)states.push('run');
  for(const state of states)add(art.image(art===MusicianArtV1?art.key(id,variant,state):id+'_'+state),id+':'+state);
  if(!npc){task('run:'+id,RunStrideV1.image(id));add(HeroAttackBody.sheet(id,variant),id+':contact');HeroAttackFX.v3Ready(id);add(HeroAttackFX.v3Images[id],id+':effects')}
  for(const expression of ['neutral','speaking']){
   const src=art===MusicianArtV1?art.portrait(id,expression):art.assets[id+'_portrait_'+(art===ProtagonistArtV5?variant+'_':'')+expression];
   portrait(src,id+':portrait:'+expression);
  }
 }
 const team=typeof partyMembers==='function'?partyMembers():[G.active];for(const id of team)hero(id);
 CenariosV2.ensure(G.area);
 for(const prop of current.props||[]){
  if(prop.type==='c3_metronome_waiting'&&!G.c3?.metronomeDone)add(EnemyArtV1.image('c3_metronome'),'preview:c3_metronome');
  const item=CenariosV2.itemFor(prop),binding=typeof CenariosDesertoV1!=='undefined'&&CenariosDesertoV1.active()?CenariosDesertoV1.binding(prop):null;
  for(const name of [item,binding?.item]){const entry=name&&CenariosV2.manifest.items[name];if(entry)add(CenariosV2.image(entry.sheet),'scene:'+entry.sheet)}
  const key=EnvironmentDepthV1.assetKey(prop),entry=key&&EnvironmentDepthV1.manifest.items[key];
  if(entry)add(EnvironmentDepthV1.image(entry.sheet),'facade:'+entry.sheet);
 }
 for(const [id,image]of Object.entries(CenariosV2.images))add(image,'scene:'+id);
 if(G.area==='studio')for(const id of ['sofa_vertical','plant_potted'])add(WorldPolishV1.image(id),'studio:'+id);
 if(G.area==='cloud_sea')for(const id of Object.keys(CloudWorldV1.assets))add(CloudWorldV1.image(id),'cloud:'+id);
 if(!C3.AREAS.includes(G.area)){
  // These are still the approved C1/C2 terrain/props/NPC sheets, not retired
  // playable-character fallbacks. Keep their presentation stable on first draw.
  for(const [id,image]of [['terrain',typeof terrain10!=='undefined'&&terrain10],['props',typeof props10!=='undefined'&&props10],['environment',typeof ENV092!=='undefined'&&ENV092],['characters',typeof atlas091!=='undefined'&&atlas091],['station',typeof stationProps11!=='undefined'&&stationProps11]])add(image,'world:'+id);
 }
 for(const n of current.npcs||[]){
  const id=n.postReserve&&typeof PostGame!=='undefined'&&PostGame.names[n.postHero]?n.postHero:n.id==='c3_synth_npc'?'synth':n.id==='c3_percussion_npc'?'percussion':n.id==='c3_alt_final'?'alt':n.id==='c3_katana_final'?'katana':null;
  if(id)hero(id,true);
  const appearance=NpcLifeV1.appearance(n);if(appearance?.ready)appearance.ready(n);
  if(NpcLifeV1.collaboratorRow(n)!==null)add(C3.images.prebeta_collabs_move,'npc:collaborators');
  if(n.id==='c3_vega')add(C3.images.prebeta_dney,'npc:dney');
  const ambient=NpcLifeV1.ambientImage(n);if(ambient)add(C3.images[ambient],'npc:'+ambient);
  if(['iris','celina','lumi','katana'].includes(n.spriteKey)&&typeof NPC092!=='undefined')add(NPC092,'npc:city');
 }
 if(typeof NpcGesturesV1!=='undefined'&&NpcGesturesV1.image)add(NpcGesturesV1.image,'npc:gestures');
 if(typeof C3AmbientGesturesV2!=='undefined'&&C3AmbientGesturesV2.image)add(C3AmbientGesturesV2.image,'npc:ambient-gestures');
 for(const enemy of [...(current.enemies||[]),bossActor].filter(Boolean)){
  if(window.EnemyVariantArtV2?.supports(enemy)){add(EnemyVariantArtV2.image(enemy.type),'enemy:'+enemy.type)}
  else {const id=EnemyArtV1.key(enemy.type,enemy);if(EnemyArtV1.supports(id))add(EnemyArtV1.image(id),'enemy:'+id)}
  if(enemy.id)for(const suffix of ['_cast','_walk']){const id=enemy.id+suffix,entry=BossChoreographyV2.manifest.clips[id];if(entry)add(BossChoreographyV2.image(id,entry),'boss:'+id)}
 }
 if(G.area==='ruins')add(CombatReadabilityV1.groundRift,'portal');
 for(const entry of extra||[])add(entry.image,entry.label||'scene');
 return list;
}
function decode(entry){
 if(entry.stride)return Promise.resolve(entry.stride.ready).then(ok=>{if(!ok||!entry.stride.bitmap)throw Error(entry.label)});
 const image=entry.image;if(known(image))return Promise.resolve();
 if(canvas(image)){if(!available(image))return Promise.reject(Error(entry.label));return Promise.resolve()}
 return Promise.resolve().then(()=>image.decode()).then(()=>{
  if(!available(image))throw Error(entry.label);
 });
}
function start(options={}){
 observeGame();
 if(typeof options==='boolean')options={force:options};
 const next=signature();if(!next)return Promise.resolve();
 // Scene entry discards the previous scene's controls. A late asset inside
 // the same scene pauses simulation while preserving fingers/keys already
 // held; their normal release handlers remain active during the pause.
 if(inputGame!==G||inputArea!==G.area){inputGame=G;inputArea=G.area;releaseInput()}
 if(next===key&&!options.force)return pending;
 const token=++generation;key=next;failure=null;failed=[];extraResources=options.extra||[];
 clearTimeout(showTimer);if(ui)ui.hidden=true;
 try{resources=collect(extraResources)}catch(error){resources=[];failed=[];failure=String(error.message||error);loading=true;pauseScheduled();Narrativa.pauseAssets();display(true);pending=Promise.reject(error);pending.catch(()=>{});return pending}
 const waiting=resources.filter(entry=>entry.stride?!entry.stride.bitmap:!known(entry.image));
 if(!waiting.length){loading=false;Narrativa.resumeAssets();resumeScheduled();pending=Promise.resolve();return pending}
 loading=true;pauseScheduled();Narrativa.pauseAssets();showTimer=setTimeout(()=>{if(token===generation&&loading)display()},120);
 const work=waiting.map(entry=>{
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(entry.label)),45000)});
  return Promise.race([decode(entry),timeout]).catch(error=>{if(token===generation){failed.push(entry);if(entry.stride&&!entry.stride.bitmap)entry.stride.failed=true}throw error}).finally(()=>clearTimeout(timer));
 });
 pending=Promise.all(work).then(()=>{
  if(token!==generation)return;
  loading=false;failure=null;clearTimeout(showTimer);if(ui)ui.hidden=true;Narrativa.resumeAssets();resumeScheduled();
 }).catch(error=>{
  if(token!==generation)return;
  failure=String(error.message||error);clearTimeout(showTimer);loading=true;display(true);throw error;
 });
 // Automatic setArea/update callers cannot own an unhandled rejection. Tests
 // and explicit ready() callers still receive the rejection and error state.
 pending.catch(()=>{});return pending;
}
function ensure(){observeGame();if(G&&current&&mode!=='title'){const next=signature();if(next&&next!==key)start()}}
function ready(){ensure();return pending}
function retry(){
 for(const entry of failed){
  if(entry.stride){RunStrideV1.retry(entry.hero);continue}
  const image=entry.image,src=source(image);if(src){image.src='';image.src=src}
 }
 return start({force:true,extra:extraResources});
}
function requireImage(image,label){return start({force:true,extra:image?[{image,label}]:[]})}
function handleKey(event){
 if(!loading)return false;
 if(event.ctrlKey||event.metaKey||event.altKey)return false;
 event.preventDefault();event.stopImmediatePropagation();
 const button=ui?.querySelector('button');
 if(button&&!button.hidden&&failure){
  if(event.key==='Tab')button.focus();
  else if(!event.repeat&&(event.key==='Enter'||event.key===' '))button.click();
 }
 return true;
}
window.FinalAssetLoadingV1={start,ready,retry,requireImage,handleKey,schedule,scheduleProgress:schedule,scheduleCombat,clearSchedule,busy:()=>loading,
 snapshot:()=>({loading,error:failure,generation,area:G?.area||null,resources:resources.map(r=>r.label),failed:failed.map(r=>r.label),scheduled:scheduled.size})};
const previousArea=setArea;setArea=function(...args){observeGame();const result=previousArea.apply(this,args);start();return result};
const previousUpdate=update;update=function(...args){ensure();if(loading)return;return previousUpdate.apply(this,args)};
const previousDraw=drawEnv;drawEnv=function(...args){ensure();if(loading)return;return previousDraw.apply(this,args)};
const previousCreature=drawCreature;drawCreature=function(x,y,kind,enemy,...args){
 if(loading)return;
 const variant=window.EnemyVariantArtV2?.supports(enemy),id=!variant&&EnemyArtV1.key(kind,enemy);
 const image=variant?EnemyVariantArtV2.image(enemy.type):EnemyArtV1.supports(id)?EnemyArtV1.image(id):null;
 if(image&&!available(image)){requireImage(image,'enemy:'+(enemy?.type||id));return}
 return previousCreature.call(this,x,y,kind,enemy,...args);
};
const previousSound=soundscape;soundscape=function(...args){if(!loading)return previousSound.apply(this,args)};
const previousLoop=loop;loop=function(time){
 if(loading){loop.prev=time;requestAnimationFrame(loop);return}
 const before=tick,result=previousLoop.call(this,time);if(loading)tick=before;return result;
};loop.prev=previousLoop.prev;
const previousPoll=C3.pollControllers;C3.pollControllers=function(...args){
 if(!loading)return previousPoll.apply(this,args);
 for(const pad of navigator.getGamepads?.()||[])if(pad)C3.pad.previous.set(pad.index,Array.from(pad.buttons,b=>!!b.pressed));
 C3.pad.raf=requestAnimationFrame(C3.pollControllers);
};
for(const type of ['pointerdown','touchstart','click'])window.addEventListener(type,event=>{
 if(loading&&!event.target?.closest?.('#finalAssetLoadingV1')){event.preventDefault();event.stopImmediatePropagation()}
},{capture:true,passive:false});
window.addEventListener('keydown',handleKey,true);
})();
