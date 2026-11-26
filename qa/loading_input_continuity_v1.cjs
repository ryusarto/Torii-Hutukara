'use strict';
// Native Chromium multitouch + keyboard; the shipped simulation is stepped
// deterministically. This does not certify physical touch hardware or FPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),url=process.argv[2]||'http://127.0.0.1:8894/';
const output=process.env.LOADING_INPUT_OUTPUT||path.join(root,'qa/beta-1.26.0/loading-input/BROWSER.json');
const report={url,method:'Real CDP touchStart/touchEnd/touchCancel, trusted keyboard, actual update/draw callbacks; isolated temporary save.',checks:[],errors:[]};
let browser,page,cdp,activeTouches=[];
async function check(name,fn){try{const detail=await fn();report.checks.push({name,passed:true,detail});console.log('PASS '+name)}catch(e){report.checks.push({name,passed:false,error:e.stack});throw e}}
function fixture(){
 window.InputGateQA={
  async arena(){
   await FinalAssetLoadingV1.ready();G=fresh();G.active='franco';G.formation=['franco','ryuchi'];G.flags.bass=true;G.knownMembers=C3.unlockedRoster().slice();
   current=mk('forest',64,64,'grass');G.area='forest';G.x=G.y=24.5;G.dir='right';G.aim091=[1,0];
   const enemy=hydrateEnemy({id:'continuity-target',type:'hush',x:G.x+3,y:G.y});enemy.hp=enemy.max=9999999;enemy.cd=enemy.stun=999;current.enemies.push(enemy);window.__continuityTarget=enemy;
   mode='action';battle={boss:false,id:'field'};bossActor=null;C3.pad.pads=[];C3.hazards=[];projectiles=[];hostileShots=[];companionCooldown=999;
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';
   resetMotion10();releaseAll121();Object.assign(act,{cool:0,combo:0,comboTime:0,skill:0,skillX:0,dashCD:0,invuln:0,hit:0});Input121.focused=true;Input121.game=G;Input121.lastArea=G.area;
   updateMobileLayout121();await FinalAssetLoadingV1.start();update(0);await FinalAssetLoadingV1.ready();transitionAlpha=screenShake=0;drawEnv();await FinalAssetLoadingV1.ready();
  },
  input(){return{pointers:Input121.pointers.size,actions:[...Input121.pointers.values()].map(p=>p.action).sort(),touch:[...Input121.touch],key:!!keys.d,newKey:!!keys.a,attack:attackHeld,stick:Input121.stickPointer,mode,loading:FinalAssetLoadingV1.busy()}},
  hold(){
   window.__releaseContinuity=null;const image=new Image();image.src=ProtagonistArtV5.assets.franco_idle;let released=false;const decode=image.decode.bind(image),complete=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'complete').get;
   Object.defineProperty(image,'complete',{get:()=>released&&complete.call(image)});image.decode=()=>new Promise((resolve,reject)=>{window.__releaseContinuity=()=>{released=true;return decode().then(resolve,reject)}});
   FinalAssetLoadingV1.start({force:true,extra:[{image,label:'controlled same-scene late asset'}]});
  },
  frozen(){return{game:JSON.stringify(G),tick,art:ProtagonistArtV5.clock,music:MusicianArtV1.clock,fx:HeroAttackFX.clock,record:JSON.stringify(ProtagonistArtV5.players),cool:act.cool,hp:__continuityTarget.hp}},
  step(count=1){for(let i=0;i<count;i++){tick+=1/60;update(1/60);drawEnv()}return{x:G.x,y:G.y,hp:__continuityTarget.hp,input:this.input()}},
  points(action='attack'){
   const stick=$('mobileStick121').getBoundingClientRect(),button=document.querySelector('[data-mobile-action="'+action+'"]').getBoundingClientRect();
   return[{id:1,x:stick.x+stick.width*.75,y:stick.y+stick.height/2},{id:2,x:button.x+button.width/2,y:button.y+button.height/2}];
  }
 };
}
async function touches(type,points){if((type==='touchCancel'||type==='touchEnd')&&!activeTouches.length)return;await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});activeTouches=type==='touchCancel'?[]:type==='touchEnd'?(points.length?activeTouches.filter(point=>!points.some(ended=>ended.id===point.id)):[]):points}
async function prepare(action='attack'){
 await touches('touchCancel',[]);await page.keyboard.up('d');await page.keyboard.up('a');await page.evaluate(()=>InputGateQA.arena());
 const points=await page.evaluate(action=>InputGateQA.points(action),action);await page.keyboard.down('d');await touches('touchStart',points);
 const before=await page.evaluate(()=>InputGateQA.input());assert.equal(before.pointers,2,JSON.stringify(before));assert(before.touch[0]>.1&&before.key);if(action==='attack')assert(before.attack);return{points,before};
}
async function hold(){await page.evaluate(()=>InputGateQA.hold());await page.waitForFunction(()=>typeof __releaseContinuity==='function',null,{polling:10})}
async function resume(){await page.evaluate(()=>__releaseContinuity());await page.evaluate(()=>FinalAssetLoadingV1.ready())}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 page=await context.newPage();cdp=await context.newCDPSession(page);page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(url,{waitUntil:'load',timeout:180000});await page.evaluate(fixture);report.source=await page.evaluate(()=>TORII_PLAYTEST_BUILD.sourceSha256);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.source,process.env.EXPECTED_SOURCE_SHA);
 await check('Same-scene late asset preserves two held fingers and keyboard, freezes all simulation, then resumes movement and attack',async()=>{
  const prepared=await prepare();await hold();const during=await page.evaluate(()=>InputGateQA.input());report.heldEvidence={before:prepared.before,during};
  assert.equal(during.pointers,2,JSON.stringify(report.heldEvidence));assert(during.touch[0]>.1&&during.key&&during.attack,JSON.stringify(report.heldEvidence));
  const frozen=await page.evaluate(()=>InputGateQA.frozen());await page.evaluate(()=>{update(.3);drawEnv();loop(1000);loop(1050)});await page.waitForTimeout(170);assert.deepEqual(await page.evaluate(()=>InputGateQA.frozen()),frozen);
  await page.keyboard.down('a');assert.equal((await page.evaluate(()=>InputGateQA.input())).newKey,false);await page.keyboard.up('a');
  await resume();const afterInput=await page.evaluate(()=>InputGateQA.input());assert.equal(afterInput.pointers,2);assert(afterInput.key&&afterInput.attack&&afterInput.touch[0]>.1);
  const after=await page.evaluate(()=>InputGateQA.step(36));assert(after.x>JSON.parse(frozen.game).x+.2,JSON.stringify(after));assert(after.hp<frozen.hp,JSON.stringify({after,frozen}));
  await touches('touchEnd',[]);await page.keyboard.up('d');const released=await page.evaluate(()=>InputGateQA.input());assert.equal(released.pointers,0);assert(!released.attack&&!released.key&&released.touch[0]===0);return{...prepared,during,afterInput,after,released};
 });
 await check('Releasing one finger during loading clears only that hold; keyup is honored',async()=>{
  const prepared=await prepare();await hold();await touches('touchEnd',[prepared.points[1]]);await page.keyboard.up('d');const released=await page.evaluate(()=>InputGateQA.input());assert.equal(released.pointers,1);assert.deepEqual(released.actions,['stick']);assert(!released.attack&&!released.key&&released.touch[0]>.1);
  await resume();const before=await page.evaluate(()=>({x:G.x,hp:__continuityTarget.hp})),after=await page.evaluate(()=>InputGateQA.step(12));assert(after.x>before.x+.1);assert.equal(after.hp,before.hp);await touches('touchEnd',[]);return{released,after};
 });
 await check('Releasing both fingers during loading leaves no held state or replay after resume',async()=>{
  await prepare();await hold();await touches('touchEnd',[]);await page.keyboard.up('d');const released=await page.evaluate(()=>InputGateQA.input());assert.equal(released.pointers,0);assert(!released.attack&&!released.key&&released.touch[0]===0);
  const before=await page.evaluate(()=>({x:G.x,hp:__continuityTarget.hp}));await resume();const after=await page.evaluate(()=>InputGateQA.step(45));assert.equal(after.x,before.x);assert.equal(after.hp,before.hp);assert.equal(after.input.pointers,0);return{released,before,after};
 });
 await check('Native touch cancellation during loading releases both controls',async()=>{
  await prepare();await hold();await touches('touchCancel',[]);await page.keyboard.up('d');const cancelled=await page.evaluate(()=>InputGateQA.input());assert.equal(cancelled.pointers,0);assert(!cancelled.attack&&!cancelled.key&&cancelled.touch[0]===0);await resume();return cancelled;
 });
 await check('New touch downs are blocked during loading and a released pause gesture never replays its menu',async()=>{
  const prepared=await prepare('pause');await hold();await touches('touchStart',[...prepared.points,{id:3,x:prepared.points[0].x-20,y:prepared.points[0].y}]);assert.equal((await page.evaluate(()=>InputGateQA.input())).pointers,2);
  await touches('touchEnd',[]);await page.keyboard.up('d');assert.equal((await page.evaluate(()=>InputGateQA.input())).pointers,0);await resume();await page.waitForTimeout(160);
  const state=await page.evaluate(()=>({input:InputGateQA.input(),overlay:!$('overlay').classList.contains('hidden')}));assert.equal(state.input.mode,'action');assert.equal(state.overlay,false);return state;
 });
 await check('New area and new game boundaries still clear existing held inputs',async()=>{
  const rows=[];for(const boundary of ['area','game']){
   await prepare();const cleared=await page.evaluate(async boundary=>{
    if(boundary==='area'){mk('city',64,64,'grass');setArea('city',24.5,24.5,false)}else{G=fresh();G.area='forest';G.x=G.y=24.5;current=areas.forest;mode='walk';await FinalAssetLoadingV1.start()}
    await FinalAssetLoadingV1.ready();return InputGateQA.input();
   },boundary);assert.equal(cleared.pointers,0);assert(!cleared.key&&!cleared.attack&&cleared.touch[0]===0);await touches('touchEnd',[]);await page.keyboard.up('d');rows.push({boundary,cleared});
  }return rows;
 });
 assert.deepEqual(report.errors,[]);console.log('PASS '+report.checks.length);
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');await browser?.close()});
