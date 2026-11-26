/* Native input, shuffled source-track phrases, revision and the Chapter 3 save. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8886/';
const out=process.argv[3];
const results=[],errors=[];
const passages=[16.55,38.79,68.84,94.24];

async function testPlant(browser,mobile){
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1100,height:760}});
  try{
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#startNew').click();
    await page.locator('#dif_historia').click();
    const guarded=await page.evaluate(()=>{
      C3.start(true);
      while(mode==='dialogue')advanceDialogue();
      Object.assign(G.c3,{metMaia:true,twoRoutesOpen:true,usinaGate:true,firstDestination:'usina'});
      setArea('power_plant',33.15,12.4,false);mode='walk';
      C3.completePlant();
      const guarded=mode==='action'&&!$('plantSequencer')&&!G.c3.usinaDone;
      G.defeated.push(...areas.power_plant.enemies.map(foe=>foe.id));
      setArea('power_plant',33.15,12.4,false);closeOverlay();mode='walk';transitionAlpha=0;keys={};
      setCheckpoint('c3_plant_console','power_plant',33.15,12.4,true);
      return guarded;
    });
    assert(guarded);
    await page.locator('#playtestEntry').waitFor({state:'detached'});
    assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),'c3_plant_console');
    if(mobile&&out){
      const progress=await page.evaluate(()=>copy(G));
      fs.writeFileSync(path.join(path.dirname(out),'SAVE_USINA.json'),JSON.stringify({progress},null,2)+'\n');
    }

    const click=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
    const open=()=>mobile?click('[data-mobile-action="interact"]'):page.keyboard.press('e');
    const pads=page.locator('[data-plant-beat]');
    await page.evaluate(()=>{
      window.__plantSamples=[];
      const proto=AudioBufferSourceNode.prototype,start=proto.start,stop=proto.stop;
      proto.start=function(when,offset,duration){
        if(this.buffer===Music11.buffer.get('c3_type_shit')&&duration===.62)
          __plantSamples.push({source:this,when,offset:Number(offset.toFixed(2))});
        return start.apply(this,arguments);
      };
      proto.stop=function(...args){
        const sample=__plantSamples.find(item=>item.source===this);
        if(sample)sample.stopped=true;
        return stop.apply(this,args);
      };
    });
    const offsets=count=>page.evaluate(count=>__plantSamples.slice(-count).map(item=>item.offset),count);
    const shapes=async selector=>page.locator(selector).evaluateAll(pads=>
      pads.map(pad=>pad.querySelector('.plant-wave')?.innerHTML||null));
    const refSelector='#plantReferenceSteps li';
    const poolSelector='[data-plant-beat]';
    const timelineSelector='[data-plant-slot]';
    const place=piece=>mobile?click('[data-plant-beat="'+piece+'"]'):page.keyboard.press(String(piece+1));
    const remove=position=>click('[data-plant-slot="'+position+'"]');
    await open();
    await page.locator('#plantSequencer').waitFor({state:'visible'});
    assert.equal(await pads.count(),5);
    assert.equal(await page.locator(timelineSelector+'[data-empty="true"]').count(),4);
    assert(await page.locator('#plantApply').isDisabled());
    if(!mobile){
      assert(await page.locator('#plantReference').evaluate(el=>el===document.activeElement));
      await page.keyboard.press('Tab');
      assert(await pads.first().evaluate(el=>el===document.activeElement));
      await page.keyboard.press('Shift+Tab');
    }
    await click('#plantReference');
    await page.locator('#plantReferenceSteps .plant-live').waitFor();
    await page.waitForFunction(()=>__plantSamples.length===4);
    const first=await offsets(4);
    assert(passages.includes(first[0]));
    assert.deepEqual(first,first.map((_,index)=>Number((first[0]+index*.62).toFixed(2))));
    assert(await page.evaluate(()=>__plantSamples.every((item,i,all)=>!i||Math.abs(item.when-all[i-1].when-.62)<.001)));
    const oldReference=await shapes(refSelector);
    await click('#plantClose');
    assert(await page.evaluate(()=>__plantSamples.every(item=>item.stopped)&&!G.c3.usinaDone));

    if(mobile){
      await page.evaluate(()=>{openSystem();openSettings10()});
      await click('#audio10');
      await page.evaluate(()=>closeOverlay());
      assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
    }
    await open();
    await page.locator('#plantSequencer').waitFor();
    assert(await page.locator('#plantReferenceSteps').isHidden());
    const previews=await page.evaluate(()=>__plantSamples.length);
    await click('#plantReference');
    await page.locator('#plantReferenceSteps .plant-live').waitFor();
    const reference=await shapes(refSelector);
    const pool=await shapes(poolSelector);
    assert.notDeepEqual(reference,oldReference);
    assert.equal(new Set(pool).size,5);
    const recipe=reference.map(wave=>pool.indexOf(wave));
    assert(recipe.every(piece=>piece>=0));
    const extra=pool.findIndex(wave=>!reference.includes(wave));
    assert(extra>=0);

    await place(extra);
    assert(await page.locator('#plantApply').isDisabled());
    for(const piece of recipe.slice(1))await place(piece);
    const wrong=await shapes(timelineSelector);
    assert.notDeepEqual(wrong,reference);
    await click('#plantApply');
    assert.match(await page.locator('#plantSignal').textContent(),/ainda difere/);
    assert.deepEqual(await shapes(timelineSelector),wrong);
    assert(await page.evaluate(()=>!G.c3.usinaDone&&!G.c3.synthUnlocked));
    if(mobile){
      for(const [width,height] of [[320,568],[844,390],[390,844]]){
        await page.setViewportSize({width,height});
        const rects=await page.locator(poolSelector+','+timelineSelector).evaluateAll(buttons=>buttons.map(button=>{
          const r=button.getBoundingClientRect();
          return {width:r.width,height:r.height,left:r.left,right:r.right};
        }));
        assert(rects.every(r=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=width),JSON.stringify({width,rects}));
      }
    }

    await remove(0);
    assert(await pads.nth(extra).isEnabled());
    assert.deepEqual(await shapes(timelineSelector),[null,...reference.slice(1)]);
    await place(recipe[0]);
    assert.deepEqual(await shapes(timelineSelector),reference);
    assert.equal(await pads.nth(extra).getAttribute('data-spare'),'true');
    assert.match(await page.locator('#plantSignal').textContent(),new RegExp('Peça '+String.fromCharCode(65+extra)+' ficou de fora'));
    await click('#plantListen');
    await page.locator('[data-plant-slot="0"].plant-live').waitFor();
    if(mobile)assert.equal(await page.evaluate(()=>__plantSamples.length),previews);
    else{
      const played=await offsets(4);
      assert(passages.includes(played[0])&&played[0]!==first[0]);
      assert.deepEqual(played,played.map((_,index)=>Number((played[0]+index*.62).toFixed(2))));
    }
    if(out)await page.screenshot({path:path.join(path.dirname(out),mobile?'usina-mobile.png':'usina-desktop.png')});
    await click('#plantApply');
    assert(await page.evaluate(()=>mode==='dialogue'&&G.c3.usinaDone));
    await page.evaluate(()=>{while(mode==='dialogue')advanceDialogue()});
    assert(await page.evaluate(()=>G.c3.synthUnlocked&&JSON.parse(localStorage.getItem(KEY)).c3.usinaDone));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#startContinue').click();
    assert(await page.evaluate(()=>G.c3.usinaDone&&G.c3.synthUnlocked));
    if(mobile&&out){
      await page.reload({waitUntil:'domcontentloaded'});
      await click('#startOptions10');
      await page.locator('#importFile').setInputFiles(path.join(path.dirname(out),'SAVE_USINA.json'));
      await page.waitForFunction(()=>mode==='walk'&&G.area==='power_plant'&&!G.c3.usinaDone);
      await open();
      await page.locator('#plantSequencer').waitFor({state:'visible'});
    }
    results.push({mode:mobile?'toque emulado com áudio e no mudo':'teclado e mouse',differentPassage:true,guarded,wrongSequenceRejected:true,resumed:true,fixtureImported:!!(mobile&&out)});
    console.log('OK · '+results.at(-1).mode);
  }finally{await context.close()}
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  try{
    await testPlant(browser,false);
    await testPlant(browser,true);
    assert.deepEqual(errors,[]);
  }finally{
    await browser.close();
    if(out)fs.writeFileSync(out,JSON.stringify({results,errors},null,2)+'\n');
  }
})().catch(error=>{console.error(error);process.exitCode=1});
