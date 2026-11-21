/* Post-game: reserve-only finale, safe travel and seeded endless encounters.
 * Save schema remains 13; this module owns G.postgame.version=1 only. */
'use strict';
const PostGame={
 AREA:'endless_echo', MAX_ALIVE:8, MAX_WAVE:1000000, MAX_SCORE:9000000000000,
 names:{franco:'Franco',ryuchi:'Ryuchi',alt:'Franco · Arqueiro',katana:'Ryuchi · Katana',synth:'Franco · Sintetizador',percussion:'Ryuchi · Percussionista'},
 memories:{franco:'A gente não precisa acertar a primeira nota. Só não deixa o medo tocar por nós.',ryuchi:'Se o caminho tremer, eu seguro o pulso com vocês.',alt:'Parei de procurar uma flecha que provasse que eu era diferente. Agora eu sei aonde quero chegar.',katana:'Não vou pedir que entrem sem medo. Só não entrem sozinhos.',synth:'Deixei um acorde aberto para vocês voltarem. Ainda cabe som novo aqui.',percussion:'Quando o compasso apertar, escuta quem está do lado. A gente encontra a próxima batida junto.'},
 rosterKey:'', resolvingHit:false, plan:[], spawnClock:0,
 number(v,max,fallback=0){return Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.floor(Number(v)))):fallback},
 defaults(){return {version:1,bestScore:0,bestWave:0,lastRun:null,run:null}},
 state(g=G){if(!g)return null;if(!g.postgame)g.postgame=this.defaults();return g.postgame},
 run(){return G?.postgame?.run||null},
 active(){return !!(G?.c3?.complete&&G.area===this.AREA&&this.run()?.active)},
 normalize(value,g){
  const v=value&&typeof value==='object'?value:{},out=this.defaults();out.bestScore=this.number(v.bestScore,this.MAX_SCORE);out.bestWave=this.number(v.bestWave,this.MAX_WAVE);
  if(v.lastRun&&typeof v.lastRun==='object')out.lastRun={score:this.number(v.lastRun.score,this.MAX_SCORE),wave:this.number(v.lastRun.wave,this.MAX_WAVE),kills:this.number(v.lastRun.kills,this.MAX_SCORE),seed:this.number(v.lastRun.seed,4294967295,1)||1,reason:v.lastRun.reason==='defeat'?'defeat':'exit'};
  const r=v.run;if(g.c3?.complete&&r?.active===true){const wave=Math.max(1,Math.min(this.MAX_WAVE,this.number(r.wave,this.MAX_WAVE,1)+(r.phase==='rest'?1:0))),banked=this.number(r.bankedScore,this.MAX_SCORE),kills=this.number(r.bankedKills,this.MAX_SCORE);const hpStart={};
   for(const id of Object.keys(this.names))hpStart[id]=Math.max(1,Math.min(g.maxhp[id]||40,r.phase==='rest'?(g.hp[id]||0)+Math.ceil((g.maxhp[id]||40)*.2):this.number(r.hpStart?.[id],999,g.maxhp[id]||40)));
   out.run={active:true,seed:this.number(r.seed,4294967295,1)||1,wave,score:banked,bankedScore:banked,kills,bankedKills:kills,completedWave:wave-1,hpStart,phase:'fight',cursor:0,wait:0,_resume:true};
  }return out;
 },
 selectedReserves(){
  const present=new Set(partyMembers());present.add(G.active);if(C3.coopActive())present.add(C3.coopMember());
  return ['alt','katana','franco','ryuchi','synth','percussion'].filter(id=>C3.unlockedRoster().includes(id)&&!present.has(id)).slice(0,2);
 },
 syncReserves(force=false){
  const a=areas.last_torii;if(!a||!G)return;const ids=this.selectedReserves(),key=ids.join('|');
  if(!force&&key===this.rosterKey)return;this.rosterKey=key;
  a.npcs=a.npcs.filter(n=>!['c3_alt_final','c3_katana_final'].includes(n.id)&&!n.postReserve);
  const cast=ids.length?ids:['belga','colli'];
  cast.forEach((id,i)=>npc(a,'post_reserve_'+id,i?19:7,11,this.names[id]||({belga:'Belga',colli:'Colli'})[id],()=>this.reserveTalk(id),id));
  for(const n of a.npcs)if(n.id.startsWith('post_reserve_')){n.postReserve=true;n.postHero=n.id.slice(13)}
 },
 reserveTalk(id){
  const who=this.names[id]?id:id==='colli'?'nara':'maia',line=this.memories[id]||(id==='colli'?'A passagem está firme. Desta vez, o caminho de volta continua aberto.':'A cidade está ouvindo. A última nota não precisa ser uma despedida.');
  talk([{who,t:line},{who:G.active,t:'Saber que vocês estão aqui muda tudo. Vamos levar essa música adiante.'}]);
 },
 intro(){
  this.syncReserves(true);if(G.c3.toriiSeen)return;G.c3.toriiSeen=true;setCheckpoint('c3_final','last_torii',13.5,13.5,true);
  const ids=this.selectedReserves(),label=ids.length?ids.map(id=>this.names[id]).join(' e '):'Belga e Colli';
  talk([{who:'narrator',t:label+' aguardam junto ao Torii. Quem seguiu com a formação permanece ao seu lado; as outras vozes vieram sustentar a passagem.'},{who:ids[0]||'maia',t:ids.length?this.memories[ids[0]]:'Daqui a gente consegue ouvir toda a cidade. Vocês não estão sozinhos.'},{who:G.active,t:'Então a gente entra junto. Cada um com a sua parte.'},{who:ids[1]||ids[0]||'nara',t:'O círculo reúne nossas frequências. O que falta agora é começar.'}],()=>save(true));
 },
 safe(a,x,y){const fits=(px,py)=>[-.3,.3].every(dx=>[-.3,.3].every(dy=>tileWalkable(a,px+dx,py+dy)));if(fits(x,y))return {x,y};for(let radius=1;radius<Math.max(a.w,a.h);radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===radius&&fits(Math.floor(x+dx)+.5,Math.floor(y+dy)+.5))return {x:Math.floor(x+dx)+.5,y:Math.floor(y+dy)+.5};return null},
 arrival(id){const a=areas[id];if(!a)return null;const incoming=Object.values(areas).flatMap(m=>m.gates.filter(g=>g.to===id));for(const g of incoming){const p=this.safe(a,g.tx,g.ty);if(p)return p}return this.safe(a,a.w/2,a.h/2)},
 canTravel(){return !!(G?.c3?.complete&&!bossActor&&!battle&&!['dialogue','rhythm','title'].includes(mode)&&!this.active())},
 travel(id){
  if(!this.canTravel()||id===this.AREA||!areas[id])return false;const p=this.arrival(id);if(!p)return false;closeOverlay();setArea(id,p.x,p.y,false);setCheckpoint('post_travel',id,p.x,p.y,true);updateHUD();return true;
 },
 openTravel(){
  if(!G?.c3?.complete)return false;if(['dialogue','rhythm','title'].includes(mode))return false;const allowed=this.canTravel(),labels=areaLabels();
  const rows=Object.values(areas).filter(a=>a.id!==this.AREA).map(a=>`<button class="action" data-post-area="${a.id}" ${allowed?'':'disabled'}>${labels[a.id]?.[0]||a.id}${a.id===G.area?' · AQUI':''}</button>`).join('');
  openOverlay(`<div class="eyebrow">HUTUKARA · CAMINHOS ABERTOS</div><h2>Viajar entre cenários</h2><p>${this.active()?'Encerre a expedição para viajar. Sua pontuação será registrada.':allowed?'As máscaras agora respondem à sua escolha.':'Conclua o combate para atravessar outra passagem.'}</p><div class="row">${rows}</div><hr class="divider"><div class="row"><button class="action strong" id="postDungeon" ${allowed?'':'disabled'}>CALABOUÇO INFINITO</button>${this.active()?'<button class="action" id="postAbandon">ENCERRAR EXPEDIÇÃO</button>':''}<button class="action" id="postMapClose">VOLTAR</button></div>`);
  document.querySelectorAll('[data-post-area]').forEach(b=>b.onclick=()=>this.travel(b.dataset.postArea));$('postDungeon').onclick=()=>this.startDungeon();$('postMapClose').onclick=closeOverlay;if($('postAbandon'))$('postAbandon').onclick=()=>this.finishRun('exit');return true;
 },
 clearCombat(){battle=bossActor=null;hostileShots=[];projectiles=[];combatFX.length=0;C3.hazards=[];C3.synthZones=[];C3.finalPending=false;C3.percussionGuard=0;resetMotion10();act.slash=act.hit=act.cool=0;act.invuln=1;C3.coop.area='';$('actionHUD').classList.add('hidden')},
 complete(){
  this.clearCombat();G.c3.silenceDone=true;G.c3.complete=true;G.c3.endingPending=false;G.c3.returnHome=false;this.state();for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];
  setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);save(true);this.showEnding();
 },
 showEnding(){
  if(!G?.c3?.complete)return;const p=this.state();openOverlay(`<div class="eyebrow">JORNADA CONCLUÍDA · O CANAL CONTINUA ABERTO</div><h2>A próxima música começa aqui</h2><p>O Silêncio deixou de decidir quando vocês podem começar. As máscaras permanecem ligadas aos caminhos de Hutukara.</p><div class="stat"><span>Capítulos concluídos</span><b>3 / 3</b></div><p>Use M ou o botão MAPA para viajar. Na Fenda das Ressonâncias, cada onda traz uma nova formação de inimigos e aumenta o desafio.</p><div class="stat"><span>Recorde do calabouço · neste save</span><b>${p.bestScore} pontos · onda ${p.bestWave}</b></div><div class="row"><button class="action strong" id="postEnter">ENTRAR NO CALABOUÇO</button><button class="action" id="postTravel">EXPLORAR OS CENÁRIOS</button><button class="action" id="postPhrase">CRIAR NOVA FRASE</button><button class="action" id="postStay">FICAR NO TORII</button><button class="action" id="postExport">EXPORTAR SAVE</button></div>`);
  $('postEnter').onclick=()=>this.startDungeon();$('postTravel').onclick=()=>this.openTravel();$('postPhrase').onclick=()=>C3.openPhrase('post');$('postStay').onclick=closeOverlay;$('postExport').onclick=exportSave;$('postEnter').focus();
 },
 random(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}},
 wavePlan(seed,wave){
  const rand=this.random((seed^Math.imul(wave,2654435761))>>>0),all=['hush','whisper','compasso','espelho','abafador','c3_drone','c3_echo'],pool=all.slice(0,Math.min(all.length,2+Math.floor(wave/2))),count=Math.min(18,3+Math.floor(wave/2));
  return Array.from({length:count},()=>({type:pool[Math.floor(rand()*pool.length)],x:3.5+Math.floor(rand()*21),y:4.5+Math.floor(rand()*13)}));
 },
 buildArena(){
  const a=C3.room(this.AREA,28,23,'c3_voidfloor');for(const [x,y]of [[2,2],[25,2]]){solid(a,x,y);prop(a,'env2_prop',x,y,{item:'core_column_left',w:30,h:88})}prop(a,'env2_prop',13,10,{item:'resonance_circle_on',w:100,h:70,flat:true});
  evt(a,'endless_exit',14,20,'ENCERRAR EXPEDIÇÃO',()=>this.finishRun('exit'));return a;
 },
 startDungeon(seed){
  if(!this.canTravel())return false;closeOverlay();this.clearCombat();for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);
  const p=this.state(),value=Number.isFinite(seed)?seed>>>0:(Date.now()^Math.floor(Math.random()*4294967295))>>>0;p.run={active:true,seed:value||1,wave:1,score:0,bankedScore:0,kills:0,bankedKills:0,completedWave:0,hpStart:{...G.hp},phase:'fight',cursor:0,wait:0,_resume:true};
  this.buildArena();setArea(this.AREA,14.5,18.5,false);return true;
 },
 beginWave(resuming=false){
  const r=this.run();if(!r?.active||G.area!==this.AREA)return;this.clearCombat();current.enemies=[];G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'));
  if(resuming){G.hp={...G.hp,...r.hpStart};r.score=r.bankedScore;r.kills=r.bankedKills}else{for(const id of C3.unlockedRoster())G.hp[id]=Math.min(G.maxhp[id],G.hp[id]+Math.max(1,Math.ceil(G.maxhp[id]*.2)));r.hpStart={...G.hp}}
  if(!G.hp[G.active])G.active=partyMembers().find(id=>G.hp[id]>0)||partyMembers()[0];r.phase='fight';r.cursor=0;r.wait=0;r._resume=false;this.plan=this.wavePlan(r.seed,r.wave);this.spawnClock=0;
  for(let i=0;i<Math.min(3,this.plan.length);i++)this.spawn();if(C3.coopActive())C3.syncCoop(true);engage();save(true);updateHUD();toast('FENDA DAS RESSONÂNCIAS · ONDA '+r.wave);
 },
 spawn(){
  const r=this.run();if(!r||r.cursor>=this.plan.length||current.enemies.filter(e=>e.hp>0).length>=this.MAX_ALIVE)return false;const spec=this.plan[r.cursor],actors=[G,...(C3.coopActive()?[C3.coop]:[])],far=(x,y)=>actors.every(a=>Math.hypot(a.x-x,a.y-y)>=4)&&canBody121(x,y);
  let pos=far(spec.x,spec.y)?{x:spec.x,y:spec.y}:null;const rand=this.random((r.seed+Math.imul(r.wave,97)+r.cursor)>>>0);for(let n=0;!pos&&n<100;n++){const x=3.5+Math.floor(rand()*21),y=3.5+Math.floor(rand()*15);if(far(x,y))pos={x,y}}if(!pos)return false;
  const e={id:'endless_'+r.cursor,type:spec.type,x:pos.x,y:pos.y,endless:true};hydrateEnemy(e);e.hp=e.max=Math.min(2000000,Math.round(e.max*(1+(r.wave-1)*.13)));e.power=Math.min(9999,Math.round(e.power*(1+(r.wave-1)*.065)));e.cd=1;e.aware=1;current.enemies.push(e);r.cursor++;return true;
 },
 update(dt){
  if(!this.active()||!['walk','action'].includes(mode))return;const r=this.run();if(r._resume){this.beginWave(true);return}
  if(r.phase==='rest'){r.wait=Math.max(0,r.wait-dt);if(!r.wait){r.wave=Math.min(this.MAX_WAVE,r.wave+1);this.beginWave()}return}
  this.spawnClock+=dt;if(this.spawnClock>=.7){this.spawnClock=0;this.spawn()}
  if(r.cursor>=this.plan.length&&current.enemies.every(e=>e.hp<=0)){
   r.score=Math.min(this.MAX_SCORE,r.score+r.wave*100);r.bankedScore=r.score;r.bankedKills=r.kills;r.completedWave=r.wave;r.phase='rest';r.wait=3;battle=null;mode='walk';this.clearCombat();this.best();save(true);updateHUD();toast('ONDA '+r.wave+' CONCLUÍDA · +'+r.wave*100+' PONTOS');
  }
 },
 best(){const p=this.state(),r=p.run;if(r){p.bestScore=Math.max(p.bestScore,r.score);p.bestWave=Math.max(p.bestWave,r.completedWave)}},
 finishRun(reason='exit'){
  if(!this.active())return false;const p=this.state(),r=p.run;this.best();p.lastRun={score:r.score,wave:r.completedWave,kills:r.kills,seed:r.seed,reason:reason==='defeat'?'defeat':'exit'};p.run=null;this.plan=[];this.clearCombat();G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'));for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];
  setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);save(true);const last=p.lastRun;
  openOverlay(`<div class="eyebrow">${reason==='defeat'?'A EXPEDIÇÃO TERMINOU':'EXPEDIÇÃO ENCERRADA'}</div><h2>${last.score} pontos</h2><div class="stat"><span>Ondas concluídas</span><b>${last.wave}</b></div><div class="stat"><span>Inimigos vencidos</span><b>${last.kills}</b></div><div class="stat"><span>Recorde neste save</span><b>${p.bestScore}</b></div><p>A campanha e os aliados continuam preservados. Cada nova tentativa recebe outra semente.</p><div class="row"><button class="action strong" id="postRunAgain">NOVA TENTATIVA</button><button class="action" id="postRunMap">VIAGENS</button><button class="action" id="postRunClose">FICAR NO TORII</button></div>`);
  $('postRunAgain').onclick=()=>this.startDungeon();$('postRunMap').onclick=()=>this.openTravel();$('postRunClose').onclick=closeOverlay;return true;
 },
 hud(){if(!G)return;if(this.active()){const r=this.run(),left=this.plan.length-r.cursor+current.enemies.filter(e=>e.hp>0).length;$('quest').textContent='ONDA '+r.wave+' · '+(r.phase==='rest'?'Próxima onda em '+Math.ceil(r.wait)+'s':left+' inimigos restantes');$('questHint').textContent=r.score+' pontos · recorde '+this.state().bestScore+' · M: encerrar expedição';$('bMap').textContent='EXPEDIÇÃO [M]'}else if(G.c3?.complete){$('quest').textContent='Hutukara continua aberto.';$('questHint').textContent='M: viajar entre cenários ou entrar no calabouço infinito.';$('bMap').textContent='CENÁRIOS [M]'}else $('bMap').textContent='MAPA [M]';if(G.c3?.complete){if($('mobileObjective'))$('mobileObjective').textContent=$('quest').textContent;if($('guideChip'))$('guideChip').textContent=$('questHint').textContent}}
};
C3.AREAS.push(PostGame.AREA);C3.COMBAT_AREAS.push(PostGame.AREA);combatAreas10.add(PostGame.AREA);C3.labels[PostGame.AREA]=['FENDA DAS RESSONÂNCIAS','CALABOUÇO INFINITO'];
const postFresh=fresh;fresh=function(...args){const g=postFresh(...args);g.postgame=PostGame.defaults();return g};
const postNormalize=normalizeSave;normalizeSave=function(raw){const source=raw?.progress||raw;if(source?.area===PostGame.AREA&&!areas[PostGame.AREA])PostGame.buildArena();const g=postNormalize(raw);if(!g)return g;g.postgame=PostGame.normalize(source?.postgame,g);if(g.area===PostGame.AREA&&!g.postgame.run){g.area=g.c3.started?'last_torii':'studio';g.x=g.c3.started?13.5:12.5;g.y=g.c3.started?13.5:10.5}return g};
const postBuild=buildMaps;buildMaps=function(...args){const r=postBuild(...args);PostGame.syncReserves(true);if(G?.postgame?.run?.active)PostGame.buildArena();return r};
const postArea=setArea;setArea=function(id,...args){if(id==='last_torii')PostGame.syncReserves(true);if(id===PostGame.AREA&&!areas[id])PostGame.buildArena();const r=postArea(id,...args);if(id===PostGame.AREA&&PostGame.run()?._resume)PostGame.beginWave(true);return r};
const postStory=C3.areaStory;C3.areaStory=function(id){if(id==='last_torii')return PostGame.intro();return postStory(id)};
const postNPC=drawDetailedNPC;drawDetailedNPC=function(n,x,y){if(n.postReserve){if(PostGame.names[n.postHero])return drawActor({style:n.postHero,dir:c3NpcPose(n).dir},x,y,false);return postNPC({...n,id:n.postHero==='colli'?'c3_nara':'c3_maia'},x,y)}return postNPC(n,x,y)};
const postMap=openMap;openMap=function(){if(G?.c3?.complete)return PostGame.openTravel();return postMap()};
const postSystem=openSystem;openSystem=function(...args){const r=postSystem(...args);if(G?.c3?.complete){for(const [id,text,fn]of [['postSystemMap','CENÁRIOS · VIAGENS',()=>PostGame.openTravel()],['postSystemDungeon',PostGame.active()?'ENCERRAR EXPEDIÇÃO':'CALABOUÇO INFINITO',()=>PostGame.active()?PostGame.finishRun('exit'):PostGame.startDungeon()]]){const b=document.createElement('button');b.id=id;b.className='menu-entry10';b.textContent=text;b.onclick=fn;$('overlayInner').appendChild(b)}}return r};
const postCombatUnlocked=C3.combatUnlocked;C3.combatUnlocked=function(g=G){return !!(g?.c3?.complete&&g.area===PostGame.AREA)||postCombatUnlocked(g)};
const postActors=enemyActors;enemyActors=function(){return PostGame.active()?current.enemies.filter(e=>e.hp>0):postActors()};
const postXP=gainXP;gainXP=function(...args){if(PostGame.active())return;return postXP(...args)};
const postHit=hitEnemy;hitEnemy=function(e,...args){if(!PostGame.active()||!e?.endless)return postHit(e,...args);const shards=G.shards;PostGame.resolvingHit=true;try{postHit(e,...args)}finally{PostGame.resolvingHit=false;G.shards=shards;G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'))}if(e.hp<=0&&!e.endlessScored){e.endlessScored=true;const r=PostGame.run();r.kills++;r.score=Math.min(PostGame.MAX_SCORE,r.score+25+r.wave*5);current.enemies=current.enemies.filter(n=>n.hp>0);PostGame.best();save(true);updateHUD()}};
const postSave=save;save=function(silent=false){if(PostGame.resolvingHit)return;if(PostGame.active()){try{localStorage.setItem(KEY,JSON.stringify(G));if(!silent)toast('EXPEDIÇÃO SALVA · A ONDA ATUAL RECOMEÇA AO CARREGAR')}catch{if(!silent)toast('Use EXPORTAR SAVE para guardar a expedição.')}return}return postSave(silent)};
// The legacy exporter substitutes a checkpoint during combat; expeditions
// instead export the bounded current-wave checkpoint held in G.postgame.
const postExportSave=exportSave;exportSave=function(...args){if(!PostGame.active())return postExportSave(...args);const previous=battle;battle=null;try{return postExportSave(...args)}finally{battle=previous}};
const postDefeat=showDefeat;showDefeat=function(...args){if(PostGame.active())return PostGame.finishRun('defeat');return postDefeat(...args)};
const postRestore=restoreCheckpoint;restoreCheckpoint=function(...args){if(PostGame.active())return PostGame.finishRun('exit');const p=G?.postgame?copy(G.postgame):null,result=postRestore(...args);if(p&&G?.c3?.complete){const s=PostGame.state();s.bestScore=Math.max(s.bestScore,p.bestScore);s.bestWave=Math.max(s.bestWave,p.bestWave);if(p.lastRun)s.lastRun=p.lastRun}return result};
const postUpdate=update;update=function(dt){const r=postUpdate(dt);if(G?.area==='last_torii')PostGame.syncReserves();PostGame.update(Math.max(0,Math.min(.1,Number(dt)||0)));return r};
const postHUD=updateHUD;updateHUD=function(...args){const r=postHUD(...args);PostGame.hud();return r};
const postObjective=objectiveData;objectiveData=function(){if(PostGame.active())return {text:'Supere a onda '+PostGame.run().wave+'.',hint:'M para encerrar a expedição e registrar a pontuação.',area:PostGame.AREA,x:G.x,y:G.y,name:'Fenda das Ressonâncias'};if(G?.c3?.complete)return {text:'Hutukara continua aberto.',hint:'M ou MAPA para viajar e entrar no calabouço infinito.',area:G.area,x:G.x,y:G.y,name:'Caminhos abertos'};if(G?.c3?.endingPending)return {text:'Escute a última frequência.',hint:'Os caminhos de Hutukara permanecem abertos.',area:G.area,x:G.x,y:G.y,name:'A próxima música'};return postObjective()};
const postRoute=getRoute;getRoute=function(){return G?.c3?.complete?[]:postRoute()};
const postGuide=drawGuideMarker;drawGuideMarker=function(...args){if(G?.c3?.complete)return;return postGuide(...args)};
const postFinish=C3.finishSilence;C3.finishSilence=function(){if(G.c3.silenceDone)return G.c3.endingPending?C3.resumeEnding():PostGame.showEnding();const r=postFinish();G.c3.returnHome=false;save(true);return r};
C3.resumeEnding=function(){C3.scene('C3_025',()=>C3.scene('C3_026',()=>C3.scene('C3_027',()=>PostGame.complete())))};
// Compatibility entry point for older pending epilogues/debug tools; never warps to the studio.
C3.returnStudio=function(){return PostGame.complete()};C3.showEnding=function(){return PostGame.showEnding()};
