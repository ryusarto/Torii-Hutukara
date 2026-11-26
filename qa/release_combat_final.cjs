'use strict';
// Independent final-release combat checks. Existing runtime + controlled states.
// Map fixtures are reported separately from original-map/campaign entry paths.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),out=process.env.COMBAT_FINAL_OUTPUT||path.join(root,'..','ANALISE_1_0','combat');
const url=process.argv[2]||'http://127.0.0.1:8896/';
const report={url,scope:'Independent controlled combat/runtime regression; original Forest geometry where identified. Not human campaign/FPS certification.',cases:[],findings:[],errors:[]};let browser,page;
function install(){
 window.CombatFinalQA={
  async ready(){await FinalAssetLoadingV1.ready();const gate=FinalAssetLoadingV1.snapshot();if(gate.loading||gate.error)throw Error('Final-art gate not ready: '+JSON.stringify(gate));},
  pad(index){return{index,id:'Final combat independent QA',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))}},
  async arena(hero='franco',partner=null,difficulty='normal',originalMap=false){
   await this.ready();G=fresh();Object.assign(G.flags,{bass:true,masks:true,reveal:true,voicesKatana:true,bridge:true});Object.assign(G.c3,{synthUnlocked:true,percussionUnlocked:true});G.knownMembers=C3.unlockedRoster().slice();G.formation=partner?[hero,partner]:[hero];G.active=hero;G.difficulty=difficulty;
   for(const id of C3.progressionIds){G.xp[id]=10000;G.hp[id]=G.maxhp[id]=500;}C3.ensureProgression(G);buildMaps();setArea('forest',10.5,12.5,false);
   if(!originalMap)current=areas.forest=mk('forest',44,36,'grass');
   current.enemies=[];bossActor=null;battle=null;C3.hazards=[];C3.finalPending=false;C3.synthZones=[];projectiles=[];hostileShots=[];combatFX.length=0;Special11.fields=[];Special11.traces=[];
   G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];G.resonance=100;keys={};touchDir={};companionCooldown=999;mode='action';battle={id:'final-combat-fixture',boss:false};resetMotion10();
   Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,invuln:0,dash:0,dashCD:0});__combatPads=partner?[this.pad(0),this.pad(1)]:[];C3.pad.pads=__combatPads;C3.pad.previous.clear();Input121.focused=true;Input121.wasCoop=false;Input121.game=G;Input121.lastArea=G.area;Input121.pad=[0,0];Input121.touch=[0,0];
   Object.assign(C3.coop,{member:partner,area:'',cool:0,skill:0,advanced:0,signature:0,dash:0,dashCD:0,recovery:0,invuln:0,hit:0,contact:999});if(partner)C3.syncCoop(true);
   for(const id of ['start','dialogue','overlay','toast'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';transitionAlpha=screenShake=0;await FinalAssetLoadingV1.start({force:true});await this.ready();update(0);await this.ready();
   return{map:originalMap?'original Forest':'controlled open Forest fixture',hero,partner,difficulty};
  },
  target(x,y,id='final-target',hp=1000){const e=hydrateEnemy({id,type:'hush',x,y});e.hp=e.max=hp;e.cd=e.stun=999;current.enemies=[e];return e},
  async settle(){await FinalAssetLoadingV1.start({force:true});await this.ready();},
  async step(count=1,dt=1/60){for(let i=0;i<count;i++){await this.ready();tick+=dt;update(dt);await this.ready()}},
  wall(){
   for(let y=3;y<current.h-3;y++)for(let x=3;x<current.w-3;x++){
    if(tileWalkable(current,x+.5,y+.5))continue;
    if(canBody121(x-.5,y+.5)&&canBody121(x+1.5,y+.5))return{wall:{x,y},start:{x:x-.5,y:y+.5},target:{x:x+1.5,y:y+.5}};
   }throw Error('No actual thin Forest obstacle with walkable sides');
  }
 };
}
async function check(name,fn){if(process.env.COMBAT_FINAL_ONLY&&!new RegExp(process.env.COMBAT_FINAL_ONLY,'i').test(name))return;try{const evidence=await fn();report.cases.push({name,passed:true,evidence});console.log('PASS '+name)}catch(e){report.cases.push({name,passed:false,error:e.message});console.log('FAIL '+name+' '+e.message)}}
(async()=>{
 fs.mkdirSync(out,{recursive:true});browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__combatPads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>__combatPads})});
 await page.goto(url,{waitUntil:'load',timeout:180000});report.build=await page.evaluate(()=>window.TORII_PLAYTEST_BUILD);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.build?.sourceSha256,process.env.EXPECTED_SOURCE_SHA);report.environment=await page.evaluate(()=>({userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],canvas:[VW,VH]}));await page.evaluate(install);
 await check('Original Forest obstacle blocks P1 Archer and P2 Archer equally',async()=>{
  const rows=[];
  for(const seat of [0,1])rows.push(await page.evaluate(async seat=>{
   const q=CombatFinalQA;await q.arena(seat?'franco':'alt',seat?'alt':null,'normal',true);const setup=q.wall();Object.assign(G,setup.start);G.dir='right';G.aim091=[1,0];if(seat){Object.assign(C3.coop,setup.start);C3.coop.dir='right';C3.coop.area=G.area;C3.coop.invuln=0;}
   const e=q.target(setup.target.x,setup.target.y);await q.settle();const before=e.hp,shotsBefore=projectiles.length;
   if(seat)C3.coopAttack(__combatPads[1]);else attackAction();const accepted=seat?C3.coop.cool>0:act.cool>0,instant=e.hp,shotsCreated=projectiles.length-shotsBefore;await q.step(70);
   return{seat,geometry:setup,accepted,before,instant,after:e.hp,shotsCreated,player:{x:G.x,y:G.y},p2:seat?{x:C3.coop.x,y:C3.coop.y}:null,wallStillSolid:!tileWalkable(current,setup.wall.x+.5,setup.wall.y+.5)};
  },seat));
  report.wallEvidence=rows;assert(rows.every(r=>r.accepted&&r.wallStillSolid));assert.equal(rows[0].after,rows[0].before,'P1 shot crossed solid obstacle');assert.equal(rows[1].after,rows[1].before,'P2 Archer damaged target through the same original solid Forest obstacle');return rows;
 });
 for(const hero of ['franco','ryuchi','alt','katana','synth','percussion'])for(const difficulty of ['normal','dificil'])await check('Accepted and rejected action ownership '+hero+' '+difficulty,async()=>page.evaluate(async({hero,difficulty})=>{
  const q=CombatFinalQA,rows=[];
  for(const[fn,field]of[['attackAction','cool'],['skillAction','skill'],['advancedSkill','skillX'],['duoAction','duo'],['dodgeAction','dashCD']]){
   await q.arena(hero,null,difficulty);const e=q.target(G.x+1.2,G.y);await q.settle();G.resonance=100;window[fn]();const cool=act[field]||0,beforeRejected={hp:e.hp,res:G.resonance,cool,events:HeroAttackFX.events.length},pos={x:G.x,y:G.y};window[fn]();const afterRejected={hp:e.hp,res:G.resonance,cool:act[field]||0,events:HeroAttackFX.events.length};
   if(!(cool>0))throw Error(hero+' '+fn+' was not accepted');if(JSON.stringify(beforeRejected)!==JSON.stringify(afterRejected))throw Error(hero+' '+fn+' repeated while rejected: '+JSON.stringify({beforeRejected,afterRejected}));
   const beforePause={hp:e.hp,act:JSON.stringify(act),x:G.x,y:G.y};openSystem();await q.step(1);const frozen={hp:e.hp,act:JSON.stringify(act),x:G.x,y:G.y};await q.step(12);const paused={hp:e.hp,act:JSON.stringify(act),x:G.x,y:G.y};if(JSON.stringify(frozen)!==JSON.stringify(paused))throw Error(hero+' '+fn+' advanced under pause');closeOverlay();rows.push({fn,cool,beforeRejected,afterRejected,position:pos,beforePause,paused:frozen,pause:true});
  }return rows;
 },{hero,difficulty}));
 await check('Delayed projectiles and attacks do not leak into a new area',async()=>page.evaluate(async()=>{
  const q=CombatFinalQA,rows=[];
  for(const hero of ['alt','percussion','synth']){await q.arena(hero);q.target(G.x+3,G.y);await q.settle();advancedSkill();const before={shots:projectiles.length,fields:Special11.fields.length,zones:C3.synthZones.length};setArea('city',29.5,33.5,false);await q.ready();const hp=JSON.stringify(G.hp);await q.step(60);await new Promise(resolve=>setTimeout(resolve,500));if(projectiles.length||C3.synthZones.some(z=>z.area===G.area)||Special11.fields.some(f=>f.area===G.area)||JSON.stringify(G.hp)!==hp)throw Error(hero+' leaked combat into City');rows.push({hero,before,after:{shots:projectiles.length,fields:Special11.fields.length,zones:C3.synthZones.length},mode});}return rows;
 }));

 await check('Percussion accepted delayed X preserves its remaining pulses through manual pause',async()=>{
  const r=await page.evaluate(async()=>{
   const q=CombatFinalQA;await q.arena('percussion');const e=q.target(G.x+2,G.y);await q.settle();const original=C3.percussionPulse,calls=[];
   C3.percussionPulse=function(...args){calls.push({args,mode,time:performance.now()});return original.apply(this,args)};
   try{advancedSkill();await new Promise(r=>setTimeout(r,55));const before={hp:e.hp,calls:calls.length,cooldown:act.skillX};openSystem();await q.step(1);const pauseAt=performance.now(),pauseStart={hp:e.hp,calls:calls.length,cooldown:act.skillX};await new Promise(r=>setTimeout(r,380));const pauseEnd={hp:e.hp,calls:calls.length,cooldown:act.skillX},resumeAt=performance.now();closeOverlay();await new Promise(r=>setTimeout(r,380));return{before,pauseStart,pauseEnd,pauseAt,resumeAt,resumed:{hp:e.hp,calls:calls.length,cooldown:act.skillX},calls};}finally{C3.percussionPulse=original}
  });
  report.percussionPauseEvidence=r;assert.equal(r.before.calls,1,'First native pulse must have fired before pausing');assert.deepEqual(r.pauseStart,r.pauseEnd,'Damage/cooldown advanced while paused');assert.equal(r.resumed.calls,3,'Accepted X permanently lost its remaining pulses while manual pause was open');assert.deepEqual(r.calls.map(c=>c.args[0]),[2.4,3.65,4.9]);assert(r.calls[1].time-r.calls[0].time-(r.resumeAt-r.pauseAt)>95,'Second pulse did not preserve its original remaining interval');assert(r.calls[2].time-r.calls[1].time>95,'Remaining pulses caught up together instead of keeping order/interval');return r;
 });
 await check('P2 basic Archer shot does not become a piercing technique',async()=>{
  const rows=[];
  for(const seat of [0,1])rows.push(await page.evaluate(async seat=>{
   const q=CombatFinalQA;await q.arena(seat?'franco':'alt',seat?'alt':null);G.x=8;G.y=12.5;G.dir='right';G.aim091=[1,0];if(seat)Object.assign(C3.coop,{x:8,y:12.5,dir:'right',area:G.area,invuln:0});
   const first=q.target(10,12.5,'first-target'),second=hydrateEnemy({id:'second-target',type:'hush',x:12,y:12.5});second.hp=second.max=1000;second.cd=second.stun=999;current.enemies.push(second);await q.settle();if(seat)C3.coopAttack(__combatPads[1]);else attackAction();const shot=projectiles.map(p=>({arrow:p.arrow,hitsLeft:p.hitsLeft,piercing:p.piercing}));await q.step(45);return{seat,shot,hp:[first.hp,second.hp]};
  },seat));
  report.piercingEvidence=rows;assert(rows.every(r=>r.hp[0]<1000),'Both native shots must hit their first target');assert.equal(rows[0].hp[1],1000);assert.equal(rows[1].hp[1],1000,'P2 basic arrow pierced a second target without Z technique');return rows;
 });

 await check('Fenda P2 Archer projectile retains its owner and instrument-card effect',async()=>{
  const r=await page.evaluate(async()=>{
   const q=CombatFinalQA;await q.arena('franco','alt');G.c3.complete=true;PostGame.state();setArea('last_torii',13.5,13.5,false);await q.ready();PostGame.startDungeon(4481);await q.ready();let n=0;while(!current.enemies.length&&n++<180)await q.step(1);
   if(!PostGame.active()||!current.enemies.length)throw Error('Native expedition did not spawn');
   const run=PostGame.run();run.upgrades={pierce:5};G.x=8;G.y=12.5;G.dir='right';G.aim091=[1,0];C3.syncCoop(true);Object.assign(C3.coop,{x:8,y:12.5,dir:'right',area:G.area,invuln:0,cool:0});
   const first=q.target(10,12.5,'endless_owner_first',10000),second=hydrateEnemy({id:'endless_owner_second',type:'hush',x:10,y:14});first.endless=second.endless=true;second.hp=second.max=10000;second.cd=second.stun=999;current.enemies.push(second);await q.settle();
   const original=hitEnemy,hits=[];hitEnemy=function(e,...args){hits.push({id:e.id,attacker:PostGame.attackerId(),damage:args[0]});return original(e,...args)};
   try{C3.coopAttack(__combatPads[1]);const shot=projectiles.map(p=>({arrow:p.arrow,source:p.source}));await q.step(20);return{shot,hits,hp:[first.hp,second.hp],card:run.upgrades,active:G.active,p2:C3.coopMember(),runMode:run.mode}}finally{hitEnemy=original}
  });
  report.fendaOwnerEvidence=r;assert(r.hits.some(h=>h.id==='endless_owner_first'),'Actual projectile must hit');assert(r.hits.filter(h=>h.id==='endless_owner_first').every(h=>h.attacker==='alt'),'Delayed P2 arrow was attributed to P1 hero');assert(r.hp[1]<10000,'Archer instrument card did not apply to actual P2 Archer shot');return r;
 });

 await check('Mute aura rejects techniques for both seats without spending resources',async()=>{
  const r=await page.evaluate(async()=>{
   const q=CombatFinalQA,rows=[];
   for(const hero of ['franco','ryuchi','alt','katana','synth','percussion'])for(const seat of [0,1]){
    await q.arena(seat?(hero==='franco'?'ryuchi':'franco'):hero,seat?hero:null);const actor=seat?C3.coop:G;actor.x=10;actor.y=12.5;actor.dir='right';const e=hydrateEnemy({id:'final_mute',type:'abafador',x:12,y:12.5});e.hp=e.max=10000;e.stun=e.cd=999;current.enemies=[e];await q.settle();
    const snapshot=()=>({hp:e.hp,res:G.resonance,cool:seat?C3.coop.cool:act.cool,z:seat?C3.coop.skill:act.skill,x:seat?C3.coop.advanced:act.skillX,k:seat?C3.coop.signature:act.duo,shots:projectiles.length});const before=snapshot();if(seat){C3.coopSkill(__combatPads[1]);C3.coopAdvanced(__combatPads[1]);C3.coopSignature(__combatPads[1]);}else{skillAction();advancedSkill();duoAction()}const after=snapshot();if(JSON.stringify(before)!==JSON.stringify(after))throw Error(hero+' seat'+seat+' spent/hit through mute');if(seat)C3.coopAttack(__combatPads[1]);else attackAction();const basicAccepted=seat?C3.coop.cool>0:act.cool>0;if(!basicAccepted)throw Error(hero+' seat'+seat+' basic wrongly muted');rows.push({hero,seat,before,after,basicAccepted});
   }return rows;
  });return r;
 });
 await check('Dead leader actions cannot spend resonance or create damage before recovery',async()=>{
  const r=await page.evaluate(async()=>{const q=CombatFinalQA,rows=[];for(const hero of ['franco','ryuchi','alt','katana','synth','percussion']){await q.arena(hero);const e=q.target(G.x+1,G.y);await q.settle();G.hp[hero]=0;const before={hp:e.hp,res:G.resonance,shots:projectiles.length,x:G.x,y:G.y};attackAction();skillAction();advancedSkill();duoAction();dodgeAction();const after={hp:e.hp,res:G.resonance,shots:projectiles.length,x:G.x,y:G.y};if(JSON.stringify(before)!==JSON.stringify(after))throw Error(hero+' dead hero accepted gameplay action');rows.push({hero,before,after});}return rows;});return r;
 });

 for(const boss of ['boss','voice_boss','c3_metronome','c3_silence'])for(const difficulty of ['normal','dificil'])await check('Native phase III lifecycle '+boss+' '+difficulty,async()=>{
  const r=await page.evaluate(async({boss,difficulty})=>{
   const q=CombatFinalQA;await q.arena('franco','ryuchi',difficulty);G.c3.started=true;G.flags.voicesBoss=false;G.c3.metronomeDone=false;G.c3.silenceDone=false;
   const area={boss:'ruins',voice_boss:'voice_tower',c3_metronome:'cloud_terrace',c3_silence:'silence_core'}[boss];setArea(area,10,12,false);await q.ready();current.enemies=[];battle=bossActor=null;C3.hazards=[];C3.finalPending=false;
   if(boss==='boss')spawnBossFight(true);else if(boss==='voice_boss')spawnVoiceBoss(true);else if(boss==='c3_metronome')C3.spawnMetronome();else C3.spawnSilence();await q.ready();for(const id of partyMembers())G.hp[id]=G.maxhp[id]=5000;const e=bossActor;if(e?.id!==boss)throw Error('Native spawn did not produce requested boss');e.hp=e.max*.2;await q.step(1);C3.syncCoop(true);const original=C3.fireHazard;let fired=0;C3.fireHazard=function(...args){fired++;return original.apply(this,args)};
   try{let bound=0;for(let i=0;i<600;i++){await q.step(1);bound=Math.max(bound,C3.hazards.length+hostileShots.length+ToriiDificuldade.perigos.length);if(![e.x,e.y,e.hp,G.x,G.y,C3.coop.x,C3.coop.y].every(Number.isFinite))throw Error('Non-finite combat state');if(bossActor!==e||mode!=='action')throw Error('Phase III unexpectedly left native fight');}
    const snap=()=>JSON.stringify({boss:e,hp:G.hp,shots:hostileShots,hazards:C3.hazards,extra:ToriiDificuldade.perigos.map(h=>({time:h.time,x:h.x,y:h.y}))});openSystem();await q.step(1);const before=snap();await q.step(90);const paused=before===snap();closeOverlay();await q.step(180);return{boss,difficulty,phase:e.phase,difficultyPhase:e.f2?.fase,fired,patterns:e.log||[],phaseEvents:e.f2?.log||[],bound,paused,mode,hp:G.hp,p2:C3.coopMember(),validP1:canBody121(G.x,G.y),validP2:canBody121(C3.coop.x,C3.coop.y),metronomeFloor:boss!=='c3_metronome'||metronomeCanStand(e.x,e.y)};
   }finally{C3.fireHazard=original}
  },{boss,difficulty});
  assert.equal(r.difficultyPhase,3);assert(r.paused&&r.validP1&&r.validP2&&r.metronomeFloor,JSON.stringify(r));assert(r.bound<100);if(boss.startsWith('c3_'))assert(r.fired>2);else assert(r.patterns.length>2);return r;
 });

 await check('Deferred percussion pulses cancel on hero, area, game and defeat boundaries',async()=>{
  const rows=[];
  for(const boundary of ['hero','area','game','defeat'])rows.push(await page.evaluate(async boundary=>{
   const q=CombatFinalQA;await q.arena('percussion');G.formation=['percussion','franco'];await q.settle();const e=q.target(G.x+2,G.y);await q.settle();const original=C3.percussionPulse,calls=[];C3.percussionPulse=function(...args){calls.push({args,hero:G.active,area:G.area});return original.apply(this,args)};
   try{advancedSkill();await new Promise(r=>setTimeout(r,55));const before={hp:e.hp,calls:calls.length};if(boundary==='hero')slotSwitch(2);else if(boundary==='area')setArea('city',29.5,33.5,false);else if(boundary==='game')await q.arena('franco');else{for(const id of partyMembers())G.hp[id]=0;showDefeat()}
    await q.ready();await new Promise(r=>setTimeout(r,360));return{boundary,before,after:{hp:e.hp,calls:calls.length},calls,mode,active:G.active,area:G.area};}finally{C3.percussionPulse=original}
  },boundary));
  report.cancelEvidence=rows;for(const r of rows){assert.equal(r.before.calls,1);assert.equal(r.after.calls,1,r.boundary+' leaked a deferred pulse');assert.equal(r.after.hp,r.before.hp)}return rows;
 });

 await check('Imported checkpoint cannot leave retry with an invalid session',async()=>{
  const rows=[];
  for(const variant of ['missing','null','zero','false','empty-string','string','array','empty-object'])rows.push(await page.evaluate(async variant=>{
   const q=CombatFinalQA;await q.arena('franco');const original=G,source=copy(G),values={null:null,zero:0,false:false,'empty-string':'',string:'corrupt',array:[],'empty-object':{}};source.checkpoint={id:'city',area:'studio',x:12.5,y:10.5};if(variant!=='missing')source.checkpoint.snapshot=values[variant];
   let normalized,error=null,gameNull=false;try{normalized=normalizeSave(source);if(normalized?.checkpoint){G=normalized;try{restoreCheckpoint()}catch(e){error=e.message}gameNull=!G;}return{variant,accepted:!!normalized,keptCheckpoint:!!normalized?.checkpoint,error,gameNull};}finally{G=original}
  },variant));report.checkpointEvidence=rows;for(const r of rows)assert(!r.error&&!r.gameNull,'Accepted checkpoint left retry without a valid game: '+JSON.stringify(r));return rows;
 });
 await check('Fenda drum protection is not consumed by an already invulnerable dodge',async()=>{
  const rows=[];
  for(const seat of [0,1])rows.push(await page.evaluate(async seat=>{
   const q=CombatFinalQA;await q.arena('franco',seat?'ryuchi':null);G.c3.complete=true;PostGame.state();setArea('last_torii',13.5,13.5,false);await q.ready();PostGame.startDungeon(4482);await q.ready();let n=0;while(!current.enemies.length&&n++<180)await q.step(1);if(!PostGame.active())throw Error('Native expedition did not start');
   for(const e of current.enemies)e.stun=e.cd=999;G.x=8;G.y=12.5;G.dir='right';G.aim091=[1,0];C3.syncCoop(true);if(seat)Object.assign(C3.coop,{x:13,y:12.5,area:G.area,dir:'right',invuln:0,dash:0,dashCD:0});act.invuln=act.dashCD=0;Combat10.dashTime=0;Object.assign(current.enemies[0],{x:G.x+2,y:G.y,stun:999,cd:999});engage();await q.ready();const r=PostGame.run();r.upgrades.drum=1;r.drum=1;
   if(seat)C3.coopDodge(__combatPads[1]);else dodgeAction();const who=seat?C3.coopMember():G.active,actor=seat?C3.coop:G,before={hp:G.hp[who],drum:r.drum,invuln:seat?C3.coop.invuln:act.invuln,mode};let path;if(seat){path='native damageCoop entry point while dodge invulnerable';C3.damageCoop(12)}else{path='native hostile projectile collision during dodge';hostileShots=[{x:actor.x+.1,y:actor.y,vx:0,vy:0,time:1,damage:12}];await q.step(1)}const after={hp:G.hp[who],drum:r.drum,invuln:seat?C3.coop.invuln:act.invuln,mode},shots=hostileShots.length;act.invuln=act.dash=0;Combat10.dashTime=0;C3.coop.invuln=C3.coop.dash=0;const damage=()=>seat?C3.damageCoop(12):damageHero(12);damage();const eligible={hp:G.hp[who],drum:r.drum,mode};damage();const unshielded={hp:G.hp[who],drum:r.drum};return{seat,who,path,before,after,eligible,unshielded,shots};
  },seat));report.drumEvidence=rows;for(const r of rows){assert(r.before.invuln>0&&r.after.invuln>0);assert.equal(r.eligible.mode,'action','The first eligible hit must happen in actual combat');assert.equal(r.after.hp,r.before.hp);assert.equal(r.after.drum,r.before.drum,'seat'+r.seat+' spent a drum charge on a hit already blocked by dodge');assert.equal(r.eligible.drum,0,'First eligible hit must consume exactly one protection');assert.equal(r.eligible.hp,r.before.hp);assert(r.unshielded.hp<r.eligible.hp,'Following unshielded hit must still deal native damage');}return rows;
 });

 await check('Fenda projectile keeps original P1 instrument after a native leader switch',async()=>{
  const r=await page.evaluate(async()=>{
   const q=CombatFinalQA;await q.arena('alt');G.formation=['alt','franco'];G.c3.complete=true;PostGame.state();setArea('last_torii',13.5,13.5,false);await q.ready();PostGame.startDungeon(4483);await q.ready();let n=0;while(!current.enemies.length&&n++<180)await q.step(1);if(!PostGame.active())throw Error('Native expedition did not start');
   const run=PostGame.run();run.upgrades={pierce:5};G.x=8;G.y=12.5;G.dir='right';G.aim091=[1,0];const first=q.target(10,12.5,'endless_swap_first',10000),second=hydrateEnemy({id:'endless_swap_second',type:'hush',x:10,y:14});first.endless=second.endless=true;second.hp=second.max=10000;second.stun=second.cd=999;current.enemies.push(second);await q.settle();
   const original=hitEnemy,hits=[];hitEnemy=function(e,...args){hits.push({id:e.id,attacker:PostGame.attackerId(),damage:args[0]});return original(e,...args)};try{attackAction();const fired=projectiles.length;slotSwitch(2);const activeAfter=G.active;await q.step(20);return{fired,activeAfter,hits,hp:[first.hp,second.hp]};}finally{hitEnemy=original}
  });report.p1SwapOwnerEvidence=r;assert(r.fired>0&&r.activeAfter==='franco');assert(r.hits.some(h=>h.id==='endless_swap_first'));assert(r.hits.filter(h=>h.id==='endless_swap_first').every(h=>h.attacker==='alt'),'P1 projectile borrowed the new leader instrument');assert(r.hp[1]<10000);return r;
 });

 await check('Fenda drum protection preserves accepted perfect defenses and counters',async()=>{
  const rows=[];
  for(const hero of ['katana','percussion'])for(const drum of [0,1])rows.push(await page.evaluate(async({hero,drum})=>{
   const q=CombatFinalQA;await q.arena(hero);G.c3.complete=true;PostGame.state();setArea('last_torii',13.5,13.5,false);await q.ready();PostGame.startDungeon(4484);await q.ready();let n=0;while(!current.enemies.length&&n++<180)await q.step(1);if(!PostGame.active())throw Error('Native expedition did not start');
   G.x=8;G.y=12.5;G.dir='right';G.aim091=[1,0];const e=q.target(10,12.5,'endless_parry_target',10000);e.endless=true;await q.settle();engage();act.invuln=act.skillX=act.skill=0;Combat10.guard=Combat10.dashTime=C3.percussionGuard=0;const guard=()=>hero==='katana'?Combat10.guard:C3.percussionGuard,run=PostGame.run();run.upgrades={drum:drum?1:0};run.drum=drum;G.resonance=20;if(hero==='katana')advancedSkill();else skillAction();const before={hp:G.hp[hero],target:e.hp,drum:run.drum,guard:guard(),res:G.resonance};hostileShots=[{x:G.x+.4,y:G.y,vx:0,vy:0,time:1,damage:12}];await q.step(1);return{hero,drum,before,after:{hp:G.hp[hero],target:e.hp,drum:run.drum,guard:guard(),res:G.resonance,invuln:act.invuln},shots:hostileShots.length,mode};
  },{hero,drum}));report.parryDrumEvidence=rows;for(const r of rows){assert(r.before.guard>0&&r.mode==='action');assert.equal(r.after.hp,r.before.hp);assert(r.after.target<r.before.target,'Drum protection suppressed the native perfect-parry counter');assert.equal(r.after.guard,0);assert.equal(r.after.drum,r.before.drum,'A perfect parry spent a drum charge');assert(r.after.res>r.before.res);}return rows;
 });
 report.passed=report.cases.filter(c=>c.passed).length;report.failed=report.cases.length-report.passed;assert.deepEqual(report.errors,[]);console.log(JSON.stringify({passed:report.passed,failed:report.failed,source:report.build?.sourceSha256,errors:report.errors}));process.exitCode=report.failed?1:0;
})().catch(e=>{report.fatal=e.message;console.error(e.message);process.exitCode=1}).finally(async()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'COMBAT_FINAL.json'),JSON.stringify(report,null,2)+'\n');await browser?.close()});
