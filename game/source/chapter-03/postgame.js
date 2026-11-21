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
    hpStart[id]=this.number(g.hp[id],max,this.number(r.hpStart?.[id],max,max));
   }
   const resonance=rest?this.number(g.resonance,100):this.number(r.resonanceStart,100,g.resonance||0);
   const combo=this.number(rest?r.combo:r.comboStart,5);
   const upgrades={};let budget=wave-1;
   for(const id of Object.keys(this.cards)){
    upgrades[id]=this.number(r.upgrades?.[id],budget);budget-=upgrades[id];
   }
   out.run={active:true,rules:3,legacy:r.rules!==3||!!r.legacy,mode:r.mode==='coop'?'coop':'solo',seed:this.number(r.seed,4294967295,1)||1,wave,score:this.number(r.bankedScore,this.MAX_SCORE),bankedScore:this.number(r.bankedScore,this.MAX_SCORE),kills:this.number(r.bankedKills,this.MAX_SCORE),bankedKills:this.number(r.bankedKills,this.MAX_SCORE),completedWave:rest?wave:wave-1,hpStart,campaignPotions:this.number(r.campaignPotions,99,g.potions||0),campaignResonance:this.number(r.campaignResonance,100,g.resonance||0),resonanceStart:resonance,potionsStart:0,combo,comboStart:combo,elapsed:this.number(r.bankedElapsed,this.MAX_SCORE),bankedElapsed:this.number(r.bankedElapsed,this.MAX_SCORE),waveSeats:r.waveSeats===2?2:1,phase:rest?'rest':'fight',cursor:0,wait:0,pending:null,clean:true,knockouts:0,upgrades,_resume:!rest};
   out.run.campaignHP=Object.fromEntries(Object.keys(this.names).map(id=>[id,this.number(r.campaignHP?.[id],g.maxhp[id]||40,g.maxhp[id]||40)]));
   out.run.campaignLeader=r.campaignLeader;
   out.run.campaignFormation=Array.isArray(r.campaignFormation)?[...new Set(r.campaignFormation.filter(id=>Object.hasOwn(this.names,id)))].slice(0,3):null;
   g.potions=0;g.resonance=resonance;
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
  document.querySelectorAll('[data-post-area]').forEach(b=>b.onclick=()=>this.travel(b.dataset.postArea));$('postDungeon').onclick=()=>this.startDungeon();$('postMapClose').onclick=closeOverlay;if($('postAbandon'))$('postAbandon').onclick=()=>this.confirmExit(()=>this.openTravel());return true;
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

 cards:{
  drive:{name:'Amplificador',text:'Dano de todos os golpes',scale:.65},
  ambush:{name:'Ataque de abertura',text:'Dano extra contra ecos com vida cheia',scale:1.4},
  finish:{name:'Último acorde',text:'Dano extra contra ecos com até metade da vida',scale:1.1},
  guard:{name:'Abafador de impacto',text:'Redução de dano para toda a equipe',scale:.5},
  charge:{name:'Retorno de sinal',text:'Ressonância por eliminação',scale:2,maxLevel:10},
  stagger:{name:'Compasso quebrado',text:'Duração do atordoamento dos golpes',scale:.9}
 },
 amount(id,level=0){
  const value=this.cards[id].scale*level/(level+4);
  return id==='charge'?this.cards[id].scale*Math.min(level,this.cards[id].maxLevel):value;
 },
 bonus(id,run){return this.amount(id,run?.upgrades?.[id]||0)},
 cardValue(id,level){
  const n=this.amount(id,level);
  return id==='charge'?String(n):Number((100*n).toFixed(1)).toLocaleString('pt-BR')+'%';
 },
 offers(run){
  const pool=Object.keys(this.cards).filter(id=>!this.cards[id].maxLevel||(run.upgrades?.[id]||0)<this.cards[id].maxLevel);
  const rand=this.random(run.seed^Math.imul(run.wave,2246822519)^0x7a0f2d03);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  return pool.slice(0,3);
 },
 showDraft(){
  const r=this.run();if(!this.active()||r.phase!=='rest'||typeof document==='undefined')return;
  const rows=this.offers(r).map(id=>{
   const card=this.cards[id],level=(r.upgrades[id]||0)+1;
   return `<button type="button" class="action" style="min-height:44px" data-echo-card="${id}"><b>${card.name} · Nv. ${level}</b><br><small>${card.text}<br>${this.cardValue(id,level-1)} → ${this.cardValue(id,level)}</small></button>`;
  }).join('');
  // O resultado da onda fica dentro do painel: um aviso solto ficaria por cima das cartas.
  this.hideToast();const result=r.lastWave&&r.lastWave.wave===r.wave?` · +${r.lastWave.bonus} PTS${r.lastWave.clean?' · SEM DANO':''} · TOTAL ${r.score}`:'';
  enterMenu10(`<div class="eyebrow">FENDA · ONDA ${r.wave} CONCLUÍDA${result}</div><h2>Escolha uma melhoria</h2><p>Vale para toda a equipe até o fim desta tentativa. A vida perdida não volta.</p><div class="row">${rows}</div><button class="action" id="postLeaveDraft">Encerrar expedição</button>`,'postgame');
  const wave=r.wave,buttons=document.querySelectorAll('[data-echo-card]');
  for(const b of buttons)b.onclick=()=>this.choose(b.dataset.echoCard,wave);
  $('postLeaveDraft').onclick=()=>this.confirmExit(closeOverlay);buttons[0]?.focus();
 },
 // Dano é permanente: ao carregar, a vida gravada vira a vida da onda. Por isso o
 // ferimento precisa ir para o save, mas sem gravar a cada golpe (cada gravação
 // serializa o save inteiro na thread principal). Junta os ferimentos e grava no
 // máximo a cada SAVE_EVERY segundos; fechar, recarregar ou esconder a página grava na hora.
 SAVE_EVERY:2,
 // O que foi gravado por último: a própria tentativa (objeto), a onda, a fase e a vida.
 // Tentativa nova, save trocado ou importado são outro objeto e sempre gravam.
 savedMark(){const r=this.run();return{run:r,wave:r?.wave,phase:r?.phase,hp:{...G.hp}}},
 unsaved(){const r=this.run(),m=this.saved;if(r?.phase!=='fight'||!m||m.run!==r||m.wave!==r.wave||m.phase!==r.phase)return true;return Object.keys(G.hp).some(id=>G.hp[id]!==m.hp[id])},
 flush(){if(this.dirty&&this.active())save(true)},
 hideToast(){if(typeof toastTimeout!=='undefined'&&toastTimeout)clearTimeout(toastTimeout);$('toast')?.classList.add('hidden')},
 // Encerrar apaga a tentativa: sempre pede confirmação. O foco começa em CONTINUAR,
 // para que um toque ou botão A repetido não encerre a expedição sem querer.
 confirmExit(back=closeOverlay){
  if(!this.active())return false;if(typeof document==='undefined')return this.finishRun('exit');
  const r=this.run();this.hideToast();
  enterMenu10(`<div class="eyebrow">FENDA · ${r.score} PTS · ${r.completedWave} ${r.completedWave===1?'ONDA':'ONDAS'}</div><h2>Encerrar a expedição?</h2><p>Não dá para retomar. Os pontos vão para o placar e a equipe volta ao Torii como estava na campanha.</p><div class="row"><button class="action strong" id="postExitBack">CONTINUAR NA FENDA</button><button class="action" id="postExitConfirm">ENCERRAR EXPEDIÇÃO</button></div>`,'postgame');
  $('postExitBack').onclick=()=>back();$('postExitConfirm').onclick=()=>this.finishRun('exit');$('postExitBack').focus();return true;
 },
 choose(id,wave){
  const r=this.run();if(!this.active()||r.phase!=='rest'||r.wave!==wave||!this.offers(r).includes(id))return false;
  r.upgrades[id]=(r.upgrades[id]||0)+1;r.phase='fight';
  closeOverlay();r.wave=Math.min(this.MAX_WAVE,r.wave+1);this.beginWave();return true;
 },
 incoming(amount){
  if(!this.active()||amount<=0)return amount;
  return Math.max(1,Math.round(amount*(1-this.bonus('guard',this.run()))));
 },
 profile(wave,seats=1){
  const w=Math.max(1,wave),phase=(w-1)%5,names=['Pulso','Contratempo','Interferência','Ressonância','Crescendo'],intensity=(w-1)*(seats===2?.90:.72);
  return {name:names[phase],count:Math.min(seats===2?18:15,Math.ceil((3+Math.floor(intensity*.55))*(seats===2?1.3:1))),alive:Math.min(seats===2?7:6,(seats===2?4:3)+Math.floor(intensity/6)),cadence:seats===2?1.05:1.25,warning:.95,hp:(1+.018*intensity+.20*Math.log2(1+intensity/5))*(seats===2?1.12:1),power:Math.min(3.25,1+.022*intensity),rest:w%5===0?8:4};
 },
 record(mode){return this.state().records[mode==='coop'?'coop':'solo']},
 multiplier(r=this.run()){return 1+Math.min(5,r?.combo||0)*.1},
 killValue(type,wave,elite=false){const base={hush:50,whisper:60,compasso:90,espelho:100,abafador:120,c3_drone:80,c3_echo:110}[type]||50;return Math.round(base*(1+.06*(wave-1))*(elite?1.5:1))},
 waveValue(r){const base=150+50*r.wave+(r.wave%5===0?250*Math.floor(r.wave/5):0);return Math.round(base*this.multiplier(r)*(r.clean?1.25:1))},
 markMode(){if(this.active()&&C3.coopActive())this.run().mode='coop'},
 damageSnapshot(){this.markMode();return Object.fromEntries(Object.keys(this.names).map(id=>[id,G.hp[id]||0]))},
 observeDamage(before){
  const r=this.run();if(!this.active()||!r||r.phase!=='fight')return;
  for(const id of Object.keys(before))if((G.hp[id]||0)<before[id]){
   this.dirty=true;r.clean=false;if(before[id]>0&&G.hp[id]<=0)r.knockouts++;
  }
 },
 random(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}},
 wavePlan(seed,wave,seats=1){
  const rand=this.random((seed^Math.imul(wave,2654435761))>>>0),profile=this.profile(wave,seats),pool=['hush','whisper'];
  if(wave>=3)pool.push('compasso');if(wave>=4)pool.push('c3_drone');if(wave>=6)pool.push('espelho');if(wave>=8)pool.push('c3_echo');if(wave>=10)pool.push('abafador');
  const preferred=[['hush','compasso'],['hush','c3_echo'],['whisper','c3_drone'],['compasso','abafador'],pool][(wave-1)%5].filter(t=>pool.includes(t)),deck=[...pool,...preferred,...preferred];let controllers=0;
  return Array.from({length:profile.count},(_,i)=>{let type=deck[Math.floor(rand()*deck.length)];if(i===0)type=preferred[0]||'hush';if(i===1)type=({3:'compasso',4:'c3_drone',6:'espelho',8:'c3_echo',10:'abafador'})[wave]||pool[(wave+(seed>>>0))%pool.length];if(type==='abafador'&&controllers++)type='hush';return {type,x:3.5+Math.floor(rand()*21),y:4.5+Math.floor(rand()*13),elite:wave%5===0&&i===profile.count-1}});
 },

 buildArena(){
  const a=C3.room(this.AREA,28,23,'c3_voidfloor');for(const [x,y]of [[2,2],[25,2]]){solid(a,x,y);prop(a,'env2_prop',x,y,{item:'core_column_left',w:30,h:88})}prop(a,'env2_prop',13,10,{item:'resonance_circle_on',w:100,h:70,flat:true});
  // Sem ponto de saída na arena: encostar nele no meio da luta encerrava a tentativa.
  // Para sair: painel entre ondas, M (viagens) ou menu do sistema, sempre com confirmação.
  return a;
 },
 startDungeon(seed){
  if(!this.canTravel())return false;
  const campaignHP={...G.hp},campaignLeader=G.active,campaignFormation=partyMembers().slice();
  closeOverlay();G.chapter=3;this.clearCombat();for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id];setArea('last_torii',13.5,13.5,false);setCheckpoint('c3_complete','last_torii',13.5,13.5,true);
  // A fresh expedition starts with both seats' actions available.
  Object.assign(act,{skill:0,skillX:0,duo:0,dashCD:0});
  Object.assign(C3.coop,{skill:0,advanced:0,signature:0,dash:0,dashCD:0,cool:0});
  const p=this.state(),value=Number.isFinite(seed)?seed>>>0:(Date.now()^Math.floor(Math.random()*4294967295))>>>0,seats=C3.coopActive()?2:1,campaignPotions=G.potions||0,campaignResonance=G.resonance||0;G.potions=0;G.resonance=100;
  p.run={active:true,campaignHP,campaignLeader,campaignFormation,upgrades:{},rules:3,legacy:false,mode:seats===2?'coop':'solo',seed:value||1,wave:1,score:0,bankedScore:0,kills:0,bankedKills:0,completedWave:0,hpStart:{...G.hp},campaignPotions,campaignResonance,resonanceStart:100,potionsStart:G.potions,combo:0,comboStart:0,elapsed:0,bankedElapsed:0,waveSeats:seats,phase:'fight',cursor:0,wait:0,pending:null,clean:true,knockouts:0,_resume:true};
  this.buildArena();setArea(this.AREA,14.5,18.5,false);toast('FENDA · VIDA PERDIDA É PERMANENTE NESTA TENTATIVA');return true;
 },

 beginWave(resuming=false){
  const r=this.run();if(!r?.active||G.area!==this.AREA)return;this.clearCombat();current.enemies=[];G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'));
  if(resuming){G.hp={...G.hp,...r.hpStart};G.potions=r.potionsStart;G.resonance=r.resonanceStart;r.score=r.bankedScore;r.kills=r.bankedKills;r.combo=r.comboStart;r.elapsed=r.bankedElapsed}
  else{r.hpStart={...G.hp};r.potionsStart=G.potions;r.resonanceStart=G.resonance;r.comboStart=r.combo}
  if(!G.hp[G.active])G.active=partyMembers().find(id=>G.hp[id]>0)||partyMembers()[0];r.waveSeats=C3.coopActive()?2:1;if(r.waveSeats===2)r.mode='coop';r.phase='fight';r.cursor=0;r.wait=0;r.pending=null;r.clean=true;r.knockouts=0;r._resume=false;this.plan=this.wavePlan(r.seed,r.wave,r.waveSeats);this.spawnClock=0;
  if(typeof EnemyArtV1!=='undefined')for(const spec of this.plan){const image=EnemyArtV1.image(EnemyArtV1.key(spec.type,spec));image?.decode?.().catch(()=>{})}
  if(C3.coopActive())C3.syncCoop(true);this.spawn();save(true);updateHUD();toast('ONDA '+r.wave+' · '+this.profile(r.wave,r.waveSeats).name.toUpperCase()+(r.wave%5===0?' · ECO RESSONANTE':''));
 },

 spawn(){
  const r=this.run(),profile=r&&this.profile(r.wave,r.waveSeats);if(!r||r.pending||r.cursor>=this.plan.length||current.enemies.filter(e=>e.hp>0).length>=profile.alive)return false;
  const spec=this.plan[r.cursor],actors=[G,...(C3.coopActive()?[C3.coop]:[])],far=(x,y)=>this.warningVisible(x,y)&&actors.every(a=>Math.hypot(a.x-x,a.y-y)>=4)&&actors.some(a=>Math.hypot(a.x-x,a.y-y)<=11)&&canBody121(x,y)&&current.enemies.every(e=>e.hp<=0||Math.hypot(e.x-x,e.y-y)>1.2);
  let pos=far(spec.x,spec.y)?{x:spec.x,y:spec.y}:null;const rand=this.random((r.seed+Math.imul(r.wave,97)+r.cursor)>>>0);for(let n=0;!pos&&n<100;n++){const x=3.5+Math.floor(rand()*21),y=3.5+Math.floor(rand()*15);if(far(x,y))pos={x,y}}if(!pos)return false;
  r.pending={...pos,index:r.cursor,time:profile.warning,max:profile.warning};return true;
 },
 materialize(){
  const r=this.run(),p=r?.pending;if(!p)return;const actors=[G,...(C3.coopActive()?[C3.coop]:[])];if(!this.warningVisible(p.x,p.y)||actors.some(a=>Math.hypot(a.x-p.x,a.y-p.y)<2.5)){r.pending=null;this.spawnClock=0;this.spawn();return}
  const spec=this.plan[p.index],profile=this.profile(r.wave,r.waveSeats),e={id:'endless_'+r.cursor,type:spec.type,x:p.x,y:p.y,endless:true,endlessElite:!!spec.elite};hydrateEnemy(e);e.hp=e.max=Math.min(2000000,Math.round(e.max*profile.hp*(spec.elite?1.4:1)));e.power=Math.min(Math.round(e.power*profile.power*(spec.elite?1.08:1)),Math.max(e.power,Math.ceil(Math.min(...partyMembers().map(id=>G.maxhp[id]||40))*.32)));e.cd=1;e.aware=1;current.enemies.push(e);r.cursor++;r.pending=null;engage();updateHUD();
 },

 update(dt){
  if(!this.active()||!['walk','action'].includes(mode))return;const r=this.run();
  if(r.phase==='rest'){this.showDraft();return}
  if(r._resume){this.beginWave(true);return}
  if(C3.coopActive())r.mode='coop';
  r.elapsed=Math.min(this.MAX_SCORE,r.elapsed+dt);
  this.sinceSave=(this.sinceSave||0)+dt;if(this.dirty&&this.sinceSave>=this.SAVE_EVERY)this.flush();
  // A disconnected/KO partner never leaves a solo player with the larger queue.
  if(r.waveSeats===2&&!C3.coopActive()){r.waveSeats=1;const count=this.profile(r.wave,1).count;this.plan.length=Math.max(r.cursor+(r.pending?1:0),Math.min(this.plan.length,count));}
  if(r.pending){r.pending.time=Math.max(0,r.pending.time-dt);if(!r.pending.time)this.materialize()}
  this.spawnClock+=dt;if(this.spawnClock>=this.profile(r.wave,r.waveSeats).cadence){this.spawnClock=0;this.spawn()}
  if(!r.pending&&r.cursor>=this.plan.length&&current.enemies.every(e=>e.hp<=0)){
   const bonus=this.waveValue(r);r.score=Math.min(this.MAX_SCORE,r.score+bonus);r.combo=r.knockouts?Math.max(0,r.combo-2):Math.min(5,r.combo+1);r.bankedScore=r.score;r.bankedKills=r.kills;r.bankedElapsed=r.elapsed;r.completedWave=r.wave;r.phase='rest';r.lastWave={wave:r.wave,bonus,clean:r.clean};r.wait=0;battle=null;mode='walk';this.clearCombat();this.best();save(true);updateHUD();this.showDraft();
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
  if(typeof Input121==='undefined'||!Input121.mobile||!this.active())return;const r=this.run(),score=r.score>=1000000?(r.score/1000000).toFixed(1)+'mi':r.score>=10000?(r.score/1000).toFixed(1)+'mil':String(r.score),label='ONDA '+r.wave+' · '+score+' PTS · ×'+this.multiplier(r).toFixed(1);
  for(const id of ['quest','questText','mobileObjective','mobileGoal121'])if($(id))$(id).textContent=label;
 },
 warningVisible(x,y){
  const sx=x*T-cam.x,sy=y*T-cam.y;if(sx<28||sx>VW-28||sy<38||sy>VH-28)return false;
  if(sx<190&&sy<155||sx>VW-115&&sy<80||sy>VH-105&&(sx<165||sx>VW-200))return false;return true;
 },
 drawWarnings(){
  if(!this.active())return;const p=this.run().pending;if(!p)return;const x=p.x*T-cam.x,y=p.y*T-cam.y,spec=this.plan[p.index];ctx.save();ctx.strokeStyle=spec?.elite?'#d6a56c':'#c4c7b0';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.ellipse(x,y,18,10,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#f0ddba';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(spec?.elite?'RESSONANTE':'ECO',x,y-16);ctx.restore();
 },
 hud(){if(!G)return;if(this.active()){const r=this.run(),left=this.plan.length-r.cursor+current.enemies.filter(e=>e.hp>0).length;$('quest').textContent='ONDA '+r.wave+' · '+(r.phase==='rest'?'Escolha uma melhoria':left+' inimigos restantes');$('questHint').textContent=r.score+' PTS · RITMO ×'+this.multiplier(r).toFixed(1)+' · '+this.profile(r.wave,r.waveSeats).name+' · M: encerrar';$('bMap').textContent='EXPEDIÇÃO [M]'}else if(G.c3?.complete){$('quest').textContent='Hutukara continua aberto.';$('questHint').textContent='M: escolher um capítulo ou entrar no calabouço infinito.';$('bMap').textContent='CAPÍTULOS [M]'}else $('bMap').textContent='MAPA [M]';if(G.c3?.complete){if($('mobileObjective'))$('mobileObjective').textContent=$('quest').textContent;if($('guideChip'))$('guideChip').textContent=$('questHint').textContent}this.mobileHUD()}
};
C3.AREAS.push(PostGame.AREA);C3.COMBAT_AREAS.push(PostGame.AREA);combatAreas10.add(PostGame.AREA);C3.labels[PostGame.AREA]=['FENDA DAS RESSONÂNCIAS','CALABOUÇO INFINITO'];
const postFresh=fresh;fresh=function(...args){const g=postFresh(...args);g.postgame=PostGame.defaults();return g};
const postNormalize=normalizeSave;normalizeSave=function(raw){const source=raw?.progress||raw;if(source?.area===PostGame.AREA&&!areas[PostGame.AREA])PostGame.buildArena();const g=postNormalize(raw);if(!g)return g;g.postgame=PostGame.normalize(source?.postgame,g);if(g.area===PostGame.AREA&&!g.postgame.run){g.area=g.c3.started?'last_torii':'studio';g.x=g.c3.started?13.5:12.5;g.y=g.c3.started?13.5:10.5}return g};
const postBuild=buildMaps;buildMaps=function(...args){const r=postBuild(...args);PostGame.syncReserves(true);if(G?.postgame?.run?.active)PostGame.buildArena();return r};
const postArea=setArea;setArea=function(id,...args){if(id==='last_torii')PostGame.syncReserves(true);if(id===PostGame.AREA&&!areas[id])PostGame.buildArena();const r=postArea(id,...args);if(id===PostGame.AREA&&PostGame.run()?._resume)PostGame.beginWave(true);return r};
const postStory=C3.areaStory;C3.areaStory=function(id){if(id==='last_torii')return PostGame.intro();return postStory(id)};
const postNPC=drawDetailedNPC;drawDetailedNPC=function(n,x,y){if(n.postReserve){if(PostGame.names[n.postHero])return drawActor({style:n.postHero,dir:c3NpcPose(n).dir},x,y,false);return postNPC({...n,id:n.postHero==='colli'?'c3_nara':'c3_maia'},x,y)}return postNPC(n,x,y)};
const postMap=openMap;openMap=function(){if(G?.c3?.complete)return PostGame.openTravel();return postMap()};
const postSystem=openSystem;openSystem=function(...args){const r=postSystem(...args);if(G?.c3?.complete&&mode==='overlay'&&menuPage10==='main'&&!$('retryCheckpoint')){for(const [id,text,fn]of [['postSystemMap','CAPÍTULOS · VIAGENS',()=>PostGame.openTravel()],['postSystemDungeon',PostGame.active()?'ENCERRAR EXPEDIÇÃO':'CALABOUÇO INFINITO',()=>PostGame.active()?PostGame.confirmExit():PostGame.startDungeon()]]){const b=document.createElement('button');b.id=id;b.className='menu-entry10';b.textContent=text;b.onclick=fn;$('overlayInner').appendChild(b)}}return r};
const postCombatUnlocked=C3.combatUnlocked;C3.combatUnlocked=function(g=G){return !!(g?.c3?.complete&&g.area===PostGame.AREA)||postCombatUnlocked(g)};
const postActors=enemyActors;enemyActors=function(){return PostGame.active()?current.enemies.filter(e=>e.hp>0):postActors()};
const postXP=gainXP;gainXP=function(...args){if(PostGame.active())return;return postXP(...args)};
const postHit=hitEnemy;hitEnemy=function(e,...args){if(!PostGame.active()||!e?.endless)return postHit(e,...args);PostGame.markMode();const r=PostGame.run();
 const perk=id=>PostGame.bonus(id,r);
 let bonus=perk('drive');
 if(e.hp===e.max)bonus+=perk('ambush');
 if(e.hp<=e.max/2)bonus+=perk('finish');
 args[0]=Math.round(args[0]*(1+bonus));
 if(args[1]===undefined)args[1]=.15;
 if(args[1]>0)args[1]*=1+perk('stagger');
 const shards=G.shards;PostGame.resolvingHit=true;try{postHit(e,...args)}finally{PostGame.resolvingHit=false;G.shards=shards;G.defeated=G.defeated.filter(id=>!id.startsWith('endless_'))}if(e.hp<=0&&!e.endlessScored){e.endlessScored=true;const r=PostGame.run();r.kills++;G.resonance=Math.min(100,G.resonance+PostGame.bonus('charge',r));r.score=Math.min(PostGame.MAX_SCORE,r.score+Math.round(PostGame.killValue(e.type,r.wave,e.endlessElite)*PostGame.multiplier(r)));current.enemies=current.enemies.filter(n=>n.hp>0);PostGame.best();updateHUD()}};
const postSave=save;save=function(silent=false){if(PostGame.resolvingHit)return;if(PostGame.active()){// No meio da onda, o jogo base também grava ao fim de cada embate. Se esta onda já está
 // gravada e a vida não mudou, não há nada novo para o save (a onda recomeça ao carregar).
 if(silent&&!PostGame.unsaved())return;
 PostGame.markMode();PostGame.dirty=false;PostGame.sinceSave=0;PostGame.saved=PostGame.savedMark();try{localStorage.setItem(KEY,JSON.stringify(G));if(!silent)toast('EXPEDIÇÃO SALVA · A ONDA ATUAL RECOMEÇA AO CARREGAR')}catch{if(!silent)toast('Use EXPORTAR SAVE para guardar a expedição.')}return}return postSave(silent)};
if(typeof addEventListener==='function'){addEventListener('pagehide',()=>PostGame.flush());if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')PostGame.flush()})}
// The legacy exporter substitutes a checkpoint during combat; expeditions
// instead export the bounded current-wave checkpoint held in G.postgame.
const postExportSave=exportSave;exportSave=function(...args){if(!PostGame.active())return postExportSave(...args);const previous=battle;battle=null;try{return postExportSave(...args)}finally{battle=previous}};
const postDefeat=showDefeat;showDefeat=function(...args){if(PostGame.active())return PostGame.finishRun('defeat');return postDefeat(...args)};
const postRestore=restoreCheckpoint;restoreCheckpoint=function(...args){if(PostGame.active())return PostGame.finishRun('exit');const p=G?.postgame?copy(G.postgame):null,result=postRestore(...args);if(p&&G?.c3?.complete){const s=PostGame.state();s.bestScore=Math.max(s.bestScore,p.bestScore);s.bestWave=Math.max(s.bestWave,p.bestWave);for(const mode of ['solo','coop']){s.records[mode].score=Math.max(s.records[mode].score,p.records?.[mode]?.score||0);s.records[mode].wave=Math.max(s.records[mode].wave,p.records?.[mode]?.wave||0)}if(p.lastRun)s.lastRun=p.lastRun}return result};
const postUpdate=update;update=function(dt){PostGame.markMode();const r=postUpdate(dt);if(G?.area==='last_torii')PostGame.syncReserves();PostGame.update(Math.max(0,Math.min(.1,Number(dt)||0)));return r};
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
const postDungeonDamage=damageHero;damageHero=function(...args){const before=PostGame.active()?PostGame.damageSnapshot():null;try{args[0]=PostGame.incoming(args[0]);return postDungeonDamage(...args)}finally{if(before)PostGame.observeDamage(before)}};
const postDungeonCoopDamage=C3.damageCoop;C3.damageCoop=function(...args){const before=PostGame.active()?PostGame.damageSnapshot():null;try{args[0]=PostGame.incoming(args[0]);return postDungeonCoopDamage(...args)}finally{if(before)PostGame.observeDamage(before)}};
if(typeof BossChoreographyV2!=='undefined'){const postDungeonGround=BossChoreographyV2.drawGround;BossChoreographyV2.drawGround=function(...args){const result=postDungeonGround.apply(this,args);PostGame.drawWarnings();return result}};

if(typeof EnemyArtV1!=='undefined'){const postDungeonEnemy=EnemyArtV1.draw;EnemyArtV1.draw=function(x,y,kind,e){const result=postDungeonEnemy.call(this,x,y,kind,e);if(result&&PostGame.active()&&e?.endlessElite){const entry=this.manifest.enemies[this.key(kind,e)],top=y-(entry?.height||64)-12;ctx.save();ctx.fillStyle='#e0b77c';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('RESSONANTE',x,top);ctx.restore()}return result}};

if(typeof updateMobileReadout121!=='undefined'){const postDungeonMobile=updateMobileReadout121;updateMobileReadout121=function(...args){const result=postDungeonMobile(...args);PostGame.mobileHUD();return result}};
