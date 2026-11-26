/* Post-game: reserve-only finale, safe travel and seeded endless encounters.
 * Save schema remains 13; this module owns G.postgame.version=3 only. */
'use strict';
const PostGame={
 AREA:'endless_echo',
 chapters:[{chapter:1,area:'city',label:'CAPÍTULO 1',name:'Cidade do Eco'},{chapter:2,area:'voices',label:'CAPÍTULO 2',name:'Cidade das Vozes'},{chapter:3,area:'distortion_district',label:'CAPÍTULO 3',name:'Distrito da Distorção'}],
 MAX_ALIVE:8, MAX_WAVE:1000000, MAX_SCORE:9000000000000,
 names:{franco:'Franco',ryuchi:'Ryuchi',alt:'Franco · Arqueiro',katana:'Ryuchi · Katana',synth:'Franco · Sintetizador',percussion:'Ryuchi · Percussionista'},
 memories:{franco:'A gente não precisa acertar a primeira nota. Só não deixa o medo tocar por nós.',ryuchi:'Se o caminho tremer, eu seguro o pulso com vocês.',alt:'Parei de procurar uma flecha que provasse que eu era diferente. Agora eu sei aonde quero chegar.',katana:'Não vou pedir que entrem sem medo. Só não entrem sozinhos.',synth:'Deixei um acorde aberto para vocês voltarem. Ainda cabe som novo aqui.',percussion:'Quando o compasso apertar, escuta quem está do lado. A gente encontra a próxima batida junto.'},
 rosterKey:'', resolvingHit:false, plan:[], spawnClock:0,
 number(v,max,fallback=0){return Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.floor(Number(v)))):fallback},
 defaults(){return {version:3,bestScore:0,bestWave:0,legacyScore:0,records:{solo:{score:0,wave:0},coop:{score:0,wave:0}},lastRun:null,run:null}},
 state(g=G){if(!g)return null;if(!g.postgame)g.postgame=this.defaults();return g.postgame},
 run(){return G?.postgame?.run||null},
 active(){return !!(G?.c3?.complete&&G.area===this.AREA&&this.run()?.active)},
 normalize(value,g){
  const v=value&&typeof value==='object'?value:{},out=this.defaults();
  out.bestScore=this.number(v.bestScore,this.MAX_SCORE);
  out.bestWave=this.number(v.bestWave,this.MAX_WAVE);
  out.legacyScore=this.number(v.version===3?v.legacyScore:Math.max(v.legacyScore||0,v.bestScore||0),this.MAX_SCORE);
  if(v.version===3)for(const mode of ['solo','coop'])out.records[mode]={score:this.number(v.records?.[mode]?.score,this.MAX_SCORE),wave:this.number(v.records?.[mode]?.wave,this.MAX_WAVE)};
  if(v.lastRun&&typeof v.lastRun==='object')out.lastRun={score:this.number(v.lastRun.score,this.MAX_SCORE),wave:this.number(v.lastRun.wave,this.MAX_WAVE),kills:this.number(v.lastRun.kills,this.MAX_SCORE),seed:this.number(v.lastRun.seed,4294967295,1)||1,reason:v.lastRun.reason==='defeat'?'defeat':'exit',mode:v.lastRun.mode==='coop'?'coop':'solo',legacy:v.lastRun.legacy!==false||v.lastRun.rules!==3,rules:3,elapsed:this.number(v.lastRun.elapsed,this.MAX_SCORE)};
  const r=v.run;if(g.c3?.complete&&g.area===this.AREA&&r?.active===true){
   const rest=r.phase==='rest',wave=Math.max(1,this.number(r.wave,this.MAX_WAVE,1)),hpStart={};
   for(const id of Object.keys(this.names)){
    const max=g.maxhp[id]||40;
    const current=this.number(g.hp[id],max,max);
    const saved=r.hpStart?.[id];
    hpStart[id]=!rest&&Number.isFinite(saved)&&saved>=0?this.number(saved,max):current;
   }
   const resonance=rest?this.number(g.resonance,100):this.number(r.resonanceStart,100,g.resonance||0);
   const combo=this.number(rest?r.combo:r.comboStart,5);
   const upgrades={};let budget=wave-1+(this.RARE_LEVELS-1)*Math.floor(wave/this.RESPITE_EVERY);
   for(const id of Object.keys(this.cards)){
    upgrades[id]=this.number(r.upgrades?.[id],budget);budget-=upgrades[id];
   }
   out.run={active:true,rules:3,legacy:r.rules!==3||!!r.legacy,mode:r.mode==='coop'?'coop':'solo',seed:this.number(r.seed,4294967295,1)||1,wave,score:this.number(r.bankedScore,this.MAX_SCORE),bankedScore:this.number(r.bankedScore,this.MAX_SCORE),kills:this.number(r.bankedKills,this.MAX_SCORE),bankedKills:this.number(r.bankedKills,this.MAX_SCORE),completedWave:rest?wave:wave-1,hpStart,campaignPotions:this.number(r.campaignPotions,99,g.potions||0),campaignResonance:this.number(r.campaignResonance,100,g.resonance||0),resonanceStart:resonance,potionsStart:0,combo,comboStart:combo,elapsed:this.number(r.bankedElapsed,this.MAX_SCORE),bankedElapsed:this.number(r.bankedElapsed,this.MAX_SCORE),waveSeats:r.waveSeats===2?2:1,phase:rest?'rest':'fight',cursor:0,wait:0,pending:null,clean:true,knockouts:0,upgrades,respite:this.number(r.respite,wave),rare:rest&&r.rare===true,reroll:this.number(r.reroll,wave),encore:r.encore===true,_resume:!rest};
   out.run.campaignHP=Object.fromEntries(Object.keys(this.names).map(id=>[id,this.number(r.campaignHP?.[id],g.maxhp[id]||40,g.maxhp[id]||40)]));
   out.run.campaignLeader=r.campaignLeader;
   out.run.campaignFormation=Array.isArray(r.campaignFormation)?[...new Set(r.campaignFormation.filter(id=>Object.hasOwn(this.names,id)))].slice(0,3):null;
   out.run.waveStart=this.normalizeWaveStart(r.waveStart,g);
   out.run.encoreStart=r.waveStart ? r.encoreStart===true : r.encore===true;
   if(!rest){
    // Restore the whole team before checking survivability on load.
    const formation=out.run.waveStart.formation;
    if(formation.length&&!formation.some(id=>hpStart[id]>0)){
     const survivor=formation.find(id=>g.hp[id]>0)||formation[0];
     hpStart[survivor]=Math.max(1,this.number(g.hp[survivor],g.maxhp[survivor]||40));
    }
    Object.assign(g.hp,hpStart);
    if(formation.length)g.formation=formation.slice();
    if(g.formation?.includes(out.run.waveStart.leader)&&g.hp[out.run.waveStart.leader]>0)g.active=out.run.waveStart.leader;
   }
   g.potions=0;g.resonance=resonance;
  }return out;
 },

 normalizeWaveStart(start,g){
  const valid=g.formation||[];
  const unlocked=['franco','ryuchi',...(g.flags?.reveal?['alt']:[]),...(g.flags?.voicesKatana?['katana']:[]),...(g.c3?.synthUnlocked?['synth']:[]),...(g.c3?.percussionUnlocked?['percussion']:[])];
  const formation=Array.isArray(start?.formation)?[...new Set(start.formation)].filter(id=>unlocked.includes(id)).slice(0,3):valid.slice();
  const cooldowns=(values,fields)=>Object.fromEntries(fields.map(k=>[k,Math.max(0,Math.min(30,Number(values?.[k])||0))]));
  return {
   formation,leader:formation.includes(start?.leader)?start.leader:g.active,
   x:Number.isFinite(start?.x)?start.x:14.5,y:Number.isFinite(start?.y)?start.y:18.5,
   player:cooldowns(start?.player,['skill','skillX','duo','dashCD']),
   coop:cooldowns(start?.coop,['skill','advanced','signature','dashCD'])
  };
 },
 storeWaveStart(r){
  r.hpStart={...G.hp};r.resonanceStart=G.resonance;r.comboStart=r.combo;r.encoreStart=!!r.encore;
  r.waveStart=this.normalizeWaveStart({
   formation:partyMembers(),leader:G.active,x:G.x,y:G.y,player:act,coop:C3.coop
  },G);
 },
 restoreWaveStart(r){
  const start=r.waveStart;
  Object.assign(G.hp,r.hpStart);
  G.potions=0;G.resonance=r.resonanceStart;
  r.score=r.bankedScore;r.kills=r.bankedKills;r.combo=r.comboStart;r.elapsed=r.bankedElapsed;r.encore=r.encoreStart;
  if(!start)return;
  if(start.formation.length)G.formation=start.formation.slice();
  if(G.formation.includes(start.leader)&&G.hp[start.leader]>0)G.active=start.leader;
  const position=this.safe(current,start.x,start.y);
  if(position){G.x=position.x;G.y=position.y;trail=[]}
  Object.assign(act,start.player);
  Object.assign(C3.coop,start.coop);
 },
 rules(){return 'Ferimentos passam para a próxima onda. Fitas ficam fora da Fenda. A cada '+this.RESPITE_EVERY+' ondas, escolha um Respiro.'},
 resumeText(r=this.run()){return r?.phase==='rest'?'Você volta à pausa após a última onda concluída.':'Ao voltar, a onda atual recomeça com a vida, a ressonância e os pontos do início da onda.'},
 showResume(){
  const r=this.run();if(!this.active()||!r)return;
  this.hideToast();
  enterMenu10(`<div class="eyebrow">FENDA DAS RESSONÂNCIAS</div><h2>Pronto para continuar?</h2><p>${this.resumeText(r)}</p><p>${r.completedWave} ondas concluídas · ${r.bankedScore} pontos salvos</p><button class="action strong" id="postResumeRun">CONTINUAR EXPEDIÇÃO</button>`,'postgame');
  $('postResumeRun').onclick=closeOverlay;
  $('postResumeRun').focus();
 },
 suspend(){
  if(!this.active()||!this.persist())return false;
  this.hideToast();closeOverlay();
  mode='title';menuPage10=null;menuOrigin10=null;
  $('actionHUD').classList.add('hidden');$('hud').style.display='none';
  $('start').classList.remove('hidden');$('startContinue').disabled=false;$('startContinue').focus();
  return true;
 },
 confirmSuspend(back=openSystem){
  if(!this.active())return false;
  this.hideToast();
  enterMenu10(`<div class="eyebrow">FENDA DAS RESSONÂNCIAS</div><h2>Suspender expedição?</h2><p>${this.resumeText()}</p><p id="postSuspendStatus" role="status"></p><div class="row"><button class="action strong" id="postSuspendBack">VOLTAR</button><button class="action" id="postSuspendConfirm">SALVAR E IR AO MENU</button></div>`,'postgame');
  $('postSuspendBack').onclick=()=>back();
  $('postSuspendConfirm').onclick=()=>{if(!this.suspend())$('postSuspendStatus').textContent='O navegador não conseguiu salvar. Exporte uma cópia em Sistema.'};
  $('postSuspendBack').focus();return true;
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
  if(!G?.c3?.complete||!savedFormationAlive10(G)||(mode==='overlay'&&$('retryCheckpoint')))return false;if(['dialogue','rhythm','title'].includes(mode))return false;
  if(this.active()){
   const r=this.run();
   enterMenu10(`<div class="eyebrow">FENDA DAS RESSONÂNCIAS</div><h2>Expedição em andamento</h2><p>Onda ${r.wave} · ${r.bankedScore} pontos salvos</p><p>${this.resumeText(r)}</p><div class="row"><button class="action strong" id="postMapClose">VOLTAR</button><button class="action" id="postMapSuspend">SUSPENDER EXPEDIÇÃO</button><button class="action" id="postAbandon">ENCERRAR EXPEDIÇÃO</button></div>`,'postgame');
   $('postMapClose').onclick=closeOverlay;
   $('postMapSuspend').onclick=()=>this.confirmSuspend(()=>this.openTravel());
   $('postAbandon').onclick=()=>this.confirmExit(()=>this.openTravel());
   $('postMapClose').focus();return true;
  }
  const allowed=this.canTravel();
  const rows=this.chapters.map(c=>`<button class="action" data-post-area="${c.area}" ${allowed?'':'disabled'}>${c.label}<br><small>${c.name}${c.area===G.area?' · AQUI':''}</small></button>`).join('');
  enterMenu10(`<div class="eyebrow">HUTUKARA · CAMINHOS ABERTOS</div><h2>Escolha um capítulo</h2><p>${allowed?'Volte ao centro de um capítulo e continue explorando. Sua equipe, história e progresso permanecem preservados.':'Conclua o combate para atravessar outra passagem.'}</p><div class="row">${rows}</div><hr class="divider"><div class="row"><button class="action strong" id="postDungeon" ${allowed?'':'disabled'}>CALABOUÇO INFINITO</button><button class="action" id="postMapClose">VOLTAR</button></div>`,'postgame');
  document.querySelectorAll('[data-post-area]').forEach(b=>b.onclick=()=>this.travel(b.dataset.postArea));$('postDungeon').onclick=()=>this.openBriefing(()=>this.openTravel());$('postMapClose').onclick=closeOverlay;return true;
 },
 clearCombat(){this.hazard=null;battle=bossActor=null;hostileShots=[];projectiles=[];combatFX.length=0;C3.hazards=[];C3.synthZones=[];C3.finalPending=false;C3.percussionGuard=0;resetMotion10();act.slash=act.hit=act.cool=0;act.invuln=1;C3.coop.area='';$('actionHUD').classList.add('hidden')},
 complete(){
  this.clearCombat();G.c3.silenceDone=true;G.c3.complete=true;G.c3.endingPending=false;G.c3.returnHome=false;this.state();for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];
  setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);save(true);this.showEnding();
 },
 showEnding(){
  if(!G?.c3?.complete)return;const p=this.state();enterMenu10(`<div class="eyebrow">JORNADA CONCLUÍDA · O CANAL CONTINUA ABERTO</div><h2>A próxima música começa aqui</h2><p>O Silêncio deixou de decidir quando vocês podem começar. As máscaras permanecem ligadas aos caminhos de Hutukara.</p><div class="stat"><span>Capítulos concluídos</span><b>3 / 3</b></div><p>Use M ou o botão MAPA para escolher entre os três capítulos e o calabouço. Na Fenda das Ressonâncias, cada onda traz uma nova formação de inimigos e aumenta o desafio.</p><div class="stat"><span>Recorde do calabouço · neste save</span><b>SOLO ${p.records.solo.score} · CO-OP ${p.records.coop.score}</b></div>${p.legacyScore?`<p class="lore">Histórico das regras anteriores: ${p.legacyScore} pontos.</p>`:''}<div class="row"><button class="action strong" id="postEnter">ENTRAR NO CALABOUÇO</button><button class="action" id="postTravel">ESCOLHER CAPÍTULO</button><button class="action" id="postPhrase">CRIAR NOVA FRASE</button><button class="action" id="postStay">FICAR NO TORII</button><button class="action" id="postExport">EXPORTAR SAVE</button></div>`,'postgame');
  $('postEnter').onclick=()=>this.openBriefing(()=>this.showEnding());$('postTravel').onclick=()=>this.openTravel();$('postPhrase').onclick=()=>C3.openPhrase('post');$('postStay').onclick=closeOverlay;$('postExport').onclick=exportSave;$('postEnter').focus();
 },

 // Melhorias: 22 cartas em três raridades. As de instrumento só aparecem com aquele
 // personagem na equipe. Valores com rendimento decrescente: scale*nível/(nível+4).
 RARITY:{comum:{label:'COMUM',weight:6,color:'#c9b38f'},rara:{label:'RARA',weight:3,color:'#7fc4e8'},lendaria:{label:'LENDÁRIA',weight:1,color:'#f0bd5a'}},
 cards:{
  drive:{name:'Amplificador',text:'Dano de todos os golpes',scale:.65},
  ambush:{name:'Ataque de abertura',text:'Dano extra contra ecos com vida cheia',scale:1.4},
  finish:{name:'Último acorde',text:'Dano extra contra ecos com até metade da vida',scale:1.1},
  guard:{name:'Abafador de impacto',text:'Redução de dano para toda a equipe',scale:.5},
  charge:{name:'Retorno de sinal',text:'Ressonância por eliminação',scale:2,maxLevel:10},
  stagger:{name:'Compasso quebrado',text:'Duração do atordoamento dos golpes',scale:.9},
  tempo:{name:'Metrônomo acelerado',text:'Recarga mais rápida de técnicas, esquiva e super',scale:.6},
  crowd:{name:'Plateia atenta',text:'Pontos por eco e por onda',scale:.8},
  chain:{name:'Eco em cadeia',text:'Ao eliminar, dano nos ecos a até 2 casas',rarity:'rara',flat:[0,14,24,32,38,42],maxLevel:5,unit:' de dano'},
  drum:{name:'Pele de tambor',text:'Golpes anulados por onda',rarity:'rara',flat:[0,1,2,3],maxLevel:3,unit:' por onda'},
  sharp:{name:'Nota aguda',text:'Chance de golpe crítico (dano dobrado)',rarity:'rara',scale:.4},
  breath:{name:'Fôlego final',text:'Menos dano recebido abaixo de 30% da vida',rarity:'rara',scale:.7},
  counter:{name:'Contra-melodia',text:'Dano extra contra ecos ressonantes',rarity:'rara',scale:1.5},
  encore:{name:'Bis',text:'Uma vez por tentativa, quem cai volta com 30% da vida',rarity:'lendaria',maxLevel:1,flat:[0,1],unit:' retorno'},
  overdrive:{name:'Distorção',text:'+35% de dano causado e +15% de dano recebido',rarity:'lendaria',maxLevel:1,flat:[0,35],unit:'% de dano'},
  harmony:{name:'Acorde perfeito',text:'Onda sem dano enche 40 de ressonância',rarity:'lendaria',maxLevel:1,flat:[0,40],unit:' de ressonância'},
  bassHold:{name:'Grave que prende',text:'Golpes do Franco atordoam por mais tempo',rarity:'rara',hero:'franco',flat:[0,.3,.5,.65,.75],maxLevel:4,unit:' s'},
  bladeRun:{name:'Corte em sequência',text:'Dano extra dos golpes do Ryuchi',rarity:'rara',hero:'ryuchi',scale:.8},
  pierce:{name:'Flecha que atravessa',text:'Acerto do Arqueiro fere outro eco próximo',rarity:'rara',hero:'alt',scale:1},
  ink:{name:'Tinta afiada',text:'Katana: dano extra em ecos atordoados',rarity:'rara',hero:'katana',scale:1.2},
  synthWave:{name:'Onda sintética',text:'Eliminações do Sintetizador dão ressonância',rarity:'rara',hero:'synth',flat:[0,4,7,9,10],maxLevel:4,unit:' de ressonância'},
  warDrum:{name:'Tambor de guerra',text:'Golpes da Percussão ferem ecos em volta',rarity:'rara',hero:'percussion',scale:.8}
 },
 amount(id,level=0){
  const card=this.cards[id];if(!card)return 0;
  if(card.flat)return card.flat[Math.min(level,card.flat.length-1)]||0;
  const value=card.scale*level/(level+4);
  return id==='charge'?card.scale*Math.min(level,card.maxLevel):value;
 },
 level(id,run=this.run()){return run?.upgrades?.[id]||0},
 // Dano extra das cartas (atravessar, tambor, cadeia): não repete efeitos nem críticos.
 // Perigo do bioma: uma área marcada no chão perto de um jogador estoura depois de
 // HAZARD_WARN s e fere quem estiver dentro (a esquiva protege, como num golpe).
 HAZARD_EVERY:5.5,HAZARD_WARN:1.3,HAZARD_RADIUS:1.3,
 updateHazard(r,dt){
  const biome=this.biomeFor(r.wave);if(!biome.hazard)return;
  if(this.hazard){this.hazard.time=Math.max(0,this.hazard.time-dt);if(!this.hazard.time){const h=this.hazard,dmg=Math.round(5+r.wave*.25);this.hazard=null;addCombatFX(h.x,h.y,'hit',1.6);if(Math.hypot(G.x-h.x,G.y-h.y)<=h.radius&&G.hp[G.active]>0)damageHero(dmg);if(C3.coopActive()&&Math.hypot(C3.coop.x-h.x,C3.coop.y-h.y)<=h.radius)C3.damageCoop(dmg)}return}
  this.hazardClock=(this.hazardClock||0)+dt;if(this.hazardClock<this.HAZARD_EVERY)return;this.hazardClock=0;
  const actors=[G,...(C3.coopActive()?[C3.coop]:[])],who=actors[Math.floor(Math.random()*actors.length)],a=Math.random()*Math.PI*2,d=Math.random()*1.2;
  const x=who.x+Math.cos(a)*d,y=who.y+Math.sin(a)*d;if(canBody121(x,y))this.hazard={x,y,time:this.HAZARD_WARN,max:this.HAZARD_WARN,radius:this.HAZARD_RADIUS,name:biome.hazard.name,color:biome.hazard.color};
 },
 drawHazard(){const h=this.hazard;if(!h)return;const x=h.x*T-cam.x,y=h.y*T-cam.y,k=1-h.time/h.max;ctx.save();ctx.globalAlpha=.25+.35*k;ctx.fillStyle=h.color;ctx.beginPath();ctx.ellipse(x,y,h.radius*T,h.radius*T*.55,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=h.color;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(x,y,h.radius*T,h.radius*T*.55,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(x,y,h.radius*T*k,h.radius*T*.55*k,0,0,Math.PI*2);ctx.stroke();ctx.restore();this.label(h.name,x,y-h.radius*T*.55-6,h.color)},
 // Divisão: a elite vira dois ecos menores no mesmo lugar.
 split(e){const r=this.run(),profile=this.profile(r.wave,r.waveSeats);for(const k of [-1,1]){const x=e.x+k*.8,y=e.y,n={id:e.id+'_'+(k<0?'a':'b'),type:'hush',x:canBody121(x,y)?x:e.x,y,endless:true};hydrateEnemy(n);n.hp=n.max=Math.round(n.max*profile.hp*.6);n.power=Math.round(n.power*profile.power);n.cd=.8;n.aware=1;current.enemies.push(n)}engage()},
 splash(e,damage){if(this.splashing||!(damage>=1))return;this.splashing=true;try{hitEnemy(e,Math.round(damage),.1,0)}finally{this.splashing=false}},
 bonus(id,run){return this.amount(id,run?.upgrades?.[id]||0)},
 cardValue(id,level){
  const n=this.amount(id,level),card=this.cards[id];
  if(card.flat)return n?(card.unit!=='% de dano'&&card.unit!==' s'?'+':'')+String(n).replace('.',',')+card.unit:'—';
  return id==='charge'?'+'+n+' de ressonância':Number((100*n).toFixed(1)).toLocaleString('pt-BR')+'%';
 },
 offers(run){
  const team=typeof partyMembers==='function'?partyMembers():[];
  const pool=Object.keys(this.cards).filter(id=>{const c=this.cards[id];return(!c.maxLevel||(run.upgrades?.[id]||0)<c.maxLevel)&&(!c.hero||team.includes(c.hero))});
  let h=(run.seed^Math.imul(run.wave,2246822519)^0x7a0f2d03^(run.reroll===run.wave?0x5bd1e995:0))>>>0;h=Math.imul(h^h>>>16,0x85ebca6b);h=Math.imul(h^h>>>13,0xc2b2ae35);h^=h>>>16;
  // Mistura a semente (sementes vizinhas davam quase sempre a mesma primeira carta).
  const rand=this.random(h>>>0||1),out=[];for(let k=0;k<3;k++)rand();
  while(out.length<3&&pool.length){const weights=pool.map(id=>this.RARITY[this.cards[id].rarity||'comum'].weight),total=weights.reduce((a,b)=>a+b,0);let pick=rand()*total,i=0;while(i<pool.length-1&&(pick-=weights[i])>=0)i++;out.push(pool.splice(i,1)[0])}
  return out;
 },
 // Respiro: a cada RESPITE_EVERY ondas, antes da melhoria, a equipe escolhe um alívio.
 // É a única cura da Fenda (as fitas continuam desligadas).
 RESPITE_EVERY:5,RESPITE_HEAL:.3,RESPITE_REVIVE:.5,RARE_LEVELS:2,
 team(){return partyMembers().filter(id=>Object.hasOwn(this.names,id))},
 respiteDue(r=this.run()){return !!r&&r.phase==='rest'&&r.wave%this.RESPITE_EVERY===0&&r.respite!==r.wave},
 respite(kind,wave,who){
  const r=this.run();if(!this.active()||!this.respiteDue(r)||r.wave!==wave)return false;const team=this.team();
  if(kind==='heal'){for(const id of team)if(G.hp[id]>0)G.hp[id]=Math.min(G.maxhp[id],G.hp[id]+Math.ceil(G.maxhp[id]*this.RESPITE_HEAL))}
  else if(kind==='revive'){if(!team.includes(who)||G.hp[who]>0)return false;G.hp[who]=Math.ceil(G.maxhp[who]*this.RESPITE_REVIVE);if(!G.hp[G.active])G.active=who}
  else if(kind==='rare')r.rare=true;else return false;
  r.respite=r.wave;save(true);updateHUD();this.showDraft();return true;
 },
 showRespite(r){
  const team=this.team(),down=team.filter(id=>!(G.hp[id]>0)),hurt=team.some(id=>G.hp[id]>0&&G.hp[id]<G.maxhp[id]),life=team.map(id=>`<span style="white-space:nowrap">${this.names[id]} <b>${Math.max(0,G.hp[id]|0)}/${G.maxhp[id]}</b></span>`).join(' &nbsp;|&nbsp; ');
  const option=(kind,title,text,extra='',disabled=false)=>`<button type="button" class="action" style="min-height:44px" data-respite="${kind}" ${extra} ${disabled?'disabled':''}><b>${title}</b><br><small>${text}</small></button>`;
  const revive=down.length?down.map(id=>option('revive','Reerguer · '+this.names[id],`Volta com ${Math.ceil(G.maxhp[id]*this.RESPITE_REVIVE)} PV`,`data-who="${id}"`)).join(''):option('revive','Reerguer','Ninguém caiu','',true);
  const healing=team.filter(id=>G.hp[id]>0&&G.hp[id]<G.maxhp[id]).map(id=>{
   const next=Math.min(G.maxhp[id],G.hp[id]+Math.ceil(G.maxhp[id]*this.RESPITE_HEAL));
   return `${this.names[id]}: ${G.hp[id]} → ${next} PV`;
  }).join(' · ');
  enterMenu10(`<div class="eyebrow">FENDA · ONDA ${r.wave} CONCLUÍDA · RESPIRO</div><h2>Um momento para respirar</h2><p>${life}</p><div class="row">${option('heal','Recompor',healing||'Equipe com vida cheia','',!hurt)}${revive}${option('rare','Sintonia rara','A melhoria desta pausa sobe '+this.RARE_LEVELS+' níveis')}</div><button class="action" id="postSuspendDraft">Suspender</button><button class="action" id="postLeaveDraft">Encerrar expedição</button>`,'postgame');
  const wave=r.wave,buttons=[...document.querySelectorAll('[data-respite]')];
  for(const b of buttons)b.onclick=()=>this.respite(b.dataset.respite,wave,b.dataset.who);
  $('postLeaveDraft').onclick=()=>this.confirmExit(()=>this.showDraft());$('postSuspendDraft').onclick=()=>this.confirmSuspend(()=>this.showDraft());buttons.find(b=>!b.disabled)?.focus();
 },
 showDraft(){
  const r=this.run();if(!this.active()||r.phase!=='rest'||typeof document==='undefined')return;
  // O resultado da onda fica dentro do painel: um aviso solto ficaria por cima das cartas.
  this.hideToast();if(this.respiteDue(r))return this.showRespite(r);
  const step=r.rare?this.RARE_LEVELS:1;
  const rows=this.offers(r).map(id=>{
   const card=this.cards[id],now=r.upgrades[id]||0,level=Math.min(card.maxLevel||Infinity,now+step),rarity=this.RARITY[card.rarity||'comum'];
   return `<button type="button" class="action" style="min-height:44px;border-color:${rarity.color}" data-echo-card="${id}" data-rarity="${card.rarity||'comum'}"><small style="color:${rarity.color}">${rarity.label}${card.hero?' · '+this.names[card.hero].toUpperCase():''}</small><br><b>${card.name} · Nv. ${level}</b><br><small>${card.text}<br>${this.cardValue(id,now)} → ${this.cardValue(id,level)}</small></button>`;
  }).join('');
  const skip=this.skipValue(r),extra=`<div class="row"><button type="button" class="action" id="postReroll" ${r.reroll?'disabled':''}>${r.reroll?'Troca já usada':'Trocar opções · 1 por tentativa'}</button><button type="button" class="action" id="postSkip">Pular · +${skip} pts</button></div>`;
  const result=r.lastWave&&r.lastWave.wave===r.wave?` · +${r.lastWave.bonus} PTS${r.lastWave.clean?' · SEM DANO':''} · TOTAL ${r.score}`:'';
  enterMenu10(`<div class="eyebrow">FENDA · ONDA ${r.wave} CONCLUÍDA${result}</div><h2>${r.rare?'Sintonia rara · +'+step+' níveis':'Escolha uma melhoria'}</h2><p>Vale para toda a equipe até o fim desta tentativa. A vida perdida não volta.</p><div class="row">${rows}</div>${extra}<button class="action" id="postSuspendDraft">Suspender</button><button class="action" id="postLeaveDraft">Encerrar expedição</button>`,'postgame');
  const wave=r.wave,buttons=document.querySelectorAll('[data-echo-card]');
  for(const b of buttons)b.onclick=()=>this.choose(b.dataset.echoCard,wave);
  $('postReroll').onclick=()=>this.reroll(wave);$('postSkip').onclick=()=>this.skip(wave);
  $('postLeaveDraft').onclick=()=>this.confirmExit(()=>this.showDraft());$('postSuspendDraft').onclick=()=>this.confirmSuspend(()=>this.showDraft());buttons[0]?.focus();
 },
 persist(){
  this.markMode();
  try{localStorage.setItem(KEY,JSON.stringify(G));return true}
  catch{return false}
 },
 hideToast(){if(typeof ToriiInterface6!=='undefined')return ToriiInterface6.Toasts.clear();if(typeof toastTimeout!=='undefined'&&toastTimeout)clearTimeout(toastTimeout);$('toast')?.classList.add('hidden')},
 // Encerrar apaga a tentativa: sempre pede confirmação. O foco começa em CONTINUAR,
 // para que um toque ou botão A repetido não encerre a expedição sem querer.
 confirmExit(back=closeOverlay){
  if(!this.active())return false;if(typeof document==='undefined')return this.finishRun('exit');
  const r=this.run();this.hideToast();
  enterMenu10(`<div class="eyebrow">FENDA · ${r.score} PTS · ${r.completedWave} ${r.completedWave===1?'ONDA':'ONDAS'}</div><h2>Encerrar a expedição?</h2><p>Não dá para retomar. Os pontos vão para o placar e a equipe volta ao Torii como estava na campanha.</p><div class="row"><button class="action strong" id="postExitBack">CONTINUAR NA FENDA</button><button class="action" id="postExitConfirm">ENCERRAR EXPEDIÇÃO</button></div>`,'postgame');
  $('postExitBack').onclick=()=>back();$('postExitConfirm').onclick=()=>this.finishRun('exit');$('postExitBack').focus();return true;
 },
 // A escolha aparece a cada DRAFT_EVERY ondas e em toda pausa de respiro. Nas outras,
 // a equipe respira BREATH segundos e a próxima onda começa sozinha.
 DRAFT_EVERY:2,BREATH:1.6,
 draftDue(r=this.run()){return !!r&&r.phase==='rest'&&(r.wave%this.DRAFT_EVERY===0||r.wave%this.RESPITE_EVERY===0)},
 skipValue(r){return Math.round((100+40*r.wave)*(1+this.bonus('crowd',r)))},
 next(){const r=this.run();r.rare=false;r.phase='fight';closeOverlay();r.wave=Math.min(this.MAX_WAVE,r.wave+1);this.beginWave();return true},
 reroll(wave){const r=this.run();if(!this.active()||r.phase!=='rest'||r.wave!==wave||r.reroll||!this.draftDue(r)||this.respiteDue(r))return false;r.reroll=wave;save(true);this.showDraft();return true},
 skip(wave){const r=this.run();if(!this.active()||r.phase!=='rest'||r.wave!==wave||!this.draftDue(r)||this.respiteDue(r))return false;r.score=Math.min(this.MAX_SCORE,r.score+this.skipValue(r));r.bankedScore=r.score;this.best();return this.next()},
 choose(id,wave){
  const r=this.run();if(!this.active()||r.phase!=='rest'||r.wave!==wave||this.respiteDue(r)||!this.offers(r).includes(id))return false;
  const max=this.cards[id].maxLevel||Infinity;r.upgrades[id]=Math.min(max,(r.upgrades[id]||0)+(r.rare?this.RARE_LEVELS:1));r.rare=false;r.phase='fight';
  closeOverlay();r.wave=Math.min(this.MAX_WAVE,r.wave+1);this.beginWave();return true;
 },
 // Força do instrumento (só na Fenda): todos recebem o mesmo dano, e quem sobrevive menos
 // compensa batendo mais forte. Quem luta colado no eco (Katana, Sintetizador, Percussão)
 // recebia de 2 a 4 vezes mais dano por onda que o Arqueiro. Ajustada com o robô de equilíbrio.
 heroPower:{franco:1,ryuchi:1.6,alt:1.3,katana:3.5,synth:2.3,percussion:1.6},
 power(who){return this.heroPower[who]??1},
 // Quem desferiu o golpe: o líder, ou o jogador 2 durante as ações dele.
 attackerId(){const source=typeof HeroAttackFX!=='undefined'?HeroAttackFX.externalSource:null;return this.attacker||(this.names[source]?source:null)||G.active},
 incoming(amount,who){
  if(!this.active()||amount<=0)return amount;const r=this.run();
  // Pele de tambor: anula os primeiros golpes de cada onda.
  if(r.drum>0){r.drum--;return 0}
  let factor=(1-this.bonus('guard',r))*(this.level('overdrive',r)?1.15:1);
  if(who&&G.hp[who]>0&&G.hp[who]<G.maxhp[who]*.3)factor*=1-this.bonus('breath',r);
  return Math.max(1,Math.round(amount*factor));
 },
 CURVE:.95,
 profile(wave,seats=1){
  // Uma única curva de dificuldade para solo e co-op. Antes o co-op subia 25% mais rápido
  // (0,90 por onda contra 0,72) e, com a mesma dupla, chegava a 30% menos ondas que o solo.
  // Agora o segundo jogador é compensado por um fator fixo: 50% mais ecos, um a mais vivo,
  // grupos maiores e 20% mais vida. Medido com o robô de equilíbrio (qa/dungeon_equilibrio.cjs).
  const w=Math.max(1,wave),phase=(w-1)%5,names=['Pulso','Contratempo','Interferência','Ressonância','Crescendo'],intensity=(w-1)*this.CURVE,coop=seats===2;
  // Curva: a onda 1 já traz 4 ecos em grupo, e o aperto chega entre as ondas 12 e 18
  // (antes começava com 3 ecos, um por vez, e o pico ficava entre a 20 e a 30).
  return {name:names[phase],count:Math.min(coop?20:15,Math.ceil((4+Math.floor(intensity*.55))*(coop?1.5:1))),alive:Math.min(coop?7:6,(coop?4:3)+Math.floor(intensity/5)),group:Math.min(coop?5:4,2+Math.floor(intensity/3)+(coop?1:0)),cadence:coop?1.05:1.25,warning:.95,hp:(1+.018*intensity+.20*Math.log2(1+intensity/5))*(coop?1.2:1),power:Math.min(3.25,1+.025*intensity)};
 },
 record(mode){return this.state().records[mode==='coop'?'coop':'solo']},
 multiplier(r=this.run()){return 1+Math.min(5,r?.combo||0)*.1},
 killValue(type,wave,elite=false){const base={boss:900,hush:50,whisper:60,compasso:90,espelho:100,abafador:120,c3_drone:80,c3_echo:110}[type]||50;return Math.round(base*(1+.06*(wave-1))*(elite?1.5:1))},
 waveValue(r){const base=150+50*r.wave+(r.wave%5===0?250*Math.floor(r.wave/5):0);return Math.round(base*this.multiplier(r)*(r.clean?1.25:1)*(1+this.bonus('crowd',r)))},
 markMode(){if(this.active()&&C3.coopActive())this.run().mode='coop'},
 damageSnapshot(){this.markMode();return Object.fromEntries(Object.keys(this.names).map(id=>[id,G.hp[id]||0]))},
 observeDamage(before){
  const r=this.run();if(!this.active()||!r||r.phase!=='fight')return;
  for(const id of Object.keys(before))if((G.hp[id]||0)<before[id]){
   r.clean=false;if(before[id]>0&&G.hp[id]<=0){r.knockouts++;if(this.level('encore',r)&&!r.encore){r.encore=true;G.hp[id]=Math.ceil(G.maxhp[id]*.3);toast('BIS · '+this.names[id].toUpperCase()+' VOLTA AO PALCO')}}
  }
 },
 random(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}},
 wavePlan(seed,wave,seats=1){
  const rand=this.random((seed^Math.imul(wave,2654435761))>>>0),profile=this.profile(wave,seats),pool=['hush','whisper'];
  if(wave>=3)pool.push('compasso');if(wave>=4)pool.push('c3_drone');if(wave>=6)pool.push('espelho');if(wave>=8)pool.push('c3_echo');if(wave>=10)pool.push('abafador');
  const preferred=[['hush','compasso'],['hush','c3_echo'],['whisper','c3_drone'],['compasso','abafador'],pool][(wave-1)%5].filter(t=>pool.includes(t)),deck=[...pool,...preferred,...preferred];let controllers=0;
  return Array.from({length:profile.count},(_,i)=>{let type=deck[Math.floor(rand()*deck.length)];if(i===0)type=preferred[0]||'hush';if(i===1)type=({3:'compasso',4:'c3_drone',6:'espelho',8:'c3_echo',10:'abafador'})[wave]||pool[(wave+(seed>>>0))%pool.length];if(type==='abafador'&&controllers++)type='hush';return {type,x:3.5+Math.floor(rand()*21),y:4.5+Math.floor(rand()*13),elite:wave%5===0&&i===profile.count-1}});
 },

 // Biomas: a cada BIOME_EVERY ondas a arena troca de piso, obstáculos e perigo,
 // reaproveitando a arte dos capítulos. O arranjo dos obstáculos sai da semente.
 BIOME_EVERY:10,
 biomes:[
  {id:'fenda',name:'Fenda',floor:'c3_voidfloor',obstacle:(a,x,y)=>prop(a,'env2_prop',x,y,{item:'core_column_left',w:30,h:88}),hazard:null},
  {id:'floresta',name:'Floresta do Silêncio',floor:'forest',obstacle:(a,x,y)=>prop(a,'tree',x,y),hazard:{name:'RAÍZES',color:'#8fd16a'}},
  {id:'cidade',name:'Cidade das Vozes',floor:'wetstone',obstacle:(a,x,y,i)=>prop(a,i%2?'stall':'lamp',x,y),hazard:{name:'ESTÁTICA',color:'#7fd0f0'}},
  {id:'usina',name:'Usina',floor:'c3_factory',obstacle:(a,x,y)=>prop(a,'c3_machine',x,y),hazard:{name:'VAPOR',color:'#f0a46a'}}
 ],
 // Arranjos de obstáculos na arena 28×23 (o centro e o ponto de partida ficam livres).
 layouts:[
  [[6,6],[21,6],[6,15],[21,15]],
  [[5,9],[8,9],[19,9],[22,9],[5,13],[22,13]],
  [[9,5],[18,5],[5,11],[22,11],[9,16],[18,16]],
  [[4,5],[11,7],[17,6],[23,9],[6,14],[20,15]]
 ],
 biomeFor(wave){return this.biomes[Math.floor((Math.max(1,wave)-1)/this.BIOME_EVERY)%this.biomes.length]},
 layoutFor(r){const block=Math.floor((Math.max(1,r?.wave||1)-1)/this.BIOME_EVERY);return this.layouts[((r?.seed>>>0||0)+block*3)%this.layouts.length]},
 buildArena(){
  const r=this.run(),biome=this.biomeFor(r?.wave||1),a=C3.room(this.AREA,28,23,biome.floor);this.arenaKey=biome.id+':'+this.layouts.indexOf(this.layoutFor(r));
  for(const [x,y]of [[2,2],[25,2]]){solid(a,x,y);prop(a,'env2_prop',x,y,{item:'core_column_left',w:30,h:88})}prop(a,'env2_prop',13,10,{item:'resonance_circle_on',w:100,h:70,flat:true});
  // A Fenda (primeiro bioma) fica aberta; os obstáculos começam na Floresta.
  if(r&&biome.id!=='fenda')this.layoutFor(r).forEach(([x,y],i)=>{solid(a,x,y);biome.obstacle(a,x,y,i)});
  // Sem ponto de saída na arena: encostar nele no meio da luta encerrava a tentativa.
  // Para sair: painel entre ondas, M (viagens) ou menu do sistema, sempre com confirmação.
  return a;
 },
 openBriefing(back=closeOverlay){
  if(!this.canTravel())return false;
  enterMenu10(`<div class="eyebrow">PÓS-JOGO</div><h2>Fenda das Ressonâncias</h2><p>${this.rules()}</p><p>${this.resumeText({phase:'fight'})}</p><div class="row"><button class="action strong" id="postBeginRun">INICIAR EXPEDIÇÃO</button><button class="action" id="postBriefingBack">VOLTAR</button></div>`,'postgame');
  $('postBeginRun').onclick=()=>this.startDungeon();$('postBriefingBack').onclick=()=>back();$('postBeginRun').focus();
  return true;
 },
 startDungeon(seed){
  if(!this.canTravel())return false;
  const campaignHP={...G.hp},campaignLeader=G.active,campaignFormation=partyMembers().slice();
  closeOverlay();G.chapter=3;this.clearCombat();for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);
  // A fresh expedition starts with both seats' actions available.
  Object.assign(act,{skill:0,skillX:0,duo:0,dashCD:0});
  Object.assign(C3.coop,{skill:0,advanced:0,signature:0,dash:0,dashCD:0,cool:0});
  const p=this.state(),value=Number.isFinite(seed)?seed>>>0:((typeof ToriiSorte!=='undefined'&&ToriiSorte.fixa()?0:Date.now())^Math.floor(Math.random()*4294967295))>>>0,seats=C3.coopActive()?2:1,campaignPotions=G.potions||0,campaignResonance=G.resonance||0;G.potions=0;G.resonance=100;
  p.run={active:true,campaignHP,campaignLeader,campaignFormation,upgrades:{},rules:3,legacy:false,mode:seats===2?'coop':'solo',seed:value||1,wave:1,score:0,bankedScore:0,kills:0,bankedKills:0,completedWave:0,hpStart:{...G.hp},campaignPotions,campaignResonance,resonanceStart:100,potionsStart:G.potions,combo:0,comboStart:0,elapsed:0,bankedElapsed:0,waveSeats:seats,phase:'fight',cursor:0,wait:0,pending:null,clean:true,knockouts:0,_resume:true};
  this.buildArena();setArea(this.AREA,14.5,18.5,false);toast(this.rules());return true;
 },

 // Mini-chefe a cada MINIBOSS_EVERY ondas: ecos dos chefes da campanha, com a mesma
 // coreografia. A queda é tratada pela Fenda (sem história, bandeiras nem XP), e a onda
 // traz metade dos ecos comuns. Elites (ondas múltiplas de 5) ganham um modificador visível.
 MINIBOSS_EVERY:10,
 bosses:[{id:'boss',name:'Eco do Viajante Mascarado',hp:255,power:10,cd:1.45},{id:'voice_boss',name:'Eco da Voz',hp:310,power:11,cd:1.5}],
 mods:{escudo:{name:'Escudo',text:'anula os 3 primeiros golpes'},frenetico:{name:'Frenético',text:'ataca mais rápido'},divisao:{name:'Divisão',text:'divide-se em dois ao cair'}},
 bossWave(wave){return wave>0&&wave%this.MINIBOSS_EVERY===0},
 bossFor(wave){return this.bosses[(Math.floor(wave/this.MINIBOSS_EVERY)-1)%this.bosses.length]},
 eliteMod(r){const keys=Object.keys(this.mods);return keys[((r.seed>>>0)+r.wave*7)%keys.length]},
 spawnBoss(r){
  const b=this.bossFor(r.wave),profile=this.profile(r.wave,r.waveSeats),scale=profile.hp*(1+r.wave/40);
  const y=Math.max(4.5,G.y-6);bossActor={id:b.id,kind:'boss',type:'boss',x:14.5,y,hp:Math.round(b.hp*scale),max:Math.round(b.hp*scale),power:Math.round(b.power*Math.min(1.6,profile.power)),cd:b.cd,wind:0,windKind:'ring',stun:0,flash:0,phase:1,facing:Math.PI/2,chargeX:0,chargeY:0,endless:true,endlessBoss:true,endlessName:b.name};
  battle={boss:true,id:b.id};mode='action';$('actionHUD')?.classList.remove('hidden');addCombatFX(bossActor.x,bossActor.y,'spawn',4);
 },
 bossDown(){const x=bossActor.x,y=bossActor.y;hostileShots=[];bossActor=null;battle=current.enemies.some(e=>e.hp>0)?battle:null;addCombatFX(x,y,'duo',5);screenShake=.5;toast('MINI-CHEFE VENCIDO');updateHUD()},
 beginWave(resuming=false){
  const r=this.run();if(!r?.active||G.area!==this.AREA)return;this.clearCombat();current.enemies=[];G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'));
  if(resuming)this.restoreWaveStart(r);
  if(!G.hp[G.active])G.active=partyMembers().find(id=>G.hp[id]>0)||partyMembers()[0];r.waveSeats=C3.coopActive()?2:1;if(r.waveSeats===2)r.mode='coop';r.phase='fight';r.cursor=0;r.wait=0;r.pending=null;r.drum=this.amount('drum',this.level('drum',r));r.clean=true;r.knockouts=0;r._resume=false;this.plan=this.wavePlan(r.seed,r.wave,r.waveSeats);this.spawnClock=0;
  if(typeof EnemyArtV1!=='undefined')for(const spec of this.plan){const image=EnemyArtV1.image(EnemyArtV1.key(spec.type,spec));image?.decode?.().catch(()=>{})}
  const biome=this.biomeFor(r.wave);if(typeof C3.room==='function'&&this.arenaKey!==biome.id+':'+this.layouts.indexOf(this.layoutFor(r))){this.buildArena();setArea(this.AREA,14.5,18.5,false);if(!resuming)toast('NOVO BIOMA · '+biome.name.toUpperCase()+(biome.hazard?' · CUIDADO COM '+biome.hazard.name:''))}
  this.hazard=null;this.hazardClock=0;
  if(this.bossWave(r.wave)){this.plan=this.plan.slice(0,Math.ceil(this.plan.length/2));this.spawnBoss(r)}
  if(C3.coopActive())C3.syncCoop(true);
  if(!resuming||!r.waveStart)this.storeWaveStart(r);
  this.spawn();this.persist();updateHUD();const boss=this.bossWave(r.wave)&&this.bossFor(r.wave);toast('ONDA '+r.wave+' · '+(boss?'MINI-CHEFE · '+boss.name:this.profile(r.wave,r.waveSeats).name.toUpperCase()+(r.wave%5===0?' · ECO RESSONANTE · '+this.mods[this.eliteMod(r)].name.toUpperCase():'')));
 },

 // Avisos de surgimento em andamento. Aceita o formato antigo (um único objeto).
 warnings(r=this.run()){const p=r?.pending;return Array.isArray(p)?p:p?[p]:[]},
 // Lugar válido para um aviso: visível, longe dos jogadores (mas não longe demais),
 // chão livre e sem colar em inimigos ou em outros avisos.
 spawnSpot(x,y,taken=[]){const actors=[G,...(C3.coopActive()?[C3.coop]:[])];return this.warningVisible(x,y)&&actors.every(a=>Math.hypot(a.x-x,a.y-y)>=4)&&actors.some(a=>Math.hypot(a.x-x,a.y-y)<=11)&&canBody121(x,y)&&current.enemies.every(e=>e.hp<=0||Math.hypot(e.x-x,e.y-y)>1.2)&&taken.every(t=>Math.hypot(t.x-x,t.y-y)>1.2)},
 randomSpot(rand,taken=[]){for(let n=0;n<100;n++){const x=3.5+Math.floor(rand()*21),y=3.5+Math.floor(rand()*15);if(this.spawnSpot(x,y,taken))return{x,y}}return null},
 // Os ecos chegam em grupos de 2 a 4 (5 no co-op), numa formação sorteada pela semente:
 // cerco em volta de um jogador, linha de um lado ou pinça pelos dois lados.
 spawn(){
  const r=this.run(),profile=r&&this.profile(r.wave,r.waveSeats);if(!r||this.warnings(r).length||r.cursor>=this.plan.length)return false;
  const alive=current.enemies.filter(e=>e.hp>0).length,left=this.plan.length-r.cursor,room=profile.alive-alive,size=Math.min(profile.group,left,room);
  // Espera abrir espaço para o grupo inteiro; só manda um grupo menor com a arena vazia.
  if(size<=0||size<Math.min(profile.group,left)&&alive>0)return false;
  const rand=this.random((r.seed+Math.imul(r.wave,97)+Math.imul(r.cursor,131))>>>0),actors=[G,...(C3.coopActive()?[C3.coop]:[])],anchor=actors[Math.floor(rand()*actors.length)];
  const shape=['cerco','linha','pinca'][Math.floor(rand()*3)],angle=rand()*Math.PI*2,dist=5+rand()*2,list=[];
  for(let i=0;i<size;i++){
   const a=shape==='cerco'?angle+i*2*Math.PI/size:shape==='pinca'?angle+(i%2?Math.PI:0):angle,off=shape==='linha'?(i-(size-1)/2)*1.6:shape==='pinca'?(Math.floor(i/2)-(Math.ceil(size/2)-1)/2)*1.5:0;
   const x=Math.round((anchor.x+Math.cos(a)*dist-Math.sin(a)*off)*2)/2,y=Math.round((anchor.y+Math.sin(a)*dist+Math.cos(a)*off)*2)/2;
   const pos=this.spawnSpot(x,y,list)?{x,y}:this.randomSpot(rand,list);if(!pos)break;
   list.push({...pos,index:r.cursor+list.length,time:profile.warning+.12*list.length,max:profile.warning+.12*list.length});
  }
  if(!list.length)return false;r.cursor+=list.length;r.pending=list;r.formation=shape;return true;
 },
 materialize(p){
  const r=this.run();if(!r)return;if(!p){for(const w of this.warnings(r).filter(w=>w.time<=0))this.materialize(w);return}
  const actors=[G,...(C3.coopActive()?[C3.coop]:[])],others=this.warnings(r).filter(w=>w!==p);
  // Um jogador em cima do aviso (ou o aviso fora da tela) muda o eco de lugar, sem perdê-lo.
  if(!this.warningVisible(p.x,p.y)||actors.some(a=>Math.hypot(a.x-p.x,a.y-p.y)<2.5)){const pos=this.randomSpot(this.random((r.seed+p.index*7919+Math.floor(r.elapsed*10))>>>0),others);if(pos){Object.assign(p,pos);p.time=p.max}return}
  const spec=this.plan[p.index];if(!spec){r.pending=others.length?others:null;return}
  const profile=this.profile(r.wave,r.waveSeats),e={id:'endless_'+p.index,type:spec.type,x:p.x,y:p.y,endless:true,endlessElite:!!spec.elite};hydrateEnemy(e);e.hp=e.max=Math.min(2000000,Math.round(e.max*profile.hp*(spec.elite?1.4:1)));e.power=Math.min(Math.round(e.power*profile.power*(spec.elite?1.08:1)),Math.max(e.power,Math.ceil(Math.min(...partyMembers().map(id=>G.maxhp[id]||40))*.32)));if(spec.elite){e.endlessMod=this.eliteMod(r);if(e.endlessMod==='escudo')e.endlessShield=3}e.cd=1;e.aware=1;current.enemies.push(e);r.cursor=Math.max(r.cursor,p.index+1);r.pending=others.length?others:null;engage();updateHUD();
 },

 update(dt){
  if(!this.active()||!['walk','action'].includes(mode))return;const r=this.run();
  if(r.phase==='rest'){if(this.draftDue(r))this.showDraft();else{r.wait=(r.wait||0)+dt;if(r.wait>=this.BREATH)this.next()}return}
  if(r._resume){this.beginWave(true);return}
  if(C3.coopActive())r.mode='coop';
  r.elapsed=Math.min(this.MAX_SCORE,r.elapsed+dt);
  this.updateHazard(r,dt);
  for(const e of current.enemies)if(e.endlessMod==='frenetico'&&e.hp>0&&e.cd>0)e.cd=Math.max(0,e.cd-dt*.6);
  const quick=this.bonus('tempo',r)*dt;if(quick>0){for(const k of ['skill','skillX','duo','dashCD','advanced'])if(act[k]>0)act[k]=Math.max(0,act[k]-quick);if(C3.coop)for(const k of ['skill','advanced','signature','dashCD'])if(C3.coop[k]>0)C3.coop[k]=Math.max(0,C3.coop[k]-quick)}
  // A disconnected/KO partner never leaves a solo player with the larger queue.
  if(r.waveSeats===2&&!C3.coopActive()){r.waveSeats=1;const count=this.profile(r.wave,1).count;this.plan.length=Math.max(r.cursor,Math.min(this.plan.length,count));}
  for(const w of this.warnings(r))w.time=Math.max(0,w.time-dt);if(this.warnings(r).some(w=>!w.time))this.materialize();
  // O próximo grupo vem um compasso depois do anterior terminar de nascer.
  if(this.warnings(r).length)this.spawnClock=0;else{this.spawnClock+=dt;if(this.spawnClock>=this.profile(r.wave,r.waveSeats).cadence){this.spawnClock=0;this.spawn()}}
  if(!bossActor&&!this.warnings(r).length&&r.cursor>=this.plan.length&&current.enemies.every(e=>e.hp<=0)){
   const bonus=this.waveValue(r);r.score=Math.min(this.MAX_SCORE,r.score+bonus);r.combo=r.knockouts?Math.max(0,r.combo-2):Math.min(5,r.combo+1);r.bankedScore=r.score;r.bankedKills=r.kills;r.bankedElapsed=r.elapsed;r.completedWave=r.wave;r.phase='rest';r.lastWave={wave:r.wave,bonus,clean:r.clean};if(r.clean&&this.level('harmony',r))G.resonance=Math.min(100,G.resonance+this.amount('harmony',1));r.wait=0;battle=null;mode='walk';this.clearCombat();this.best();save(true);updateHUD();if(this.draftDue(r))this.showDraft();else toast('ONDA '+r.wave+' · +'+bonus+' PTS'+(r.clean?' · SEM DANO':'')+' · TOTAL '+r.score);
  }
 },

 best(){const p=this.state(),r=p.run;if(r){if(C3.coopActive())r.mode='coop';if(r.legacy)p.legacyScore=Math.max(p.legacyScore,r.score);p.bestScore=Math.max(p.bestScore,r.score);p.bestWave=Math.max(p.bestWave,r.completedWave);if(!r.legacy){const board=this.record(r.mode);board.score=Math.max(board.score,r.score);board.wave=Math.max(board.wave,r.completedWave)}} },

 finishRun(reason='exit'){
  if(!this.active())return false;const p=this.state(),r=p.run;this.best();p.lastRun={score:r.score,wave:r.completedWave,kills:r.kills,seed:r.seed,reason:reason==='defeat'?'defeat':'exit',mode:r.mode,legacy:r.legacy,rules:3,elapsed:Math.floor(r.elapsed)};G.potions=r.campaignPotions;G.resonance=r.campaignResonance;p.run=null;this.plan=[];this.clearCombat();G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'));
  for(const id of C3.unlockedRoster())G.hp[id]=r.campaignHP?.[id]??G.maxhp[id];
  if(r.campaignFormation?.length)G.formation=r.campaignFormation;
  if(r.campaignLeader&&partyMembers().includes(r.campaignLeader)&&G.hp[r.campaignLeader]>0)G.active=r.campaignLeader;
  else if(!G.hp[G.active])G.active=partyMembers().find(id=>G.hp[id]>0)||G.active;

  setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);save(true);const last=p.lastRun;
  enterMenu10(`<div class="eyebrow">${reason==='defeat'?'A EXPEDIÇÃO TERMINOU':'EXPEDIÇÃO ENCERRADA'}</div><h2>${last.score} pontos</h2><div class="stat"><span>Ondas concluídas</span><b>${last.wave}</b></div><div class="stat"><span>Inimigos vencidos</span><b>${last.kills}</b></div><div class="stat"><span>Recorde ${last.mode==='coop'?'CO-OP':'SOLO'} · regras novas</span><b>${this.record(last.mode).score}</b></div><p>${last.legacy?'Partida migrada: pontuação preservada no histórico. ' : ''}Tempo de combate: ${Math.floor(last.elapsed/60)}min ${last.elapsed%60}s.</p><p>A campanha e os aliados continuam preservados. Cada nova tentativa recebe outra semente.</p><div class="row"><button class="action strong" id="postRunAgain">NOVA TENTATIVA</button><button class="action" id="postRunMap">VIAGENS</button><button class="action" id="postRunClose">FICAR NO TORII</button></div>`,'postgame');
  $('postRunAgain').onclick=()=>this.startDungeon();$('postRunMap').onclick=()=>this.openTravel();$('postRunClose').onclick=closeOverlay;return true;
 },

 mobileHUD(){
  if(typeof Input121==='undefined'||!Input121.mobile||!this.active())return;const r=this.run(),left=this.remaining(r),score=r.score>=1000000?(r.score/1000000).toFixed(1)+'mi':r.score>=10000?(r.score/1000).toFixed(1)+'mil':String(r.score),label='ONDA '+r.wave+' · '+(r.phase==='rest'?'PAUSA':left+' RESTANTES')+' · '+score+' PTS';
  for(const id of ['quest','questText','mobileObjective','mobileGoal121'])if($(id))$(id).textContent=label;
 },
 // Rótulos no mapa: 12 px com contorno escuro, legíveis sobre qualquer piso.
 label(text,x,y,color){ctx.save();ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#120f1c';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore()},
 warningVisible(x,y){
  const sx=x*T-cam.x,sy=y*T-cam.y;if(sx<28||sx>VW-28||sy<38||sy>VH-28)return false;
  if(sx<190&&sy<155||sx>VW-115&&sy<80||sy>VH-105&&(sx<165||sx>VW-200))return false;return true;
 },
 drawWarnings(){
  if(!this.active())return;this.drawHazard();for(const p of this.warnings())this.drawWarning(p);
 },
 drawWarning(p){
  const x=p.x*T-cam.x,y=p.y*T-cam.y,spec=this.plan[p.index];ctx.save();ctx.strokeStyle=spec?.elite?'#d6a56c':'#c4c7b0';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.ellipse(x,y,18,10,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);PostGame.label(spec?.elite?'RESSONANTE':'ECO',x,y-16,spec?.elite?'#f3c98a':'#f0ddba');ctx.restore();
 },
 remaining(r=this.run()){return Math.max(0,this.plan.length-r.cursor)+this.warnings(r).length+(bossActor?.endlessBoss&&bossActor.hp>0?1:0)+current.enemies.filter(e=>e.hp>0).length},
 hud(){if(!G)return;if(this.active()){const r=this.run(),left=this.remaining(r);$('quest').textContent='ONDA '+r.wave+' · '+(r.phase==='rest'?'Pausa entre ondas':left+' inimigos restantes');$('questHint').textContent=r.score+' PTS · SEM DANO ×'+this.multiplier(r).toFixed(1)+' · '+this.biomeFor(r.wave).name+' · M: encerrar';$('bMap').textContent='EXPEDIÇÃO [M]'}else if(G.c3?.complete){$('quest').textContent='Hutukara continua aberto.';$('questHint').textContent='M: escolher um capítulo ou entrar no calabouço infinito.';$('bMap').textContent='CAPÍTULOS [M]'}else $('bMap').textContent='MAPA [M]';if(G.c3?.complete){if($('mobileObjective'))$('mobileObjective').textContent=$('quest').textContent;if($('guideChip'))$('guideChip').textContent=$('questHint').textContent}this.mobileHUD()}
};
C3.AREAS.push(PostGame.AREA);C3.COMBAT_AREAS.push(PostGame.AREA);combatAreas10.add(PostGame.AREA);C3.labels[PostGame.AREA]=['FENDA DAS RESSONÂNCIAS','CALABOUÇO INFINITO'];
const postFresh=fresh;fresh=function(...args){const g=postFresh(...args);g.postgame=PostGame.defaults();return g};
const postNormalize=normalizeSave;normalizeSave=function(raw){const source=raw?.progress||raw;if(source?.area===PostGame.AREA&&!areas[PostGame.AREA])PostGame.buildArena();const g=postNormalize(raw);if(!g)return g;g.postgame=PostGame.normalize(source?.postgame,g);if(g.area===PostGame.AREA&&!g.postgame.run){g.area=g.c3.started?'last_torii':'studio';g.x=g.c3.started?13.5:12.5;g.y=g.c3.started?13.5:10.5}return g};
const postBuild=buildMaps;buildMaps=function(...args){const r=postBuild(...args);PostGame.syncReserves(true);if(G?.postgame?.run?.active)PostGame.buildArena();return r};
const postArea=setArea;setArea=function(id,...args){if(id==='last_torii')PostGame.syncReserves(true);if(id===PostGame.AREA&&!areas[id])PostGame.buildArena();const r=postArea(id,...args);if(id===PostGame.AREA&&PostGame.run()?._resume)PostGame.beginWave(true);return r};
const postStory=C3.areaStory;C3.areaStory=function(id){if(id==='last_torii')return PostGame.intro();return postStory(id)};
const postNPC=drawDetailedNPC;drawDetailedNPC=function(n,x,y){if(n.postReserve){if(PostGame.names[n.postHero])return drawActor({style:n.postHero,dir:c3NpcPose(n).dir},x,y,false);return postNPC({...n,id:n.postHero==='colli'?'c3_nara':'c3_maia'},x,y)}return postNPC(n,x,y)};
const postMap=openMap;openMap=function(){if(G?.c3?.complete)return PostGame.openTravel();return postMap()};
const postSystem=openSystem;openSystem=function(...args){
 const result=postSystem(...args);
 if(!G?.c3?.complete||mode!=='overlay'||menuPage10!=='main'||$('retryCheckpoint'))return result;
 const actions=PostGame.active()?[
  ['postSystemSuspend','SUSPENDER EXPEDIÇÃO',()=>PostGame.confirmSuspend()],
  ['postSystemDungeon','ENCERRAR EXPEDIÇÃO',()=>PostGame.confirmExit(openSystem)]
 ]:[
  ['postSystemMap','CAPÍTULOS · VIAGENS',()=>PostGame.openTravel()],
  ['postSystemDungeon','CALABOUÇO INFINITO',()=>PostGame.openBriefing(openSystem)]
 ];
 for(const [id,text,fn] of actions){
  const button=document.createElement('button');button.id=id;button.className='menu-entry10';button.textContent=text;button.onclick=fn;
  $('overlayInner').appendChild(button);
 }
 return result;
};
const postCombatUnlocked=C3.combatUnlocked;C3.combatUnlocked=function(g=G){return !!(g?.c3?.complete&&g.area===PostGame.AREA)||postCombatUnlocked(g)};
const postActors=enemyActors;enemyActors=function(){return PostGame.active()?current.enemies.filter(e=>e.hp>0):postActors()};
const postXP=gainXP;gainXP=function(...args){if(PostGame.active())return;return postXP(...args)};
for(const name of ['coopAttack','coopSkill','coopAdvanced','coopSignature']){const f=C3[name];if(typeof f!=='function')continue;C3[name]=function(...args){const previous=PostGame.attacker;PostGame.attacker=C3.coop?.member||previous;try{return f.apply(this,args)}finally{PostGame.attacker=previous}}}
const postHit=hitEnemy;hitEnemy=function(e,...args){if(!PostGame.active()||!e?.endless)return postHit(e,...args);PostGame.markMode();const r=PostGame.run();
 const perk=id=>PostGame.bonus(id,r);
 const who=PostGame.attackerId(),lv=id=>PostGame.level(id,r),splash=PostGame.splashing;
 let bonus=perk('drive');
 if(e.hp===e.max)bonus+=perk('ambush');
 if(e.hp<=e.max/2)bonus+=perk('finish');
 if(e.endlessElite)bonus+=perk('counter');
 if(who==='ryuchi')bonus+=perk('bladeRun');
 if(who==='katana'&&e.stun>0)bonus+=perk('ink');
 let mult=(1+bonus)*PostGame.power(who)*(lv('overdrive')?1.35:1);
 if(!splash&&lv('sharp')&&Math.random()<perk('sharp'))mult*=2;
 args[0]=Math.round(args[0]*mult);
 if(args[1]===undefined)args[1]=.15;
 if(args[1]>0)args[1]*=1+perk('stagger');
 if(who==='franco'&&lv('bassHold'))args[1]=(args[1]||0)+PostGame.amount('bassHold',lv('bassHold'));
 if(e.endlessShield>0&&!splash){e.endlessShield--;e.flash=.2;addCombatFX(e.x,e.y,'hit',.8);updateHUD();return}
 const hitDamage=args[0];
 const shards=G.shards;PostGame.resolvingHit=true;try{postHit(e,...args)}finally{PostGame.resolvingHit=false;G.shards=shards;G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'))}if(!splash){const near=(radius,except)=>current.enemies.filter(n=>n!==e&&n!==except&&n.endless&&n.hp>0&&Math.hypot(n.x-e.x,n.y-e.y)<=radius);
  if(who==='alt'&&lv('pierce')){const n=near(3).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];if(n)PostGame.splash(n,hitDamage*perk('pierce'))}
  if(who==='percussion'&&lv('warDrum'))for(const n of near(1.6))PostGame.splash(n,hitDamage*perk('warDrum'))}
 if(e.hp<=0&&!e.endlessScored){e.endlessScored=true;const r=PostGame.run();r.kills++;G.resonance=Math.min(100,G.resonance+PostGame.bonus('charge',r)+(who==='synth'?PostGame.amount('synthWave',lv('synthWave')):0));if(e.endlessMod==='divisao')PostGame.split(e);if(lv('chain')){const dmg=PostGame.amount('chain',lv('chain'));for(const n of current.enemies.filter(n=>n!==e&&n.endless&&n.hp>0&&Math.hypot(n.x-e.x,n.y-e.y)<=2))PostGame.splash(n,dmg)}r.score=Math.min(PostGame.MAX_SCORE,r.score+Math.round(PostGame.killValue(e.type,r.wave,e.endlessElite)*PostGame.multiplier(r)*(1+PostGame.bonus('crowd',r))));current.enemies=current.enemies.filter(n=>n.hp>0);updateHUD()}};
