/* Post-game: reserve-only finale, safe travel and seeded endless encounters.
 * Save schema remains 13; this module owns G.postgame.version=2 only. */
'use strict';
const PostGame={
 AREA:'endless_echo',
 chapters:[{chapter:1,area:'city',label:'CAPÍTULO 1',name:'Cidade do Eco'},{chapter:2,area:'voices',label:'CAPÍTULO 2',name:'Cidade das Vozes'},{chapter:3,area:'distortion_district',label:'CAPÍTULO 3',name:'Distrito da Distorção'}],
 MAX_ALIVE:8, MAX_WAVE:1000000, MAX_SCORE:9000000000000,
 names:{franco:'Franco',ryuchi:'Ryuchi',alt:'Franco · Arqueiro',katana:'Ryuchi · Katana',synth:'Franco · Sintetizador',percussion:'Ryuchi · Percussionista'},
 memories:{franco:'A gente não precisa acertar a primeira nota. Só não deixa o medo tocar por nós.',ryuchi:'Se o caminho tremer, eu seguro o pulso com vocês.',alt:'Parei de procurar uma flecha que provasse que eu era diferente. Agora eu sei aonde quero chegar.',katana:'Não vou pedir que entrem sem medo. Só não entrem sozinhos.',synth:'Deixei um acorde aberto para vocês voltarem. Ainda cabe som novo aqui.',percussion:'Quando o compasso apertar, escuta quem está do lado. A gente encontra a próxima batida junto.'},
 rosterKey:'', resolvingHit:false, plan:[], spawnClock:0,
 number(v,max,fallback=0){return Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.floor(Number(v)))):fallback},
 defaults(){return {version:2,bestScore:0,bestWave:0,legacyScore:0,records:{solo:{score:0,wave:0},coop:{score:0,wave:0}},lastRun:null,run:null}},
 state(g=G){if(!g)return null;if(!g.postgame)g.postgame=this.defaults();return g.postgame},
 run(){return G?.postgame?.run||null},
 active(){return !!(G?.c3?.complete&&G.area===this.AREA&&this.run()?.active)},
 normalize(value,g){
  const v=value&&typeof value==='object'?value:{},out=this.defaults();out.bestScore=this.number(v.bestScore,this.MAX_SCORE);out.bestWave=this.number(v.bestWave,this.MAX_WAVE);out.legacyScore=this.number(v.version===2?v.legacyScore:v.bestScore,this.MAX_SCORE);
  for(const mode of ['solo','coop'])out.records[mode]={score:this.number(v.records?.[mode]?.score,this.MAX_SCORE),wave:this.number(v.records?.[mode]?.wave,this.MAX_WAVE)};
  if(v.lastRun&&typeof v.lastRun==='object')out.lastRun={score:this.number(v.lastRun.score,this.MAX_SCORE),wave:this.number(v.lastRun.wave,this.MAX_WAVE),kills:this.number(v.lastRun.kills,this.MAX_SCORE),seed:this.number(v.lastRun.seed,4294967295,1)||1,reason:v.lastRun.reason==='defeat'?'defeat':'exit',mode:v.lastRun.mode==='coop'?'coop':'solo',legacy:v.lastRun.legacy!==false||v.lastRun.rules!==2,rules:2,elapsed:this.number(v.lastRun.elapsed,this.MAX_SCORE)};
  const r=v.run;if(g.c3?.complete&&g.area===this.AREA&&r?.active===true){
   const rest=r.phase==='rest',wave=Math.max(1,Math.min(this.MAX_WAVE,this.number(r.wave,this.MAX_WAVE,1)+(rest?1:0))),hpStart={},recovery=r.rules===2?this.recovery(this.number(r.wave,this.MAX_WAVE,1)):.2;
   for(const id of Object.keys(this.names))hpStart[id]=Math.max(1,Math.min(g.maxhp[id]||40,rest?(g.hp[id]||0)+(r.rules===2?0:Math.ceil((g.maxhp[id]||40)*recovery)):this.number(r.hpStart?.[id],999,g.maxhp[id]||40)));
   const original=this.number(r.campaignPotions,99,g.potions||0),potions=rest?this.number(g.potions,6):this.number(r.potionsStart,6,g.potions||0);
   out.run={active:true,rules:2,legacy:r.rules!==2||!!r.legacy,mode:r.mode==='coop'?'coop':'solo',seed:this.number(r.seed,4294967295,1)||1,wave,score:this.number(r.bankedScore,this.MAX_SCORE),bankedScore:this.number(r.bankedScore,this.MAX_SCORE),kills:this.number(r.bankedKills,this.MAX_SCORE),bankedKills:this.number(r.bankedKills,this.MAX_SCORE),completedWave:wave-1,hpStart,campaignPotions:original,potionsStart:potions,combo:rest?this.number(r.combo,5):this.number(r.comboStart,5),comboStart:rest?this.number(r.combo,5):this.number(r.comboStart,5),elapsed:this.number(r.bankedElapsed,this.MAX_SCORE),bankedElapsed:this.number(r.bankedElapsed,this.MAX_SCORE),waveSeats:r.waveSeats===2?2:1,phase:'fight',cursor:0,wait:0,pending:null,clean:true,knockouts:0,_resume:true};g.potions=potions;
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
 canTravel(){return !!(!(mode==='overlay'&&$('retryCheckpoint'))&&savedFormationAlive10(G)&&G?.c3?.complete&&!bossActor&&!battle&&!['dialogue','rhythm','title'].includes(mode)&&!this.active())},
 travel(id){
  const chapter=this.chapters.find(c=>c.area===id);if(!chapter||!this.canTravel()||!areas[id])return false;const p=this.arrival(id);if(!p)return false;closeOverlay();G.chapter=chapter.chapter;setArea(id,p.x,p.y,false);setCheckpoint('post_travel',id,p.x,p.y,true);updateHUD();return true;
 },
 openTravel(){
  if(!G?.c3?.complete||!savedFormationAlive10(G)||(mode==='overlay'&&$('retryCheckpoint')))return false;if(['dialogue','rhythm','title'].includes(mode))return false;const allowed=this.canTravel();
  const rows=this.chapters.map(c=>`<button class="action" data-post-area="${c.area}" ${allowed?'':'disabled'}>${c.label}<br><small>${c.name}${c.area===G.area?' · AQUI':''}</small></button>`).join('');
  enterMenu10(`<div class="eyebrow">HUTUKARA · CAMINHOS ABERTOS</div><h2>Escolha um capítulo</h2><p>${this.active()?'Encerre a expedição para viajar. Sua pontuação será registrada.':allowed?'Volte ao centro de um capítulo e continue explorando. Sua equipe, história e progresso permanecem preservados.':'Conclua o combate para atravessar outra passagem.'}</p><div class="row">${rows}</div><hr class="divider"><div class="row"><button class="action strong" id="postDungeon" ${allowed?'':'disabled'}>CALABOUÇO INFINITO</button>${this.active()?'<button class="action" id="postAbandon">ENCERRAR EXPEDIÇÃO</button>':''}<button class="action" id="postMapClose">VOLTAR</button></div>`,'postgame');
  document.querySelectorAll('[data-post-area]').forEach(b=>b.onclick=()=>this.travel(b.dataset.postArea));$('postDungeon').onclick=()=>this.startDungeon();$('postMapClose').onclick=closeOverlay;if($('postAbandon'))$('postAbandon').onclick=()=>this.finishRun('exit');return true;
 },
 clearCombat(){battle=bossActor=null;hostileShots=[];projectiles=[];combatFX.length=0;C3.hazards=[];C3.synthZones=[];C3.finalPending=false;C3.percussionGuard=0;resetMotion10();act.slash=act.hit=act.cool=0;act.invuln=1;C3.coop.area='';$('actionHUD').classList.add('hidden')},
 complete(){
  this.clearCombat();G.c3.silenceDone=true;G.c3.complete=true;G.c3.endingPending=false;G.c3.returnHome=false;this.state();for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];
  setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);save(true);this.showEnding();
 },
 showEnding(){
  if(!G?.c3?.complete)return;const p=this.state();enterMenu10(`<div class="eyebrow">JORNADA CONCLUÍDA · O CANAL CONTINUA ABERTO</div><h2>A próxima música começa aqui</h2><p>O Silêncio deixou de decidir quando vocês podem começar. As máscaras permanecem ligadas aos caminhos de Hutukara.</p><div class="stat"><span>Capítulos concluídos</span><b>3 / 3</b></div><p>Use M ou o botão MAPA para escolher entre os três capítulos e o calabouço. Na Fenda das Ressonâncias, cada onda traz uma nova formação de inimigos e aumenta o desafio.</p><div class="stat"><span>Recorde do calabouço · neste save</span><b>SOLO ${p.records.solo.score} · CO-OP ${p.records.coop.score}</b></div>${p.legacyScore?`<p class="lore">Histórico das regras anteriores: ${p.legacyScore} pontos.</p>`:''}<div class="row"><button class="action strong" id="postEnter">ENTRAR NO CALABOUÇO</button><button class="action" id="postTravel">ESCOLHER CAPÍTULO</button><button class="action" id="postPhrase">CRIAR NOVA FRASE</button><button class="action" id="postStay">FICAR NO TORII</button><button class="action" id="postExport">EXPORTAR SAVE</button></div>`,'postgame');
  $('postEnter').onclick=()=>this.startDungeon();$('postTravel').onclick=()=>this.openTravel();$('postPhrase').onclick=()=>C3.openPhrase('post');$('postStay').onclick=closeOverlay;$('postExport').onclick=exportSave;$('postEnter').focus();
 },

 recovery(wave){return wave%5===0?.25:.10},
 profile(wave,seats=1){
  const w=Math.max(1,wave),phase=(w-1)%5,names=['Pulso','Contratempo','Interferência','Ressonância','Crescendo'];
  return {name:names[phase],count:Math.min(seats===2?18:15,Math.ceil((3+Math.floor((w-1)*.55))*(seats===2?1.3:1))),alive:Math.min(seats===2?7:6,(seats===2?4:3)+Math.floor((w-1)/6)),cadence:seats===2?1.05:1.25,warning:.95,hp:(1+.018*(w-1)+.20*Math.log2(1+(w-1)/5))*(seats===2?1.12:1),power:Math.min(3.25,1+.022*(w-1)),rest:w%5===0?8:4};
 },
 record(mode){return this.state().records[mode==='coop'?'coop':'solo']},
 multiplier(r=this.run()){return 1+Math.min(5,r?.combo||0)*.1},
 killValue(type,wave,elite=false){const base={hush:50,whisper:60,compasso:90,espelho:100,abafador:120,c3_drone:80,c3_echo:110}[type]||50;return Math.round(base*(1+.06*(wave-1))*(elite?1.5:1))},
 waveValue(r){const base=150+50*r.wave+(r.wave%5===0?250*Math.floor(r.wave/5):0);return Math.round(base*this.multiplier(r)*(r.clean?1.25:1))},
 damageSnapshot(){return Object.fromEntries(Object.keys(this.names).map(id=>[id,G.hp[id]||0]))},
 observeDamage(before){const r=this.run();if(!this.active()||!r||r.phase!=='fight')return;for(const id of Object.keys(before))if((G.hp[id]||0)<before[id]){r.clean=false;if(before[id]>0&&G.hp[id]<=0)r.knockouts++}},
 random(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}},
 wavePlan(seed,wave,seats=1){
  const rand=this.random((seed^Math.imul(wave,2654435761))>>>0),profile=this.profile(wave,seats),pool=['hush','whisper'];
  if(wave>=3)pool.push('compasso');if(wave>=4)pool.push('c3_drone');if(wave>=6)pool.push('espelho');if(wave>=8)pool.push('c3_echo');if(wave>=10)pool.push('abafador');
  const preferred=[['hush','compasso'],['hush','c3_echo'],['whisper','c3_drone'],['compasso','abafador'],pool][(wave-1)%5].filter(t=>pool.includes(t)),deck=[...pool,...preferred,...preferred];let controllers=0;
  return Array.from({length:profile.count},(_,i)=>{let type=deck[Math.floor(rand()*deck.length)];if(i===0)type=preferred[0]||'hush';if(i===1)type=({3:'compasso',4:'c3_drone',6:'espelho',8:'c3_echo',10:'abafador'})[wave]||pool[(wave+(seed>>>0))%pool.length];if(type==='abafador'&&controllers++)type='hush';return {type,x:3.5+Math.floor(rand()*21),y:4.5+Math.floor(rand()*13),elite:wave%5===0&&i===profile.count-1}});
 },

 buildArena(){
  const a=C3.room(this.AREA,28,23,'c3_voidfloor');for(const [x,y]of [[2,2],[25,2]]){solid(a,x,y);prop(a,'env2_prop',x,y,{item:'core_column_left',w:30,h:88})}prop(a,'env2_prop',13,10,{item:'resonance_circle_on',w:100,h:70,flat:true});
  evt(a,'endless_exit',14,20,'ENCERRAR EXPEDIÇÃO',()=>this.finishRun('exit'));return a;
 },
 startDungeon(seed){
  if(!this.canTravel())return false;closeOverlay();G.chapter=3;this.clearCombat();for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);
  const p=this.state(),value=Number.isFinite(seed)?seed>>>0:(Date.now()^Math.floor(Math.random()*4294967295))>>>0,seats=C3.coopActive()?2:1,campaignPotions=G.potions||0;G.potions=seats===2?4:3;G.resonance=100;
  p.run={active:true,rules:2,legacy:false,mode:seats===2?'coop':'solo',seed:value||1,wave:1,score:0,bankedScore:0,kills:0,bankedKills:0,completedWave:0,hpStart:{...G.hp},campaignPotions,potionsStart:G.potions,combo:0,comboStart:0,elapsed:0,bankedElapsed:0,waveSeats:seats,phase:'fight',cursor:0,wait:0,pending:null,clean:true,knockouts:0,_resume:true};
  this.buildArena();setArea(this.AREA,14.5,18.5,false);return true;
 },

 beginWave(resuming=false){
  const r=this.run();if(!r?.active||G.area!==this.AREA)return;this.clearCombat();current.enemies=[];G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'));
  if(resuming){G.hp={...G.hp,...r.hpStart};G.potions=r.potionsStart;r.score=r.bankedScore;r.kills=r.bankedKills;r.combo=r.comboStart;r.elapsed=r.bankedElapsed}
  else{r.hpStart={...G.hp};r.potionsStart=G.potions;r.comboStart=r.combo}
  if(!G.hp[G.active])G.active=partyMembers().find(id=>G.hp[id]>0)||partyMembers()[0];r.waveSeats=C3.coopActive()?2:1;if(r.waveSeats===2)r.mode='coop';r.phase='fight';r.cursor=0;r.wait=0;r.pending=null;r.clean=true;r.knockouts=0;r._resume=false;this.plan=this.wavePlan(r.seed,r.wave,r.waveSeats);this.spawnClock=0;
  if(typeof EnemyArtV1!=='undefined')for(const spec of this.plan){const image=EnemyArtV1.image(EnemyArtV1.key(spec.type,spec));image?.decode?.().catch(()=>{})}
  if(C3.coopActive())C3.syncCoop(true);this.spawn();save(true);updateHUD();toast('ONDA '+r.wave+' · '+this.profile(r.wave,r.waveSeats).name.toUpperCase()+(r.wave%5===0?' · ECO RESSONANTE':''));
 },

 spawn(){
  const r=this.run(),profile=r&&this.profile(r.wave,r.waveSeats);if(!r||r.pending||r.cursor>=this.plan.length||current.enemies.filter(e=>e.hp>0).length>=profile.alive)return false;
  const spec=this.plan[r.cursor],actors=[G,...(C3.coopActive()?[C3.coop]:[])],far=(x,y)=>actors.every(a=>Math.hypot(a.x-x,a.y-y)>=4)&&actors.some(a=>Math.hypot(a.x-x,a.y-y)<=11)&&canBody121(x,y)&&current.enemies.every(e=>e.hp<=0||Math.hypot(e.x-x,e.y-y)>1.2);
  let pos=far(spec.x,spec.y)?{x:spec.x,y:spec.y}:null;const rand=this.random((r.seed+Math.imul(r.wave,97)+r.cursor)>>>0);for(let n=0;!pos&&n<100;n++){const x=3.5+Math.floor(rand()*21),y=3.5+Math.floor(rand()*15);if(far(x,y))pos={x,y}}if(!pos)return false;
  r.pending={...pos,index:r.cursor,time:profile.warning,max:profile.warning};return true;
 },
 materialize(){
  const r=this.run(),p=r?.pending;if(!p)return;const actors=[G,...(C3.coopActive()?[C3.coop]:[])];if(actors.some(a=>Math.hypot(a.x-p.x,a.y-p.y)<2.5)){r.pending=null;this.spawnClock=0;this.spawn();return}
  const spec=this.plan[p.index],profile=this.profile(r.wave,r.waveSeats),e={id:'endless_'+r.cursor,type:spec.type,x:p.x,y:p.y,endless:true,endlessElite:!!spec.elite};hydrateEnemy(e);e.hp=e.max=Math.min(2000000,Math.round(e.max*profile.hp*(spec.elite?1.4:1)));e.power=Math.min(9999,Math.round(e.power*profile.power*(spec.elite?1.08:1)));e.cd=1;e.aware=1;current.enemies.push(e);r.cursor++;r.pending=null;engage();updateHUD();
 },

 update(dt){
  this.restButton();if(!this.active()||!['walk','action'].includes(mode))return;const r=this.run();if(r._resume){this.beginWave(true);return}
  if(C3.coopActive())r.mode='coop';if(r.phase==='rest'){const seconds=Math.ceil(r.wait);r.wait=Math.max(0,r.wait-dt);if(seconds!==Math.ceil(r.wait))updateHUD();if(!r.wait){r.wave=Math.min(this.MAX_WAVE,r.wave+1);this.beginWave()}return}
  r.elapsed=Math.min(this.MAX_SCORE,r.elapsed+dt);
  // A disconnected/KO partner never leaves a solo player with the larger queue.
  if(r.waveSeats===2&&!C3.coopActive()){r.waveSeats=1;const count=this.profile(r.wave,1).count;this.plan.length=Math.max(r.cursor+(r.pending?1:0),Math.min(this.plan.length,count));}
  if(r.pending){r.pending.time=Math.max(0,r.pending.time-dt);if(!r.pending.time)this.materialize()}
  this.spawnClock+=dt;if(this.spawnClock>=this.profile(r.wave,r.waveSeats).cadence){this.spawnClock=0;this.spawn()}
  if(!r.pending&&r.cursor>=this.plan.length&&current.enemies.every(e=>e.hp<=0)){
   const bonus=this.waveValue(r);r.score=Math.min(this.MAX_SCORE,r.score+bonus);r.combo=r.knockouts?Math.max(0,r.combo-2):Math.min(5,r.combo+1);for(const id of C3.unlockedRoster())G.hp[id]=Math.min(G.maxhp[id],G.hp[id]+Math.max(1,Math.ceil(G.maxhp[id]*this.recovery(r.wave))));if(r.wave%5===0)G.potions=Math.min(6,G.potions+(r.waveSeats===2?2:1));r.bankedScore=r.score;r.bankedKills=r.kills;r.bankedElapsed=r.elapsed;r.completedWave=r.wave;r.phase='rest';r.wait=this.profile(r.wave,r.waveSeats).rest;battle=null;mode='walk';this.clearCombat();this.best();save(true);updateHUD();toast('ONDA '+r.wave+' · +'+bonus+' PTS'+(r.clean?' · SEM DANO!':'')+(r.wave%5===0?' · +FITAS DESTA EXPEDIÇÃO':''));
  }
 },

 best(){const p=this.state(),r=p.run;if(r){if(C3.coopActive())r.mode='coop';if(r.legacy)p.legacyScore=Math.max(p.legacyScore,r.score);p.bestScore=Math.max(p.bestScore,r.score);p.bestWave=Math.max(p.bestWave,r.completedWave);if(!r.legacy){const board=this.record(r.mode);board.score=Math.max(board.score,r.score);board.wave=Math.max(board.wave,r.completedWave)}} },

 finishRun(reason='exit'){
  if(!this.active())return false;const p=this.state(),r=p.run;this.best();p.lastRun={score:r.score,wave:r.completedWave,kills:r.kills,seed:r.seed,reason:reason==='defeat'?'defeat':'exit',mode:r.mode,legacy:r.legacy,rules:2,elapsed:Math.floor(r.elapsed)};G.potions=r.campaignPotions;p.run=null;this.plan=[];this.clearCombat();G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'));for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];
  setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);save(true);const last=p.lastRun;
  enterMenu10(`<div class="eyebrow">${reason==='defeat'?'A EXPEDIÇÃO TERMINOU':'EXPEDIÇÃO ENCERRADA'}</div><h2>${last.score} pontos</h2><div class="stat"><span>Ondas concluídas</span><b>${last.wave}</b></div><div class="stat"><span>Inimigos vencidos</span><b>${last.kills}</b></div><div class="stat"><span>Recorde ${last.mode==='coop'?'CO-OP':'SOLO'} · regras novas</span><b>${this.record(last.mode).score}</b></div><p>${last.legacy?'Partida migrada: pontuação preservada no histórico. ' : ''}Tempo de combate: ${Math.floor(last.elapsed/60)}min ${last.elapsed%60}s.</p><p>A campanha e os aliados continuam preservados. Cada nova tentativa recebe outra semente.</p><div class="row"><button class="action strong" id="postRunAgain">NOVA TENTATIVA</button><button class="action" id="postRunMap">VIAGENS</button><button class="action" id="postRunClose">FICAR NO TORII</button></div>`,'postgame');
  $('postRunAgain').onclick=()=>this.startDungeon();$('postRunMap').onclick=()=>this.openTravel();$('postRunClose').onclick=closeOverlay;return true;
 },

 restButton(){
  if(typeof document==='undefined'||!$('hud'))return;let b=$('postNextWave');if(!b){b=document.createElement('button');b.id='postNextWave';b.type='button';b.className='action';b.style.cssText='position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:8;pointer-events:auto;min-height:44px;min-width:150px;font-size:12px';b.textContent='PRÓXIMA ONDA';b.addEventListener('pointerdown',e=>e.stopPropagation());b.onclick=()=>{if(this.active()&&this.run().phase==='rest'&&mode==='walk')this.run().wait=0};$('hud').appendChild(b)}b.hidden=!(this.active()&&this.run().phase==='rest'&&mode==='walk');
 },
 drawWarnings(){
  if(!this.active())return;const p=this.run().pending;if(!p)return;const x=p.x*T-cam.x,y=p.y*T-cam.y,spec=this.plan[p.index];ctx.save();ctx.strokeStyle=spec?.elite?'#d6a56c':'#c4c7b0';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.ellipse(x,y,18,10,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#f0ddba';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(spec?.elite?'RESSONANTE':'ECO',x,y-16);ctx.restore();
 },
 hud(){if(!G)return;if(this.active()){const r=this.run(),left=this.plan.length-r.cursor+current.enemies.filter(e=>e.hp>0).length;$('quest').textContent='ONDA '+r.wave+' · '+(r.phase==='rest'?'Próxima onda em '+Math.ceil(r.wait)+'s':left+' inimigos restantes');$('questHint').textContent=r.score+' PTS · RITMO ×'+this.multiplier(r).toFixed(1)+' · '+this.profile(r.wave,r.waveSeats).name+' · M: encerrar';$('bMap').textContent='EXPEDIÇÃO [M]'}else if(G.c3?.complete){$('quest').textContent='Hutukara continua aberto.';$('questHint').textContent='M: escolher um capítulo ou entrar no calabouço infinito.';$('bMap').textContent='CAPÍTULOS [M]'}else $('bMap').textContent='MAPA [M]';if(G.c3?.complete){if($('mobileObjective'))$('mobileObjective').textContent=$('quest').textContent;if($('guideChip'))$('guideChip').textContent=$('questHint').textContent}}
};
C3.AREAS.push(PostGame.AREA);C3.COMBAT_AREAS.push(PostGame.AREA);combatAreas10.add(PostGame.AREA);C3.labels[PostGame.AREA]=['FENDA DAS RESSONÂNCIAS','CALABOUÇO INFINITO'];
const postFresh=fresh;fresh=function(...args){const g=postFresh(...args);g.postgame=PostGame.defaults();return g};
const postNormalize=normalizeSave;normalizeSave=function(raw){const source=raw?.progress||raw;if(source?.area===PostGame.AREA&&!areas[PostGame.AREA])PostGame.buildArena();const g=postNormalize(raw);if(!g)return g;g.postgame=PostGame.normalize(source?.postgame,g);if(g.area===PostGame.AREA&&!g.postgame.run){g.area=g.c3.started?'last_torii':'studio';g.x=g.c3.started?13.5:12.5;g.y=g.c3.started?13.5:10.5}return g};
const postBuild=buildMaps;buildMaps=function(...args){const r=postBuild(...args);PostGame.syncReserves(true);if(G?.postgame?.run?.active)PostGame.buildArena();return r};
const postArea=setArea;setArea=function(id,...args){if(id==='last_torii')PostGame.syncReserves(true);if(id===PostGame.AREA&&!areas[id])PostGame.buildArena();const r=postArea(id,...args);if(id===PostGame.AREA&&PostGame.run()?._resume)PostGame.beginWave(true);return r};
const postStory=C3.areaStory;C3.areaStory=function(id){if(id==='last_torii')return PostGame.intro();return postStory(id)};
const postNPC=drawDetailedNPC;drawDetailedNPC=function(n,x,y){if(n.postReserve){if(PostGame.names[n.postHero])return drawActor({style:n.postHero,dir:c3NpcPose(n).dir},x,y,false);return postNPC({...n,id:n.postHero==='colli'?'c3_nara':'c3_maia'},x,y)}return postNPC(n,x,y)};
const postMap=openMap;openMap=function(){if(G?.c3?.complete)return PostGame.openTravel();return postMap()};
const postSystem=openSystem;openSystem=function(...args){const r=postSystem(...args);if(G?.c3?.complete&&mode==='overlay'&&menuPage10==='main'&&!$('retryCheckpoint')){for(const [id,text,fn]of [['postSystemMap','CAPÍTULOS · VIAGENS',()=>PostGame.openTravel()],['postSystemDungeon',PostGame.active()?'ENCERRAR EXPEDIÇÃO':'CALABOUÇO INFINITO',()=>PostGame.active()?PostGame.finishRun('exit'):PostGame.startDungeon()]]){const b=document.createElement('button');b.id=id;b.className='menu-entry10';b.textContent=text;b.onclick=fn;$('overlayInner').appendChild(b)}}return r};
const postCombatUnlocked=C3.combatUnlocked;C3.combatUnlocked=function(g=G){return !!(g?.c3?.complete&&g.area===PostGame.AREA)||postCombatUnlocked(g)};
const postActors=enemyActors;enemyActors=function(){return PostGame.active()?current.enemies.filter(e=>e.hp>0):postActors()};
const postXP=gainXP;gainXP=function(...args){if(PostGame.active())return;return postXP(...args)};
const postHit=hitEnemy;hitEnemy=function(e,...args){if(!PostGame.active()||!e?.endless)return postHit(e,...args);const shards=G.shards;PostGame.resolvingHit=true;try{postHit(e,...args)}finally{PostGame.resolvingHit=false;G.shards=shards;G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'))}if(e.hp<=0&&!e.endlessScored){e.endlessScored=true;const r=PostGame.run();r.kills++;r.score=Math.min(PostGame.MAX_SCORE,r.score+Math.round(PostGame.killValue(e.type,r.wave,e.endlessElite)*PostGame.multiplier(r)));current.enemies=current.enemies.filter(n=>n.hp>0);PostGame.best();save(true);updateHUD()}};
const postSave=save;save=function(silent=false){if(PostGame.resolvingHit)return;if(PostGame.active()){try{localStorage.setItem(KEY,JSON.stringify(G));if(!silent)toast('EXPEDIÇÃO SALVA · A ONDA ATUAL RECOMEÇA AO CARREGAR')}catch{if(!silent)toast('Use EXPORTAR SAVE para guardar a expedição.')}return}return postSave(silent)};
// The legacy exporter substitutes a checkpoint during combat; expeditions
// instead export the bounded current-wave checkpoint held in G.postgame.
const postExportSave=exportSave;exportSave=function(...args){if(!PostGame.active())return postExportSave(...args);const previous=battle;battle=null;try{return postExportSave(...args)}finally{battle=previous}};
const postDefeat=showDefeat;showDefeat=function(...args){if(PostGame.active())return PostGame.finishRun('defeat');return postDefeat(...args)};
const postRestore=restoreCheckpoint;restoreCheckpoint=function(...args){if(PostGame.active())return PostGame.finishRun('exit');const p=G?.postgame?copy(G.postgame):null,result=postRestore(...args);if(p&&G?.c3?.complete){const s=PostGame.state();s.bestScore=Math.max(s.bestScore,p.bestScore);s.bestWave=Math.max(s.bestWave,p.bestWave);for(const mode of ['solo','coop']){s.records[mode].score=Math.max(s.records[mode].score,p.records?.[mode]?.score||0);s.records[mode].wave=Math.max(s.records[mode].wave,p.records?.[mode]?.wave||0)}if(p.lastRun)s.lastRun=p.lastRun}return result};
const postUpdate=update;update=function(dt){const r=postUpdate(dt);if(G?.area==='last_torii')PostGame.syncReserves();PostGame.update(Math.max(0,Math.min(.1,Number(dt)||0)));return r};
const postHUD=updateHUD;updateHUD=function(...args){const r=postHUD(...args);PostGame.hud();return r};
const postActionHUD=updateActionHUD;updateActionHUD=function(...args){const r=postActionHUD(...args);if(PostGame.active()){const run=PostGame.run(),left=PostGame.plan.length-run.cursor+current.enemies.filter(e=>e.hp>0).length;$('actionEnemy').textContent='ONDA '+run.wave+' · '+left+' RESTANTES · '+run.score+' PTS · ×'+PostGame.multiplier(run).toFixed(1);$('actionEnemyFill').style.width=(PostGame.plan.length?100*(1-left/PostGame.plan.length):0)+'%'}return r};
const postObjective=objectiveData;objectiveData=function(){if(PostGame.active())return {text:'Supere a onda '+PostGame.run().wave+'.',hint:'M para encerrar a expedição e registrar a pontuação.',area:PostGame.AREA,x:G.x,y:G.y,name:'Fenda das Ressonâncias'};if(G?.c3?.complete)return {text:'Hutukara continua aberto.',hint:'M ou MAPA para escolher um capítulo ou o calabouço infinito.',area:G.area,x:G.x,y:G.y,name:'Caminhos abertos'};if(G?.c3?.endingPending)return {text:'Escute a última frequência.',hint:'Os caminhos de Hutukara permanecem abertos.',area:G.area,x:G.x,y:G.y,name:'A próxima música'};return postObjective()};
const postC3Objective=C3.objective;C3.objective=function(){return G?.c3?.complete||G?.c3?.endingPending?objectiveData():postC3Objective()};
const postRoute=getRoute;getRoute=function(){return G?.c3?.complete?[]:postRoute()};
const postGuide=drawGuideMarker;drawGuideMarker=function(...args){if(G?.c3?.complete)return;return postGuide(...args)};
const postFinish=C3.finishSilence;C3.finishSilence=function(){if(G.c3.silenceDone)return G.c3.endingPending?C3.resumeEnding():PostGame.showEnding();const r=postFinish();G.c3.returnHome=false;save(true);return r};
C3.resumeEnding=function(){C3.scene('C3_025',()=>C3.scene('C3_026',()=>C3.scene('C3_027',()=>PostGame.complete())))};
// Compatibility entry point for older pending epilogues/debug tools; never warps to the studio.
C3.returnStudio=function(){return PostGame.complete()};C3.showEnding=function(){return PostGame.showEnding()};

// Normalize dynamic areas before validating their existence. Do not replace the
// current session or storage until the entire imported progress is accepted.
importSave=function(file){
 if(!file)return;const rd=new FileReader();rd.onload=()=>{try{
  const raw=JSON.parse(rd.result),source=raw?.progress||raw;
  if(!source||typeof source.flags!=='object'||!source.flags||!Number.isFinite(Number(source.x))||!Number.isFinite(Number(source.y)))throw Error('Arquivo não reconhecido');
  const imported=normalizeSave(source);if(!imported||!areas[imported.area])throw Error('Versão de progresso incompatível');
  G=imported;buildMaps();let persisted=true;try{localStorage.setItem(KEY,JSON.stringify(G))}catch{persisted=false}
  $('start').classList.add('hidden');$('hud').style.display='block';closeOverlay();setArea(G.area,G.x,G.y,false);
  toast(persisted?'PROGRESSO IMPORTADO':'PROGRESSO IMPORTADO · EXPORTE PARA GUARDAR');
 }catch{toast('ARQUIVO DE SALVAMENTO INVÁLIDO')}};rd.readAsText(file);
};

// Track actual HP loss (including leader swaps), not blocked/invulnerable hits.
const postDungeonDamage=damageHero;damageHero=function(...args){const before=PostGame.active()?PostGame.damageSnapshot():null;try{return postDungeonDamage(...args)}finally{if(before)PostGame.observeDamage(before)}};
const postDungeonCoopDamage=C3.damageCoop;C3.damageCoop=function(...args){const before=PostGame.active()?PostGame.damageSnapshot():null;try{return postDungeonCoopDamage(...args)}finally{if(before)PostGame.observeDamage(before)}};
if(typeof BossChoreographyV2!=='undefined'){const postDungeonGround=BossChoreographyV2.drawGround;BossChoreographyV2.drawGround=function(...args){const result=postDungeonGround.apply(this,args);PostGame.drawWarnings();return result}};
