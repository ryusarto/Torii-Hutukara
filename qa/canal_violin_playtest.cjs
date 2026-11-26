/* Native keyboard/touch input and a round trip through the Chapter 3 save. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8886/';
const out=process.argv[3];
const checks=[],errors=[];
const recording=fs.readFileSync(path.join(__dirname,'../assets/chapter-03/audio/violino-veracidade-canal.wav')).toString('base64');

async function testCanal(browser,mobile,muted=false){
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1100,height:760}});
  try{
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#startNew').click();
    await page.locator('#dif_historia').click();
    await page.evaluate(()=>{
      C3.start(true);
      while(mode==='dialogue')advanceDialogue();
      Object.assign(G.c3,{metMaia:true,twoRoutesOpen:true,canalIntro:true,firstDestination:'canal'});
      G.defeated.push('p4_canal_entry');
      setArea('sky_canal',14.35,12.4,false);closeOverlay();mode='walk';transitionAlpha=0;keys={};
      setCheckpoint('c3_canal','sky_canal',14.35,12.4,true);
    });
    await page.locator('#playtestEntry').waitFor({state:'detached'});
    await page.locator('#canalViolin').waitFor({state:'visible',timeout:8000});
    assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),'c3_violin_path');

    if(mobile&&out&&!muted){
      const progress=await page.evaluate(()=>copy(G));
      fs.writeFileSync(path.join(path.dirname(out),'SAVE_CANAL.json'),JSON.stringify({progress},null,2)+'\n');
    }
    if(muted){
      await page.evaluate(()=>{openSystem();openSettings10()});
      await page.locator('#audio10').tap();
      await page.evaluate(()=>closeOverlay());
      assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
    }else if(!mobile){
      await page.evaluate(()=>ToriiInterface6.KeyMap.set('interact','g'));
      await page.waitForFunction(()=>$('canalViolinHint').textContent.includes('Segure G'));
    }
    await page.evaluate(()=>{
      window.__canalAudio=[];
      window.__canalDraws=0;
      const proto=AudioBufferSourceNode.prototype,start=proto.start,stop=proto.stop;
      proto.start=function(...args){
        if(this.loop&&Math.abs(this.loopStart-1180/24000)<.0001){
          __canalAudio.push(this);
          this.addEventListener('ended',()=>{this.qaEnded=true});
        }
        return start.apply(this,args);
      };
      proto.stop=function(...args){
        if(__canalAudio.includes(this))this.qaStopped=true;
        return stop.apply(this,args);
      };
      const tile=drawTile;
      drawTile=function(type,...args){
        if(type==='c3_bridge'&&current.id==='sky_canal'&&!G.c3.canalPath)__canalDraws++;
        return tile(type,...args);
      };
    });
    const session=mobile?await context.newCDPSession(page):null;
    const action=mobile?await page.locator('[data-mobile-action="interact"]').boundingBox():null;
    if(mobile)assert(action?.width>=44&&action?.height>=44);
    const down=()=>mobile?session.send('Input.dispatchTouchEvent',{
      type:'touchStart',touchPoints:[{id:1,x:action.x+action.width/2,y:action.y+action.height/2}]
    }):page.keyboard.down('g');
    const up=(cancel=false)=>mobile?session.send('Input.dispatchTouchEvent',{
      type:cancel?'touchCancel':'touchEnd',touchPoints:[]
    }):page.keyboard.up('g');
    async function shot(name){
      if(out&&!muted)await page.screenshot({path:path.join(path.dirname(out),name+'.png')});
    }

    await down();
    await page.waitForFunction(()=>CanalViolin.progress().value>=.38);
    const midway=await page.evaluate(()=>({
      collidable:!canBody121(20.5,12.5),drawn:__canalDraws,
      farBankVisible:24.25*T-cam.x<VW,
      noteCount:__canalAudio.length,percent:document.getElementById('canalViolinMeter').value
    }));
    assert(midway.collidable&&midway.farBankVisible&&midway.drawn>0&&midway.percent>=.38&&midway.percent<.85,JSON.stringify(midway));
    assert.equal(midway.noteCount,muted?0:1);
    if(!muted){
      const sample=await page.evaluate(async base64=>{
        const source=__canalAudio[0],buffer=source.buffer;
        const bytes=Uint8Array.from(atob(base64),char=>char.charCodeAt(0));
        const reference=await AC.decodeAudioData(bytes.buffer);
        const pcm=buffer.getChannelData(0),original=reference.getChannelData(0);
        return {loop:source.loop,start:source.loopStart,end:source.loopEnd,duration:buffer.duration,
          equal:pcm.length===original.length&&pcm.every((value,index)=>value===original[index]),
          peak:pcm.reduce((peak,value)=>Math.max(peak,Math.abs(value)),0)};
      },recording);
      assert(sample.loop&&sample.equal&&sample.start>0&&sample.end===sample.duration&&sample.peak>.5,JSON.stringify(sample));
    }
    await shot(mobile?'canal-formando-mobile':'canal-formando-desktop');
    await up(mobile&&!muted);
    await page.waitForFunction(()=>CanalViolin.progress().value===0);
    assert(await page.evaluate(()=>!G.c3.canalPath&&!canBody121(20.5,12.5)&&__canalAudio.every(node=>node.qaStopped&&node.qaEnded)));

    await down();
    if(!mobile){
      await page.waitForFunction(()=>CanalViolin.progress().value>=.22);
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>mode==='overlay'&&!CanalViolin.progress().holding&&__canalAudio.every(node=>node.qaStopped));
      await page.evaluate(()=>closeOverlay());
      await page.waitForFunction(()=>CanalViolin.progress().value===0);
      assert(await page.evaluate(()=>!G.c3.canalPath));
      await up();
      await down();
    }
    await page.waitForFunction(()=>G.c3.canalPath);
    const playing=await page.evaluate(muted=>({count:__canalAudio.length,time:muted?tick:AC.currentTime}),muted);
    await page.waitForFunction(({time,muted})=>(muted?tick:AC.currentTime)>time+.55,{time:playing.time,muted});
    assert.deepEqual(await page.evaluate(()=>({
      holding:CanalViolin.progress().holding,mode,count:__canalAudio.length,
      lastStillPlaying:__canalAudio.length>0&&!__canalAudio.at(-1).qaStopped&&!__canalAudio.at(-1).qaEnded
    })),{holding:true,mode:'walk',count:playing.count,lastStillPlaying:!muted});
    await up();
    await page.waitForFunction(()=>mode==='dialogue'&&__canalAudio.every(node=>node.qaStopped&&node.qaEnded));
    const completed=await page.evaluate(()=>{
      const saved=JSON.parse(localStorage.getItem(KEY));
      return {saved:saved.c3.canalPath,walkable:canBody121(20.5,12.5),tile:current.tiles[12][20],
        stopped:__canalAudio.every(node=>node.qaStopped),mode,instrument:G.flags.violin11};
    });
    assert.deepEqual(completed,{saved:true,walkable:true,tile:'c3_bridge',stopped:true,mode:'dialogue',instrument:true});
    await page.evaluate(()=>{while(mode==='dialogue')advanceDialogue()});
    await shot(mobile?'canal-firme-mobile':'canal-firme-desktop');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#startContinue').click();
    assert(await page.evaluate(()=>G.c3.canalPath&&G.area==='sky_canal'&&canBody121(20.5,12.5)));
    if(mobile&&out&&!muted){
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#startOptions10').tap();
      await page.locator('#importFile').setInputFiles(path.join(path.dirname(out),'SAVE_CANAL.json'));
      await page.locator('#canalViolin').waitFor({state:'visible'});
      assert(await page.evaluate(()=>G.area==='sky_canal'&&!G.c3.canalPath&&G.flags.violin11));
    }else if(!mobile){
      await page.keyboard.down('d');
      await page.waitForFunction(()=>G.x>24.25);
      await page.keyboard.up('d');
    }
    const input=mobile?(muted?'toque emulado no mudo':'toque emulado com gravação'):'teclado remapeado com gravação';
    checks.push({input,canceledBy:mobile&&!muted?'touchcancel':'soltar o comando',
      midway,completed,noteContinuedAfterBridge:!muted,resumed:true});
    console.log('OK · '+checks.at(-1).input);
  }finally{await context.close()}
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  try{
    await testCanal(browser,false);
    await testCanal(browser,true);
    await testCanal(browser,true,true);
    assert.deepEqual(errors,[]);
  }finally{
    await browser.close();
    if(out)fs.writeFileSync(out,JSON.stringify({checks,errors},null,2)+'\n');
  }
})().catch(error=>{console.error(error);process.exitCode=1});