const postSave=save;save=function(silent=false){
 if(PostGame.resolvingHit)return;
 if(!PostGame.active())return postSave(silent);
 // During a fight the only autosave is the checkpoint written by beginWave.
 if(silent&&PostGame.run().phase==='fight')return;
 const saved=PostGame.persist();
 if(!silent)toast(saved?PostGame.resumeText():'Use EXPORTAR SAVE para guardar a expedição.');
 return saved;
};
if(typeof addEventListener==='function'){
 const persistRun=()=>{if(PostGame.active())PostGame.persist()};
 addEventListener('pagehide',persistRun);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)persistRun()});
}
// The legacy exporter substitutes a checkpoint during combat; expeditions
// instead export the bounded current-wave checkpoint held in G.postgame.
const postExportSave=exportSave;exportSave=function(...args){if(!PostGame.active())return postExportSave(...args);const previous=battle;battle=null;try{return postExportSave(...args)}finally{battle=previous}};
if(typeof finishBoss==='function'){const postFinishBoss=finishBoss;finishBoss=function(...args){if(PostGame.active()&&bossActor?.endlessBoss)return PostGame.bossDown();return postFinishBoss(...args)}}
const postContinue=continueGame;continueGame=function(...args){
 const result=postContinue(...args);
 if(PostGame.active())PostGame.showResume();
 return result;
};
const postDefeat=showDefeat;showDefeat=function(...args){if(PostGame.active())return PostGame.finishRun('defeat');return postDefeat(...args)};
const postRestore=restoreCheckpoint;restoreCheckpoint=function(...args){if(PostGame.active())return PostGame.finishRun('exit');const p=G?.postgame?copy(G.postgame):null,result=postRestore(...args);if(p&&G?.c3?.complete){const s=PostGame.state();s.bestScore=Math.max(s.bestScore,p.bestScore);s.bestWave=Math.max(s.bestWave,p.bestWave);for(const mode of ['solo','coop']){s.records[mode].score=Math.max(s.records[mode].score,p.records?.[mode]?.score||0);s.records[mode].wave=Math.max(s.records[mode].wave,p.records?.[mode]?.wave||0)}if(p.lastRun)s.lastRun=p.lastRun}return result};
const postUpdate=update;update=function(dt){PostGame.markMode();const r=postUpdate(dt);if(G?.area==='last_torii')PostGame.syncReserves();PostGame.update(Math.max(0,Math.min(.1,Number(dt)||0)));return r};
const postHUD=updateHUD;updateHUD=function(...args){const r=postHUD(...args);PostGame.hud();return r};
const postActionHUD=updateActionHUD;updateActionHUD=function(...args){const r=postActionHUD(...args);if(PostGame.active()){const run=PostGame.run(),left=PostGame.remaining(run);$('actionEnemy').textContent='ONDA '+run.wave+' · '+left+' RESTANTES · '+run.score+' PTS · SEM DANO ×'+PostGame.multiplier(run).toFixed(1);$('actionEnemyFill').style.width=(PostGame.plan.length?100*(1-left/PostGame.plan.length):0)+'%'}return r};
const postObjective=objectiveData;objectiveData=function(){if(PostGame.active())return {text:'Supere a onda '+PostGame.run().wave+'.',hint:'Abra o menu para suspender ou encerrar a expedição.',area:PostGame.AREA,x:G.x,y:G.y,name:'Fenda das Ressonâncias'};if(G?.c3?.complete)return {text:'Hutukara continua aberto.',hint:'M ou MAPA para escolher um capítulo ou o calabouço infinito.',area:G.area,x:G.x,y:G.y,name:'Caminhos abertos'};if(G?.c3?.endingPending)return {text:'Escute a última frequência.',hint:'Os caminhos de Hutukara permanecem abertos.',area:G.area,x:G.x,y:G.y,name:'A próxima música'};return postObjective()};
const postC3Objective=C3.objective;C3.objective=function(){return G?.c3?.complete||G?.c3?.endingPending?objectiveData():postC3Objective()};
const postRoute=getRoute;getRoute=function(){return G?.c3?.complete?[]:postRoute()};
const postGuide=drawGuideMarker;drawGuideMarker=function(...args){if(G?.c3?.complete)return;return postGuide(...args)};
const postFinish=C3.finishSilence;C3.finishSilence=function(){if(G.c3.silenceDone)return G.c3.endingPending?C3.resumeEnding():PostGame.showEnding();const r=postFinish();G.c3.returnHome=false;save(true);return r};
C3.resumeEnding=function(){C3.scene('C3_025',()=>C3.scene('C3_026',()=>C3.scene('C3_027',()=>PostGame.complete())))};
// Compatibility entry point for older pending epilogues/debug tools; never warps to the studio.
C3.returnStudio=function(){return PostGame.complete()};C3.showEnding=function(){return PostGame.showEnding()};

