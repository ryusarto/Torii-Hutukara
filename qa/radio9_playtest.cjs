/* Native input, Web Audio, mute, and a round trip through the Chapter 2 save. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8886/';
const out=process.argv[3];
const checks=[],errors=[];

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1100,height:760}});
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#startNew').click();
   await page.locator('#dif_historia').click();
   await page.evaluate(()=>{
    while(mode==='dialogue')advanceDialogue();
    Object.assign(G.flags,{console:true,masks:true,arrived:true,ema:true,forestGuide:true,bass:true,bridge:true,ruinA:true,ruinB:true,boss:true,reveal:true,ending:true,
     voicesArrived:true,voicesIris:true,voicesTape:true,voicesCoupler:true,voicesTech:false});
    G.chapter=2;G.party3=true;G.formation=['franco','ryuchi','alt'];
    setArea('radio9',18.35,8.55,false);closeOverlay();mode='walk';transitionAlpha=0;keys={};
    setCheckpoint('radio9','radio9',18.35,8.55,true);
   });
   assert.equal(await page.evaluate(()=>objectiveData().name),'Mostrador de sintonia');
   assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),'radioReceiver');
   if(mobile){
    if(out){
     const progress=await page.evaluate(()=>copy(G));
     fs.writeFileSync(path.join(path.dirname(out),'SAVE_RADIO9.json'),JSON.stringify({progress},null,2)+'\n');
    }
    await page.evaluate(()=>{openSystem();openSettings10()});
    await page.locator('#audio10').tap();
    await page.evaluate(()=>closeOverlay());
    assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
   }
   await page.evaluate(()=>{
    window.__radioAudio=[];
    const proto=AudioBufferSourceNode.prototype;
    const start=proto.start,stop=proto.stop;
    proto.start=function(...args){
     if(this.loop&&[1,4].includes(this.buffer?.duration))__radioAudio.push(this);
     return start.apply(this,args);
    };
    proto.stop=function(...args){
     if(__radioAudio.includes(this))this.qaStopped=true;
     return stop.apply(this,args);
    };
   });
   const press=()=>mobile?page.locator('[data-mobile-action="interact"]').tap():page.keyboard.press('e');
   const click=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
   const shot=async name=>{
    if(!out)return;
    await page.locator('#playtestEntry').waitFor({state:'detached'});
    await page.screenshot({path:path.join(path.dirname(out),name+'.png')});
   };
   await press();
   assert(await page.locator('#radioSend').isDisabled());
   assert.equal(await page.locator('#radioQuality').textContent(),'Estática');
   const initial=await page.locator('#radioScope').evaluate(canvas=>canvas.toDataURL());
   if(mobile)await shot('radio-estatica-mobile');
   else await page.waitForFunction(()=>__radioAudio.length===2);
   await page.evaluate(()=>$('radioSend').onclick());
   assert.equal(await page.evaluate(()=>Radio9.tuned()),false);
   for(let i=0;i<4;i++){
    if(mobile)await click('#radioUp');else await page.keyboard.press('ArrowRight');
   }
   assert.equal(await page.locator('#radioQuality').textContent(),'Sinal limpo');
   assert.equal(await page.locator('#radioChannel').textContent(),'89,3');
   assert(await page.locator('#radioSend').isEnabled());
   assert.notEqual(await page.locator('#radioScope').evaluate(canvas=>canvas.toDataURL()),initial);
   if(mobile){
    assert.equal(await page.evaluate(()=>__radioAudio.length),0);
    for(const [width,height] of [[320,568],[844,390],[390,844]]){
     await page.setViewportSize({width,height});
     await page.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,[width,height]);
     const buttons=await page.locator('#radioTuner button').evaluateAll(elements=>
      elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}));
     assert(buttons.every(b=>b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=height&&b.width>=44&&b.height>=44),JSON.stringify({width,height,buttons}));
    }
    await shot('radio-sinal-mobile');
   }else{
    const sample=await page.evaluate(()=>{
     const original=Music11.buffer.get('esquecer'),loop=__radioAudio.find(source=>source.buffer.duration===4).buffer;
     const pcm=loop.getChannelData(0),index=loop.sampleRate;
     return {length:loop.duration,equal:pcm[index]===original.getChannelData(0)[index+6*loop.sampleRate],
      rms:Math.sqrt(pcm.reduce((sum,value)=>sum+value*value,0)/pcm.length)};
    });
    assert(sample.equal&&sample.length===4&&sample.rms>.02,JSON.stringify(sample));
    await shot('radio-sinal-desktop');
   }
   await click('#radioUp');
   assert(await page.locator('#radioSend').isDisabled());
   await click('#radioDown');
   await click('#radioSend');
   assert(!await page.locator('#radioTuner').isVisible());
   await page.evaluate(()=>{while(mode==='dialogue')advanceDialogue()});
   const integration=await page.evaluate(()=>{
    const saved=JSON.parse(localStorage.getItem(KEY));
    const old=copy(saved);delete old.flags.radioTuned;old.flags.relayPlaza=true;
    const migrated=normalizeSave(old);
    const oldTrack=albumTrack11();
    G.flags.relayPlaza=G.flags.relayMarket=true;
    const two=albumTrack11();
    G.flags.relayRoof=true;
    const three=albumTrack11();
    G.flags.relayPlaza=G.flags.relayMarket=G.flags.relayRoof=false;
    return {tuned:G.flags.radioTuned,tech:G.flags.voicesTech,objective:objectiveData().name,saved:saved.flags.radioTuned,
     migration:migrated.flags.radioTuned,stopped:__radioAudio.every(source=>source.qaStopped),oldTrack,two,three};
   });
   assert.deepEqual(integration,{tuned:true,tech:true,objective:'Retransmissor da Praça',saved:true,migration:true,
    stopped:true,oldTrack:'esquecer',two:'esquecer',three:'sauna'});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#startContinue').click();
   assert(await page.evaluate(()=>G.flags.radioTuned&&G.flags.voicesTech));
   checks.push({mode:mobile?'toque emulado no mudo':'teclado e áudio original',...integration});
   console.log('OK · '+checks.at(-1).mode);
   await context.close();
  }
  assert.deepEqual(errors,[]);
 }finally{
  await browser.close();
  if(out)fs.writeFileSync(path.join(path.dirname(out),path.basename(out)),JSON.stringify({checks,errors},null,2)+'\n');
 }
})().catch(error=>{console.error(error);process.exitCode=1});
