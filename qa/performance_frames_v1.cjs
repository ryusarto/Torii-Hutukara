'use strict';
// Native scheduler + actual game draws. Calibration prevents attributing the
// host's refresh cap to the game; none of these numbers certify physical FPS.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const url=process.argv[2],out=process.env.PERF_OUT;
if(!/^https?:/.test(url||'')||!out)throw Error('Pass HTTP export URL and PERF_OUT');
const report={url,method:'Native requestAnimationFrame intervals with the actual game, compared with about:blank in the same browser. Draw invocations count completed game draws outside the asset gate, not GPU presentation. No hardware FPS certification.',cases:[],errors:[]};
async function sample(count=90){
 window.__cpuRows=[];window.__cpuMeasure=true;
 const intervals=[];let last=await new Promise(requestAnimationFrame);const start=performance.now();
 const before=window.__measuredDraws||0;
 while(intervals.length<count){const now=await new Promise(requestAnimationFrame);intervals.push(now-last);last=now}
 const elapsed=performance.now()-start,a=[...intervals].sort((a,b)=>a-b),pct=p=>a[Math.min(a.length-1,Math.floor(a.length*p))];
 window.__cpuMeasure=false;const rows=window.__cpuRows||[],cpuStats=k=>{if(!rows.length)return null;const values=rows.map(r=>r[k]).sort((a,b)=>a-b);return{median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],p99:values[Math.floor(values.length*.99)],max:values.at(-1),over16_7ms:values.filter(v=>v>1000/60).length}};
 return{cpuFrames:rows.length,cpuUpdateMs:cpuStats('update'),cpuDrawMs:cpuStats('draw'),cpuFrameMs:cpuStats('total'),frames:intervals.length,elapsedMs:elapsed,rafFps:intervals.length*1000/elapsed,completedDraws:(window.__measuredDraws||0)-before,medianMs:pct(.5),p95Ms:pct(.95),p99Ms:pct(.99),maxMs:a.at(-1),over16_7ms:intervals.filter(x=>x>18.5).length};
}
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});report.browser=browser.version();
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('about:blank');report.scheduler=await page.evaluate(sample);
 await page.addInitScript(()=>Object.defineProperty(navigator,'getGamepads',{value:()=>[]}));
 await page.goto(url,{waitUntil:'load',timeout:120000});await page.locator('#playtestEntry').waitFor({state:'detached'});
 report.source=await page.evaluate(()=>window.TORII_PLAYTEST_BUILD?.sourceSha256);
 await page.evaluate(()=>{window.__measuredDraws=0;let updateCost=0;const beforeUpdate=update;update=function(...args){const start=performance.now(),r=beforeUpdate.apply(this,args);updateCost=performance.now()-start;return r};const before=drawEnv;drawEnv=function(...args){const loading=window.FinalAssetLoadingV1?.busy(),start=performance.now();const r=before.apply(this,args),cost=performance.now()-start;if(!loading&&!window.FinalAssetLoadingV1?.busy()){__measuredDraws++;if(window.__cpuMeasure)__cpuRows.push({update:updateCost,draw:cost,total:updateCost+cost})}return r}});
 const specs=process.env.PERF_CASES?JSON.parse(process.env.PERF_CASES):[{id:'forest',area:'forest',x:26,y:21},{id:'district',area:'distortion_district',x:35,y:26},{id:'plant',area:'power_plant',x:25,y:13},{id:'wave10',wave:10},{id:'wave30',wave:30},...['viajante','arauto','metronomo','silencio'].map((boss,i)=>({id:boss,boss,area:['ruins','voice_tower','cloud_terrace','silence_core'][i],x:[35.4,13.5,15.5,17.5][i],y:[18.5,16.5,14.5,20.5][i]}))];
 for(const spec of specs){
  await page.evaluate(async s=>{
   ToriiSorte.semear(8142);G=fresh();G.chapter=s.boss==='viajante'?1:s.boss==='arauto'?2:3;
   Object.assign(G.flags,{bass:true,masks:true,reveal:true,ending:true,voicesKatana:true});
   Object.assign(G.c3,{started:G.chapter===3,complete:!s.boss,synthUnlocked:true,percussionUnlocked:true,usinaDone:true,canalDone:true});
   G.knownMembers=['franco','ryuchi','alt','katana','synth','percussion'];G.active='franco';G.formation=['franco','ryuchi','synth'];for(const id of G.knownMembers)G.hp[id]=G.maxhp[id]=99999;
   buildMaps();setArea(s.area||'last_torii',s.x||13.5,s.y||13.5,false);
   if(s.wave){PostGame.startDungeon(8142);PostGame.run().wave=s.wave;PostGame.beginWave()}
   if(s.boss){if(s.boss==='viajante')spawnBossFight();else if(s.boss==='arauto')spawnVoiceBoss();else if(s.boss==='metronomo')C3.spawnMetronome();else C3.spawnSilence();if(!bossActor)throw Error('Boss fixture failed')}
   menuPage10=menuOrigin10=null;keys={};for(const id of['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';mode=s.wave||s.boss?'action':'walk';transitionAlpha=0;act.invuln=99999;companionCooldown=99999;
   await window.FinalAssetLoadingV1?.ready();
  },spec);
  await page.waitForTimeout(1200);await page.evaluate(()=>window.FinalAssetLoadingV1?.ready());
  const initial=await page.evaluate(()=>({mode,area:G.area,boss:bossActor?.id||null,enemies:current.enemies.length,loading:window.FinalAssetLoadingV1?.busy()||false}));
  if(spec.boss&&(!initial.boss||initial.mode!=='action'))throw Error('Not measuring the intended boss: '+JSON.stringify(initial));
  if(initial.loading)throw Error('Scene still loading');
  const measurement=await page.evaluate(sample,Number(process.env.PERF_NATIVE_FRAMES)||90),final=await page.evaluate(()=>({mode,area:G.area,boss:bossActor?.id||null,loading:window.FinalAssetLoadingV1?.busy()||false}));
  report.cases.push({...spec,...measurement,drawFps:measurement.completedDraws*1000/measurement.elapsedMs,initial,final});console.log(spec.id+' '+JSON.stringify(report.cases.at(-1)));
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 }
 if(report.errors.length)throw Error('Browser errors: '+report.errors.join(' | '));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')});