// Normalize dynamic areas before validating their existence. Do not replace the
// current session or storage until the entire imported progress is accepted.
let importReadSerial=0;
importSave=function(file){
 if(!file)return;const serial=++importReadSerial,game=G,rd=new FileReader();
 const currentRead=()=>serial===importReadSerial&&G===game;
 const readFailed=()=>{if(currentRead())toast('NÃO FOI POSSÍVEL LER O ARQUIVO. TENTE IMPORTAR NOVAMENTE.')};
 rd.onload=()=>{if(!currentRead())return;try{
  const raw=JSON.parse(rd.result),source=raw?.progress||raw;
  if(!source||typeof source.flags!=='object'||!source.flags||!Number.isFinite(Number(source.x))||!Number.isFinite(Number(source.y)))throw Error('Arquivo não reconhecido');
  const imported=normalizeSave(source);if(!imported||!areas[imported.area])throw Error('Versão de progresso incompatível');
  G=imported;buildMaps();let persisted=true;try{localStorage.setItem(KEY,JSON.stringify(G))}catch{persisted=false}
  $('start').classList.add('hidden');$('hud').style.display='block';closeOverlay();setArea(G.area,G.x,G.y,false);
  if(PostGame.active())PostGame.showResume();
  toast(persisted?'PROGRESSO IMPORTADO':'PROGRESSO IMPORTADO · EXPORTE PARA GUARDAR');
 }catch{toast('ARQUIVO DE SALVAMENTO INVÁLIDO')}};
 rd.onerror=readFailed;
 rd.onabort=()=>{if(currentRead())toast('IMPORTAÇÃO CANCELADA')};
 try{rd.readAsText(file)}catch{readFailed()}
};

