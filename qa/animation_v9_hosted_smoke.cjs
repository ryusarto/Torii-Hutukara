// Check the hosted lazy-media pipeline, separately from portable art tests.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/beta-1.17.0/HOSTED_ANIMATION_V9.json');
let browser;const report={checks:[],errors:[],limits:['Isolated Chromium context; hosted lazy media and movement smoke test, not a full campaign.']};
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--disable-gpu']});
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(process.argv[2]||'http://127.0.0.1:8877/?ui=22bae091',{waitUntil:'load',timeout:120000});
 await page.locator('#playtestEntry').waitFor({state:'detached'});
 const expected=JSON.parse(fs.readFileSync(path.join(root,'production/playtest-dist/build-info.json'))).sourceSha256;
 const boot=await page.evaluate(()=>({sha:TORII_PLAYTEST_BUILD.sourceSha256,registration:RunStrideV1.manifest.registrationVersion,fx:HeroAttackFX.v3Manifest.version,baked:ProtagonistArtV5.manifest.bakedEdgeMatte.length}));
 assert.equal(boot.sha,expected);assert.equal(boot.registration,9);assert.equal(boot.fx,3);assert.equal(boot.baked,12);report.checks.push({name:'Hosted export contains final V9/V3 modules and baked matte manifest',passed:true,details:boot});
 await page.waitForFunction(()=>HeroAttackFX.heroes.every(h=>HeroAttackFX.v3Ready(h)),null,{polling:50,timeout:60000});
 const loaded=await page.evaluate(async()=>{const walk=ProtagonistArtV5.image('ryuchi_walk');await walk.decode();const run=await RunStrideV1.image('ryuchi').ready;return{run,walkWidth:walk.naturalWidth,customOnload:typeof walk.onload==='function',atlases:HeroAttackFX.heroes.map(h=>({hero:h,width:HeroAttackFX.v3Images[h].naturalWidth,height:HeroAttackFX.v3Images[h].naturalHeight}))}});
 assert(loaded.run);assert.equal(loaded.walkWidth,4096);assert(!loaded.customOnload);for(const a of loaded.atlases){assert.equal(a.width,1024);assert.equal(a.height,768)}report.checks.push({name:'All six FX sheets and precleaned walk/run decode through hosted loader',passed:true,details:loaded});
 const walking=await page.evaluate(()=>{G=fresh();G.active='ryuchi';buildMaps();setArea('studio',12.5,10.5,false);mode='walk';battle=bossActor=null;menuOpen=false;for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');Input121.focused=true;resetMotion10();keys={ArrowLeft:true};const before=G.x;for(let i=0;i<30;i++){tick+=1/60;update(1/60);drawEnv()}keys={};return{distance:before-G.x,state:RunStrideV1.snapshot().find(s=>s.hero==='ryuchi')}});
 assert(walking.distance>.3);assert.equal(walking.state.moveDir,'left');assert.equal(walking.state.nativePose.frame%2,0);report.checks.push({name:'Opening unmasked Ryuchi walks using canonical left poses in the hosted build',passed:true,details:walking});
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify({passed:report.checks.length,errors:report.errors}));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');await browser?.close()});
