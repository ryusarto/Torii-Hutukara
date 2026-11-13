/* Run with Node and PLAYWRIGHT_CORE pointing at an installed playwright-core.
 * Browser isolation: connect to a disposable headless Chrome on port 9223.
 * No player save is read or modified: each context is new.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'../..');
const build=path.join(root,'game/builds/alpha-1.2.3/TORII_HUTUKARA_ALPHA_1_2_3_MOBILE_COOP.html');
const results=[];
async function main(){
  const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.requestAnimationFrame=()=>0;
    window.__pads=[];
    Object.defineProperty(navigator,'getGamepads',{value:()=>window.__pads});
    window.__pad=(index,axes=[0,0],buttons=[])=>({index,id:'DualSense test '+index,connected:true,mapping:'standard',axes,buttons:Array.from({length:18},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0}))});
  });
  await page.goto(pathToFileURL(build).href,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>typeof Input121!=='undefined');
  async function check(name,fn){await fn();results.push({name,passed:true});console.log('OK · '+name)}
  async function arena(){await page.evaluate(()=>{
    G=fresh();G.active='ryuchi';G.formation=['franco','ryuchi'];G.hp.franco=G.hp.ryuchi=100;
    current=mk('studio',40,30,'grass');G.area=current.id;G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
    mode='walk';battle=null;bossActor=null;act.cool=act.dashCD=act.invuln=0;keys={};
    Input121.pad=[0,0];Input121.touch=[0,0];resetMotion10();Combat10.area=G.area;Combat10.active=G.active;
    C3.pad.previous.clear();window.__pads=[];C3.pad.pads=[];Input121.wasCoop=false;
    $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('hud').style.display='block';
  })}
  await check('Desktop starts with keyboard layout and no touch deck',async()=>{
    assert(await page.evaluate(()=>document.documentElement.classList.contains('desktop121')));
    assert.equal(await page.locator('#mobileDeck121').isVisible(),false);
  });
  await check('No gamepad does not erase touch-owned movement or attack',async()=>{
    await arena();const v=await page.evaluate(()=>{Input121.touch=[1,0];Input121.touchRun=true;Input121.pointers.set(11,{action:'attack'});C3.pollControllers(100);return {x:Input121.touch[0],run:runningTouch,attack:attackHeld}});
    assert.deepEqual(v,{x:1,run:true,attack:true});await page.evaluate(()=>releaseTouch121());
  });
  await check('Circle rolls in peaceful areas; only Options opens pause',async()=>{
    await arena();const v=await page.evaluate(()=>{window.__pads=[window.__pad(0,[0,0],[1])];C3.pollControllers(100);return {mode,dash:Combat10.dashTime}});
    assert.equal(v.mode,'walk');assert(v.dash>0);
    await page.evaluate(()=>{window.__pads=[window.__pad(0,[0,0],[])];C3.pollControllers(110);window.__pads=[window.__pad(0,[0,0],[9])];C3.pollControllers(120)});
    assert.equal(await page.evaluate(()=>mode),'overlay');
  });
  await check('All six rolls have stable distance and duration independent of frame rate',async()=>{
    await arena();const values=await page.evaluate(()=>{
      const out=[];
      for(const id of Object.keys(CombatFeel121))for(const hz of [30,60,120]){
        G.formation=[id];G.active=id;G.hp[id]=100;G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
        act.dashCD=0;resetMotion10();startRoll121();const duration=Combat10.dashTime;
        for(let i=0;i<hz*2&&Combat10.dashTime>0;i++)tickMotion10(1/hz);
        out.push({id,hz,duration,distance:G.x-10.5,expected:feel121(id).distance});
      }
      return out;
    });
    for(const v of values){assert(Math.abs(v.distance-v.expected)<.001,JSON.stringify(v));assert(v.duration>=.34)}
  });
  await check('Roll stops at walls with full body radius at high and low frame rates',async()=>{
    await arena();const v=await page.evaluate(()=>{for(let y=0;y<30;y++)current.blocked.add('12,'+y);G.x=11.5;act.dashCD=0;startRoll121();for(let i=0;i<30;i++)tickMotion10(1/30);return {x:G.x,valid:canBody121(G.x,G.y)}});
    assert(v.valid);assert(v.x<11.72);
  });
  await check('Ryuchi roll completes through the real game update without double displacement',async()=>{
    await arena();const v=await page.evaluate(()=>{
      Input121.game=G;Input121.lastArea=G.area;startRoll121();
      for(let i=0;i<30;i++){tick+=1/60;update(1/60)}
      return {distance:G.x-10.5,rolling:Combat10.dashTime,valid:canBody121(G.x,G.y)};
    });assert(v.valid);assert(Math.abs(v.distance-2.93)<.01,JSON.stringify(v));assert.equal(v.rolling,0);
  });
  await check('Player 2 is smoothly pulled around a building without teleport or wall penetration',async()=>{
    await arena();const v=await page.evaluate(()=>{
      window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;
      G.x=18.5;G.y=12.5;C3.syncCoop(true);C3.coop.x=7.5;C3.coop.y=12.5;C3.coop.lastGood={x:7.5,y:12.5};
      for(let y=9;y<=15;y++)for(let x=12;x<=15;x++)current.blocked.add(x+','+y);
      let maxStep=0,invalid=0;for(let i=0;i<900;i++){const x=C3.coop.x,y=C3.coop.y;C3.coopMove(window.__pads[1],1/60);maxStep=Math.max(maxStep,Math.hypot(C3.coop.x-x,C3.coop.y-y));if(!canBody121(C3.coop.x,C3.coop.y))invalid++}
      return {maxStep,invalid,distance:Math.hypot(C3.coop.x-G.x,C3.coop.y-G.y)};
    });
    assert(v.maxStep<.15,JSON.stringify(v));assert.equal(v.invalid,0);assert(v.distance<=9.6,JSON.stringify(v));
  });
  await check('Map entry near a wall finds a valid player 2 spawn',async()=>{
    await arena();const v=await page.evaluate(()=>{window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;G.x=5.5;G.y=5.5;for(let y=5;y<=7;y++)current.blocked.add('4,'+y);C3.syncCoop(true);return canBody121(C3.coop.x,C3.coop.y)});assert(v);
  });
  await check('Two controllers do not advance player 2 during pause',async()=>{
    await arena();const v=await page.evaluate(()=>{window.__pads=[window.__pad(0),window.__pad(1,[1,0])];C3.pad.pads=window.__pads;C3.syncCoop(true);C3.coop.dash=.2;mode='overlay';const x=C3.coop.x;for(let i=0;i<30;i++)C3.pollControllers(i*16);return {dx:C3.coop.x-x,dash:C3.coop.dash}});assert.equal(v.dx,0);assert.equal(v.dash,.2);
  });
  await check('Player 2 can leave a blocked legacy position without disconnecting',async()=>{
    await arena();const v=await page.evaluate(()=>{window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;C3.syncCoop(true);current.blocked.add(Math.floor(C3.coop.x)+','+Math.floor(C3.coop.y));C3.coop.lastGood=null;C3.syncCoop();return canBody121(C3.coop.x,C3.coop.y)});assert(v);
  });
  await check('Final bosses expose a recovery window after the pattern resolves',async()=>{
    await arena();const v=await page.evaluate(()=>{
      bossActor={id:'c3_silence',x:15,y:10,hp:100,max:100,phase:1,cd:0,stun:0,flash:0};
      C3.finalPending=false;C3.hazards=[{kind:'ring',time:.01,max:1,trigger:.17,fired:true}];
      C3.updateHazards(.02,bossActor);updateEnemy(bossActor,.02,true);
      return {recovery:bossActor.recovery121,stun:bossActor.stun,hazards:C3.hazards.length};
    });assert(v.recovery>.5);assert(v.stun>.5);assert.equal(v.hazards,0);
  });
  await check('Final boss alternates its aimed attacks between both players',async()=>{
    await arena();const v=await page.evaluate(()=>{
      window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;C3.syncCoop(true);
      G.x=10;G.y=15;C3.coop.x=20;C3.coop.y=10;
      bossActor={id:'c3_silence',x:15,y:10,hp:100,max:100,phase:1,cd:0};C3.hazards=[];
      C3.castPattern(bossActor,'ring');C3.hazards=[];C3.castPattern(bossActor,'fan');
      return {angle:C3.hazards[0].angle,x:G.x,y:G.y};
    });assert(Math.abs(v.angle)<.001);assert.equal(v.x,10);assert.equal(v.y,15);
  });

  await check('P2 identity changes cancel roll and attack state without touching P1',async()=>{
    await arena();const v=await page.evaluate(()=>{
      G.formation=['ryuchi','percussion','franco'];G.hp.percussion=G.hp.franco=100;
      window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;C3.coop.member='percussion';C3.syncCoop(true);
      C3.coopDodge(window.__pads[1]);const first=C3.coop.rollHero;C3.coop.attackHero='percussion';C3.coop.attackUntil=tick+1;
      C3.cycleCoop();return {first,id:C3.coopMember(),roll:C3.coop.dash,hero:C3.coop.rollHero,attack:C3.coop.attackHero,leader:G.active};
    });assert.equal(v.first,'percussion');assert.equal(v.id,'franco');assert.equal(v.roll,0);assert.equal(v.hero,null);assert.equal(v.attack,null);assert.equal(v.leader,'ryuchi');
  });
  await check('Six P2 attacks retain character identity and never mutate P1 action state',async()=>{
    await arena();const v=await page.evaluate(()=>{
      current.id='forest';G.area='forest';G.active='ryuchi';window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;
      const before=JSON.stringify(act),motion=JSON.stringify(C3.percussionMotion),out=[];
      for(const id of ['franco','ryuchi','alt','katana','synth','percussion']){
        G.active=id==='ryuchi'?'franco':'ryuchi';G.formation=[G.active,id];G.hp[id]=100;C3.coop.member=id;C3.syncCoop(true);C3.coop.cool=0;C3.coop.dash=0;mode='walk';
        C3.coopAttack(window.__pads[1]);out.push({id,hero:C3.coop.attackHero,roll:C3.coop.dash});
      }return {out,same:before===JSON.stringify(act),motion:motion===JSON.stringify(C3.percussionMotion)};
    });assert(v.same);assert(v.motion);for(const x of v.out){assert.equal(x.hero,x.id);assert.equal(x.roll,0)}
  });
  await check('P2 interacts at its own position and can travel nine tiles before pull',async()=>{
    await arena();const v=await page.evaluate(()=>{
      window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;C3.syncCoop(true);G.x=10.5;G.y=12.5;C3.coop.x=19.5;C3.coop.y=12.5;
      let count=0;current.events=[{x:19.5,y:12.5,label:'TEST',doit:()=>count++}];current.npcs=[];current.gates=[];
      C3.interactCoop();C3.coopMove(window.__pads[1],1/60);
      return {count,x:G.x,pulling:C3.coop.pulling,focus:coopCamera123('x')};
    });assert.equal(v.count,1);assert.equal(v.x,10.5);assert.equal(v.pulling,false);assert.equal(v.focus,15);
  });
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const mobile=await mobileContext.newPage();mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.addInitScript(()=>{window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
  await mobile.goto(pathToFileURL(build).href,{waitUntil:'load',timeout:120000});
  await check('iPhone automatically gets portrait mobile layout with large targets',async()=>{
    assert(await mobile.locator('#mobileDeck121').isVisible());
    const v=await mobile.evaluate(()=>({mobile:Input121.mobile,scroll:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('.mobileActions121 button')].map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))}));
    assert(v.mobile);assert(!v.scroll,JSON.stringify(v));for(const b of v.buttons)assert(b.w>=44&&b.h>=40,JSON.stringify(b));
  });
  const cdp=await mobileContext.newCDPSession(mobile);
  await mobile.evaluate(()=>{G=fresh();buildMaps();setArea('studio',12.5,10.5,false);mode='walk';$('start').classList.add('hidden');$('hud').style.display='block';drawEnv()});
  await check('Real multitouch holds movement and attack; releasing one finger preserves the other',async()=>{
    const stick=await mobile.locator('#mobileStick121').boundingBox(),attack=await mobile.locator('[data-mobile-action="attack"]').boundingBox();
    const a={x:stick.x+stick.width*.8,y:stick.y+stick.height*.5,id:1},b={x:attack.x+attack.width/2,y:attack.y+attack.height/2,id:2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});
    await mobile.waitForTimeout(80);
    let v=await mobile.evaluate(()=>{C3.pollControllers(100);return {x:Input121.touch[0],attack:attackHeld,pointers:[...Input121.pointers.keys()],origin:Input121.stickOrigin}});assert(v.x>.5,JSON.stringify({v,stick,attack,a,b}));assert(v.attack);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[b]});
    v=await mobile.evaluate(()=>({x:Input121.touch[0],attack:attackHeld}));assert(v.x>.5,JSON.stringify(v));assert(!v.attack);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.deepEqual(await mobile.evaluate(()=>Input121.touch),[0,0]);
  });
  await check('Rotation switches layout and releases all held touches',async()=>{
    await mobile.setViewportSize({width:844,height:390});await mobile.waitForTimeout(100);
    const v=await mobile.evaluate(()=>({landscape:document.documentElement.classList.contains('landscape121'),held:Input121.pointers.size,width:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(v.landscape);assert.equal(v.held,0);assert(v.width<=v.viewport);assert(await mobile.locator('#mobileStick121').isVisible());
  });

  await check('Landscape touch targets receive real simultaneous movement and attack',async()=>{
    await mobile.evaluate(()=>{mode='walk';releaseAll121()});
    const stick=await mobile.locator('#mobileStick121').boundingBox(),attack=await mobile.locator('[data-mobile-action="attack"]').boundingBox();
    const a={x:stick.x+stick.width*.8,y:stick.y+stick.height*.5,id:3},b={x:attack.x+attack.width/2,y:attack.y+attack.height/2,id:4};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});
    const v=await mobile.evaluate(()=>({x:Input121.touch[0],attack:attackHeld,frame:document.getElementById('frame').getBoundingClientRect().width}));
    assert(v.x>.5,JSON.stringify(v));assert(v.attack);assert(v.frame>=840);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  });
  await check('Dialogue cancels held touch and roll and cannot move the actor',async()=>{
    const v=await mobile.evaluate(()=>{
      mode='walk';Input121.touch=[1,0];G.active='ryuchi';G.hp.ryuchi=100;act.dashCD=0;startRoll121();
      talk([{who:'franco',t:'Teste de diálogo.'}]);const x=G.x,y=G.y;
      mobileStick121({clientX:800,clientY:300});
      for(let i=0;i<30;i++)update(1/60);
      return {dx:G.x-x,dy:G.y-y,input:inputVector121(),roll:Combat10.dashTime,speed:G.moveSpeed10};
    });assert.equal(v.dx,0);assert.equal(v.dy,0);assert.deepEqual(v.input,[0,0]);assert.equal(v.roll,0);assert.equal(v.speed,0);
  });
  await check('Musical challenge stops album and blocks late decoded tracks',async()=>{
    const v=await mobile.evaluate(()=>{
      let stops=0;Music11.source={stop(){stops++}};Music11.gain={};mode='rhythm';soundscape();
      startAlbum11('veracidade',{});
      return {stops,source:Music11.source,challenge:musicChallenge122()};
    });assert(v.challenge);assert(v.stops>0);assert.equal(v.source,null);
    await mobile.evaluate(()=>{mode='walk';document.getElementById('dialogue').classList.add('hidden')});
  });
  await check('Mobile can connect and disconnect a physical controller and return to touch',async()=>{
    await mobile.evaluate(()=>{C3.pad.pads=[{index:0}];updateMobileLayout121()});assert.equal(await mobile.locator('#mobileDeck121').isVisible(),false);
    await mobile.evaluate(()=>{C3.pad.pads=[];updateMobileLayout121()});assert(await mobile.locator('#mobileStick121').isVisible());
  });
  await mobile.evaluate(()=>{for(let i=0;i<30;i++)drawEnv()});await mobile.screenshot({path:path.join(__dirname,'mobile-landscape.png')});
  await mobile.setViewportSize({width:390,height:844});await mobile.waitForTimeout(100);await mobile.evaluate(()=>{for(let i=0;i<30;i++)drawEnv()});await mobile.screenshot({path:path.join(__dirname,'mobile-portrait.png')});
  assert.deepEqual(errors,[],'Browser runtime errors');
  fs.writeFileSync(path.join(__dirname,'INPUT_TEST_RESULTS.json'),JSON.stringify({build:path.basename(build),sha256:crypto.createHash('sha256').update(fs.readFileSync(build)).digest('hex'),passed:results.length,checks:results,browserErrors:errors},null,2)+'\n');
  await context.close();await mobileContext.close();await browser.close();
  console.log(results.length+' verificações funcionais aprovadas.');
}
main().catch(e=>{console.error(e);process.exit(1)});
