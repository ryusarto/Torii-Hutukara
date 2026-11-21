// Actual combat entry points in an isolated Chrome context. The flat arena
// removes story gates; cooldowns and input acceptance still come from the game.
'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_CORE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
  await page.goto(process.argv[2],{waitUntil:'load',timeout:120000});
  const result=await page.evaluate(async()=>{
   HeroAttackFX.prepare();
   await Promise.all([HeroAttackFX.atlas.decode(),HeroAttackFX.sword.decode()]);
   const actors=['franco','ryuchi','alt','katana','synth','percussion'];
   const p1=[()=>attackAction(),()=>skillAction(),()=>advancedSkill(),()=>duoAction()];
   const p2=[()=>C3.coopAttack(),()=>C3.coopSkill(),()=>C3.coopAdvanced(),()=>C3.coopSignature()];
   const rows=[];
   function arena(hero,seat){
    G=fresh();const other=hero==='franco'?'ryuchi':'franco';
    G.active=seat?other:hero;G.formation=[G.active,seat?hero:other];
    G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;
    G.c3.synthUnlocked=G.c3.percussionUnlocked=true;
    for(const id of G.formation){G.hp[id]=G.maxhp[id]=100;G.levels[id]=5}
    G.resonance=100;current=mk('forest',40,30,'grass');G.area='forest';
    G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
    mode='action';battle={boss:false,id:'field'};bossActor=null;keys={};tick=8;menuOpen=false;
    C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;
    resetMotion10();Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,combo:0,comboTime:0});
    C3.pad.pads=[{index:0},{index:1}];C3.coop.member=G.formation[1];C3.syncCoop(true);
    Object.assign(C3.coop,{x:14,y:15,dir:'left',cool:0,skill:0,advanced:0,signature:0,combo:0,lastAttack:-20});
    HeroAttackFX.sync();cam.x=cam.y=0;
   }
   for(let h=0;h<actors.length;h++)for(let seat=0;seat<2;seat++)for(let action=0;action<4;action++){
    const hero=actors[h];arena(hero,seat);
    const invoke=(seat?p2:p1)[action];invoke();
    const event=HeroAttackFX.events.at(-1);
    if(!event || event.row!==h*4+action)throw Error('Missing cast '+[hero,seat,action,event?.row]);
    if(seat && Math.hypot(event.x-14,event.y-15)>.51)throw Error('P2 cast drawn at wrong origin');
    const count=HeroAttackFX.events.length;
    invoke();if(HeroAttackFX.events.length!==count)throw Error('Rejected action restarted '+[hero,seat,action]);
    const images=[],original=ctx.drawImage;
    try{ctx.drawImage=function(bitmap,...args){images.push({bitmap:bitmap===HeroAttackFX.sword?'sword':'atlas',tile:args.slice(0,4)});return original.call(this,bitmap,...args)};HeroAttackFX.draw()}
    finally{ctx.drawImage=original}
    if(!images.length)throw Error('Accepted action not drawn '+[hero,seat,action]);
    rows.push({hero,seat,action,row:event.row,bitmap:images.at(-1).bitmap});
   }
   const combos=[];
   for(const hero of actors.filter(h=>h!=='alt'))for(let seat=0;seat<2;seat++){
    arena(hero,seat);const events=[];
    for(let n=0;n<3;n++){
     const body=seat?C3.coop:act;body.cool=0;tick+=.24;(seat?p2:p1)[0]();
     const event=HeroAttackFX.events.at(-1);events.push([event.row,event.sword]);
    }
    if(new Set(events.map(v=>v[0])).size!==3)throw Error('Combo lacks distinct frames '+hero+'/'+seat+'/'+JSON.stringify(events));
    if(hero==='ryuchi' && JSON.stringify(events.map(v=>v[1]))!==JSON.stringify([true,false,false]))throw Error('Ryuchi combo repeats sword sheet');
    combos.push({hero,seat,events});
   }
   arena('alt',0);p1[1]();const arrow=projectiles.at(-1),before=JSON.stringify(arrow);
   if(!arrow?.arrow || !HeroAttackFX.drawProjectile(arrow) || before!==JSON.stringify(arrow))throw Error('Arrow lost sprite or mutated');
   const time=HeroAttackFX.clock;mode='overlay';HeroAttackFX.advance(.5);if(time!==HeroAttackFX.clock)throw Error('Pause advances FX');
   mode='action';HeroAttackFX.advance(1);if(HeroAttackFX.events.length)throw Error('Cast outlives its timer');
   let phases=0;
   function expectRow(row,label){
    if(!HeroAttackFX.events.some(event=>event.row===row))throw Error('Missing '+label);
    phases++;
   }
   arena('katana',0);p1[2]();act.invuln=0;
   damageHero(4,hydrateEnemy({id:'qa_guard',type:'hush',x:G.x+.65,y:G.y}));
   expectRow(34,'successful katana counter');
   arena('percussion',0);p1[1]();act.invuln=0;damageHero(4,{type:'hush',x:G.x+.65,y:G.y});
   expectRow(35,'successful percussion counter');
   // Drain timers from preceding casts before measuring one actual break sequence.
   arena('franco',0);await new Promise(resolve=>setTimeout(resolve,330));
   arena('percussion',0);p1[2]();await new Promise(resolve=>setTimeout(resolve,400));
   if(HeroAttackFX.events.filter(event=>event.row===39).length!==3)throw Error('Expected three actual drum releases');
   phases++;
   arena('synth',0);p1[1]();expectRow(41,'actual pad');p1[2]();expectRow(40,'filter release');
   arena('alt',0);p1[3]();
   for(let i=0;i<3;i++){mode='action';updateAction(i?.33:.66)}
   if(HeroAttackFX.events.filter(event=>event.row===36).length!==3)throw Error('Rain must use each actual release');
   phases++;
   arena('franco',0);C3.pad.pads=[];const ally=getFollower(0);
   current.enemies=[hydrateEnemy({id:'qa_ally',type:'hush',x:ally.x+.3,y:ally.y})];
   companionCooldown=0;updateAction(.016);
   expectRow(4,'autonomous follower strike');
   return {casts:rows.length,combos:combos.length,phases,atlas:[HeroAttackFX.atlas.naturalWidth,HeroAttackFX.atlas.naturalHeight],sword:[HeroAttackFX.sword.naturalWidth,HeroAttackFX.sword.naturalHeight]};
  });
  assert.equal(result.casts,48);assert.equal(result.combos,10);assert.deepEqual(result.atlas,[1920,2304]);assert.deepEqual(result.sword,[512,128]);assert.deepEqual(errors,[]);
  console.log('Hero attack FX passed',JSON.stringify(result));
 } finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
