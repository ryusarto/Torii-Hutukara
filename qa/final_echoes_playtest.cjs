/* Actual boss transition, native arena inputs, persistent partial solve, and ending. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8886/';
const out=process.argv[3];
const results=[],errors=[];
const notes=[1.626,3.315,2.748,4.445,5.299],phrase=[0,1,2,0,2];

async function testEchoes(browser,mobile){
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1100,height:760}});
  try{
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#startNew').click();
    await page.locator('#dif_historia').click();
    const transition=await page.evaluate(mobile=>{
      C3.start(true);
      while(mode==='dialogue')advanceDialogue();
      Object.assign(G.c3,{metMaia:true,twoRoutesOpen:true,usinaGate:true,usinaDone:true,canalDone:true,
        canalPath:true,windFlute:true,clubPhraseDone:true,clubPhrase:mobile?[3,2,1,0]:[0,1,2,0,2],
        metronomeDone:true,toriiSeen:true,liftOpen:true,horizonDrum:true,cloudPathA:true,cloudPathB:true,cloudPlatform:true});
      setCheckpoint('c3_final','last_torii',13.5,13.5,true);
      setArea('silence_core',17.5,17.64,false);C3.spawnSilence();
      G.x=17.5;G.y=17.65;transitionAlpha=0;
      const before=!current.events.some(event=>event.id===FinalEchoes.memory.id)&&albumTrack11()==='c3_nervos';
      C3.hazards.push({kind:'ring',fired:true,time:1});
      hostileShots.push({x:12,y:12});projectiles.push({x:13,y:12});
      hitEnemy(bossActor,bossActor.hp+1);
      const clean=bossActor===null&&battle===null&&C3.hazards.length===0&&hostileShots.length===0&&projectiles.length===0;
      while(mode==='dialogue')advanceDialogue();
      $('playtestEntry')?.remove();
      return {before,clean,active:FinalEchoes.active(),initialSave:JSON.parse(localStorage.getItem(KEY)).c3.finalRecovered,
        nodes:current.events.filter(event=>event.id.startsWith('final_')).length,combatDisabled:!combatReady10()};
    },mobile);
    assert.deepEqual(transition,{before:true,clean:true,active:true,initialSave:0,nodes:4,combatDisabled:true});
    assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),'final_memory');
    if(mobile&&out){
      const progress=await page.evaluate(()=>copy(G));
      fs.writeFileSync(path.join(path.dirname(out),'SAVE_ULTIMA_FREQUENCIA.json'),JSON.stringify({progress},null,2)+'\n');
    }
    const click=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
    const interact=()=>mobile?click('[data-mobile-action="interact"]'):page.keyboard.press('e');
    async function mute(){
      if(!mobile)return;
      await page.evaluate(()=>{openSystem();openSettings10()});
      // Audio mute now persists across Continue. Do not toggle it back on.
      if(!await page.evaluate(()=>audioMuted))await click('#audio10');
      await page.evaluate(()=>closeOverlay());
      assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
    }
    async function watchAudio(){
      await page.evaluate(()=>{
        window.__echoNotes=[];
        const proto=AudioBufferSourceNode.prototype,original=proto.start;
        proto.start=function(when,offset,duration){
          if(this.buffer===Music11.buffer.get('c3_chico_buarque')&&duration)__echoNotes.push(offset);
          return original.apply(this,arguments);
        };
      });
    }
    await mute();
    await watchAudio();
    await page.locator('#finalEchoes').waitFor({state:'visible'});
    assert.deepEqual(await page.locator('#finalEchoNotes li').allTextContents(),['Baixo','…','Guitarra','…','…']);
    await page.locator('#toast').waitFor({state:'hidden'});
    if(out)await page.screenshot({path:path.join(path.dirname(out),mobile?'final-ecos-mobile.png':'final-ecos-desktop.png')});
    await interact();
    await page.waitForFunction(()=>FinalEchoes.progress().heard&&!FinalEchoes.progress().hearing);
    assert.deepEqual(await page.evaluate(()=>__echoNotes),mobile?[]:notes);

    const touch=mobile?await context.newCDPSession(page):null;
    async function move(axis,goal){
      const value=await page.evaluate(axis=>G[axis],axis);
      if(Math.abs(value-goal)<.12)return;
      const sign=Math.sign(goal-value),key=axis==='x'?(sign>0?'d':'a'):(sign>0?'s':'w');
      if(mobile){
        const box=await page.locator('#mobileStick121').boundingBox();
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,
          x:box.x+box.width*(.5+(axis==='x'?sign*.25:0)),y:box.y+box.height*(.5+(axis==='y'?sign*.25:0))
        }]});
      }else await page.keyboard.down(key);
      try{await page.waitForFunction(({axis,goal,sign})=>sign*(G[axis]-goal)>=0,{axis,goal,sign},{timeout:5000})}
      finally{
        if(mobile)await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        else await page.keyboard.up(key);
      }
    }
    async function answer(instrument){
      const echo=await page.evaluate(instrument=>FinalEchoes.echoes.find(item=>item.instrument===instrument),instrument);
      await move('y',echo.y+1.17);
      await move('x',echo.x);
      assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),echo.id);
      await interact();
    }

    await answer('drums');
    await page.waitForFunction(()=>FinalEchoes.progress().count===1&&$('finalEchoNotes').children[1].textContent==='Bateria');
    const remaining=await page.locator('#finalEchoNotes li').allTextContents();
    assert.deepEqual(remaining,['Baixo','Bateria','Guitarra','…','…']);
    await answer('guitar');
    assert(await page.evaluate(()=>FinalEchoes.progress().count===1&&!G.c3.silenceDone&&JSON.parse(localStorage.getItem(KEY)).c3.finalRecovered===1));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#startContinue').click();
    await page.waitForFunction(()=>FinalEchoes.active()&&FinalEchoes.progress().count===1&&!bossActor&&mode==='walk');
    if(mobile)assert(await page.evaluate(()=>audioMuted&&!audioEnabled),'Mute preference must persist after Continue');
    await mute();
    await watchAudio();
    await answer('bass');
    assert(await page.evaluate(()=>FinalEchoes.progress().count===2&&!G.c3.silenceDone));
    await answer('guitar');
    await page.waitForFunction(()=>G.c3.silenceDone&&mode==='dialogue');
    const complete=await page.evaluate(()=>({
      final:G.c3.finalPhrase,oldClub:G.c3.clubPhrase,count:G.c3.finalRecovered,stageSound:__echoNotes.slice(-5),
      noVictoryUntilSaved:JSON.parse(localStorage.getItem(KEY)).c3.silenceDone
    }));
    assert.deepEqual(complete,{final:phrase,oldClub:mobile?[3,2,1,0]:phrase,count:null,stageSound:mobile?[]:notes,noVictoryUntilSaved:true});
    await page.evaluate(()=>{while(mode==='dialogue')advanceDialogue()});
    assert(await page.evaluate(()=>G.c3.complete&&!FinalEchoes.active()));
    if(mobile&&out){
      await page.reload({waitUntil:'domcontentloaded'});
      await click('#startOptions10');
      await page.locator('#importFile').setInputFiles(path.join(path.dirname(out),'SAVE_ULTIMA_FREQUENCIA.json'));
      await page.waitForFunction(()=>mode==='walk'&&FinalEchoes.active()&&FinalEchoes.progress().count===0);
      assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),'final_memory');
    }
    results.push({input:mobile?'analógico e toque no mudo':'teclado e gravação',transition,partialReload:true,complete});
    console.log('OK · '+results.at(-1).input);
  }finally{await context.close()}
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  try{
    await testEchoes(browser,false);
    await testEchoes(browser,true);
    assert.deepEqual(errors,[]);
  }finally{
    await browser.close();
    if(out)fs.writeFileSync(out,JSON.stringify({results,errors},null,2)+'\n');
  }
})().catch(error=>{console.error(error);process.exitCode=1});
