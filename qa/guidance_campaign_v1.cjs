'use strict';
// Controlled runtime campaign/save probes and actual Canvas calls. This is
// not physical-device FPS or human gameplay certification.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),url=process.argv[2]||'http://127.0.0.1:8894/';
const out=process.env.GUIDANCE_CAMPAIGN_OUTPUT_DIR||path.join(root,'qa/beta-1.26.0/guidance-campaign'),report={url,method:'Chromium runtime; controlled campaign states, real save/Continue, original scene compositor and Canvas commands.',checks:[],errors:[]};
let browser,page;
async function check(name,fn){const detail=await fn();report.checks.push({name,passed:true,detail});console.log('PASS '+name)}
function fixture(){
 const late={metMaia:true,twoRoutesOpen:true,usinaGate:true,usinaDone:true,canalPath:true,canalDone:true,windFlute:true,clubPhraseDone:true,horizonDrum:true,liftOpen:true,cloudPathA:true,cloudPlatform:true,cloudPathB:true,synthUnlocked:true,percussionUnlocked:true};
 async function state(area='cloud_terrace',patch=late,x=5.5,y=17.5){
  bossActor=null;battle=null;G=fresh();Object.assign(G.flags,{voicesDone:true,reveal:true,voicesKatana:true,masks:true});Object.assign(G.c3,{started:true,...patch});G.chapter=3;G.party3=true;G.formation=['franco','ryuchi'];buildMaps();
  $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';mode='walk';setArea(area,x,y,false);await FinalAssetLoadingV1.ready();mode='walk';screenShake=0;transitionAlpha=0;
 }
 function probe(){
  const saved=JSON.stringify(G),target=navigationTarget(),order=[];let markers=0,preview=0;
  const marker=drawGuideMarker,art=EnemyArtV1.draw,actor=drawActor,text=ctx.fillText;let inMarker=false;
  drawGuideMarker=function(...a){inMarker=true;try{return marker.apply(this,a)}finally{inMarker=false}};
  ctx.fillText=function(...a){if(inMarker)markers++;return text.apply(this,a)};
  EnemyArtV1.draw=function(x,y,k,e){if(e?.id==='c3_metronome'&&e!==bossActor){preview++;order.push('preview')}return art.apply(this,arguments)};
  drawActor=function(p,...args){if(p.style===G.active)order.push('leader');return actor.call(this,p,...args)};
  try{drawEnv()}finally{drawGuideMarker=marker;EnemyArtV1.draw=art;drawActor=actor;ctx.fillText=text}
  if(JSON.stringify(G)!==saved)throw Error('Drawing changed player/save state');
  return{area:G.area,target,markers,route:getRoute().length,preview,order,mode,boss:bossActor?.id||null,battle:!!battle,guidance:G.guidance};
 }
 window.GuidanceCampaignQA={late,state,probe};
}
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();sessionStorage.clear();Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(url,{waitUntil:'load',timeout:180000});await page.evaluate(fixture);report.source=await page.evaluate(()=>TORII_PLAYTEST_BUILD.sourceSha256);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.source,process.env.EXPECTED_SOURCE_SHA);
 await check('Cold Metronome preview waits for its final image without creating combat',async()=>{
  const before=await page.evaluate(()=>{
   G=fresh();Object.assign(G.flags,{voicesDone:true,masks:true});Object.assign(G.c3,{started:true,...GuidanceCampaignQA.late});G.chapter=3;buildMaps();mode='walk';
   const image=EnemyArtV1.image('c3_metronome'),decode=image.decode.bind(image),complete=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'complete').get;
   window.__previewImage=image;window.__previewDecode=decode;window.__previewReleased=false;window.__releasePreview=null;
   Object.defineProperty(image,'complete',{configurable:true,get:()=>__previewReleased&&complete.call(image)});image.decode=()=>new Promise((resolve,reject)=>{window.__releasePreview=()=>{__previewReleased=true;return decode().then(resolve,reject)}});
   setArea('cloud_terrace',5.5,17.5,false);return{busy:FinalAssetLoadingV1.busy(),resources:FinalAssetLoadingV1.snapshot().resources,boss:bossActor,battle,mode};
  });assert(before.busy);assert(before.resources.includes('preview:c3_metronome'));assert.equal(before.boss,null);assert.equal(before.battle,null);assert.equal(before.mode,'walk');
  await page.waitForFunction(()=>typeof __releasePreview==='function',null,{polling:10});await page.evaluate(()=>__releasePreview());await page.evaluate(()=>FinalAssetLoadingV1.ready());await page.evaluate(()=>{__previewImage.decode=__previewDecode;delete __previewImage.complete});
  const result=await page.evaluate(()=>GuidanceCampaignQA.probe());assert.equal(result.preview,1);assert.equal(result.markers,1);assert(result.route>3);assert.equal(result.boss,null);assert.equal(result.battle,false);return result;
 });
 await check('Waiting boss uses normal Y compositing and has no collision or interaction',async()=>{
  const result=await page.evaluate(()=>{
   const area=current,waiting=area.props.find(p=>p.type==='c3_metronome_waiting'),blocked=[...area.blocked].sort().join('|'),events=area.events.map(e=>e.id),npcs=area.npcs.map(n=>n.id);
   G.x=15.5;G.y=9.5;const north=GuidanceCampaignQA.probe();G.y=11.5;const south=GuidanceCampaignQA.probe();
   return{waiting,north,south,unchanged:blocked===[...area.blocked].sort().join('|')&&JSON.stringify(events)===JSON.stringify(area.events.map(e=>e.id))&&JSON.stringify(npcs)===JSON.stringify(area.npcs.map(n=>n.id)),walkable:tileWalkable(area,15.5,10.5)};
  });assert.deepEqual(result.waiting,{type:'c3_metronome_waiting',x:15,y:10});assert(result.unchanged&&result.walkable);assert(result.north.order.indexOf('leader')<result.north.order.indexOf('preview'));assert(result.south.order.indexOf('leader')>result.south.order.indexOf('preview'));return result;
 });
 await check('Pre-fight dialogue retains waiting sprite and actual battle replaces it once',async()=>{
  const r=await page.evaluate(async()=>{
   C3.startMetronome(false);await FinalAssetLoadingV1.ready();const dialogue=GuidanceCampaignQA.probe();Narrativa.pularCena();await FinalAssetLoadingV1.ready();const battle=GuidanceCampaignQA.probe();
   return{dialogue,battle,hp:bossActor?.hp,max:bossActor?.max};
  });assert.equal(r.dialogue.mode,'dialogue');assert.equal(r.dialogue.preview,1);assert.equal(r.dialogue.boss,null);assert.equal(r.battle.mode,'action');assert.equal(r.battle.preview,0);assert.equal(r.battle.boss,'c3_metronome');assert.equal(r.hp,360);assert.equal(r.max,360);return r;
 });
 await check('Checkpoint rest and Continue retain progress and restore pre-fight directions',async()=>{
  await page.evaluate(async()=>{restoreCheckpoint({c3Rest:true});await FinalAssetLoadingV1.ready();mode='walk';save(true);window.__campaignSaved={flags:JSON.stringify(G.flags),c3:JSON.stringify(G.c3),xp:JSON.stringify(G.xp),inventory:JSON.stringify({shards:G.shards,potions:G.potions})}});
  const before=await page.evaluate(()=>GuidanceCampaignQA.probe());assert.equal(before.preview,1);assert.equal(before.markers,1);
  await page.evaluate(()=>openSystem());await page.locator('#ui7PauseTitle').click();await page.locator('#startContinue').click();await page.evaluate(()=>FinalAssetLoadingV1.ready());
  const after=await page.evaluate(()=>({draw:GuidanceCampaignQA.probe(),same:__campaignSaved.flags===JSON.stringify(G.flags)&&__campaignSaved.c3===JSON.stringify(G.c3)&&__campaignSaved.xp===JSON.stringify(G.xp)&&__campaignSaved.inventory===JSON.stringify({shards:G.shards,potions:G.potions})}));assert(after.same);assert.equal(after.draw.preview,1);assert.equal(after.draw.markers,1);return after;
 });
 await check('Campaign routes remain local from both branches through the final rooms',async()=>{
  const rows=await page.evaluate(async()=>{
   const base={started:true,metMaia:true,twoRoutesOpen:true},stages=[
    ['distortion_district',base,31.5,28.5],['power_plant',base,3.5,20.5],
    ['sky_canal',{...base,usinaDone:true,firstDestination:'canal'},3.5,12.5],
    ['contratempo',{...GuidanceCampaignQA.late,windFlute:false},13.5,16.5],
    ['sky_lift',{...GuidanceCampaignQA.late,liftOpen:false},10.5,20.5],
    ['cloud_sea',{...GuidanceCampaignQA.late,cloudPathA:false,cloudPlatform:false,cloudPathB:false},5.5,26.5],
    ['cloud_sea',{...GuidanceCampaignQA.late,cloudPlatform:false,cloudPathB:false},25.5,22.5],
    ['cloud_sea',{...GuidanceCampaignQA.late,cloudPathB:false},38.5,16.5],
    ['cloud_terrace',GuidanceCampaignQA.late,5.5,17.5],
    ['last_torii',{...GuidanceCampaignQA.late,metronomeDone:true},5.5,13.5],
    ['silence_core',{...GuidanceCampaignQA.late,metronomeDone:true},5.5,20.5],
    ['silence_core',{...GuidanceCampaignQA.late,metronomeDone:true,finalRecovered:0},17.5,20.5]
   ],rows=[];
   for(const [area,patch,x,y]of stages){await GuidanceCampaignQA.state(area,patch,x,y);rows.push(GuidanceCampaignQA.probe())}return rows;
  });for(const r of rows){assert.equal(r.target.area,r.area,r.area);assert.equal(r.markers,1,r.area)}return rows;
 });
 await check('Legacy locked-route save keeps a local marker explaining its real prerequisite',async()=>{
  await page.evaluate(()=>GuidanceCampaignQA.state('distortion_district',{metMaia:true,twoRoutesOpen:false},31.5,28.5));const r=await page.evaluate(()=>{const before=JSON.stringify(G);const result=GuidanceCampaignQA.probe();return{...result,unchanged:before===JSON.stringify(G)}});
  assert.equal(r.target.area,'distortion_district');assert.equal(r.target.hint,'CONVERSE COM BELGA NO CONTRATEMPO');assert.equal(r.markers,1);assert(r.unchanged);return r;
 });
 await check('Navigation can include existing earlier-chapter gates',async()=>{
  const r=await page.evaluate(async()=>{
   await GuidanceCampaignQA.state('city',GuidanceCampaignQA.late,28.5,34.5);const objective=C3.objective;C3.objective=()=>({area:'studio',x:12,y:5,name:'Estúdio',hint:'Retorne ao estúdio.'});try{return C3.nav()}finally{C3.objective=objective}
  });assert.equal(r.area,'city');assert(r.name.startsWith('PASSAGEM'));return r;
 });
 await check('OFF preserves ground-trail choice while essential final-room marks remain visible',async()=>{
  const rows=[];for(const area of ['cloud_terrace','silence_core']){await page.evaluate(({area})=>GuidanceCampaignQA.state(area,{...GuidanceCampaignQA.late,metronomeDone:area==='silence_core'},5.5,17.5),{area});await page.evaluate(()=>{G.guidance=false});const r=await page.evaluate(()=>GuidanceCampaignQA.probe());assert.equal(r.route,0);assert.equal(r.markers,1);assert.equal(r.guidance,false);rows.push(r)}return rows;
 });
 await check('Existing OFF save restores guidance directly from pause without a new game',async()=>{
  await page.evaluate(()=>GuidanceCampaignQA.state('cloud_terrace'));await page.evaluate(async()=>{G=normalizeSave(G);buildMaps();setArea(G.area,G.x,G.y,false);await FinalAssetLoadingV1.ready();G.guidance=false;save(true);window.__recoverBefore=JSON.stringify({flags:G.flags,c3:G.c3,hp:G.hp,xp:G.xp,shards:G.shards,potions:G.potions});openSystem()});
  await page.locator('#ui7PauseTitle').click();await page.locator('#startContinue').click();await page.evaluate(()=>FinalAssetLoadingV1.ready());assert.equal(await page.evaluate(()=>G.guidance),false);
  await page.evaluate(()=>openSystem());await page.locator('#guidanceRecover').click();
  const r=await page.evaluate(()=>({same:__recoverBefore===JSON.stringify({flags:G.flags,c3:G.c3,hp:G.hp,xp:G.xp,shards:G.shards,potions:G.potions}),on:G.guidance,saved:safeLoad().guidance,draw:GuidanceCampaignQA.probe()}));assert(r.same&&r.on&&r.saved,JSON.stringify(r));assert(r.draw.route>3);assert.equal(r.draw.markers,1);return r;
 });
 await check('Combat checkpoint saves carry the current guidance choice without copying combat progress or HP',async()=>{
  await page.evaluate(async()=>{
   await GuidanceCampaignQA.state('cloud_terrace');G=normalizeSave(G);buildMaps();setArea(G.area,G.x,G.y,false);await FinalAssetLoadingV1.ready();
   G.guidance=false;setCheckpoint('c3_clouds','cloud_terrace',5.5,17.5,true);window.__guidanceCheckpointHp=JSON.stringify(G.checkpoint.snapshot.hp);
   C3.spawnMetronome();await FinalAssetLoadingV1.ready();G.hp.franco=7;
   window.__combatProgress=JSON.stringify({hp:G.hp,flags:G.flags,c3:G.c3,xp:G.xp,shards:G.shards,potions:G.potions});openSystem();
  });await page.locator('#guidanceRecover').click();
  const recovered=await page.evaluate(()=>({unchanged:__combatProgress===JSON.stringify({hp:G.hp,flags:G.flags,c3:G.c3,xp:G.xp,shards:G.shards,potions:G.potions}),on:G.guidance,snapshotOn:G.checkpoint.snapshot.guidance,storedOn:safeLoad().guidance,safeHp:JSON.stringify(safeLoad().hp)===__guidanceCheckpointHp,mode,boss:bossActor?.id}));
  assert.deepEqual(recovered,{unchanged:true,on:true,snapshotOn:true,storedOn:true,safeHp:true,mode:'action',boss:'c3_metronome'});
  const toggled=await page.evaluate(()=>{toggleGuidance();const off=!G.guidance&&!G.checkpoint.snapshot.guidance&&!safeLoad().guidance;toggleGuidance();return{off,on:G.guidance&&G.checkpoint.snapshot.guidance&&safeLoad().guidance}});assert(toggled.off&&toggled.on);
  await page.evaluate(()=>{for(const hero of G.formation)G.hp[hero]=0;showDefeat();$('c3RestCheckpoint').click()});await page.evaluate(()=>FinalAssetLoadingV1.ready());
  const rested=await page.evaluate(()=>({on:G.guidance,storedOn:safeLoad().guidance,hp:JSON.stringify(G.hp)===__guidanceCheckpointHp,preview:GuidanceCampaignQA.probe().preview}));assert(rested.on&&rested.storedOn&&rested.hp);assert.equal(rested.preview,1);
  return{recovered,toggled,rested};
 });
 await check('Touch portrait and landscape can walk the real route until the full boss sprite is visible before interacting',async()=>{
  const results=[];for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}),touch=await context.newPage();touch.on('pageerror',e=>report.errors.push(e.message));
   try{
    await touch.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
    await touch.goto(url,{waitUntil:'load',timeout:180000});await touch.evaluate(fixture);await touch.evaluate(()=>GuidanceCampaignQA.state('cloud_terrace'));
    const result=await touch.evaluate(async()=>{
     await FinalAssetLoadingV1.ready();updateMobileLayout121();Input121.focused=true;releaseAll121();
     const before={x:G.x,y:G.y},route=getRoute().slice();let frames=0;
     // Real movement/update and collision rules at 60Hz; no position assignment
     // along the route. Touch axes are simulated, not a physical touch test.
     for(const [x,y]of route.slice(1)){
      let n=0;while(Math.hypot(G.x-(x+.5),G.y-(y+.5))>.1&&n++<180){
       const dx=x+.5-G.x,dy=y+.5-G.y,length=Math.hypot(dx,dy);Input121.touch=[dx/length*.7,dy/length*.7];Input121.touchRun=false;
       tick+=1/60;update(1/60);if(++frames%8===0)drawEnv();if(FinalAssetLoadingV1.busy())await FinalAssetLoadingV1.ready();
      }
      if(n>=180)throw Error('Touch route movement blocked '+JSON.stringify({goal:[x,y],player:[G.x,G.y],mode,gate:FinalAssetLoadingV1.snapshot(),input:inputVector121(),touch:Input121.touch,focused:Input121.focused,body:canBody121(x+.5,y+.5),canvas:[VW,VH]}));
     }
     Input121.touch=[0,0];keys={};for(let n=0;n<90;n++){tick+=1/60;update(1/60);drawEnv()}
     await FinalAssetLoadingV1.ready();transitionAlpha=screenShake=0;drawEnv();
     const prop=current.props.find(p=>p.type==='c3_metronome_waiting'),entry=EnemyArtV1.manifest.enemies.c3_metronome,cell=EnemyArtV1.manifest.cell,[px,py]=EnemyArtV1.manifest.pivot;
     const sample=document.createElement('canvas');sample.width=sample.height=cell;const q=sample.getContext('2d',{willReadFrequently:true});q.drawImage(EnemyArtV1.image('c3_metronome'),0,0,cell,cell,0,0,cell,cell);
     const data=q.getImageData(0,0,cell,cell).data;let minX=cell,minY=cell,maxX=-1,maxY=-1;
     for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if(data[(y*cell+x)*4+3]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
     const scale=entry.height/cell,width=Math.round(cell*scale),worldX=Math.round((prop.x+.5)*T-cam.x),worldY=Math.round((prop.y+.5)*T-cam.y),dx=Math.round(worldX-px*scale),dy=Math.round(worldY-py*scale);
     return{mobile:Input121.mobile,canvas:{width:VW,height:VH},before,after:{x:G.x,y:G.y},frames,mode,boss:bossActor?.id||null,interaction:nearestInteraction()?.value?.id,preview:GuidanceCampaignQA.probe().preview,
      alphaBounds:{left:dx+minX/cell*width,top:dy+minY/cell*width,right:dx+(maxX+1)/cell*width,bottom:dy+(maxY+1)/cell*width},transitionAlpha};
    });assert(result.mobile);if(viewport.width<viewport.height)assert.equal(result.canvas.width,384);assert(result.frames>0);assert.equal(result.mode,'walk');assert.equal(result.boss,null);assert.equal(result.interaction,'c3_metronome_start');assert.equal(result.preview,1);
    const bounds=result.alphaBounds;assert(bounds.left>=0&&bounds.top>=0&&bounds.right<=result.canvas.width&&bounds.bottom<=result.canvas.height,JSON.stringify(result));assert.equal(result.transitionAlpha,0);
    fs.mkdirSync(out,{recursive:true});await touch.screenshot({path:path.join(out,viewport.width<viewport.height?'metronome-touch-portrait.png':'metronome-touch-landscape.png')});results.push({viewport,...result});
   }finally{await context.close()}
  }return results;
 });
 assert.deepEqual(report.errors,[]);fs.mkdirSync(out,{recursive:true});
 await page.evaluate(async()=>{await FinalAssetLoadingV1.ready();transitionAlpha=screenShake=0;drawEnv()});
 await page.screenshot({path:path.join(out,'metronome-before-fight.png')});console.log('PASS '+report.checks.length);
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER.json'),JSON.stringify(report,null,2)+'\n');await browser?.close()});
