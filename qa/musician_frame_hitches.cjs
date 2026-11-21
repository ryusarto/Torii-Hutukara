/* Real accepted attacks + renderer under controlled 60Hz,30Hz and a 60ms hitch.
 * No module/PNG replacement, no record/pose/frame assignments, disposable saves.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
(async()=>{
 let browser,context;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  context=await browser.newContext({viewport:{width:960,height:640}});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.__hitchPads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>window.__hitchPads});window.__hitchPad=i=>({index:i,id:'HitchQA'+i,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});});
  const url=process.argv[2];await page.goto(url,{waitUntil:'load',timeout:120000});
  const report=await page.evaluate(async()=>{
   const art=MusicianArtV1,heroes=['synth','percussion'],variants=['unmasked','masked'],cases=[];
   function step(dt){tick+=dt;update(dt)}
   function arena(hero,variant,seat){
    const other=heroes.find(id=>id!==hero);G=fresh();G.active=seat===0?hero:other;G.formation=[G.active,seat===1?hero:other];G.flags.reveal=G.flags.voicesKatana=G.flags.bass=true;G.c3.started=G.c3.synthUnlocked=G.c3.percussionUnlocked=true;
    for(const id of heroes)G.hp[id]=G.maxhp[id]=100;
    current=mk('power_plant',64,64,'grass');G.area='power_plant';G.x=G.y=32.5;G.dir='right';G.aim091=[1,0];
    const target=hydrateEnemy({id:'hitch-target',type:'hush',x:G.x+1,y:G.y});target.hp=target.max=9999999;target.stun=target.cd=999;current.enemies.push(target);
    mode='action';menuOpen=false;battle={boss:false,id:'field'};bossActor=null;keys={};following=[];
    Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,dashCD:0,invuln:0,combo:0,comboTime:0});C3.synthWave=0;C3.synthZones=[];C3.percussionGuard=0;G.resonance=100;projectiles=[];hostileShots=[];
    resetMotion10();stride10=0;lastAnimArea10=G.area;Input121.game=G;Input121.lastArea=G.area;Input121.focused=true;Input121.wasCoop=false;
    C3.pad.previous.clear();window.__hitchPads=seat===1?[window.__hitchPad(0),window.__hitchPad(1)]:[];C3.pad.pads=window.__hitchPads;C3.coop.member=G.formation[1];C3.coop.actor123=null;if(seat===1)C3.syncCoop(true);Input121.wasCoop=seat===1;
    Object.assign(C3.coop,{cool:0,skill:0,advanced:0,signature:0,combo:0,hit:0,dash:0,dashCD:0,invuln:0,stride:0,running:false,moving:false,dir:'right'});
    art.reset();art.setVariant(hero,variant);$('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';cam.x=G.x*T-160;cam.y=G.y*T-160;
   }
   for(const hero of heroes)for(const variant of variants)for(const seat of [0,1])for(const stage of [1,2,3])for(const profile of ['60hz','30hz','60ms_hitch']){
    const item={hero,variant,seat,stage,profile,frames:[],samples:[],passed:false};
    try{
     arena(hero,variant,seat);const state='attack_'+stage;
     await HeroAttackBody.sheet(hero,variant).decode();
     await Promise.all(['idle',state].map(s=>art.image(art.key(hero,variant,s)).decode()));
     const body=seat===0?act:C3.coop;
     for(let combo=1;combo<=stage;combo++){
      for(let n=0;body.cool>0&&n<180;n++)step(1/60);
      (seat===0?attackAction:()=>C3.coopAttack(window.__hitchPads[1]))();
      if(art.players[seat]?.state!=='attack_'+combo)throw Error('Accepted combo missing '+combo+' actual='+art.players[seat]?.state+' combo='+body.combo+' cool='+body.cool+' tick='+tick+' last='+body.lastAttack+' actor='+body.actor123);
     }
     const record=art.players[seat],duration=record.duration,key=art.key(hero,variant,state);item.duration=duration;let elapsed=0;
     const draw=()=>{const body=seat===0?G:C3.coop,calls=[],prior=ctx.drawImage;ctx.drawImage=function(...a){calls.push(a);return prior.apply(this,a)};try{drawActor({style:hero,dir:'right'},body.x*T-cam.x,body.y*T-cam.y,false)}finally{ctx.drawImage=prior}
      const contact=calls.find(a=>a[0]===HeroAttackBody.sheet(hero,variant));const action=calls.find(a=>a[0]===art.images[key]);const actual=contact?'contact':action?action[1]/256:null;item.samples.push({elapsed,frame:actual,cool:seat===0?act.cool:C3.coop.cool});if(actual!==null&&item.frames.at(-1)!==actual)item.frames.push(actual);};
     draw();for(let n=0;n<120&&elapsed<duration+.25;n++){
      const dt=profile==='30hz'?1/30:profile==='60ms_hitch'&&n===4?.06:1/60;step(dt);elapsed+=dt;draw();
     }
     item.lastActionAt=item.samples.filter(s=>s.frame!==null).at(-1)?.elapsed??null;
     item.passed=item.frames.join(',')==='0,1,2,3,contact,4,5,6,7'&&item.lastActionAt<=duration+.117;
     if(!item.passed)item.failure='Expected eight ordered original frames plus the authored body contact and a bounded visual tail';
    }catch(e){item.failure=e.message}cases.push(item);
   }
   return {cases,metadata:{version:ToriiPlaytest.version,sourceSha:ToriiPlaytest.sourceSha256},method:'accepted real P1/P2 attacks, natural combo cooldowns, actual update/drawActor calls; controlled simulation intervals, not a hardware FPS claim'};
  });
  report.errors=errors;report.passed=report.cases.length===72&&report.cases.every(c=>c.passed)&&errors.length===0;
  const output=process.env.MUSICIAN_HITCH_OUTPUT||path.join(__dirname,'beta-'+report.metadata.version,'MUSICIAN_FRAME_HITCHES.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,failures:report.cases.filter(c=>!c.passed).map(c=>({hero:c.hero,variant:c.variant,seat:c.seat,stage:c.stage,profile:c.profile,frames:c.frames,failure:c.failure})),errors}));
  if(!process.env.MUSICIAN_ALLOW_FAILURE)assert(report.passed,'Actual rendered attack frame omission');
 }finally{if(context)await context.close();if(browser)await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