// Track actual HP loss (including leader swaps), not blocked/invulnerable hits.
// Apply expedition modifiers only at accepted damage sites (builder), after
// native dodge/parry checks. These observers keep knockout/clean-wave rules.
const postDungeonDamage=damageHero;damageHero=function(...args){const before=PostGame.active()?PostGame.damageSnapshot():null;try{return postDungeonDamage(...args)}finally{if(before)PostGame.observeDamage(before)}};
const postDungeonCoopDamage=C3.damageCoop;C3.damageCoop=function(...args){const before=PostGame.active()?PostGame.damageSnapshot():null;try{return postDungeonCoopDamage(...args)}finally{if(before)PostGame.observeDamage(before)}};
if(typeof BossChoreographyV2!=='undefined'){const postDungeonGround=BossChoreographyV2.drawGround;BossChoreographyV2.drawGround=function(...args){const result=postDungeonGround.apply(this,args);PostGame.drawWarnings();return result}};

if(typeof EnemyArtV1!=='undefined'){const postDungeonEnemy=EnemyArtV1.draw;EnemyArtV1.draw=function(x,y,kind,e){const result=postDungeonEnemy.call(this,x,y,kind,e);if(result&&PostGame.active()&&e?.endlessElite){const entry=this.manifest.enemies[this.key(kind,e)],top=y-(entry?.height||64)-12;PostGame.label('RESSONANTE'+(e.endlessMod?' · '+PostGame.mods[e.endlessMod].name.toUpperCase()+(e.endlessShield>0?' '+'◆'.repeat(e.endlessShield):''):''),x,top,'#f3c98a')}return result}};

if(typeof updateMobileReadout121!=='undefined'){const postDungeonMobile=updateMobileReadout121;updateMobileReadout121=function(...args){const result=postDungeonMobile(...args);PostGame.mobileHUD();return result}};
