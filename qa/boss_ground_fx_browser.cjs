/* Ground impact sprites in the built game, isolated Chrome and no player saves.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CHROME_PATH=/path/to/chrome
 * node qa/boss_ground_fx_browser.cjs [portable URL or HTML path]
 * Controlled simulation/canvas evidence, not a human campaign or physical-device test.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const out=path.join(root,'qa/boss-ground-fx-v1');
const input=process.argv[2]||path.join(root,'game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html');
const url=/^(file|https?):/.test(input)?input:pathToFileURL(path.resolve(input)).href;
const checks=[],errors=[],sequences=[];let browser,context;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,o){return get.call(this,k,k==='2d'?{...o,willReadFrequently:true}:o);};});
 await page.goto(url,{waitUntil:'load',timeout:120000});
 async function check(name,fn){try{const detail=await fn();checks.push({name,passed:true,detail});console.log('OK · '+name);}catch(e){checks.push({name,passed:false,error:e.stack});throw e;}}
 await check('Six real PNG atlases decode, each with eight distinct transparent sprite frames',async()=>{
  const rows=await page.evaluate(async()=>{const a=BossGroundFXV1,rows=[],cell=a.manifest.cell,cols=a.manifest.columns;if(cell!==256||cols!==4)throw Error('ground FX contract');
   for(const key of Object.keys(a.manifest.clips)){const im=a.image(key);if(!im)throw Error(key+' missing');await im.decode();if(im.naturalWidth!==cell*cols||im.naturalHeight!==cell*2)throw Error(key+' dimensions');const c=document.createElement('canvas');c.width=c.height=cell;const q=c.getContext('2d'),hashes=[];
    for(let f=0;f<8;f++){q.clearRect(0,0,cell,cell);q.drawImage(im,f%cols*cell,Math.floor(f/cols)*cell,cell,cell,0,0,cell,cell);const d=q.getImageData(0,0,cell,cell).data;let h=2166136261,visible=0,transparent=0;for(let j=0;j<d.length;j++){h=Math.imul(h^d[j],16777619);if(j%4===3){if(d[j]>128)visible++;if(d[j]===0)transparent++;}}if(!visible||!transparent)throw Error(key+' frame '+f+' missing alpha or content');hashes.push((h>>>0).toString(16));}rows.push({key,width:im.naturalWidth,height:im.naturalHeight,hashes,unique:new Set(hashes).size});}return rows;});
  assert.deepEqual(rows.map(r=>r.key).sort(),['pulse','static','scrap','void','aim','projectile'].sort());assert(rows.every(r=>r.unique===8));return rows;
 });
 await page.evaluate(async()=>{
  G=fresh();buildMaps();if(typeof CenariosV2!=='undefined')await CenariosV2.ready();
  await Promise.all(Object.values(C3.images).filter(i=>i?.src).map(i=>i.decode().catch(()=>{})));
  await Promise.all(Object.keys(EnemyArtV1.manifest.enemies).map(k=>EnemyArtV1.image(k).decode()));
  await Promise.all(Object.keys(BossChoreographyV2.manifest.clips).map(k=>BossChoreographyV2.image(k,BossChoreographyV2.manifest.clips[k]).decode()));
  window.GroundFXQA={
   fixture(id){G=fresh();buildMaps();G.area=({boss:'ruins',voice_boss:'voice_tower',c3_metronome:'cloud_terrace',c3_silence:'silence_core'})[id];current=areas[G.area];mode='action';act.invuln=0;G.active='franco';G.formation=['franco','ryuchi'];G.guidance=false;G.options10={...G.options10,reducedMotion:false};G.hp.franco=G.maxhp.franco=1000;G.x=15;G.y=15;bossActor={id,type:'boss',kind:'boss',x:15,y:10,hp:1000,max:1000,power:10,cd:10,wind:0,windKind:'ring',stun:0,flash:0,phase:1,facing:Math.PI/2,chargeX:0,chargeY:1};battle={id,boss:true};C3.hazards=[];C3.finalPending=false;hostileShots=[];combatFX=[];if(typeof rings092!=='undefined')rings092=[];ToriiCombate.MODE.mode='padrao';transitionAlpha=0;BossChoreographyV2.reset();BossGroundFXV1.reset();cam.x=clamp(15*T-VW/2,0,current.w*T-VW);cam.y=id==='c3_silence'?0:clamp(12*T-VH/2,0,current.h*T-VH);return bossActor;},
   step(dt){BossChoreographyV2.clock+=dt;BossGroundFXV1.step(dt);updateEnemy(bossActor,dt,true);},
   start(id,kind){const e=this.fixture(id);if(id==='boss'){e.x=39.4;e.y=17.6;G.x=35.4;G.y=18.5;e.cd=0;cam.x=clamp(e.x*T-VW/2,0,current.w*T-VW);cam.y=clamp(e.y*T-VH/2,0,current.h*T-VH);this.step(.001);}else if(id==='voice_boss'){e.cd=0;this.step(.001);}else C3.castPattern(e,kind);const h=C3.hazards[0],s=BossChoreographyV2.snapshot(e);return{id,kind:e.id.startsWith('c3_')?h.kind:s.kind,total:h?h.time-h.trigger:s.remaining};},
   render(){drawEnv();return cv.toDataURL('image/png');},
   probe(){const before=JSON.stringify(C3.hazards),images=new Set(Object.values(BossGroundFXV1.images)),draw=ctx.drawImage,frames=[];ctx.drawImage=function(im,...args){if(images.has(im))frames.push({sx:args[0],sy:args[1],sw:args[2],sh:args[3],key:Object.keys(BossGroundFXV1.images).find(k=>BossGroundFXV1.images[k]===im)});return draw.call(this,im,...args);};try{BossChoreographyV2.drawGround();return{frames,hazardsUnchanged:before===JSON.stringify(C3.hazards),effects:BossGroundFXV1.effects.length};}finally{ctx.drawImage=draw;}}
  };
 });
 await check('All seven final patterns use aim sprites and both projectile volleys draw actual bitmap shots',async()=>{
  const rows=await page.evaluate(()=>{const rows=[],fx=BossGroundFXV1;for(const kind of ['ring','cross','fan','pulse','rain','chase','orbit']){const start=GroundFXQA.start('c3_silence',kind);GroundFXQA.step(start.total*.45);const before=GroundFXQA.probe();if(!before.frames.some(f=>f.key==='aim'))throw Error(kind+' missing aim sprite');if(['chase','orbit'].includes(kind)){GroundFXQA.step(start.total*.56+.0001);for(let i=0;i<4;i++){tick+=.05;update(.05)}const shots=hostileShots.length,snapshot=JSON.stringify(hostileShots),image=fx.image('projectile'),original=ctx.drawImage;let bitmapShots=0;ctx.drawImage=function(im,...args){if(im===image)bitmapShots++;return original.call(this,im,...args)};try{GroundFXQA.render()}finally{ctx.drawImage=original}rows.push({kind,aim:true,shots,bitmapShots,drawPreservedShots:snapshot===JSON.stringify(hostileShots)});}else rows.push({kind,aim:true});}return rows;});
  for(const row of rows){assert(row.aim);if(row.shots!==undefined){assert.equal(row.shots,row.kind==='chase'?5:12);assert.equal(row.bitmapShots,row.shots);assert(row.drawPreservedShots)}}return rows;
 });
 await check('Four bosses draw impact sprite images through the real ground paint/fire pipeline',async()=>{
  const rows=await page.evaluate(()=>{const rows=[];for(const[id,kind]of [['boss','ring'],['voice_boss','lanes'],['c3_metronome','cross'],['c3_silence','rain']]){const start=GroundFXQA.start(id,kind),before=GroundFXQA.probe();GroundFXQA.step(start.total+.00001);const after=GroundFXQA.probe();rows.push({...start,before,after,fired:C3.hazards.length?C3.hazards.some(h=>h.fired):BossChoreographyV2.records.get(bossActor)?.released});}return rows;});
  for(const row of rows){assert.equal(row.kind,({boss:'ring',voice_boss:'lanes',c3_metronome:'cross',c3_silence:'rain'})[row.id]);assert(row.fired,row.id+' actual release');assert(row.after.frames.length>0,row.id+' missing ground sprite drawImage');assert(row.before.hazardsUnchanged&&row.after.hazardsUnchanged);}return rows;
 });
 await check('C3 sprite residue survives actual removal of its hazard without mutating combat data',async()=>{
  const r=await page.evaluate(()=>{const start=GroundFXQA.start('c3_metronome','cross'),h=C3.hazards[0];GroundFXQA.step(start.total+.00001);const active=GroundFXQA.probe();GroundFXQA.step(h.time+.00001);const removed=!C3.hazards.includes(h),snapshot=JSON.stringify(h),after=GroundFXQA.probe();return{removed,active,after,originalUnchanged:snapshot===JSON.stringify(h)};});assert(r.removed&&r.originalUnchanged);assert(r.after.frames.length>0,'residue disappeared with hazard');assert(r.after.hazardsUnchanged);return r;
 });
 await check('Pause freezes sprites; save/area/actor replacement and final phrase cancel residue',async()=>{
  const r=await page.evaluate(()=>{function emit(){const s=GroundFXQA.start('c3_silence','ring');GroundFXQA.step(s.total+.00001);return BossGroundFXV1.effects.length>0;}const had=emit();mode='dialogue';const clock=BossGroundFXV1.clock;update(.05);const pause=clock===BossGroundFXV1.clock;mode='action';G={...G};BossGroundFXV1.sync();const load=BossGroundFXV1.effects.length===0;emit();G.area='last_torii';BossGroundFXV1.sync();const area=BossGroundFXV1.effects.length===0;emit();bossActor={...bossActor};BossGroundFXV1.sync();const actor=BossGroundFXV1.effects.length===0;emit();C3.finalPending=true;BossGroundFXV1.sync();return{had,pause,load,area,actor,final:BossGroundFXV1.effects.length===0};});assert(Object.values(r).every(Boolean));return r;
 });
 await check('Drawing ground sprites leaves actual damage and hazard results identical',async()=>{
  const r=await page.evaluate(()=>{function run(draw){const start=GroundFXQA.start('c3_silence','ring');G.x=bossActor.x;G.y=bossActor.y;for(let i=0;i<65;i++){GroundFXQA.step(.02);if(draw)BossChoreographyV2.drawGround();}return{hp:G.hp.franco,x:bossActor.x,y:bossActor.y,wind:bossActor.wind,cd:bossActor.cd,hazards:C3.hazards.map(h=>({...h})),shots:hostileShots.map(p=>({...p}))};}return{on:run(true),off:run(false)};});assert.deepEqual(r.on,r.off);assert(r.on.hp<1000);return r;
 });
 const contact=[];
 await check('Actual canvas captures show four sprite impacts over 36 controlled simulation frames',async()=>{
  for(const[id,kind]of [['boss','ring'],['voice_boss','lanes'],['c3_metronome','cross'],['c3_silence','rain']]){
   const key=id+'_'+kind,directory=path.join(out,'frames',key);fs.mkdirSync(directory,{recursive:true});
   const frames=await page.evaluate(({id,kind})=>{const start=GroundFXQA.start(id,kind),rows=[];let firstRelease=null,holding=false;for(let i=0;i<36;i++){let dt=0;if(i&&!holding){dt=.07;GroundFXQA.step(dt);}const record=BossChoreographyV2.records.get(bossActor);if(firstRelease===null&&record?.released)firstRelease=BossChoreographyV2.clock;const probe=GroundFXQA.probe();rows.push({index:i,id,kind,dt,clock:BossGroundFXV1.clock,pose:BossChoreographyV2.pose(bossActor)?.frame??null,released:!!record?.released,sprites:probe.frames,effects:probe.effects,holding,image:GroundFXQA.render()});if(firstRelease!==null&&BossChoreographyV2.clock-firstRelease>.45&&BossGroundFXV1.effects.length===0)holding=true;}return rows;},{id,kind});
   assert(frames.some(f=>f.released&&f.sprites.length),key+' captures lack sprite impact');assert.equal(frames.at(-1).effects,0,key+' final residue did not expire');assert.equal(frames.at(-1).sprites.length,0,key+' sprite remains after fade');assert(frames.at(-1).holding,key+' final fade never completed');
   for(const f of frames){const filename=String(f.index).padStart(3,'0')+'.png';fs.writeFileSync(path.join(directory,filename),Buffer.from(f.image.split(',')[1],'base64'));f.file=path.relative(out,path.join(directory,filename));}
   const impact=frames.findIndex(f=>f.released&&f.sprites.length);for(const index of [Math.max(0,impact-2),impact,frames.length-1])contact.push({label:key+' · '+index,image:frames[index].image});
   frames.forEach(f=>delete f.image);const metadata={key,id,kind,frames,method:'Real simulation calls; camera held for C3 Silêncio to keep the boss and FX visible; after all first-attack FX residues expire, final clean state held to avoid a second attack.'};sequences.push(metadata);fs.writeFileSync(path.join(directory,'SEQUENCIA.json'),JSON.stringify(metadata,null,2)+'\n');
  }
  await page.evaluate(async(shots)=>{const c=document.createElement('canvas');c.id='qa-ground-fx-contact';c.width=1152;c.height=4*242;c.style.cssText='position:fixed;left:0;top:0;z-index:999999';document.body.append(c);const q=c.getContext('2d');q.fillStyle='#272322';q.fillRect(0,0,c.width,c.height);for(let i=0;i<shots.length;i++){const im=new Image();im.src=shots[i].image;await im.decode();const x=i%3*384,y=Math.floor(i/3)*242;q.drawImage(im,x,y+26,384,216);q.fillStyle='#fff0d0';q.font='13px sans-serif';q.fillText(shots[i].label,x+5,y+17);}},contact);
  await page.locator('#qa-ground-fx-contact').screenshot({path:path.join(out,'CONTATO_IMPACTOS.png')});return sequences.map(s=>({key:s.key,frames:s.frames.length}));
 });
 assert.deepEqual(errors,[],'runtime/console errors');
 fs.writeFileSync(path.join(out,'BROWSER_RESULTADOS.json'),JSON.stringify({version:version.versao,url,passed:checks.length,checks,browserErrors:errors,sequences,method:'Isolated Chrome; real simulation and actual game-canvas screenshots. Not a human campaign or physical-device validation.'},null,2)+'\n');console.log('PASS · '+checks.length+' ground sprite browser checks');
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER_RESULTADOS.json'),JSON.stringify({version:version.versao,url,checks,browserErrors:errors,fatal:e.stack},null,2)+'\n');console.error(e);process.exitCode=1;}).finally(async()=>{if(context)await context.close();if(browser)await browser.close();});
