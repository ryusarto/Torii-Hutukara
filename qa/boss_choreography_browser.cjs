/* Built-game choreography checks in an isolated Chromium profile, no player saves.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CHROME_PATH=/path/to/chrome
 * node qa/boss_choreography_browser.cjs [portable HTML URL or local path]
 * Captures are controlled simulation scenarios, not a human campaign/playtest.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const out=path.join(root,'qa/boss-animations-v2');
const input=process.argv[2]||path.join(root,'game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html');
const url=/^(file|https?):/.test(input)?input:pathToFileURL(path.resolve(input)).href;
const checks=[],errors=[],animatedSequences=[];let browser,context;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,o){return get.call(this,k,k==='2d'?{...o,willReadFrequently:true}:o);};});
 await page.goto(url,{waitUntil:'load',timeout:120000});
 async function check(name,run){try{const detail=await run();checks.push({name,passed:true,detail});console.log('OK · '+name);}catch(e){checks.push({name,passed:false,error:e.stack});throw e;}}
 await check('Cast and directional walking atlases decode with distinct transparent frames',async()=>{
  const r=await page.evaluate(async()=>{const a=BossChoreographyV2,result=[];
   for(const [key,entry]of Object.entries(a.manifest.clips)){const im=a.image(key,entry);if(!im)throw Error(key+' missing image');await im.decode();const cell=entry.cell||a.manifest.cell,columns=entry.columns||a.manifest.columns,rows=entry.rows||2,frames=entry.frames||8;if(im.naturalWidth!==cell*columns||im.naturalHeight!==cell*rows)throw Error(key+' dimensions');const c=document.createElement('canvas');c.width=c.height=cell;const q=c.getContext('2d'),hashes=[];
    for(let row=0;row<(entry.directions?rows:1);row++)for(let f=0;f<frames;f++){q.clearRect(0,0,cell,cell);q.drawImage(im,(f%columns)*cell,(entry.directions?row:Math.floor(f/columns))*cell,cell,cell,0,0,cell,cell);const d=q.getImageData(0,0,cell,cell).data;let h=2166136261,pixels=0;for(let j=0;j<d.length;j++){h=Math.imul(h^d[j],16777619);if(j%4===3&&d[j]>128)pixels++;}if(!pixels)throw Error(key+' empty frame '+f);if(d[3]||d[(cell*cell-1)*4+3])throw Error(key+' opaque corner '+f);hashes.push((h>>>0).toString(16));}result.push({key,hashes,unique:new Set(hashes).size,expected:entry.directions?frames*rows:frames});}return result;});
  assert.deepEqual(r.map(x=>x.key).sort(),['boss_cast','boss_charge','voice_boss_cast','c3_metronome_cast','c3_silence_cast','boss_walk','c3_metronome_walk'].sort());assert(r.every(x=>x.unique===x.expected));return r;
 });
 await page.evaluate(async()=>{
  G=fresh();buildMaps();
  if(typeof CenariosV2!=='undefined')await CenariosV2.ready();
  await Promise.all(Object.values(C3.images).filter(i=>i?.src).map(i=>i.decode().catch(()=>{})));
  await Promise.all(Object.keys(EnemyArtV1.manifest.enemies).map(k=>EnemyArtV1.image(k).decode()));
  window.BossQA={
   fixture(id,phase=1){G=fresh();buildMaps();G.area=({boss:'ruins',voice_boss:'voice_tower',c3_metronome:'cloud_terrace',c3_silence:'silence_core'})[id];current=areas[G.area];mode='action';act.invuln=0;G.active='franco';G.formation=['franco','ryuchi'];G.guidance=false;G.options10={...G.options10,reducedMotion:false};G.x=15;G.y=15;G.hp.franco=G.maxhp.franco=1000;bossActor={id,type:'boss',kind:'boss',x:15,y:10,hp:phase===1?1000:400,max:1000,power:10,cd:10,wind:0,windKind:'ring',stun:0,flash:0,phase,facing:Math.PI/2,chargeX:0,chargeY:1};battle={id,boss:true};C3.hazards=[];C3.finalPending=false;hostileShots=[];combatFX=[];if(typeof rings092!=='undefined')rings092=[];ToriiCombate.MODE.mode='padrao';BossChoreographyV2.reset();transitionAlpha=0;cam.x=clamp(15*T-VW/2,0,current.w*T-VW);cam.y=id==='c3_silence'?0:clamp(12*T-VH/2,0,current.h*T-VH);return bossActor;},
   step(dt){BossChoreographyV2.clock+=dt;updateEnemy(bossActor,dt,true);return BossChoreographyV2.pose(bossActor);},
   // drawEnv already invokes the combat layer. Capture exactly one game pass.
   render(){drawEnv();return cv.toDataURL('image/png');},
   recovery(){const a=BossChoreographyV2,e=bossActor,r=a.records.get(e),frames=[];for(const offset of [0,.101,.201,.301]){a.clock=r.releaseAt+offset;frames.push(a.pose(e)?.frame??null);}return frames;},
   emit(kind){const e=bossActor;C3.castPattern(e,kind);return C3.hazards[0];}
  };
 });
 await check('First boss selects moving bitmap poses and keeps the same cell while paused',async()=>{
  const r=await page.evaluate(()=>{const e=BossQA.fixture('boss'),art=BossChoreographyV2;Object.assign(e,{x:39.4,y:17.6,cd:99});G.x=35.4;G.y=18.5;const start={x:e.x,y:e.y},frames=new Set();let last=null;for(let i=0;i<360;i++){BossQA.step(1/60);const pose=art.walkPose(e);if(pose){frames.add(pose.frame);last=pose;if(frames.size>=3)break}}if(!last)throw Error('No actual boss walking');const phase=art.walks.get(e).phase,cell=JSON.stringify(art.walkPose(e));mode='overlay';update(.06);const frozen=cell===JSON.stringify(art.walkPose(e))&&phase===art.walks.get(e).phase,body=JSON.stringify(e),drawn=art.drawActor(e.x*T-cam.x,e.y*T-cam.y,'boss',e);return{distance:Math.hypot(e.x-start.x,e.y-start.y),frames:[...frames],frozen,drawn,bodyUnchanged:body===JSON.stringify(e)}});assert(r.distance>0&&r.frames.length>=3&&r.frozen&&r.drawn&&r.bodyUnchanged,JSON.stringify(r));return r;
 });
 await check('Metronome walks in four directions, plants its feet for attacks and stays clear of the rear door',async()=>{
  const r=await page.evaluate(()=>{
   const directions=[];
   let capture;
   for(const [dx,dy] of [[0,1],[-1,0],[0,-1],[1,0]]){
    const e=BossQA.fixture('c3_metronome'),frames=new Set();e.patternIndex=0;
    G.x=e.x+dx*6;G.y=e.y+dy*6;
    const start=[e.x,e.y];let row=null;
    for(let i=0;i<48;i++){
     BossQA.step(1/60);const pose=BossChoreographyV2.walkPose(e);
     if(pose){row=pose.row;frames.add(pose.frame);if(dx===0&&dy===1&&pose.frame===2&&!capture)capture=BossQA.render()}
    }
    directions.push({row,frames:frames.size,travel:Math.hypot(e.x-start[0],e.y-start[1])});
   }
   const e=BossQA.fixture('c3_metronome');e.patternIndex=0;G.x=15.5;G.y=2.1;
   e.y=3.25;BossQA.step(1/60);
   for(let i=0;i<240;i++)BossQA.step(1/60);
   const staysOnFloor=metronomeCanStand(e.x,e.y);
   const beforeHit=[e.x,e.y];hitEnemy(e,1,.25,3);const afterHit=[e.x,e.y];e.stun=0;
   const warning=BossQA.emit('cross'),beforeCast=[e.x,e.y];
   for(let i=0;i<24;i++)BossQA.step(1/60);
   const afterCast=[e.x,e.y],stillWarning=!warning.fired&&!BossChoreographyV2.walkPose(e);
   const phase=BossQA.fixture('c3_metronome');phase.patternIndex=0;G.difficulty='normal';
   G.x=phase.x;G.y=phase.y-1.2;BossQA.step(1/60);
   phase.hp=phase.max*.6;BossQA.step(1/60);
   return {directions,staysOnFloor,beforeHit,afterHit,beforeCast,afterCast,stillWarning,
    phase:phase.f2?.fase,playerSupported:canBody121(G.x,G.y),capture};
  });
  assert.deepEqual(r.directions.map(d=>d.row),[0,1,2,3]);
  assert(r.directions.every(d=>d.travel>1&&d.frames>=3));
  assert(r.staysOnFloor&&r.stillWarning&&r.playerSupported);
  assert.deepEqual(r.beforeHit,r.afterHit);assert.deepEqual(r.beforeCast,r.afterCast);assert.equal(r.phase,2);
  assert(r.capture);fs.writeFileSync(path.join(out,'metronomo-caminhada.png'),Buffer.from(r.capture.split(',')[1],'base64'));
  delete r.capture;return r;
 });
 const shots=[];
 await check('Danger zones render once on the ground before the boss body',async()=>{
  const rows=await page.evaluate(()=>['boss','c3_metronome'].map(id=>{
   const e=BossQA.fixture(id),a=BossChoreographyV2,events=[];
   if(id==='boss'){e.wind=.5;e.windKind='ring';a.begin(e,a.snapshot(e));}else BossQA.emit('cross');
   const ground=a.drawGround,paint=a.paint,creature=drawCreature;
   a.drawGround=function(...args){events.push('ground');return ground.apply(this,args);};
   a.paint=function(...args){events.push('zone');return paint.apply(this,args);};
   drawCreature=function(x,y,k,actor,...rest){if(actor===e)events.push('body');return creature.call(this,x,y,k,actor,...rest);};
   try{BossQA.render();return{id,events};}finally{a.drawGround=ground;a.paint=paint;drawCreature=creature;}
  }));
  for(const r of rows){assert.equal(r.events.filter(x=>x==='ground').length,1);assert.equal(r.events.filter(x=>x==='zone').length,1);assert.equal(r.events.filter(x=>x==='body').length,1);assert(r.events.indexOf('zone')<r.events.indexOf('body'));}return rows;
 });
 await check('Actual C3 cast/update releases all attack patterns at h.fired while wind remains positive',async()=>{
  const r=await page.evaluate(()=>{const rows=[];for(const id of ['c3_metronome','c3_silence'])for(const kind of (id==='c3_metronome'?['ring','cross','fan','pulse']:['ring','cross','fan','pulse','rain','chase','orbit'])){
   const e=BossQA.fixture(id),h=BossQA.emit(kind),a=BossChoreographyV2,frames=[a.pose(e)?.frame];
   const total=h.time-h.trigger;BossQA.step(total*.30);frames.push(a.pose(e)?.frame);BossQA.step(total*.35);frames.push(a.pose(e)?.frame);BossQA.step(total*.34);frames.push(a.pose(e)?.frame);const before={fired:h.fired===true,wind:e.wind,frame:a.pose(e)?.frame};BossQA.step(total*.01+.00001);
   rows.push({id,kind,frames,before,fired:h.fired===true,wind:e.wind,release:a.pose(e)?.frame,recovery:BossQA.recovery(),hazards:C3.hazards.length});
  }return rows;});
  for(const row of r){assert.equal(row.before.fired,false);assert(row.frames.every(f=>f>=0&&f<=3));assert(new Set(row.frames).size>=3);assert(row.fired,row.id+row.kind);assert(row.wind>0);assert.equal(row.release,4);assert.deepEqual(row.recovery,[4,5,6,7]);}return r;
 });
 await check('Viajante actual wind release and charge endpoint match the eleven collision steps',async()=>{
  const r=await page.evaluate(()=>{const rows=[];for(const kind of ['ring','fan','charge']){const e=BossQA.fixture('boss',2),a=BossChoreographyV2;e.wind=.6;e.windKind=kind;e.facing=Math.PI/2;e.chargeX=0;e.chargeY=1;if(kind==='charge'){let spot=null;for(let y=3;y<current.h-3&&!spot;y++)for(let x=3;x<current.w-3;x++)if(tileWalkable(current,x+.5,y+.5)&&tileWalkable(current,x+.5,y+.88)){spot={x:x+.5,y:y+.5};break;}if(!spot)throw Error('no charge corridor');Object.assign(e,spot);}a.begin(e,a.snapshot(e));const points=kind==='charge'?a.previewCharge(e):[],start={x:e.x,y:e.y},frames=[a.pose(e)?.frame];BossQA.step(.19);frames.push(a.pose(e)?.frame);BossQA.step(.2);frames.push(a.pose(e)?.frame);BossQA.step(.21+.00001);const record=a.records.get(e);rows.push({kind,start,end:{x:e.x,y:e.y},points,storedPoints:record.execution.points,frames,release:a.pose(e)?.frame,recovery:BossQA.recovery()});}return rows;});
  for(const row of r){assert(row.frames.every(f=>f>=0&&f<=3));assert.equal(row.release,4);assert.deepEqual(row.recovery,[4,5,6,7]);if(row.kind==='charge'){assert.equal(row.points.length,11);assert.deepEqual(row.end,row.points.at(-1));assert.deepEqual(row.storedPoints,row.points);assert(Math.hypot(row.end.x-row.start.x,row.end.y-row.start.y)>0);}}return r;
 });
 await check('Arauto uses actual tele09 allocation/time and expanding double-wave collision bands',async()=>{
  const r=await page.evaluate(()=>{const e=BossQA.fixture('voice_boss'),a=BossChoreographyV2;e.cd=0;BossQA.step(.001);const tele=e.tele09,start=tele.time,frames=[a.pose(e)?.frame];BossQA.step(start*.4);frames.push(a.pose(e)?.frame);BossQA.step(start*.4);frames.push(a.pose(e)?.frame);BossQA.step(start*.2+.00001);const result={allocated:!!tele,start,frames,cleared:e.tele09===null,release:a.pose(e)?.frame,recovery:BossQA.recovery()};
   const w=BossQA.fixture('voice_boss',2);w.cd=0;w.step09=2;BossQA.step(.001);result.doubleWarning=w.echoWarning092;BossQA.step(w.echoWarning092+.00001);result.waves=rings092.map(r=>({...r}));result.band=BossChoreographyV2.contains({kind:'wave',x:0,y:0,r:3},3,0)&&!BossChoreographyV2.contains({kind:'wave',x:0,y:0,r:3},0,0);return result;});
  assert(r.allocated&&r.cleared);assert(r.start>1.08);assert(r.frames.every(f=>f>=0&&f<=3));assert.equal(r.release,4);assert.deepEqual(r.recovery,[4,5,6,7]);assert(r.doubleWarning>0);assert.equal(r.waves.length,2);assert(r.waves[1].delay>r.waves[0].delay);assert(r.band);return r;
 });
 await check('Pause/load/area/retry/final cancellation clears stale visual state',async()=>{
  const r=await page.evaluate(()=>{let e=BossQA.fixture('boss');e.wind=.5;BossChoreographyV2.begin(e,BossChoreographyV2.snapshot(e));mode='dialogue';const before=BossChoreographyV2.clock;update(.02);const pause=BossChoreographyV2.clock===before;mode='action';G={...G};BossChoreographyV2.sync();const load=BossChoreographyV2.pose(e)===null;e.wind=.5;BossChoreographyV2.begin(e,BossChoreographyV2.snapshot(e));G.area='forest';BossChoreographyV2.sync();const area=BossChoreographyV2.pose(e)===null;e=BossQA.fixture('c3_silence');BossQA.emit('ring');C3.finalPending=true;BossChoreographyV2.sync();const final=BossChoreographyV2.pose(e)===null;e=BossQA.fixture('boss');e.wind=.5;BossChoreographyV2.begin(e,BossChoreographyV2.snapshot(e));const old=e;spawnBossFight(true);BossChoreographyV2.sync();return{pause,load,area,final,retry:bossActor!==old&&BossChoreographyV2.pose(bossActor)===null};});assert(Object.values(r).every(Boolean));return r;
 });
 await check('Cosmetic draw on/off preserves actual C3 damage/actor/hazard state',async()=>{
  const r=await page.evaluate(()=>{function run(draw){const e=BossQA.fixture('c3_silence');G.x=e.x;G.y=e.y;const h=BossQA.emit('ring');for(let i=0;i<60;i++){BossQA.step(.02);if(draw){BossChoreographyV2.drawActor(300,250,'boss',e);drawCombatLayer();}}return{hp:G.hp.franco,x:e.x,y:e.y,wind:e.wind,cd:e.cd,hazard:{time:h.time,fired:h.fired},shots:hostileShots.map(p=>({...p}))};}return{on:run(true),off:run(false)};});assert.deepEqual(r.on,r.off);assert(r.on.hp<1000,'parity scenario must exercise damage');return r;
 });
 await page.evaluate(()=>{const a=BossChoreographyV2,c=document.createElement('canvas');c.id='qa-boss-clips';c.width=1280;c.height=5*190;c.style.cssText='position:fixed;left:0;top:0;z-index:999999';document.body.append(c);const q=c.getContext('2d'),cell=a.manifest.cell;q.imageSmoothingEnabled=false;Object.keys(a.manifest.clips).forEach((key,row)=>{q.fillStyle=row%2?'#36302a':'#292a2d';q.fillRect(0,row*190,1280,190);q.fillStyle='#fff0d0';q.font='14px sans-serif';q.fillText(key,8,row*190+16);for(let f=0;f<8;f++){q.drawImage(a.images[key],(f%4)*cell,Math.floor(f/4)*cell,cell,cell,f*160,row*190+25,160,160);q.fillText(String(f),f*160+8,row*190+35);}});});
 await page.locator('#qa-boss-clips').screenshot({path:path.join(out,'CONTATO_40_QUADROS.png')});
 await page.locator('#qa-boss-clips').evaluate(e=>e.remove());
 // Controlled actual simulation states rendered through the game's canvas.
 for(const [id,kind]of [['boss','ring'],['boss','charge'],['voice_boss','lanes'],['c3_metronome','cross'],['c3_silence','rain']]){
  const r=await page.evaluate(({id,kind})=>{const e=BossQA.fixture(id,id==='boss'?2:1),a=BossChoreographyV2;if(id.startsWith('c3_'))BossQA.emit(kind);else if(id==='boss'){e.wind=.6;e.windKind=kind;a.begin(e,a.snapshot(e));}else{e.cd=0;BossQA.step(.001);}const prep=a.pose(e),total=id.startsWith('c3_')?C3.hazards[0].time-C3.hazards[0].trigger:a.snapshot(e).remaining;BossQA.step(total*.72);const prepImage=BossQA.render();BossQA.step(total*.28+.00001);const releaseImage=BossQA.render(),release=a.pose(e);a.clock+=.15;return{prep:prep?.frame,release:release?.frame,images:[prepImage,releaseImage,BossQA.render()]};},{id,kind});
  for(let i=0;i<r.images.length;i++){const name=id+'_'+kind+'_'+['PREPARACAO','LIBERACAO','RECUPERACAO'][i]+'.png';fs.writeFileSync(path.join(out,name),Buffer.from(r.images[i].split(',')[1],'base64'));shots.push({label:name,image:r.images[i]});}
 }
 await page.evaluate(async(shots)=>{const c=document.createElement('canvas');c.id='qa-boss-choreography';c.width=1152;c.height=Math.ceil(shots.length/3)*242;c.style.cssText='position:fixed;left:0;top:0;z-index:999999';document.body.append(c);const q=c.getContext('2d');q.fillStyle='#272322';q.fillRect(0,0,c.width,c.height);for(let i=0;i<shots.length;i++){const im=new Image();im.src=shots[i].image;await im.decode();const x=i%3*384,y=Math.floor(i/3)*242;q.drawImage(im,x,y+26,384,216);q.fillStyle='#fff0d0';q.font='11px sans-serif';q.fillText(shots[i].label,x+5,y+16);}},shots);
 await page.locator('#qa-boss-choreography').screenshot({path:path.join(out,'CONTATO_COMBATE.png')});
 // Real simulation snapshots for animation packaging. Hold the final safe pose after
 // the first recovery so a quick phase-2 cooldown cannot introduce a second attack.
 await check('Animated canvas evidence covers real preparation, frame-4 release and recovery',async()=>{
  const summaries=[];
  for(const [id,kind]of [['boss','ring'],['boss','charge'],['voice_boss','lanes'],['c3_metronome','cross'],['c3_silence','rain']]){
   const key=id+'_'+kind,frames=await page.evaluate(({id,kind})=>{
    const e=BossQA.fixture(id,kind==='charge'?2:1),a=BossChoreographyV2;
    if(id==='boss'){e.x=39.4;e.y=17.6;G.x=35.4;G.y=18.5;e.cd=0;cam.x=clamp(e.x*T-VW/2,0,current.w*T-VW);cam.y=clamp(e.y*T-VH/2,0,current.h*T-VH);BossQA.step(.001);}
    else if(id==='voice_boss'){e.cd=0;BossQA.step(.001);}
    else BossQA.emit(kind);
    const actualKind=id.startsWith('c3_')?C3.hazards[0]?.kind:a.snapshot(e)?.kind;
    if(actualKind!==kind)throw Error(id+' requested '+kind+' but allocated '+actualKind);
    const rows=[];let firstReleaseAt=null,holding=false;
    for(let i=0;i<24;i++){
     let stepDt=0;if(i>0&&!holding){stepDt=.07;BossQA.step(stepDt);}
     const record=a.records.get(e);if(firstReleaseAt===null&&record?.released)firstReleaseAt=record.releaseAt;
     const pose=a.pose(e);
     rows.push({index:i,id,kind,dt:stepDt,displayDurationMs:70,clock:a.clock,pose:pose?.frame??null,
      released:record?.released===true,holding,actor:{x:e.x,y:e.y,wind:e.wind},
      hazards:C3.hazards.map(h=>({kind:h.kind,time:h.time,fired:!!h.fired})),image:BossQA.render()});
     if(firstReleaseAt!==null&&a.clock-firstReleaseAt>=.32)holding=true;
    }
    return rows;
   },{id,kind});
   const directory=path.join(out,'frames',key);fs.mkdirSync(directory,{recursive:true});
   for(const f of frames){const filename=String(f.index).padStart(3,'0')+'.png';fs.writeFileSync(path.join(directory,filename),Buffer.from(f.image.split(',')[1],'base64'));delete f.image;f.file=path.relative(out,path.join(directory,filename));}
   const poses=frames.map(f=>f.pose);assert(poses.some(f=>f>=0&&f<=3),key+' preparation');assert(poses.includes(4),key+' release frame');assert(poses.includes(5)&&poses.includes(6)&&poses.includes(7),key+' recovery frames');
   const metadata={key,id,kind,frames,method:'Actual updateEnemy/C3.castPattern states rendered to game canvas; after the first recovery the final pose is held, without changing combat cooldowns.'};
   fs.writeFileSync(path.join(directory,'SEQUENCIA.json'),JSON.stringify(metadata,null,2)+'\n');animatedSequences.push(metadata);summaries.push({key,frames:frames.length,poses,firstReleasedAt:frames.find(f=>f.released)?.clock});
  }
  return summaries;
 });
 assert.deepEqual(errors,[],'browser/console errors');
 fs.writeFileSync(path.join(out,'BROWSER_RESULTADOS.json'),JSON.stringify({version:version.versao,url,passed:checks.length,checks,browserErrors:errors,captures:shots.map(s=>s.label),animatedSequences,method:'Isolated Chrome, controlled real simulation calls and actual game canvas captures; no human campaign or physical-device validation.'},null,2)+'\n');
 console.log('PASS · '+checks.length+' boss choreography browser checks');
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER_RESULTADOS.json'),JSON.stringify({version:version.versao,url,passed:checks.filter(c=>c.passed).length,checks,browserErrors:errors,fatal:e.stack},null,2)+'\n');console.error(e);process.exitCode=1;}).finally(async()=>{if(context)await context.close();if(browser)await browser.close();});
