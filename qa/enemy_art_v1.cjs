/* Isolated built-game checks, reviewed crops and map captures. No player saves.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CHROME_PATH=/path/to/chrome
 * node qa/enemy_art_v1.cjs [optional build URL]
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),out=path.join(root,'qa/enemies-v1');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,opts){return get.call(this,kind,kind==='2d'?{...opts,willReadFrequently:true}:opts)}});
 await page.goto(process.argv[2]||pathToFileURL(path.join(root,'game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html')).href,{waitUntil:'load',timeout:120000});
 async function check(name,run){const detail=await run();checks.push({name,passed:true,detail});console.log('OK · '+name)}
 await check('13 identity/variant atlases and all 52 transparent cells decode',async()=>{
  const result=await page.evaluate(async()=>{const a=EnemyArtV1;let frames=0;for(const key of Object.keys(a.manifest.enemies)){const im=a.image(key);await im.decode();if(im.naturalWidth!==512||im.naturalHeight!==512)throw Error(key+' dimensions');const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');for(let i=0;i<4;i++){q.clearRect(0,0,256,256);q.drawImage(im,i%2*256,Math.floor(i/2)*256,256,256,0,0,256,256);const d=q.getImageData(0,0,256,256).data;if(d[3]||d[(256*256-1)*4+3])throw Error(key+' opaque corner');if(!d.some((n,j)=>j%4===3&&n>128))throw Error(key+' empty cell');frames++}}return{keys:Object.keys(a.manifest.enemies),frames}});assert.equal(result.keys.length,13);assert.equal(result.frames,52);return result;
 });
 await page.evaluate(async()=>{G=fresh();buildMaps();mode='action';await CenariosV2.ready();await Promise.all(Object.values(C3.images).filter(i=>i.src).map(i=>i.decode().catch(()=>{})));});
 await check('Chapter variants preserve C1/C2 and boss IDs precede shared types',async()=>{
  const r=await page.evaluate(()=>{const a=EnemyArtV1,r=[];for(const[area,type,want]of[['ruins','compasso','compasso'],['cloud_sea','compasso','compasso_c3'],['voices','abafador','abafador'],['distortion_district','abafador','abafador_c3']]){G.area=area;r.push({area,type,key:a.key(type,{type}),want})}for(const id of ['boss','voice_boss','c3_metronome','c3_silence'])r.push({key:a.key('boss',{id,type:'boss'}),want:id});return r});assert(r.every(x=>x.key===x.want));return r;
 });
 await check('Discrete poses, no actor mutation, and preparation includes Arauto tele09',async()=>{
  const r=await page.evaluate(()=>{const a=EnemyArtV1;G.area='ruins';a.reset();const e={id:'qa',type:'hush',hp:44,max:44,cd:.4,wind:0,flash:0,stun:0,x:10,y:10};const poses=[];poses.push(a.pose(e));e.wind=.5;poses.push(a.pose(e));e.wind=0;poses.push(a.pose(e));a.clock+=.3;poses.push(a.pose(e));e.flash=.1;poses.push(a.pose(e));e.flash=0;e.tele09={type:'lanes',time:.5,x:10,y:10};poses.push(a.pose(e));e.tele09=null;poses.push(a.pose(e));const before=JSON.stringify(e);a.draw(100,200,'hush',e);return {poses,unchanged:before===JSON.stringify(e)}});assert.deepEqual(r.poses,[0,1,2,0,3,1,2]);assert(r.unchanged);return r;
 });
 await check('Pause/dialogue freezes cosmetic clock; area and save replacement clear stale pose',async()=>{
  const r=await page.evaluate(()=>{const a=EnemyArtV1;mode='dialogue';const before=a.clock;update(.05);const frozen=a.clock===before;const e={wind:.5};a.pose(e);e.wind=0;G={...G};const load=a.pose(e)===0;a.pose({wind:.5});G.area='forest';const area=a.pose(e)===0;return{frozen,load,area}});assert(r.frozen&&r.load&&r.area);return r;
 });
 await check('Aura and telegraph wrapper remains active for new musical bodies',async()=>{
  const r=await page.evaluate(()=>{G.area='distortion_district';let ellipses=0;const original=ctx.ellipse;ctx.ellipse=function(...args){ellipses++;return original.apply(this,args)};try{drawCreature(180,200,'abafador',{type:'abafador',x:10,y:10,wind:.4,stun:0,flash:0});return{ellipses}}finally{ctx.ellipse=original}});assert(r.ellipses>0);return r;
 });
 const snapshots=[];
 await check('All four boss maps render once each; first boss never draws exposed Archer',async()=>{
  for(const [id,area]of [['boss','ruins'],['voice_boss','voice_tower'],['c3_metronome','cloud_terrace'],['c3_silence','silence_core']]){
   const r=await page.evaluate(({id,area})=>{G=fresh();buildMaps();G.area=area;current=areas[area];mode='action';G.guidance=false;G.active='franco';G.formation=['franco','ryuchi'];const bx=Math.floor(current.w/2),by=Math.floor(current.h/2);G.x=bx;G.y=by+4;bossActor={id,type:'boss',kind:'boss',x:bx,y:by,hp:200,max:200,power:10,cd:1,wind:.4,flash:0,stun:0,phase:1};battle={id,boss:true};cam.x=clamp(G.x*T-VW/2,0,current.w*T-VW);cam.y=clamp(G.y*T-VH/2,0,current.h*T-VH);const a=EnemyArtV1,oldDraw=a.draw,oldActor=drawActor;let draws=0,exposed=0;a.draw=function(x,y,k,e){if(e===bossActor)draws++;return oldDraw.call(this,x,y,k,e)};drawActor=function(p,...rest){if(p.style==='alt')exposed++;return oldActor(p,...rest)};try{drawEnv();return{id,draws,exposed,image:cv.toDataURL('image/png')}}finally{a.draw=oldDraw;drawActor=oldActor}}, {id,area});assert.equal(r.draws,1,id+' duplicate');if(id==='boss')assert.equal(r.exposed,0);snapshots.push(r.image);delete r.image;
  }return{maps:4,firstBossExposedArcherCalls:0};
 });
 await page.evaluate(async({snapshots})=>{const c=document.createElement('canvas');c.id='qa-boss-maps';c.width=1536;c.height=912;c.style.cssText='position:fixed;z-index:999999;top:0;left:0';document.body.append(c);const q=c.getContext('2d');q.fillStyle='#211d2d';q.fillRect(0,0,c.width,c.height);for(let i=0;i<4;i++){const im=new Image();im.src=snapshots[i];await im.decode();q.drawImage(im,i%2*768,Math.floor(i/2)*456+24);q.fillStyle='#fff';q.font='18px sans-serif';q.fillText(['Viajante','Arauto','Metrônomo · ferrugem','Silêncio · ferrugem'][i],i%2*768+12,Math.floor(i/2)*456+19)}}, {snapshots});await page.locator('#qa-boss-maps').screenshot({path:path.join(out,'CHEFES_MAPAS.png')});await page.locator('#qa-boss-maps').evaluate(e=>e.remove());
 await check('Unloaded boss sheet falls back without using the Archer actor',async()=>{
  const r=await page.evaluate(()=>{G.area='ruins';current=areas.ruins;bossActor={id:'boss',type:'boss',x:20,y:15,hp:200,max:200,power:10,cd:1,wind:0,phase:1};G.x=20;G.y=19;let exposed=0;const old=drawActor,im=EnemyArtV1.images.boss;EnemyArtV1.images.boss={complete:false,naturalWidth:0};drawActor=function(p,...args){if(p.style==='alt')exposed++;return old(p,...args)};try{drawEnv();return{exposed}}finally{drawActor=old;EnemyArtV1.images.boss=im}});assert.equal(r.exposed,0);return r;
 });
 await check('Musician remains masked even after reveal flag; normal Archer portrait follows alt speaker',async()=>{
  const r=await page.evaluate(()=>{G=fresh();G.flags.reveal=true;talk([{who:'musician',t:'Antes de retirar a máscara.'}]);const masked=$('portrait').getAttribute('src')===ART.mask;talk([{who:'alt',t:'Depois da revelação.'}]);const archer=$('portrait').getAttribute('src')===NinjaArcherArtV1.assets.alt_portrait_speaking;return{masked,archer}});assert(r.masked&&r.archer);return r;
 });
 // Actual browser compositing shows alpha correctly, including hidden RGB under alpha=0.
 await page.evaluate(()=>{const a=EnemyArtV1,keys=Object.keys(a.manifest.enemies),c=document.createElement('canvas');c.id='qa-enemy-contact';c.width=1040;c.height=keys.length*205;c.style.cssText='position:fixed;z-index:999999;top:0;left:0';document.body.append(c);const q=c.getContext('2d');q.imageSmoothingEnabled=false;for(let row=0;row<keys.length;row++){const key=keys[row],y=row*205;q.fillStyle=row%2?'#332d28':'#292c33';q.fillRect(0,y,c.width,205);q.fillStyle='#f7e7c7';q.font='16px sans-serif';q.fillText(a.manifest.enemies[key].name,12,y+22);for(let i=0;i<4;i++){const x=220+i*205;q.fillStyle='#736852';q.fillRect(x+10,y+188,176,1);q.drawImage(a.images[key],i%2*256,Math.floor(i/2)*256,256,256,x,y+25,180,180);q.fillStyle='#ddd';q.font='13px sans-serif';q.fillText(a.manifest.states[i],x,y+18)}}});await page.locator('#qa-enemy-contact').screenshot({path:path.join(out,'ELENCO_52_POSES.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'RESULTADOS.json'),JSON.stringify({version:version.versao,passed:checks.length,checks,browserErrors:errors,method:'Chrome headless in isolated context; static captures reviewed separately; no human campaign'},null,2)+'\n');
 await context.close();await browser.close();console.log('PASS · '+checks.length+' enemy integration checks, zero runtime errors');
})().catch(e=>{console.error(e);process.exitCode=1});
