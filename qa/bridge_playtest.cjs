/* Real browser checks for the four notes, native inputs, animation and checkpoint. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8886/';
const out=process.argv[3];
const checks=[],errors=[];
const markerPosition=[30.35,21.55];

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  const run=async(mobile)=>{
   const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1100,height:780}});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#startNew').click();
   await page.locator('#dif_historia').click();
   await page.evaluate(()=>{
    while(mode==='dialogue')advanceDialogue();
    Object.assign(G.flags,{console:true,masks:true,arrived:true,ema:true,forestGuide:true,bass:true});
    setArea('forest',30.35,21.55,false);closeOverlay();mode='walk';keys={};transitionAlpha=0;
    setCheckpoint('forest','forest',30.35,21.55,true);
   });
   await page.waitForFunction(()=>BridgeArt.ready());
   if(mobile&&out){
    const progress=await page.evaluate(()=>copy(G));
    fs.writeFileSync(path.join(path.dirname(out),'SAVE_PONTE.json'),JSON.stringify({progress},null,2)+'\n');
   }
   const press=()=>mobile?page.locator('[data-mobile-action="interact"]').tap():page.keyboard.press('e');
   const row=await page.evaluate(()=>BridgePuzzle.stations.map(({x,y})=>({x,y,walkable:tileWalkable(current,x,y)})));
   assert(row.every(station=>station.x===row[0].x&&station.walkable));
   const at=async(id)=>{
    const position=id==='marker'?markerPosition:[row[id-1].x+.15,row[id-1].y+.35];
    await page.evaluate(([x,y])=>{G.x=x;G.y=y;trail=[];cam.x=clamp(x*T-VW/2,0,current.w*T-VW);cam.y=clamp(y*T-VH/2,0,current.h*T-VH)},position);
    const expected=id==='marker'?'bridge':['','bridge_log','bridge_stone','bridge_bell'][id];
    assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),expected);
    await press();
   };
   const snap=async(name)=>{
    if(!out)return;
    await page.locator('#playtestEntry').waitFor({state:'detached'});
    await page.screenshot({path:path.join(path.dirname(out),name+'.png')});
   };
   if(mobile){
    await page.evaluate(()=>{openSystem();openSettings10()});
    await page.locator('#audio10').tap();
    await page.evaluate(()=>closeOverlay());
    assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
   }
   if(mobile){
    await at(1);
    assert.deepEqual(await page.evaluate(()=>{const s=BridgePuzzle.progress();return [s.heard,s.notes,audioEnabled]}),[false,1,false]);
    await at(1);
    await page.waitForFunction(()=>!BridgePuzzle.progress().resetting);
   }else{
    await page.evaluate(()=>{
     window.__bridgeClips=[];
     const start=AudioBufferSourceNode.prototype.start;
     AudioBufferSourceNode.prototype.start=function(when,offset,duration){
      if(offset>=124.5&&offset<125.22)__bridgeClips.push([offset,Number(duration.toFixed(3))]);
      return start.apply(this,arguments);
     };
    });
   }
   assert.equal(await page.locator('#bridgeBeat').count(),0);
   if(out)await page.locator('#playtestEntry').waitFor({state:'detached'});
   await at('marker');
   const names=['Tronco oco','Pedra rachada','Sino de madeira','Pedra rachada'];
   for(const [i,name] of names.entries()){
    const cue=`Exemplo ${i+1} de 4 · ${name}`;
    await page.waitForFunction(text=>$('bridgeMessage').textContent===text,cue);
    if(mobile&&i===2)await snap('ponte-pista-mobile');
   }
   await page.waitForFunction(()=>$('bridgeMessage').textContent.startsWith('Sua vez.'));
   const clips=[[124.51,.146],[124.665,.169],[124.84,.182],[125.027,.188]];
   if(mobile)assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
   else {
    const heard=await page.evaluate(()=>__bridgeClips.splice(0));
    assert.deepEqual(heard,clips);
   }
   const original=await page.evaluate(()=>({shards:G.shards,res:G.resonance}));
   await at(1);
   await page.waitForFunction(()=>BridgePuzzle.progress().segments[0]===1);
   await at(2);
   await page.waitForFunction(()=>BridgePuzzle.progress().segments[1]===1);
   await at(1); // um terceiro toque errado desmonta as duas seções.
   const wrong=await page.evaluate(()=>BridgePuzzle.progress());
   assert.equal(wrong.notes,0);assert(wrong.resetting&&wrong.segments.slice(0,2).some(n=>n>0));
   if(!mobile){
    await page.evaluate(()=>openSystem());
    await page.waitForFunction(()=>!BridgePuzzle.progress().playingRecording);
    const paused=await page.evaluate(()=>BridgePuzzle.progress());
    await page.waitForTimeout(180);
    assert.deepEqual(await page.evaluate(()=>BridgePuzzle.progress()),paused);
    await page.evaluate(()=>closeOverlay());
   }
   await page.waitForFunction(()=>BridgePuzzle.progress().segments.every(n=>n===0)&&!BridgePuzzle.progress().resetting);
   assert.equal(await page.evaluate(()=>tileWalkable(current,33.5,21.5)),false);
   if(!mobile)await page.evaluate(()=>__bridgeClips.splice(0));
   for(const [i,n] of [1,2,3,2].entries()){
    await at(n);
    await page.waitForFunction(i=>BridgePuzzle.progress().segments[i]===1,i);
    if(i<3)assert.equal(await page.evaluate(()=>tileWalkable(current,33.5,21.5)),false);
   }
   if(!mobile)assert.deepEqual(await page.evaluate(()=>__bridgeClips),clips);
   const victory=await page.evaluate(()=>({opened:G.flags.bridge,walkable:tileWalkable(current,33.5,21.5),
    shards:G.shards,res:G.resonance,saved:JSON.parse(localStorage.getItem(KEY))?.flags?.bridge}));
   assert.deepEqual(victory,{opened:true,walkable:true,shards:original.shards+4,res:Math.min(100,original.res+30),saved:true});
   if(mobile)await snap('ponte-concluida-mobile');
   else await snap('ponte-concluida-desktop');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#startContinue').click();
   assert(await page.evaluate(()=>G.flags.bridge&&tileWalkable(current,33.5,21.5)));
   assert.equal(await page.evaluate(()=>G.shards),victory.shards);
   checks.push({mode:mobile?'touch emulado, mudo':'teclado, gravação',wrong,victory});
   console.log('OK · '+checks.at(-1).mode);
   await context.close();
  };
  await run(false);await run(true);
  assert.deepEqual(errors,[]);
 }finally{
  await browser.close();
  if(out)fs.writeFileSync(out,JSON.stringify({checks,errors},null,2)+'\n');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
