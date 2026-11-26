/* Reproducible captures from the real renderer and callbacks.
 * Disposable save, simulated gamepads; no physical hardware or full campaign. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const output=process.env.DESERT_STATES_OUTPUT_DIR||path.join(__dirname,'cenarios-deserto-v1/estados');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),context=await browser.newContext(),page=await context.newPage();
 const errors=[],frames=[],positions=[],patterns=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
  const url=process.argv[2]||'http://127.0.0.1:8792/';
  await page.goto(url,{waitUntil:'load',timeout:120000});
  const build=await(await context.request.get(new URL('build-info.json',url).href)).json();
  if(process.env.TORII_EXPECTED_SHA)assert.equal(build.sourceSha256,process.env.TORII_EXPECTED_SHA);
  await page.evaluate(async()=>{
   C3.loadDeferredImages();C3.start(true);for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();
   await CenariosV2.ready();await Promise.all(Object.keys(C3.assetData).map(async key=>{
    const image=C3.images[key];if(!image)throw Error('Missing configured C3 image '+key);
    // Chroma-key resources assign out.src only after their raw Image has
    // loaded and been processed. Await that existing pipeline, not raw art.
    if(!image.src)await new Promise((resolve,reject)=>{
     const finish=error=>{clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);error?reject(error):resolve()};
     const loaded=()=>finish(),failed=()=>finish(Error('C3 image failed '+key));
     const timer=setTimeout(()=>finish(Error('C3 image pipeline timed out '+key)),45000);
     image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});
    });
    await image.decode();if(!image.naturalWidth)throw Error('Empty configured C3 image '+key);
   }));
   await window.FinalAssetLoadingV1?.ready();
   if(typeof EnemyArtV1!=='undefined')await Promise.all(Object.keys(EnemyArtV1.manifest.enemies).map(k=>EnemyArtV1.image(k).decode()));
   if(typeof BossChoreographyV2!=='undefined')await Promise.all(Object.entries(BossChoreographyV2.manifest.clips).map(([k,spec])=>BossChoreographyV2.image(k,spec).decode()));
   for(const hero of ['synth','percussion'])for(const variant of ['masked','unmasked'])await MusicianArtV1.image(MusicianArtV1.key(hero,variant,'idle')).decode();
   for(const hero of ['franco','ryuchi'])await ProtagonistArtV5.image(hero+'_idle').decode();
   VW=768;VH=432;cv.width=VW;cv.height=VH;keys={};tick=4;transitionAlpha=screenShake=0;
   window.__statePads=()=>[0,1].map(index=>({index,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
   window.__stateP2=(member='ryuchi')=>{C3.pad.pads=__statePads();C3.coop.member=member;C3.syncCoop(true);const near=[[G.x+.7,G.y+.5],[G.x-.7,G.y],[G.x,G.y+.8]].find(([x,y])=>canBody121(x,y));if(near)[C3.coop.x,C3.coop.y]=near;if(!canBody121(C3.coop.x,C3.coop.y))throw Error('Invalid P2 capture position')};
   window.__statePlace=async(id,x,y,duo=true)=>{
    G.area=id;current=areas[id];const safe=safeSpawn121(x,y);if(!safe)throw Error('No safe capture position '+id);
    G.x=safe.x;G.y=safe.y;G.active='franco';G.formation=['franco','ryuchi'];G.hp.franco=G.maxhp.franco;G.hp.ryuchi=G.maxhp.ryuchi;
    mode='walk';battle=bossActor=null;trail=[];combatFX.length=0;C3.hazards=[];C3.pad.pads=[];
    if(duo)__stateP2();cam.x=Math.max(0,x*T-VW/2);cam.y=Math.max(0,y*T-VH/2);
    await window.FinalAssetLoadingV1?.ready();
   };
   window.__stateDraw=()=>{
    $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';
    transitionAlpha=screenShake=0;drawEnv();if(mode==='action')drawCombatLayer();return cv.toDataURL('image/png');
   };
  });
  async function snap(name){
   await page.evaluate(()=>window.FinalAssetLoadingV1?.ready());
   const pos=await page.evaluate(name=>({name,area:G.area,p1:{x:G.x,y:G.y,valid:canBody121(G.x,G.y)},p2:C3.coopActive()?{x:C3.coop.x,y:C3.coop.y,valid:canBody121(C3.coop.x,C3.coop.y)}:null}),name);
   assert(pos.p1.valid&&(!pos.p2||pos.p2.valid),'Invalid actor placement '+name);positions.push(pos);
   const data=await page.evaluate(()=>__stateDraw());fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(data.split(',')[1],'base64'));frames.push(name);
  }
  await page.evaluate(async()=>{Object.assign(G.c3,C3.defaults(),{started:true,windFlute:true,horizonDrum:true});buildMaps();await __statePlace('cloud_sea',20,23)});
  await snap('altura-00-ausente-p1p2');
  await page.evaluate(async()=>{C3.cloudPath('A');await __statePlace('cloud_sea',20,23)});await snap('altura-01-passagem-a-p1p2');
  await page.evaluate(async()=>{C3.cloudPlatform();await __statePlace('cloud_sea',34,16)});await snap('altura-02-plataforma-p1p2');
  await page.evaluate(async()=>{C3.cloudPath('B');await __statePlace('cloud_sea',46,11)});await snap('altura-03-passagem-b-p1p2');
  await page.evaluate(async()=>{Object.assign(G.c3,{usinaGate:false,usinaDone:false});buildMaps();G.flags.bass=true;await __statePlace('power_plant',17,14)});await snap('usina-00-fechada');
  await page.evaluate(async()=>{C3.openPlantGate();for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();await __statePlace('power_plant',17,14)});await snap('usina-01-aberta');
  for(const active of [false,true]){await page.evaluate(async active=>{G.c3.clubPhraseDone=active;await __statePlace('contratempo',14,8)},active);await snap('palco-'+(active?'ativo':'inativo'))}
  for(const done of [false,true]){await page.evaluate(async done=>{Object.assign(G.c3,{canalPath:done,canalDone:done});buildMaps();await __statePlace('sky_canal',21,12)},done);await snap('canal-'+(done?'resolvido':'interferencia'))}
  const patrol=await page.evaluate(async()=>{
   G.c3.usinaDone=true;G.defeated=[];await __statePlace('distortion_district',37.5,25.5);
   const enemy=enemyActors().map(hydrateEnemy).find(e=>e.hp>0);if(!enemy)throw Error('No real living patrol');
   const near=[[enemy.x+1,enemy.y],[enemy.x-1,enemy.y],[enemy.x,enemy.y+1],[enemy.x,enemy.y-1]].find(([x,y])=>canBody121(x,y));if(!near)throw Error('No valid approach');
   [G.x,G.y]=near;__stateP2();act.invuln=10;enemy.cd=0;enemy.stun=0;enemy.wind=0;engage();updateEnemy(enemy,.016,false);
   if(mode!=='action'||!(enemy.wind>0))throw Error('Real patrol windup not generated');
   cam.x=Math.max(0,enemy.x*T-VW/2);cam.y=Math.max(0,enemy.y*T-VH/2);return {id:enemy.id,wind:enemy.wind,windKind:enemy.windKind};
  });await snap('distrito-combate-real');
  await page.evaluate(async()=>{
   C3.pad.pads=[];C3.qaState('silence');for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();await window.FinalAssetLoadingV1?.ready();
   const safe=safeSpawn121(bossActor.x+3,bossActor.y+2);G.x=safe.x;G.y=safe.y;__stateP2('percussion');
   window.__statePatternMode=window.ToriiCombate.MODE.mode;window.ToriiCombate.MODE.mode='padrao';
   cam.x=Math.max(0,bossActor.x*T-VW/2);cam.y=Math.max(0,bossActor.y*T-VH/2);
  });
  for(const kind of ['ring','cross','fan','rain','chase','pulse','orbit']){
   const result=await page.evaluate(kind=>{
    C3.hazards=[];combatFX.length=0;hostileShots=[];bossActor.log=[];bossActor.lastPattern121=null;
    C3.castPattern(bossActor,kind);const actual=[...new Set(C3.hazards.map(h=>h.kind))];
    C3.updateHazards(.25,bossActor);return {requested:kind,actual,atSeconds:.25,count:C3.hazards.length};
   },kind);assert.deepEqual(result.actual,[kind]);patterns.push(result);await snap('nucleo-aviso-'+kind);
  }
  await page.evaluate(async()=>{window.ToriiCombate.MODE.mode=window.__statePatternMode});
  const retry=await page.evaluate(async()=>{
   C3.hazards=[];showDefeat();if(!$('retryCheckpoint'))throw Error('Real retry button missing');$('retryCheckpoint').click();
   for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();await window.FinalAssetLoadingV1?.ready();update(1/60);drawEnv();
   const valid=canBody121(G.x,G.y),x=G.x;moveActor121(G,.2,0,1);const canMove=G.x!==x;
   C3.startSilence(false);for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();await window.FinalAssetLoadingV1?.ready();update(1/60);
   return {mode,area:G.area,valid,canMove,formation:G.formation,boss:bossActor?.id||null};
  });assert(retry.valid&&retry.canMove);assert.equal(retry.mode,'action');assert.equal(retry.boss,'c3_silence');await snap('apos-tentar-novamente');
  assert.deepEqual(errors,[]);
  const report={build:{version:build.version,sha256:build.sourceSha256},frames,positions,patrol,patterns,retry,browserErrors:errors,realRouteCallbacks:true,simulatedPads:true,physicalHardware:false,warningEvidenceLimit:'Seven real pattern kinds requested and asserted. Distinct warning geometry/readability requires separate human review; no full campaign played.'};
  fs.writeFileSync(path.join(output,'ESTADOS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({frames:frames.length,patterns,retry,errors}));
 }finally{await context.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
