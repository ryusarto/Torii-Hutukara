/* Regressões de progressão, save, geometria, coop e diálogo mobile.
 * Usa a build atual e contextos descartáveis; não lê saves do jogador.
 * PLAYWRIGHT_CORE=/caminho/playwright node qa/gameplay_regression.cjs
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const config=JSON.parse(fs.readFileSync(path.join(root,'web/playtest/build.json')));
const manifestPath=path.join(root,config.manifest),manifest=JSON.parse(fs.readFileSync(manifestPath));
const build=path.join(path.dirname(manifestPath),manifest.output.file),out=path.join(__dirname,version.versao);
fs.mkdirSync(out,{recursive:true});const checks=[],errors=[];

async function main(){
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.requestAnimationFrame=()=>0;window.__pads=[];
   Object.defineProperty(navigator,'getGamepads',{value:()=>window.__pads});
   window.__pad=index=>({index,id:'audit controller',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
  });
  await page.goto((process.argv[2]||pathToFileURL(build).href),{waitUntil:'load',timeout:120000});
  async function check(name,run){await run();checks.push({name,passed:true});console.log('OK · '+name)}
  async function arena(coop=false){await page.evaluate(coop=>{
   G=fresh();G.flags.masks=G.flags.bass=true;G.formation=['franco','ryuchi'];G.active='franco';
   G.hp.franco=G.hp.ryuchi=G.maxhp.franco=G.maxhp.ryuchi=100;
   current=mk('forest',40,30,'grass');areas.forest=current;G.area='forest';G.x=8;G.y=12;G.dir='right';G.aim091=[1,0];
   mode='action';battle={id:'test'};bossActor=null;keys={};act.cool=act.skill=act.skillX=act.duo=act.invuln=0;
   resetMotion10();C3.hazards=[];C3.synthZones=[];projectiles=[];hostileShots=[];companionCooldown=999;
   window.__pads=coop?[window.__pad(0),window.__pad(1)]:[];C3.pad.pads=window.__pads;C3.coop.member='ryuchi';
   if(coop){C3.syncCoop(true);Object.assign(C3.coop,{x:17,y:12,invuln:0,contact:0,cool:0,skill:0,advanced:0,signature:0,dash:0})}
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';
  },coop)}

  await check('Prólogo sem inimigo, dano ou combate antes do instrumento',async()=>{
   const v=await page.evaluate(()=>{
    newGame();while(mode==='dialogue')advanceDialogue();
    const states=[];
    for(const area of ['studio','corridor','chamber']){
     setArea(area,area==='corridor'?21.5:12.5,9.5,false);mode='walk';
     for(let i=0;i<120;i++){tick+=1/60;update(1/60)}
     states.push({area,mode,enemies:enemyActors().length,hp:copy(G.hp),ready:combatReady10()});
    }return {states,corridorSpawns:areas.corridor.enemies.length};
   });
   assert.equal(v.corridorSpawns,0);
   for(const s of v.states){assert.equal(s.mode,'walk');assert.equal(s.enemies,0);assert.equal(s.ready,false);assert.equal(s.hp.franco,40);assert.equal(s.hp.ryuchi,38)}
  });
  await check('Entrada da floresta segura; entrega do baixo libera a primeira luta',async()=>{
   const v=await page.evaluate(()=>{
    G=fresh();buildMaps();G.flags.console=G.flags.masks=G.flags.ema=true;setArea('forest',4.5,22.5,false);mode='walk';
    for(let i=0;i<90;i++){tick+=1/60;update(1/60)}
    const before={mode,enemies:enemyActors().length,ready:combatReady10()};maskedHelp();while(mode==='dialogue')advanceDialogue();
    const e=hydrateEnemy(enemyActors()[0]);G.x=e.x-1.5;G.y=e.y;G.dir='right';G.aim091=[1,0];act.cool=0;const hp=e.hp;attackAction();
    return {before,bass:G.flags.bass,mode,hit:e.hp<hp};
   });assert.deepEqual(v.before,{mode:'walk',enemies:0,ready:false});assert(v.bass);assert(v.hit);assert.equal(v.mode,'action');
  });
  await check('Save antigo no corredor continua sem o encontro removido',async()=>{
   const v=await page.evaluate(()=>{
    const old=fresh();old.area='corridor';old.x=21.5;old.y=9.5;old.flags.console=true;old.defeated=['p4_corridor_hush'];old.potions=5;
    G=normalizeSave({progress:old});buildMaps();setArea(G.area,G.x,G.y,false);mode='walk';update(1/60);
    return {mode,potions:G.potions,console:G.flags.console,enemies:enemyActors().length};
   });assert.deepEqual(v,{mode:'walk',potions:5,console:true,enemies:0});
  });
  await check('Distrito permite ataque dos seis integrantes após a primeira frente',async()=>{
   const v=await page.evaluate(()=>{
    C3.start(true);while(mode==='dialogue')advanceDialogue();Object.assign(G.c3,{metMaia:true,usinaDone:true,synthUnlocked:true,percussionUnlocked:true});
    const rows=[];
    for(const id of C3.progressionIds){
     G.formation=[id];G.active=id;G.hp[id]=100;setArea('distortion_district',35,25.5,false);mode='action';resetMotion10();act.cool=0;G.dir='right';G.aim091=[1,0];
     current.enemies=[];enemy(current,'test_'+id,36.5,25.5,'hush');const e=hydrateEnemy(current.enemies[0]);const hp=e.hp;
     attackAction();for(let i=0;i<20;i++)tickFriendlyShots10(.025);
     rows.push({id,ready:combatReady10(),hit:e.hp<hp});
    }return rows;
   });for(const r of v){assert(r.ready,r.id);assert(r.hit,r.id)}
  });
  await check('XP ativo e de reserva é igual nos três capítulos e estável ao carregar',async()=>{
   for(const chapter of [1,2,3]){
    const v=await page.evaluate(chapter=>{
     G=fresh();G.chapter=chapter;G.flags.reveal=G.flags.voicesKatana=true;G.formation=['alt','katana','franco'];G.active='alt';G.c3.started=chapter===3;
     C3.ensureProgression(G);gainXP(100);const earned={xp:copy(G.xp),levels:copy(G.levels),maxhp:copy(G.maxhp)};
     let loaded=copy(G);for(let i=0;i<3;i++)loaded=normalizeSave(loaded);
     return {earned,loaded:{xp:loaded.xp,levels:loaded.levels,maxhp:loaded.maxhp}};
    },chapter);assert.equal(v.earned.xp.alt,100);assert.equal(v.earned.xp.katana,100);assert.equal(v.earned.xp.ryuchi,75);assert.deepEqual(v.loaded,v.earned);
   }
  });
  await check('Migração antiga compensa aliados uma vez e checkpoint preserva XP',async()=>{
   const v=await page.evaluate(()=>{
    let old=fresh();old.flags.reveal=true;old.xp.franco=old.xp.ryuchi=100;old.xp.alt=0;delete old.progressionRoster;
    G=normalizeSave(old);const first=copy(G.xp);G=normalizeSave(G);const second=copy(G.xp);
    setCheckpoint('test','studio',12.5,10.5,true);return {first,second,checkpoint:G.checkpoint.snapshot.xp};
   });assert.equal(v.first.alt,75);assert.deepEqual(v.first,v.second);assert.deepEqual(v.first,v.checkpoint);
  });
  await check('Aliados recebem compensação no recrutamento, antes de XP ou recarga',async()=>{
   const rows=await page.evaluate(()=>{
    const rows=[];
    for(const id of ['alt','katana','synth','percussion']){
     G=fresh();buildMaps();current=areas.studio;G.area='studio';G.xp.franco=G.xp.ryuchi=400;C3.ensureProgression(G);mode='walk';
     if(id==='alt')revealAlt();
     else if(id==='katana')voiceBossWin();
     else C3.recruit(id);
     const before={xp:copy(G.xp),levels:copy(G.levels)};const loaded=normalizeSave(G);
     rows.push({id,before,after:{xp:loaded.xp,levels:loaded.levels},roster:G.progressionRoster});
    }return rows;
   });for(const r of rows){assert(r.before.xp[r.id]>=300,r.id);assert(r.roster.includes(r.id));assert.deepEqual(r.before,r.after,r.id)}
  });
  await check('Patrulhas respeitam cooldown após load e não herdam relógio de outra partida',async()=>{
   const v=await page.evaluate(()=>{
    C3.start(true);while(mode==='dialogue')advanceDialogue();G.c3.metMaia=G.c3.usinaDone=true;G.totalSeconds=1200;setArea('distortion_district',30.5,26.5,false);
    const ids=ToriiRitmoMapa.PATROLS.map(p=>p[1]);G.defeated.push(...ids);G.totalSeconds=1230;G=normalizeSave(copy(G));buildMaps();setArea('distortion_district',30.5,26.5,false);const before=ids.every(id=>G.defeated.includes(id));
    G.totalSeconds=1261;setArea('distortion_district',30.5,26.5,false);const elapsed=ids.every(id=>!G.defeated.includes(id));
    C3.start(true);while(mode==='dialogue')advanceDialogue();G.c3.metMaia=G.c3.usinaDone=true;G.totalSeconds=65;G.defeated.push(...ids);setArea('distortion_district',30.5,26.5,false);
    return {before,elapsed,newGame:ids.every(id=>!G.defeated.includes(id))};
   });assert.deepEqual(v,{before:true,elapsed:true,newGame:true});
  });
  await check('Pad para antes da parede e filtro conserva o corpo do inimigo no chão',async()=>{
   await arena();const v=await page.evaluate(()=>{
    G.c3.synthUnlocked=true;G.formation=['synth'];G.active='synth';G.hp.synth=100;G.x=9.5;G.y=10.5;G.aim091=[1,0];current.blocked.add('10,10');current.blocked.add('12,10');
    C3.placeSynthZone();const placed=copy(C3.synthZones.at(-1));const placementValid=C3.enemyBodyFree(placed.x,placed.y)&&placed.x<10;
    C3.synthZones=[{x:9.5,y:10.5,area:G.area,left:2,next:1,phase:0}];enemy(current,'pull',11.3,10.5,'c3_echo');const e=hydrateEnemy(current.enemies.at(-1));act.skillX=0;advancedSkill();
    return {placementValid,enemyValid:C3.enemyBodyFree(e.x,e.y),x:e.x};
   });assert(v.placementValid);assert(v.enemyValid);assert(v.x>=11.22);
  });

  for(const [type,radius] of [['compasso',2],['espelho',1.5],['abafador',1.5]]){
   await check(type+': mesmo ataque acerta P1 e P2 e respeita invulnerabilidade',async()=>{
    await arena(true);const v=await page.evaluate(({type,radius})=>{
     enemy(current,'enemy',15,12,type);const e=hydrateEnemy(current.enemies.at(-1));
     const trigger=()=>{e.stun=0;e.cd=1;if(type==='compasso'){e.clock=1.59;e.lastBeat=0}else if(type==='espelho'){e.retaliate=.01;e.mirrorCd=1}else e.wind=.01;updateEnemy(e,.02,false)};
     G.x=15+radius;C3.coop.x=15-radius;trigger();const hit={p1:G.hp.franco,p2:G.hp.ryuchi};
     G.hp.franco=G.hp.ryuchi=100;act.invuln=1;C3.coop.invuln=1;trigger();return {hit,protected:{p1:G.hp.franco,p2:G.hp.ryuchi}};
    },{type,radius});assert(v.hit.p1<100);assert.equal(v.hit.p1,v.hit.p2);assert.deepEqual(v.protected,{p1:100,p2:100});
   });
  }
  await check('Queda do líder durante uma onda não redireciona o dano do companheiro',async()=>{
   await arena(true);const v=await page.evaluate(()=>{
    G.x=17;C3.coop.x=13;G.hp.franco=1;G.hp.ryuchi=100;
    enemy(current,'leader_wave',15,12,'compasso');const e=hydrateEnemy(current.enemies.at(-1));e.clock=1.59;e.lastBeat=0;e.stun=0;
    updateEnemy(e,.02,false);return {hp:G.hp,active:G.active};
   });assert.equal(v.hp.franco,0);assert.equal(v.hp.ryuchi,91);assert.equal(v.active,'ryuchi');
  });
  await check('Abafador bloqueia as três técnicas de cada ator, mas permite sair da aura',async()=>{
   await arena(true);const v=await page.evaluate(()=>{
    enemy(current,'mute',15.5,12,'abafador');hydrateEnemy(current.enemies.at(-1));G.x=8;C3.coop.x=17;G.resonance=100;
    for(const name of ['coopSkill','coopAdvanced','coopSignature'])C3[name](window.__pads[1]);
    const p2={skill:C3.coop.skill,advanced:C3.coop.advanced,signature:C3.coop.signature,res:G.resonance};
    G.x=17;C3.coop.x=8;for(const action of [skillAction,advancedSkill,duoAction])action();
    const p1={skill:act.skill,advanced:act.skillX,signature:act.duo,res:G.resonance};
    C3.coop.x=20;C3.coopSkill(window.__pads[1]);return {p1,p2,outside:C3.coop.skill};
   });assert.deepEqual(v.p1,{skill:0,advanced:0,signature:0,res:100});assert.deepEqual(v.p2,v.p1);assert(v.outside>0);
  });
  await check('Share do segundo controle cura P2 e manter pressionado não gasta outra fita',async()=>{
   await arena(true);const v=await page.evaluate(()=>{
    G.hp.franco=40;G.hp.ryuchi=20;G.potions=3;window.__pads[1].buttons[8].pressed=true;update(.016);
    const first={p1:G.hp.franco,p2:G.hp.ryuchi,tapes:G.potions};for(let i=0;i<180;i++)update(1/60);return {first,tapes:G.potions};
   });assert.deepEqual(v.first,{p1:40,p2:60,tapes:2});assert.equal(v.tapes,2);
  });
  await check('Cura simultânea usa o inventário compartilhado sem duplicar ou ficar negativo',async()=>{
   for(const tapes of [1,2]){
    await arena(true);const v=await page.evaluate(tapes=>{
     G.hp.franco=G.hp.ryuchi=20;G.potions=tapes;for(const pad of window.__pads)pad.buttons[8].pressed=true;update(.016);
     return {hp:[G.hp.franco,G.hp.ryuchi],tapes:G.potions};
    },tapes);assert.equal(v.tapes,0);assert.deepEqual(v.hp,tapes===1?[60,20]:[60,60]);
   }
  });

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const mobile=await mobileContext.newPage();mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.addInitScript(()=>{window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
  await mobile.goto((process.argv[2]||pathToFileURL(build).href),{waitUntil:'load',timeout:120000});
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   for(const bigText of [false,true]){
    await check(`Diálogo ${viewport.width} × ${viewport.height}, texto ${bigText?'maior':'normal'}: leitura e toque livres`,async()=>{
     await mobile.setViewportSize(viewport);await mobile.waitForFunction(landscape=>document.documentElement.classList.contains('landscape121')===landscape,viewport.width>viewport.height,{polling:50});
     await mobile.evaluate(big=>{
      G=fresh();buildMaps();setArea('studio',12.5,10.5,false);$('start').classList.add('hidden');$('hud').style.display='block';
      localStorage.setItem('torii_hutukara_acessibilidade_v1',JSON.stringify({bigText:big}));ToriiAcessibilidade.apply();
      talk([{who:'franco',t:'Primeira fala: o caminho começa quando a gente escuta.'},{who:'ryuchi',t:'Segunda fala: agora dá para seguir.'}]);transitionAlpha=0;drawEnv();
     },bigText);
     const box=await mobile.locator('#words').boundingBox();
     const point={x:box.x+box.width/2,y:box.y+box.height/2};
     assert(await mobile.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('#dialogue'),point));
     await mobile.touchscreen.tap(point.x,point.y);assert.match(await mobile.locator('#words').textContent(),/Segunda fala/);
     const tape=await mobile.locator('#tapeButton').boundingBox();assert(tape.height>=44);
     await mobile.screenshot({path:path.join(out,`dialogue-${viewport.width}-${bigText?'big':'normal'}.png`)});
    });
   }
  }
  assert.deepEqual(errors,[],'Browser runtime errors');
  fs.writeFileSync(path.join(out,'GAMEPLAY_TEST_RESULTS.json'),JSON.stringify({build:path.basename(build),sha256:crypto.createHash('sha256').update(fs.readFileSync(build)).digest('hex'),passed:checks.length,checks,browserErrors:errors},null,2)+'\n');
  console.log(checks.length+' verificações de jogabilidade aprovadas.');
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exit(1)});
