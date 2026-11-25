/* Environment depth, atmosphere and cloud traversal in the compiled game.
 * Disposable Chrome context, actual canvas, real simulation/interaction callbacks.
 * This is controlled browser QA, not a human campaign or a physical-device test.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CHROME_PATH=/path/to/chrome
 * node qa/environment_world_browser.cjs [URL or portable HTML path]
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL,fileURLToPath}=require('node:url');
let chromium;try{({chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core'));}catch{({chromium}=require('playwright'));}
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const out=path.join(root,'qa/environment-world-v1'),input=process.argv[2]||path.join(root,'game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html');
const url=/^(file|https?):/.test(input)?input:pathToFileURL(path.resolve(input)).href;
const report={suite:'environment-world-v1',version:version.numero,url,filter:process.env.TORII_WORLD_ONLY||null,checks:[],captures:[],browserErrors:[],method:'Isolated Chrome, controlled real simulation and rendered canvas captures; no human campaign or physical hardware.'};
let browser,context,page;
async function check(name,fn){if(report.filter&&!new RegExp(report.filter,'i').test(name))return;try{const detail=await fn();report.checks.push({name,passed:true,detail});console.log('OK · '+name);}catch(e){report.checks.push({name,passed:false,error:e.stack});throw e;}}
async function capture(name){
 const data=await page.evaluate(()=>WorldReviewQA.render()),bytes=Buffer.from(data.split(',')[1],'base64'),file=name+'.png';fs.writeFileSync(path.join(out,file),bytes);
 const record={file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};report.captures.push(record);return record;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 if(url.startsWith('file:')){const local=fileURLToPath(url),hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(local))hash.update(chunk);report.build={version:version.numero,sourceSha256:hash.digest('hex'),bytes:fs.statSync(local).size};}
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});context=await browser.newContext({viewport:{width:1280,height:900}});page=await context.newPage();report.browser=await browser.version();
 page.on('pageerror',e=>report.browserErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.browserErrors.push('console: '+m.text());});
 await page.addInitScript(()=>{
  window.requestAnimationFrame=()=>0;window.__worldPads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>window.__worldPads});
  const before=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,options){return before.call(this,kind,kind==='2d'?{...options,willReadFrequently:true}:options);};
 });
 await page.goto(url,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>typeof CloudWorldV1!=='undefined'&&typeof EnvironmentDepthV1!=='undefined'&&typeof EnvironmentAtmosphereV1!=='undefined',null,{timeout:120000});
 try{if(/^https?:/.test(url)){const r=await context.request.get(new URL('build-info.json',url).href);if(r.ok()){const j=await r.json();report.build={version:j.version,sourceSha256:j.sourceSha256,indexSha256:j.indexSha256};}}}catch{}
 if(process.env.TORII_EXPECTED_SHA)assert.equal(report.build?.sourceSha256,process.env.TORII_EXPECTED_SHA);
 await page.evaluate(async()=>{
  G=fresh();buildMaps();C3.loadDeferredImages();await CenariosV2.ready();await EnvironmentDepthV1.ready();await Promise.all(Object.values(C3.images).filter(im=>im?.src).map(im=>im.decode().catch(()=>{})));
  if(typeof EnemyArtV1!=='undefined')await Promise.all(Object.keys(EnemyArtV1.manifest.enemies).map(key=>EnemyArtV1.image(key).decode()));
  for(const hero of ['franco','ryuchi'])for(const state of ['idle','walk','roll'])await ProtagonistArtV5.image(hero+'_'+state).decode();
  for(const hero of ['synth','percussion'])for(const variant of ['masked','unmasked'])await MusicianArtV1.image(MusicianArtV1.key(hero,variant,'idle')).decode();
  VW=768;VH=432;cv.width=VW;cv.height=VH;ctx.imageSmoothingEnabled=false;
  window.WorldReviewQA={
   clearUI(){for(const id of ['start','overlay','dialogue','toast'])$(id)?.classList.add('hidden');$('cinema').style.display='none';},
   checkpoint(id='post_travel'){if(['c3_clouds','c3_final'].includes(id))throw Error('World fixture cannot use a reserved boss checkpoint '+id);setCheckpoint(id,G.area,G.x,G.y,true);},
   pad(index,axes=[0,0]){return {index,id:'Controlled QA '+index,connected:true,mapping:'standard',axes:[...axes,0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))};},
   fixture(area,x,y,{coop=false,bridges=true}={}){
    G=fresh();G.c3={...C3.defaults(),started:true,arrivalSeen:true,cloudIntro:true,toriiSeen:true,windFlute:true,horizonDrum:true,clubPhraseDone:true,liftOpen:true,cloudPathA:bridges,cloudPathB:bridges,cloudPlatform:bridges};
    G.active='franco';G.formation=['franco','ryuchi'];G.flags.masks=G.flags.bass=true;G.guidance=false;G.options10={...G.options10,reducedMotion:false};buildMaps();setArea(area,x,y,false);
    const safe=safeSpawn121(x,y);if(!safe)throw Error('No valid camera/actor position '+area+'/'+x+'/'+y);G.x=safe.x;G.y=safe.y;
    keys={};touchDir={};trail=[];mode='walk';menuOpen=false;battle=bossActor=null;C3.hazards=[];hostileShots=[];projectiles=[];combatFX.length=0;attackHeld=false;lastStep=1;tick=4;
    act.cool=act.dashCD=act.dash=act.invuln=0;resetMotion10();Input121.pad=[0,0];Input121.touch=[0,0];Input121.focused=true;
    __worldPads=coop?[this.pad(0),this.pad(1)]:[];C3.pad.pads=__worldPads;Input121.wasCoop=coop;C3.coop.member=coop?'ryuchi':null;if(coop)C3.syncCoop(true);Input121.game=G;Input121.lastArea=G.area;
    G.hp.franco=G.maxhp.franco;G.hp.ryuchi=G.maxhp.ryuchi;this.checkpoint();this.clearUI();transitionAlpha=screenShake=0;
    EnvironmentDepthV1.enabled=EnvironmentAtmosphereV1.enabled=CloudWorldV1.enabled=true;EnvironmentAtmosphereV1.clock=0;
    this.camera();return {area:G.area,x:G.x,y:G.y};
   },
   camera(){cam.x=current.w*T<VW?(current.w*T-VW)/2:clamp(G.x*T-VW/2,0,current.w*T-VW);cam.y=current.h*T<VH?(current.h*T-VH)/2:clamp(G.y*T-VH/2,0,current.h*T-VH);},
   render(){this.clearUI();transitionAlpha=screenShake=0;this.camera();drawEnv();return cv.toDataURL('image/png');},
   pixels(){this.render();return new Uint8ClampedArray(ctx.getImageData(0,0,VW,VH).data);},
   diff(a,b){let changed=0,total=0;for(let i=0;i<a.length;i+=4){const d=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);if(d)changed++;total+=d;}return {changed,total};},
   luminance(a){let sum=0;for(let i=0;i<a.length;i+=4)sum+=a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722;return sum/(a.length/4);},
   step(dt,count=1){for(let i=0;i<count;i++){tick+=dt;update(dt);}},
   edges(){const a=current,rows=[];for(let y=3;y<a.h-3;y++)for(let x=3;x<a.w-3;x++){if(!canBody121(x+.5,y+.5))continue;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(a.tiles[y+dy]?.[x+dx]==='c3_sky'&&!a.gates.some(g=>Math.hypot(g.x-x,g.y-y)<3))rows.push({x:x+.5,y:y+.5,dx,dy});}return rows.sort((a,b)=>Math.hypot(a.x-10,a.y-27)-Math.hypot(b.x-10,b.y-27));},
   edge(coop=false){this.fixture('cloud_sea',10.5,27.5,{coop,bridges:true});const edge=this.edges()[0];if(!edge)throw Error('No walkable cloud edge next to actual sky');Object.assign(coop?C3.coop:G,{x:edge.x,y:edge.y});if(coop){G.x=edge.x-edge.dx;G.y=edge.y-edge.dy;C3.coop.lastGood={x:edge.x,y:edge.y};}this.checkpoint();this.camera();return edge;},
   walk(edge){keys={[edge.dx===1?'d':edge.dx===-1?'a':edge.dy===1?'s':'w']:true};for(let i=0;i<20&&!CloudWorldV1.fall;i++)this.step(1/60);keys={};return !!CloudWorldV1.fall;},
   fallState(){const f=CloudWorldV1.fall;return f?{hero:f.hero,coop:f.coop,elapsed:f.elapsed,duration:f.duration,x:f.x,y:f.y}:null;},
   cloudCells(){const a=areas.cloud_sea,rows=[];for(let x=18;x<25;x++)rows.push(tileWalkable(a,x+.5,23.5));return rows;},
   immutable(){return JSON.stringify(Object.values(areas).map(a=>({id:a.id,w:a.w,h:a.h,tiles:a.tiles,blocked:[...a.blocked].sort(),props:a.props,gates:a.gates.map(g=>({...g,need:undefined})),events:a.events.map(e=>({id:e.id,x:e.x,y:e.y,label:e.label}))})));}
  };
 });

 await check('Eight authored facade sprites decode with alpha and their rendered door pivots stay within one pixel of the entrance anchors',async()=>{
  return page.evaluate(async()=>{
   const a=EnvironmentDepthV1;await a.ready();const rows=[],canvas=document.createElement('canvas'),q=canvas.getContext('2d');
   const variants=[['c1_house','city',{type:'house',kind:'house'}],['c1_shop','city',{type:'house',kind:'shop'}],['c1_inn','city',{type:'house',kind:'inn'}],['c1_archive','city',{type:'house',kind:'archive'}],['c2_home','voices',{type:'voiceHouse',sign:'CASA DE CELINA'}],['c2_workshop','voices',{type:'voiceHouse',sign:'OFICINA BENTO'}],['c2_shop','voices',{type:'voiceHouse',sign:'MERCADO DE DISCOS'}],['c2_radio','voices',{type:'voiceHouse',sign:'RÁDIO TORRE'}]];
   for(const[key,area,variant]of variants){
    WorldReviewQA.fixture(area,20,20);const p={...variant,x:10,y:10,w:5,h:4},item=a.manifest.items[key],im=a.image(item.sheet);canvas.width=item.content[2];canvas.height=item.content[3];q.drawImage(im,...item.content,0,0,canvas.width,canvas.height);const pixels=q.getImageData(0,0,canvas.width,canvas.height).data;let visible=0,transparent=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]>128)visible++;if(pixels[i]===0)transparent++;}if(!visible||!transparent)throw Error('Facade has empty/opaque rectangular content '+key);
    const original=ctx.drawImage,draws=[];ctx.drawImage=function(image,...args){if(image===im)draws.push(args);return original.call(this,image,...args);};try{drawProp(p,0,0);}finally{ctx.drawImage=original;}
    if(draws.length!==1||a.assetKey(p)!==key)throw Error('Facade actual renderer did not consume expected atlas '+key);const draw=draws[0],b=a.facade(p),doorX=draw[4]+item.pivot[0]*draw[6]/item.content[2],doorY=draw[5]+item.pivot[1]*draw[7]/item.content[3];
    if(Math.abs(doorX-b.doorX)>1||Math.abs(doorY-b.bottom)>1)throw Error('Rendered door pivot drifts '+key);
    rows.push({key,sheet:item.sheet,visible,transparent,draw:draw.slice(4),doorDelta:[doorX-b.doorX,doorY-b.bottom]});
   }return rows;
  });
 });

 await check('City facades and interior zones render differently without mutating maps, interactions or saves',async()=>{
  const views=[['city',28.5,22.5],['voices',32.5,26.5],['distortion_district',22,20],['studio',12.5,10.5],['contratempo',14,11],['ciro_workshop',14,11],['power_plant',12,13],['chamber',12,10],['celina_home',8,8],['bento_shop',8,8],['tape_market',8,8],['radio9',10,10],['last_torii',13,10]];
  const rows=[];
  for(const[area,x,y]of views){
   const before=await page.evaluate(({area,x,y})=>{WorldReviewQA.fixture(area,x,y);EnvironmentDepthV1.enabled=EnvironmentAtmosphereV1.enabled=false;const immutable=WorldReviewQA.immutable(),save=JSON.stringify(G);window.__beforeWorldPixels=WorldReviewQA.pixels();if(immutable!==WorldReviewQA.immutable()||save!==JSON.stringify(G))throw Error('Baseline render mutated world '+area);return {actor:{x:G.x,y:G.y},immutable,save};},{area,x,y});
   const baseline=await capture(area+'-antes');
   const detail=await page.evaluate(({area,immutable,save})=>{EnvironmentDepthV1.enabled=EnvironmentAtmosphereV1.enabled=true;const after=WorldReviewQA.pixels();if(immutable!==WorldReviewQA.immutable()||save!==JSON.stringify(G))throw Error('New render mutated world '+area);return {...WorldReviewQA.diff(__beforeWorldPixels,after),profile:EnvironmentDepthV1.profiles[area]?.style||null,light:EnvironmentDepthV1.lightingProfile(area)};}, {area,immutable:before.immutable,save:before.save});
   const after=await capture(area+'-depois');assert(detail.changed>100,area+' produced no visible environment change');assert.notEqual(baseline.sha256,after.sha256,area+' identical capture');rows.push({area,actor:before.actor,...detail,captures:[baseline.file,after.file]});
  }return rows;
 });

 await check('Interior colors stay free of lighting overlays while desert dust remains bounded',async()=>{
  const rows=await page.evaluate(()=>{const rows=[];for(const area of ['studio','contratempo','ciro_workshop','power_plant','chamber','distortion_district']){WorldReviewQA.fixture(area,12.5,11.5);EnvironmentDepthV1.enabled=true;EnvironmentAtmosphereV1.enabled=false;const before=WorldReviewQA.pixels();EnvironmentAtmosphereV1.enabled=true;const after=WorldReviewQA.pixels();EnvironmentAtmosphereV1.drawLighting();const unchanged=ctx.getImageData(0,0,VW,VH).data;rows.push({area,before:WorldReviewQA.luminance(before),after:WorldReviewQA.luminance(after),...WorldReviewQA.diff(before,after),lightingChanged:WorldReviewQA.diff(after,unchanged).changed,profile:EnvironmentAtmosphereV1.profile()});}return rows;});
  for(const row of rows){assert(row.changed>30,row.area+' ground contact or dust not rendered');assert.equal(row.lightingChanged,0,row.area+' adds a lighting filter');assert.equal(row.profile.ambient,1);assert.equal(row.profile.lights.length,0);}return rows;
 });

 await check('Focused city facade captures show volume at their actual footpoint and preserve the front approach',async()=>{
  const rows=[];for(const area of ['city','voices','distortion_district']){
   const where=await page.evaluate(area=>{WorldReviewQA.fixture(area,20,20);const a=current,p=a.props.find(p=>area==='city'?p.type==='house'&&p.y>6:area==='voices'?p.type==='voiceHouse':p.type==='c3_club');if(!p)throw Error('No facade '+area);const box=EnvironmentDepthV1.facade(p),safe=safeSpawn121((box.x+box.w/2)/T,box.bottom/T+1.6);if(!safe)throw Error('Facade approach is not walkable '+area);G.x=safe.x;G.y=safe.y;EnvironmentAtmosphereV1.enabled=false;EnvironmentDepthV1.enabled=false;window.__facadeBefore=WorldReviewQA.pixels();return {type:p.type,position:{x:p.x,y:p.y},box,frontValid:canBody121(G.x,G.y)};},area);
   await capture(area+'-fachada-antes');const difference=await page.evaluate(()=>{EnvironmentDepthV1.enabled=true;return WorldReviewQA.diff(__facadeBefore,WorldReviewQA.pixels());});assert(difference.changed>40,area+' has no visible facade volume');await capture(area+'-fachada-depois');rows.push({area,...where,...difference});
  }return rows;
 });

 await check('Wind animates real tree canopy, keeps its base anchored, and pause freezes the atmosphere clock',async()=>{
  return page.evaluate(()=>{
   WorldReviewQA.fixture('forest',15,15);const p=current.props.find(p=>p.type==='tree'||p.type==='rainTree');if(!p)throw Error('No real tree to test');
   const cx=(p.x+.5)*T-384,cy=(p.y+.65)*T-330;
   function pixels(){ctx.resetTransform();ctx.clearRect(0,0,VW,VH);drawProp(p,cx,cy);return new Uint8ClampedArray(ctx.getImageData(0,0,VW,VH).data);}
   const first=pixels();WorldReviewQA.step(.05,11);const second=pixels(),d=WorldReviewQA.diff(first,second);if(!d.changed)throw Error('Tree image did not move in actual simulation');
   let baseChanges=0;for(let y=320;y<350;y++)for(let x=300;x<468;x++){const i=(y*VW+x)*4;if(first[i]!==second[i]||first[i+1]!==second[i+1]||first[i+2]!==second[i+2]||first[i+3]!==second[i+3])baseChanges++;}if(baseChanges)throw Error('Wind shifted the actual tree base');
   G.options10.reducedMotion=true;const reducedA=pixels();WorldReviewQA.step(.05,11);const reducedB=pixels(),reduced=WorldReviewQA.diff(reducedA,reducedB);if(reduced.total>d.total)throw Error('Reduced motion intensified canopy movement');G.options10.reducedMotion=false;
   const anchorA=EnvironmentAtmosphereV1.treePose(p);WorldReviewQA.step(.05,7);const anchorB=EnvironmentAtmosphereV1.treePose(p);
   const clock=EnvironmentAtmosphereV1.clock;openSystem();WorldReviewQA.step(.05,10);if(EnvironmentAtmosphereV1.clock!==clock)throw Error('Atmosphere advances while paused');closeOverlay();
   return {pixelsChanged:d.changed,baseChanges,reducedPixelsChanged:reduced.changed,poses:[anchorA,anchorB],pauseFrozen:true};
  });
 });

 await check('Open lift visibly becomes a portal, preserves its progression gate, and presents the cloud-world narrative',async()=>{
  const r=await page.evaluate(()=>{
   WorldReviewQA.fixture('sky_lift',11.5,8.5);const gate=current.gates.find(g=>g.to==='cloud_sea');if(!gate)throw Error('Cloud portal gate missing');
   G.c3.liftOpen=false;const closedBlocked=!!gate.need&&!gate.need();G.c3.liftOpen=true;const openAllowed=!gate.need||gate.need();
   CloudStoryV1.enabled=false;const before=WorldReviewQA.pixels();CloudStoryV1.enabled=true;const after=WorldReviewQA.pixels(),d=WorldReviewQA.diff(before,after);if(!d.changed)throw Error('Open portal has no actual visible change');
   const cinema=PB.cinemaPanel('cloud');if(cinema!==CloudWorldV1.assets.cinema)throw Error('Cloud world uses old desert cinema');
   const lines=C3.dialogue.scenes?.find(s=>s.id==='C3_018')?.lines||C3.dialogue.find?.(s=>s.id==='C3_018')?.lines||[];
   return {closedBlocked,openAllowed,portalPixels:d.changed,cinemaUsesNewCloudAsset:true,labels:{lift:C3.labels.sky_lift,cloud:C3.labels.cloud_sea},introLines:lines.map(l=>l.text||l.t||'')};
  });assert(r.closedBlocked&&r.openAllowed);await capture('portal-aberto');return r;
 });

 await check('Reconstruction atlas decodes with eight distinct nonempty alpha sprite frames in the actual browser',async()=>{
  return page.evaluate(async()=>{
   await CloudWorldV1.ready();const im=CloudWorldV1.image('rebuild'),m=CloudWorldV1.manifest.rebuild||{},cols=m.cols||4,rows=m.rows||2,fw=m.cellWidth||im.naturalWidth/cols,fh=m.cellHeight||im.naturalHeight/rows;
   if(im.naturalWidth!==fw*cols||im.naturalHeight!==fh*rows)throw Error('Reconstruction atlas grid mismatch');
   const canvas=document.createElement('canvas');canvas.width=fw;canvas.height=fh;const q=canvas.getContext('2d'),frames=[];
   for(let f=0;f<8;f++){q.clearRect(0,0,fw,fh);q.drawImage(im,(f%cols)*fw,Math.floor(f/cols)*fh,fw,fh,0,0,fw,fh);const data=q.getImageData(0,0,fw,fh).data;let hash=2166136261,visible=0,transparent=0;for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3){if(data[i]>128)visible++;if(data[i]===0)transparent++;}}if(!visible||!transparent)throw Error('Sprite reconstruction frame lacks cloud/alpha '+f);frames.push({frame:f,hash:(hash>>>0).toString(16),visible,transparent});}
   if(new Set(frames.map(f=>f.hash)).size!==8)throw Error('Reconstruction atlas repeats frames');return {width:im.naturalWidth,height:im.naturalHeight,cell:[fw,fh],frames};
  });
 });

 await check('Real flute interaction reconstructs the cloud bridge progressively and safely resumes from a saved partial bridge',async()=>{
  await page.evaluate(()=>{WorldReviewQA.fixture('cloud_sea',17,23,{bridges:false});});await capture('nuvens-00-ausente');
  const steps=await page.evaluate(()=>{
   const initial=WorldReviewQA.cloudCells(),old=G.shards;C3.cloudPath('A');C3.cloudPath('A');const states=[{t:0,cells:WorldReviewQA.cloudCells()}];
   for(let i=0;i<16;i++){WorldReviewQA.step(.05);states.push({t:(i+1)*.05,cells:WorldReviewQA.cloudCells()});}
   const beforePause=CloudWorldV1.clock;openSystem();WorldReviewQA.step(.1,4);const pause=CloudWorldV1.clock===beforePause;closeOverlay();save(true);const raw=localStorage.getItem(KEY);
   if(old!==G.shards)throw Error('Cloud interaction changed currency');return {initial,states,pause,raw,flag:G.c3.cloudPathA};
  });
  assert(steps.initial.some(v=>!v),'Missing bridge was already walkable');assert(steps.flag,'Accepted flute interaction is not persisted');assert(steps.pause,'Cloud construction did not pause');assert(steps.states.some(s=>s.cells.some(Boolean)&&s.cells.some(v=>!v)),'No progressively supported intermediate bridge state');await capture('nuvens-01-reconstruindo');
  const resolved=await page.evaluate(raw=>{localStorage.setItem(KEY,raw);continueGame();for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();WorldReviewQA.clearUI();transitionAlpha=0;return {area:G.area,cells:WorldReviewQA.cloudCells(),valid:canBody121(G.x,G.y),flag:G.c3.cloudPathA};},steps.raw);
  assert.equal(resolved.area,'cloud_sea');assert(resolved.valid&&resolved.flag&&resolved.cells.every(Boolean),'Reload did not restore completed bridge safely');await capture('nuvens-02-restaurada');delete steps.raw;return {...steps,resolved};
 });

 await check('All three musical constructions become fully supported through simulation and repeated interactions do not restart them',async()=>{
  return page.evaluate(()=>{
   WorldReviewQA.fixture('cloud_sea',17,23,{bridges:false});const rows=[];
   for(const [which,key,x0,w,y]of [['A','cloudPathA',18,7,23],['P','cloudPlatform',32,7,16],['B','cloudPathB',45,6,11]]){
    function cells(){return Array.from({length:w},(_,i)=>tileWalkable(areas.cloud_sea,x0+i+.5,y+.5));}
    const before=cells();if(which==='P')C3.cloudPlatform();else C3.cloudPath(which);const pending=CloudWorldV1.builds.length;
    if(which==='P')C3.cloudPlatform();else C3.cloudPath(which);if(CloudWorldV1.builds.length!==pending)throw Error('Repeated interaction duplicated construction '+which);
    const counts=[];for(let i=0;i<40;i++){WorldReviewQA.step(.05);counts.push(cells().filter(Boolean).length);}
    if(!G.c3[key]||!cells().every(Boolean))throw Error('Construction failed to finish '+which);
    if(counts.some((n,i)=>i>0&&n<counts[i-1]))throw Error('Support receded during construction '+which);
    rows.push({which,before,counts,after:cells(),pending:CloudWorldV1.builds.length});
   }return rows;
  });
 });

 await check('Falling hero is visible in the sky and is occluded by actual cloud support instead of becoming a miniature over its floor',async()=>{
  const r=await page.evaluate(()=>{
   const edge=WorldReviewQA.edge();if(!WorldReviewQA.walk(edge))throw Error('Missing real fall for pixel-layer test');
   function sample(){
    const hero=CloudWorldV1.fall.hero,visible=WorldReviewQA.pixels(),actor=drawActor;let hidden;
    drawActor=function(p,...args){if(p.style===hero)return;return actor.call(this,p,...args);};try{hidden=WorldReviewQA.pixels();}finally{drawActor=actor;}
    let cloudPixels=0,skyPixels=0,totalPixels=0;
    for(let y=0;y<VH;y++)for(let x=0;x<VW;x++){
     const i=(y*VW+x)*4;if(visible[i]===hidden[i]&&visible[i+1]===hidden[i+1]&&visible[i+2]===hidden[i+2]&&visible[i+3]===hidden[i+3])continue;
     totalPixels++;const wx=x+cam.x+.5,wy=y+cam.y+.5,localX=((wx%T)+T)%T,localY=((wy%T)+T)%T;
     // Omit the one-pixel rasterized tile boundary, where projection rounds coordinates.
     if(localX<1||localX>T-1||localY<1||localY>T-1)continue;
     const type=current.tiles[Math.floor(wy/T)]?.[Math.floor(wx/T)];if(type==='c3_cloud'||type==='c3_platform')cloudPixels++;if(type==='c3_sky'||type==='void')skyPixels++;
    }return {elapsed:CloudWorldV1.fall.elapsed,totalPixels,cloudPixels,skyPixels};
   }
   WorldReviewQA.step(.05);const early=sample();WorldReviewQA.step(.05,11);const late=sample();return {edge,early,late};
  });assert(r.early.skyPixels>10,'Falling sprite was never visible in the sky');assert.equal(r.early.cloudPixels,0,'Early falling sprite appears over cloud support');assert.equal(r.late.cloudPixels,0,'Distant falling sprite appears over cloud support');await capture('queda-oclusao-nuvem');return r;
 });

 await check('Walking beyond an actual cloud edge plays the fall, pauses, and restarts at the start of the clouds without defeat',async()=>{
  const start=await page.evaluate(()=>{const edge=WorldReviewQA.edge();const started=WorldReviewQA.walk(edge);return {edge,started,fall:WorldReviewQA.fallState()};});assert(start.started,'Invisible collision still blocks leaving cloud');await capture('queda-p1-00-inicio');
  const paused=await page.evaluate(()=>{WorldReviewQA.step(.05,4);const before=WorldReviewQA.fallState();openSystem();WorldReviewQA.step(.1,6);const after=WorldReviewQA.fallState();closeOverlay();return {before,after};});assert.equal(paused.before.elapsed,paused.after.elapsed,'Fall advances while paused');await capture('queda-p1-01-caindo');
  await page.evaluate(()=>WorldReviewQA.step(.05,8));await capture('queda-p1-02-distante');
  const end=await page.evaluate(()=>{const hp=G.hp.franco,partner=G.hp.ryuchi;WorldReviewQA.step(.05,20);const x=G.x;moveBody10(.5,0,.1,false);return {mode,area:G.area,hpBefore:hp,hp:G.hp.franco,partner,partnerAfter:G.hp.ryuchi,retry:!!$('retryCheckpoint'),fall:WorldReviewQA.fallState(),start:{...CloudWorldV1.start},pos:{x,y:G.y},valid:canBody121(G.x,G.y),moved:G.x!==x};});
  assert.equal(end.fall,null,'Fall did not finish');assert.equal(end.area,'cloud_sea');assert.equal(end.mode,'walk');assert(!end.retry,'Fall still opens the defeat UI');
  assert.equal(end.hp,end.hpBefore,'Fall changed the hero HP');assert.equal(end.partner,end.partnerAfter);
  assert(Math.hypot(end.pos.x-end.start.x,end.pos.y-end.start.y)<1.5,'Fall did not return to the start of the clouds: '+JSON.stringify(end));assert(end.valid&&end.moved,'Hero cannot move after the fall');
  await capture('queda-p1-03-inicio-nuvens');return {start,paused,end};
 });

 await check('Dash and the real P2 movement pipeline can leave cloud edges without bypassing fall or hurting anyone',async()=>{
  const dash=await page.evaluate(()=>{const edge=WorldReviewQA.edge();G.aim091=[edge.dx,edge.dy];keys={[edge.dx===1?'d':edge.dx===-1?'a':edge.dy===1?'s':'w']:true};const started=startRoll121();for(let i=0;i<45&&!CloudWorldV1.fall;i++)WorldReviewQA.step(1/60);keys={};return {roll:started,fall:WorldReviewQA.fallState()};});assert(dash.roll&&dash.fall,'Dash still stops at an invisible cloud wall');await capture('queda-dash');
  const p2=await page.evaluate(()=>{const edge=WorldReviewQA.edge(true);const p1={x:G.x,y:G.y,hp:G.hp.franco},states=[];__worldPads[1].axes=[edge.dx,edge.dy,0,0];for(let i=0;i<20&&!CloudWorldV1.fall;i++){WorldReviewQA.step(1/60);states.push({i,active:C3.coopActive(),mode,x:C3.coop.x,y:C3.coop.y,valid:canBody121(C3.coop.x,C3.coop.y),area:C3.coop.area,member:C3.coopMember()});}__worldPads[1].axes=[0,0,0,0];return {edge,p1,states,fall:WorldReviewQA.fallState(),p1After:{x:G.x,y:G.y,hp:G.hp.franco}};});assert(p2.fall?.coop&&p2.fall.hero==='ryuchi','P2 did not enter fall: '+JSON.stringify(p2));assert.deepEqual(p2.p1,p2.p1After,'P2 fall moved or damaged P1');await capture('queda-p2');
  const p2hp=await page.evaluate(()=>G.hp.ryuchi);const end=await page.evaluate(()=>{WorldReviewQA.step(.05,22);return {mode,area:G.area,p1:G.hp.franco,p2:G.hp.ryuchi,retry:!!$('retryCheckpoint'),fall:WorldReviewQA.fallState(),valid:canBody121(C3.coop.x,C3.coop.y)};});assert.equal(end.fall,null);assert.equal(end.area,'cloud_sea');assert.equal(end.mode,'walk');assert.equal(end.p2,p2hp,'P2 fall changed P2 HP');assert.equal(end.p1,p2.p1.hp);assert(!end.retry,'P2 fall opened the defeat UI');assert(end.valid,'P2 respawned in an invalid spot');return {dash,p2,end};
 });

 await check('Postgame travel and dungeon entry cannot cancel a real cloud fall, including through the map menu or cosmetic toggle',async()=>{
  const rows=[];for(const coop of [false,true]){
   const start=await page.evaluate(coop=>{
    const edge=WorldReviewQA.edge(coop);Object.assign(G.c3,{complete:true,metronomeDone:true,silenceDone:true,synthUnlocked:true,percussionUnlocked:true});Object.assign(G.flags,{reveal:true,voicesKatana:true});
    // A real completed campaign has already polled its earned milestones. Let
    // the unchanged milestone/recruitment logic observe this seeded state on
    // safe ground, rather than awarding its synthetic pending revive after death.
    WorldReviewQA.step(.05,12);const hero=coop?C3.coopMember():G.active;if(G.hp[hero]!==G.maxhp[hero]||!canBody121(G.x,G.y)||coop&&!canBody121(C3.coop.x,C3.coop.y))throw Error('Completed campaign did not settle safely before the fall');
    const before=PostGame.canTravel();if(!before)throw Error('Completed safe campaign cannot travel before the fall');WorldReviewQA.checkpoint('c3_complete');
    if(coop){__worldPads[1].axes=[edge.dx,edge.dy,0,0];for(let i=0;i<20&&!CloudWorldV1.fall;i++)WorldReviewQA.step(1/60);__worldPads[1].axes=[0,0,0,0];}else WorldReviewQA.walk(edge);
    if(!CloudWorldV1.fall||!!CloudWorldV1.fall.coop!==coop)throw Error('Completed campaign did not enter the requested real cloud fall');
    const fall=CloudWorldV1.fall,area=G.area,position={x:G.x,y:G.y},partner=coop?G.active:'ryuchi',blocked=[];window.__travelFallQA={fall,hero:fall.hero,partner,partnerHP:G.hp[partner]};
    for(const enabled of [true,false]){
     CloudWorldV1.enabled=enabled;const canTravel=PostGame.canTravel(),travel=PostGame.travel('city'),dungeon=PostGame.startDungeon(197);blocked.push({enabled,canTravel,travel,dungeon,area:G.area,sameFall:CloudWorldV1.fall===fall,position:{x:G.x,y:G.y}});
     if(canTravel||travel!==false||dungeon!==false||G.area!==area||CloudWorldV1.fall!==fall||G.x!==position.x||G.y!==position.y)throw Error('Postgame navigation bypassed fatality '+JSON.stringify(blocked.at(-1)));
    }
    CloudWorldV1.enabled=true;const beforeM={mode,complete:G.c3.complete,endingPending:G.c3.endingPending,elapsed:fall.elapsed,dialogueHidden:$('dialogue').classList.contains('hidden'),speaker:$('speaker').textContent,words:$('words').textContent,queue:dialogueQueue.length};__travelFallQA.beforeM=beforeM;return {coop,edge,hero:fall.hero,seededCampaignSettledForSeconds:.6,heroHPBeforeFall:G.hp[hero],canTravelBefore:before,beforeM,blocked};
   },coop);
   await page.keyboard.press('m');
   const paused=await page.evaluate(()=>{
    const state=__travelFallQA,buttons=[...document.querySelectorAll('[data-post-area]')],menu={hero:state.hero,mode,complete:G.c3.complete,endingPending:G.c3.endingPending,beforeM:state.beforeM,travelButtons:buttons.length,allDisabled:buttons.length>0&&buttons.every(b=>b.disabled),dungeonDisabled:!!$('postDungeon')?.disabled,sameFall:CloudWorldV1.fall===state.fall,dialogueHidden:$('dialogue').classList.contains('hidden'),speaker:$('speaker').textContent,words:$('words').textContent};
    if(menu.mode!=='overlay'||!menu.allDisabled||!menu.dungeonDisabled||!menu.sameFall)throw Error('M map leaves an escape from the fall '+JSON.stringify(menu));
    const age=state.fall.elapsed;WorldReviewQA.step(.05,8);if(!CloudWorldV1.fall||CloudWorldV1.fall.elapsed!==age)throw Error('Map did not pause the original fall');return {menu,age};
   });
   await page.locator('#postMapClose').click();
   const end=await page.evaluate(age=>{
    const state=__travelFallQA;WorldReviewQA.step(.05);const resumed=CloudWorldV1.fall?.elapsed>age;if(!resumed)throw Error('Closing map failed to resume original fatal fall');
    const heroHP=G.hp[state.hero];WorldReviewQA.step(.05,20);const restart={mode,area:G.area,hero:state.hero,hp:G.hp[state.hero],partner:state.partner,partnerHP:G.hp[state.partner],retry:!!$('retryCheckpoint'),fall:!!CloudWorldV1.fall};
    if(restart.hp!==heroHP||restart.partnerHP!==state.partnerHP||restart.retry||restart.mode!=='walk'||restart.area!=='cloud_sea'||restart.fall)throw Error('Fall did not restart the clouds after map attempt '+JSON.stringify(restart));return {resumed,restart};
   },paused.age);
   const retry=await page.evaluate(()=>{
    const state=__travelFallQA;for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();WorldReviewQA.step(1/60);
    const result={area:G.area,hero:state.hero,hp:G.hp[state.hero],valid:canBody121(G.x,G.y),coopValid:!C3.coopActive()||canBody121(C3.coop.x,C3.coop.y),fall:!!CloudWorldV1.fall,complete:G.c3.complete,canTravel:PostGame.canTravel()};
    if(!result.valid||!result.coopValid||result.hp<=0||result.fall||!result.complete||!result.canTravel)throw Error('Travel did not recover after the cloud restart '+JSON.stringify(result));delete window.__travelFallQA;return result;
   });rows.push({...start,...paused,...end,retry});
  }return rows;
 });

 await check('Real solid walls outside cloud traversal still block movement, and area changes cancel transient falls',async()=>{
  const r=await page.evaluate(()=>{
   const edge=WorldReviewQA.edge();WorldReviewQA.walk(edge);if(!CloudWorldV1.fall)throw Error('Missing fall fixture');setArea('ciro_workshop',13.5,15.5,false);WorldReviewQA.step(1/60);const cleared=!CloudWorldV1.fall;
   const hp=G.hp.franco;G.x=1.5;G.y=5.5;const before=G.x;moveBody10(-1,0,5,false);const wall={before,after:G.x,valid:canBody121(G.x,G.y),fall:!!CloudWorldV1.fall};WorldReviewQA.step(.05,22);return {cleared,wall,hpBefore:hp,hpAfter:G.hp.franco,area:G.area};
  });assert(r.cleared&&r.wall.valid&&!r.wall.fall&&r.wall.after>=.29&&r.wall.after<r.wall.before);assert.equal(r.hpAfter,r.hpBefore);assert.equal(r.area,'ciro_workshop');return r;
 });

 await check('Reduced effects preserve traversable cloud state, contrast and static readable scenery',async()=>{
  const r=await page.evaluate(()=>{WorldReviewQA.fixture('cloud_sea',15,25);G.options10.reducedMotion=true;const before=JSON.stringify({hp:G.hp,c3:G.c3});WorldReviewQA.render();const first=EnvironmentAtmosphereV1.treePose({type:'tree',x:10,y:12});WorldReviewQA.step(.05,8);const second=EnvironmentAtmosphereV1.treePose({type:'tree',x:10,y:12});WorldReviewQA.render();return {valid:canBody121(G.x,G.y),fall:!!CloudWorldV1.fall,first,second,hp:G.hp,unchanged:before===JSON.stringify({hp:G.hp,c3:G.c3})};});assert(r.valid&&!r.fall&&r.unchanged);await capture('efeitos-suaves-nuvens');return r;
 });
 assert.deepEqual(report.browserErrors,[],'Browser errors');report.passed=report.checks.length;report.status='passed';console.log('PASS · '+report.passed+' environment/world browser checks');
})().catch(e=>{report.status='failed';report.fatal=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{fs.mkdirSync(out,{recursive:true});const file=report.filter?'BROWSER_FOCO_'+report.filter.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'.json':'BROWSER_RESULTADOS.json';fs.writeFileSync(path.join(out,file),JSON.stringify(report,null,2)+'\n');if(context)await context.close();if(browser)await browser.close();});
