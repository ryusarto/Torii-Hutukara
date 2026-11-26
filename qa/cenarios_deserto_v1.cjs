/* Isolated browser checks for the C3-only desert art layer.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CHROME_PATH=/path/to/Chrome
 * node qa/cenarios_deserto_v1.cjs http://127.0.0.1:<root-owned-server>/
 * Does not start a server, edit a real save or claim a physical playthrough.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),out=process.env.DESERT_OUTPUT_DIR||path.join(root,'qa/cenarios-deserto-v1');
const url=process.argv[2]||process.env.TORII_URL;
if(!url)throw Error('Pass the root-owned local build URL as argument or TORII_URL.');
const baselineFile=path.join(root,'qa/cenarios-v2/depois/MAPAS.json');
const baselineBytes=fs.readFileSync(baselineFile),baselineRaw=JSON.parse(baselineBytes);
const baseline=Array.isArray(baselineRaw)?baselineRaw:baselineRaw.maps||baselineRaw.areas;
const report={suite:'cenarios-deserto-v1',url,baseline:{file:'qa/cenarios-v2/depois/MAPAS.json',sha256:crypto.createHash('sha256').update(baselineBytes).digest('hex')},checks:[],browserErrors:[],physicalControllersTested:false,physicalMobileTested:false,newManualCampaignPlayed:false};
fs.mkdirSync(out,{recursive:true});
(async()=>{
 let browser,context;
 try{
  browser=process.env.CDP_URL?await chromium.connectOverCDP(process.env.CDP_URL):await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  context=await browser.newContext({viewport:{width:1280,height:800}});const page=await context.newPage();
  page.on('pageerror',error=>report.browserErrors.push(error.message));
  await page.addInitScript(()=>{
   const old=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,options){return old.call(this,type,type==='2d'&&this.id==='game'?{...options,willReadFrequently:true}:options)};
   window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]});
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof CenariosDesertoV1!=='undefined'&&typeof CenariosV2!=='undefined',null,{timeout:120000});
  // Isolate the existing desert library; environment_world_browser checks the new composition.
  await page.evaluate(()=>{for(const name of ['EnvironmentDepthV1','EnvironmentAtmosphereV1','CloudStoryV1','CloudWorldV1'])if(window[name])window[name].enabled=false;});
  report.browser=await browser.version();
  try{const r=await context.request.get(new URL('build-info.json',url).href);if(r.ok()){const b=await r.json();report.build={version:b.version,sourceSha256:b.sourceSha256,indexSha256:b.indexSha256}}}catch{}
  if(process.env.TORII_EXPECTED_SHA&&report.build?.sourceSha256!==process.env.TORII_EXPECTED_SHA)throw Error('Served build hash does not match TORII_EXPECTED_SHA: '+report.build?.sourceSha256);
  await page.evaluate(async()=>{
   C3.loadDeferredImages();C3.start(true);for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();mode='walk';transitionAlpha=0;screenShake=0;tick=4;keys={};bossActor=null;battle=null;trail=[];C3.pad.pads=[];
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('toast').classList.add('hidden');
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
   for(const hero of ['franco','ryuchi'])await ProtagonistArtV5.image(hero+'_idle').decode();
   for(const hero of ['alt','katana'])await NinjaArcherArtV1.image(hero+'_idle').decode();
   if(typeof MusicianArtV1==='undefined')throw Error('Reconciled MusicianArtV1 module missing');
   for(const hero of ['synth','percussion'])for(const variant of ['unmasked','masked']){const image=MusicianArtV1.image(MusicianArtV1.key(hero,variant,'idle'));if(!image)throw Error('Missing musician idle '+hero+'/'+variant);await image.decode();}
   VW=768;VH=432;cv.width=VW;cv.height=VH;ctx.imageSmoothingEnabled=false;
   window.__desertQA={
    pixels(fn){ctx.save();ctx.resetTransform();ctx.globalAlpha=1;ctx.clearRect(0,0,768,432);fn();ctx.restore();return new Uint8ClampedArray(ctx.getImageData(0,0,768,432).data)},
    equal(a,b){return a.every((n,i)=>n===b[i])},nonempty(a){return a.some((n,i)=>i%4===3&&n>0)}
   };
  });
  async function check(name,fn){
   try{const detail=await fn();report.checks.push({name,passed:true,detail});console.log('OK · '+name)}
   catch(error){report.checks.push({name,passed:false,error:error.message});console.error('FAIL · '+name+' · '+error.message)}
  }
  await check('Merged final desert library: 15 sheets / 151 nonempty cells and two decoded backgrounds',async()=>{
   const r=await page.evaluate(()=>{
    const art=CenariosV2,c=document.createElement('canvas'),q=c.getContext('2d',{willReadFrequently:true});let items=0;
    if(art.manifest.theme!=='deserto-v1')throw Error('Wrong compiled theme: '+art.manifest.theme);
    for(const [id,s]of Object.entries(art.manifest.sheets)){const im=art.image(id);if(im.naturalWidth!==s.grid[0]*s.cell||im.naturalHeight!==s.grid[1]*s.cell)throw Error('Wrong atlas dimensions '+id)}
    for(const [name,a]of Object.entries(art.manifest.items)){
     c.width=a.cell[2];c.height=a.cell[3];q.drawImage(art.image(a.sheet),...a.cell,0,0,c.width,c.height);const d=q.getImageData(0,0,c.width,c.height).data;
     for(const pixel of [0,c.width-1,(c.height-1)*c.width,c.width*c.height-1])if(d[pixel*4+3]!==0)throw Error('Opaque corner '+name);
     if(!d.some((n,i)=>i%4===3&&n>0))throw Error('Empty cell '+name);
     if(a.content[0]<a.cell[0]||a.content[1]<a.cell[1]||a.content[0]+a.content[2]>a.cell[0]+a.cell[2]||a.content[1]+a.content[3]>a.cell[1]+a.cell[3])throw Error('Content escapes cell '+name);
     items++;
    }
    const backgrounds=Object.entries(art.manifest.backgrounds||{}).map(([id,b])=>{const image=art.image(id);if(image.naturalWidth!==b.size[0]||image.naturalHeight!==b.size[1])throw Error('Wrong background dimensions '+id);return {id,width:image.naturalWidth,height:image.naturalHeight}});
    return {theme:art.manifest.theme,sheets:Object.keys(art.manifest.sheets).length,items,backgrounds,desertExtras:Object.keys(art.manifest.items).filter(k=>k.startsWith('c3_desert_'))};
   });assert.equal(r.sheets,15);assert.equal(r.items,151);assert.equal(r.desertExtras.length,25);assert.equal(r.backgrounds.length,2);return r;
  });
  await check('All 25 maps keep their gates and match baseline tiles and collision outside the approved layout updates',async()=>{
   const currentMaps=await page.evaluate(()=>JSON.parse(JSON.stringify(Object.values(areas).map(a=>({id:a.id,w:a.w,h:a.h,tiles:a.tiles,blocked:[...a.blocked].sort(),gates:a.gates.map(g=>({...g,need:undefined}))})))));
   assert.equal(currentMaps.length,25);assert.equal(baseline.length,25);
   for(const old of baseline){
    const a=currentMaps.find(m=>m.id===old.id);
    assert(a,'Missing '+old.id);assert.equal(a.w,old.w,old.id+' width');assert.equal(a.h,old.h,old.id+' height');
    const expectedTiles=old.tiles.map(row=>row.slice());
    const expectedBlocked=new Set(old.blocked);
    if(old.id==='studio'){
     for(let y=5;y<9;y++)for(let x=2;x<6;x++)expectedBlocked.delete(x+','+y);
     for(let y=6;y<12;y++)for(let x=2;x<5;x++)expectedBlocked.add(x+','+y);
    }
    if(old.id==='distortion_district'){
     // 1.11 removes only the residences at (9,9) and (21,8).
     // Their footprints overlap eight workshop cells, which must stay blocked.
     for(const [hx,hy]of [[9,9],[21,8]])for(let y=hy-5;y<hy;y++)for(let x=hx-3;x<hx+4;x++){
      if(x>=21&&x<29&&y>=6&&y<11)continue;
      assert(expectedBlocked.delete(x+','+y),'Missing historical residence cell '+x+','+y);
     }
     assert.equal(old.blocked.length-expectedBlocked.size,62,'Exactly the removed residence collision is released');
    }
    if(old.id==='forest'){
     // The instrument forecourt opens a path and removes these seven tree footprints.
     for(const [x,y] of [[27,17],[28,18],[26,24],[27,24],[28,24],[27,25]])expectedTiles[y][x]='forestpath';
     for(const cell of ['28,17','27,24','28,24','29,24','27,25','28,25','27,26'])assert(expectedBlocked.delete(cell),'Missing historical tree cell '+cell);
    }
    if(old.id==='contratempo'){
     // Stage perimeter, with the two stair tiles open at the front.
     for(let x=7;x<=20;x++){
      expectedBlocked.add(`${x},4`);
      if(x!==13&&x!==14)expectedBlocked.add(`${x},9`);
     }
     for(let y=5;y<=8;y++)for(const x of [7,20])expectedBlocked.add(`${x},${y}`);
     // Instruments, mixer, four chairs, instrument rack and bar counter.
     for(const cell of ['10,6','14,6','17,6','22,7','6,14','8,14','10,15','12,15','2,8','3,8','4,8'])expectedBlocked.add(cell);
     for(let y=11;y<=16;y++)for(const x of [24,25])expectedBlocked.add(`${x},${y}`);
    }
    assert.deepEqual(a.tiles,expectedTiles,old.id+' tiles');
    assert.deepEqual(a.blocked,[...expectedBlocked].sort(),old.id+' blocked');
    assert.deepEqual(a.gates,old.gates,old.id+' gates');
   }
   return {maps:25,transitions:currentMaps.reduce((n,a)=>n+a.gates.length,0),collisionChanges:{studio:'sofa 3x6 at (2,6)',distortion_district:'62 released cells; workshop overlap retained',forest:'instrument forecourt',contratempo:'stage and furnishings'},allOtherCellsUnchanged:true};
  });
  await check('Desert binding is used by the real prop renderer only in C3, including elevator states',async()=>{
   const r=await page.evaluate(()=>{
    const original=CenariosV2.sprite,calls=[],rows=[];CenariosV2.sprite=function(name,...args){calls.push(name);return original.call(this,name,...args)};
    try{
     const types=['c3_club','c3_workshop','c3_lamp','c3_neon_lamp','c3_neon_utility','c3_elevator','c3_sanctuary','env2_prop'];
     for(const area of ['city','voices','distortion_district','cloud_terrace'])for(const type of types){
      G.area=area;current=areas[area];G.c3.liftOpen=false;const p={type,item:'checkpoint_recorder',x:4,y:4,w:58,h:68};calls.length=0;
      const image=__desertQA.pixels(()=>drawProp(p,0,0));const expected=C3.AREAS.includes(area)?CenariosDesertoV1.binding(p):null;
      const extras=calls.filter(k=>k.startsWith('c3_desert_'));if(expected){if(!extras.includes(expected.item)||!__desertQA.nonempty(image))throw Error('Missing actual binding '+area+'/'+type)}else if(extras.length)throw Error('Binding leaked into '+area+'/'+type);
      rows.push({area,type,extra:extras[0]||null});
     }
     G.area='sky_lift';current=areas.sky_lift;const p={type:'c3_elevator',x:6,y:8};
     G.c3.liftOpen=false;const closed=__desertQA.pixels(()=>drawProp(p,0,0)),a=CenariosDesertoV1.binding(p).item;
     G.c3.liftOpen=true;const open=__desertQA.pixels(()=>drawProp(p,0,0)),b=CenariosDesertoV1.binding(p).item;
     if(a!=='c3_desert_elevator_closed'||b!=='c3_desert_elevator_open'||__desertQA.equal(closed,open))throw Error('Lift states do not change actual rendered pixels');
     return {samples:rows,elevator:{closed:a,open:b,pixelsDiffer:true}};
    }finally{CenariosV2.sprite=original}
   });return r;
  });
  await check('D11/D12/D13 ensure requests stay in their designated C3 areas and never C1/C2',async()=>{
   return page.evaluate(()=>{
    const previous=CenariosV2.image,calls=[],result=[];CenariosV2.image=function(id){calls.push(id);return previous.call(this,id)};
    try{for(const area of ['studio','city','voices','radio9',...C3.AREAS]){
     calls.length=0;CenariosDesertoV1.ensure(area);const extra=calls.filter(id=>/^D\d+$/.test(id));
     if(!C3.AREAS.includes(area)&&extra.length)throw Error('Extra requested outside C3 '+area);
     const expected={D11:['sky_terminal','distortion_district','sky_lift','cloud_terrace','last_torii'],D12:C3.AREAS,D13:['ciro_workshop','sky_canal','sky_lift']};
     for(const [id,places]of Object.entries(expected))if(extra.includes(id)!==places.includes(area))throw Error(id+' wrong request scope '+area);
     result.push({area,extra});
    }return result;}finally{CenariosV2.image=previous}
   });
  });
  await check('All nine D12 bindings render at the contracted sizes, including checkpoint 46x60',async()=>{
   return page.evaluate(()=>{
    const original=CenariosV2.sprite,calls=[],rows=[];CenariosV2.sprite=function(item,x,y,w,h,...rest){calls.push({item,w,h});return original.call(this,item,x,y,w,h,...rest)};
    const specs=[['c3_bench','bench',96,58],['c3_planter','planter',96,54],['c3_crates','crates',82,72],['c3_vending','vending',60,88],['c3_railing','railing',106,58],['c3_drain','drain',72,38],['c3_kiosk','kiosk',68,80],['c3_workbench','workbench',154,88],['c3_flute_rack','flute_rack',112,78],['checkpointStone','kiosk',46,60]];
    try{G.area='ciro_workshop';current=areas.ciro_workshop;for(const [type,key,w,h]of specs){calls.length=0;const pixels=__desertQA.pixels(()=>drawProp({type,x:8,y:10},0,0));const expected='c3_desert_'+key,a=CenariosV2.manifest.items[expected];
     if(a?.sheet!=='D12'||!calls.some(c=>c.item===expected&&c.w===w&&c.h===h)||!__desertQA.nonempty(pixels))throw Error('D12 contract mismatch '+type);rows.push({type,item:expected,display:[w,h]});
    }return rows;}finally{CenariosV2.sprite=original}
   });
  });
  await check('D13 renders every functional binding and separates active/calm interference by Canal flags',async()=>{
   return page.evaluate(()=>{
    const c=G.c3,old={...c},original=CenariosV2.sprite,calls=[],rows=[];CenariosV2.sprite=function(item,...args){calls.push(item);return original.call(this,item,...args)};
    function render(area,type,flags,expected){Object.assign(c,{canalPath:false,canalDone:false,usinaGate:false,usinaDone:false},flags);G.area=area;current=areas[area];calls.length=0;const pixels=__desertQA.pixels(()=>drawProp({type,x:8,y:10},0,0));const name='c3_desert_'+expected;
     if(CenariosV2.manifest.items[name]?.sheet!=='D13'||!calls.includes(name)||!__desertQA.nonempty(pixels))throw Error('D13 mismatch '+type+'/'+JSON.stringify(flags));rows.push({area,type,flags,item:name});}
    try{
     for(const [type,key]of [['c3_wind_console','wind_console'],['c3_tuning_machine','tuning_machine'],['c3_broken_pipe','broken_pipe'],['c3_lift_console','lift_console'],['c3_wind_receiver','wind_receiver'],['c3_bass_lock','bass_lock']])render('ciro_workshop',type,{},key);
     render('sky_canal','c3_interference',{},'interference_active');
     render('sky_canal','c3_interference',{usinaGate:true,usinaDone:true},'interference_active');
     render('sky_canal','c3_interference',{canalPath:true},'interference_calm');
     render('sky_canal','c3_interference',{canalDone:true},'interference_calm');
     render('sky_canal','c3_interference_calm',{},'interference_calm');return rows;
    }finally{Object.assign(c,old);CenariosV2.sprite=original}
   });
  });
  await check('Thirteen off/on asset pairs retain common cell dimensions and pivots',async()=>{
   return page.evaluate(()=>{
    const pairs=[['stage_idle','stage_active'],['speaker_idle','speaker_active'],['machine_inactive','machine_active'],['pressure_switch_inactive','pressure_switch_active'],['valve_stalled','valve_released'],['canal_gate_closed','canal_gate_open'],['wind_beacon_off','wind_beacon_on'],['condensation_off','condensation_on'],['drum_anchor_off','drum_anchor_on'],['silence_altar_dormant','silence_altar_awake'],['resonance_circle_off','resonance_circle_on'],['c3_desert_elevator_closed','c3_desert_elevator_open'],['c3_desert_interference_active','c3_desert_interference_calm']];
    return pairs.map(([off,on])=>{const a=CenariosV2.manifest.items[off],b=CenariosV2.manifest.items[on];if(!a||!b||JSON.stringify(a.cell.slice(2))!==JSON.stringify(b.cell.slice(2))||JSON.stringify(a.pivot)!==JSON.stringify(b.pivot))throw Error('State dimensions/pivot drift '+off+'/'+on);return {off,on,cell:a.cell.slice(2),pivot:a.pivot}});
   });
  });
  await check('Two C3 dialogue backgrounds replace old panels, four legacy panels stay identical, and stale loads cannot restore or resurrect',async()=>{
   return page.evaluate(()=>{
    const art=CenariosV2,legacy=['studio','chamber','city','ruins'],result={legacy:[],desert:[],lateCallbacks:[]},image=C3.images.prebeta_cinema,descriptor=Object.getOwnPropertyDescriptor(image,'complete'),oldCache={...PB.cinemaCache};
    function same(a,b,label){if(a!==b)throw Error(label)}
    try{
     for(const area of legacy){const before=desertCinemaPanelV1.call(PB,area),after=PB.cinemaPanel(area);if(!before)throw Error('Missing decoded legacy panel '+area);same(after,before,'Legacy panel changed '+area);result.legacy.push({area,pixelSourceIdentical:true,uriBytes:before.length});}
     for(const area of ['distortion','cloud']){const id='BG_'+area,old=desertCinemaPanelV1.call(PB,area),fresh=PB.cinemaPanel(area);same(fresh,art.assets[id],'Wrong C3 panel '+area);if(fresh===old)throw Error('Old C3 panel retained '+area);result.desert.push({area,asset:id,replaced:true});}
     // Force a pending-load branch on the real image/renderer. No network timing
     // or personal UI is involved; dispatch invokes the registered real callbacks.
     Object.defineProperty(image,'complete',{value:false,configurable:true});
     showCinema('distortion');showCinema('cloud');const currentImage=$('cinema').style.backgroundImage;
     if(!currentImage.includes(art.assets.BG_cloud))throw Error('Cloud contextual source missing');
     const expected=document.createElement('div');expected.style.backgroundImage=`url("${art.assets.BG_cloud}")`;
     same(currentImage,expected.style.backgroundImage,'Desert source mismatch');
     image.dispatchEvent(new Event('load'));same($('cinema').style.backgroundImage,currentImage,'Stale load restored source or purple color');
     result.lateCallbacks.push({case:'old context then new context',backgroundAndGradientUnchanged:true});
     showCinema('distortion');talk([{who:'narrator',t:'Verificação isolada de encerramento.'}]);for(let i=0;mode==='dialogue'&&i<10;i++)advanceDialogue();
     if($('cinema').style.display!=='none')throw Error('Real dialogue completion did not close cinema');const closedImage=$('cinema').style.backgroundImage;
     image.dispatchEvent(new Event('load'));if($('cinema').style.display!=='none'||$('cinema').style.backgroundImage!==closedImage)throw Error('Late image load resurrected/changed closed dialogue');
     result.lateCallbacks.push({case:'real dialogue completion then late image load',remainedHidden:true,backgroundUnchanged:true});return result;
    }finally{if(descriptor)Object.defineProperty(image,'complete',descriptor);else delete image.complete;PB.cinemaCache=oldCache;$('cinema').style.display='none';}
   });
  });
  await check('Industrial A07 states depend on their own local progress, never the other route',async()=>{
   return page.evaluate(()=>{
    const oldArea=G.area,old={...G.c3},c=G.c3,result=[];
    function test(area,flags,type,expected){Object.assign(c,{usinaGate:false,usinaDone:false,canalPath:false,canalDone:false,clubPhraseDone:false},flags);G.area=area;const actual=CenariosV2.itemFor({type});if(actual!==expected)throw Error(area+'/'+type+' '+JSON.stringify(flags)+' expected '+expected+' got '+actual);result.push({area,flags,type,actual});}
    try{
     test('sky_canal',{usinaGate:true,usinaDone:true},'c3_machine','machine_inactive');
     test('power_plant',{canalPath:true,canalDone:true},'c3_machine','machine_inactive');
     test('sky_canal',{canalPath:true},'c3_machine','machine_active');test('sky_canal',{canalDone:true},'c3_machine','machine_active');
     test('power_plant',{usinaGate:true},'c3_machine','machine_active');test('power_plant',{usinaDone:true},'c3_machine','machine_active');
     test('sky_canal',{usinaDone:true},'c3_canal_gate','canal_gate_closed');test('sky_canal',{canalDone:true},'c3_canal_gate','canal_gate_open');
     test('sky_canal',{canalDone:true},'c3_rescue_barrier','canal_gate_open');
     test('power_plant',{canalDone:true},'c3_pressure_switch','pressure_switch_inactive');test('power_plant',{usinaGate:true},'c3_pressure_switch','pressure_switch_active');
     test('power_plant',{usinaGate:true},'c3_valve_station','valve_stalled');test('power_plant',{usinaDone:true},'c3_valve_station','valve_released');
     return result;
    }finally{Object.assign(c,old);G.area=oldArea}
   });
  });
  await check('Rendering all 25 areas leaves the serialized save, props and gates unchanged',async()=>{
   return page.evaluate(async()=>{
    const immutable=()=>JSON.stringify(Object.values(areas).map(a=>({id:a.id,props:a.props,gates:a.gates}))),before=immutable(),tested=[];
    for(const a of Object.values(areas)){
     current=a;G.area=a.id;const safe=safeSpawn121(a.w/2,a.h/2);G.x=safe?.x||a.w/2;G.y=safe?.y||a.h/2;cam.x=cam.y=0;trail=[];mode='walk';transitionAlpha=0;
     await window.FinalAssetLoadingV1?.ready();const saveBefore=JSON.stringify(G);drawEnv();if(JSON.stringify(G)!==saveBefore)throw Error('Save mutated during render '+a.id);tested.push(a.id);
    }
    if(before!==immutable())throw Error('A prop or gate changed during render');return {areas:tested,saveUnchanged:true,propsUnchanged:true,gatesUnchanged:true};
   });
  });
  await check('C1/C2 legacy pixels match V2 and new forest and radio props render',async()=>{
   const result=await page.evaluate(()=>{
    const tested=[],forestProps=[];let count=0,radioTuners=0,radioAntennas=0,planarPortals=0;
    for(const a of Object.values(areas).filter(a=>!C3.AREAS.includes(a.id))){
     current=a;G.area=a.id;cam.x=cam.y=0;const props=a.props;
     for(const p of props){if(a.id==='studio'&&['sofa','plant'].includes(p.type))continue;const cx=(p.x+.5)*T-384,cy=(p.y+.65)*T-330;
      const before=__desertQA.pixels(()=>desertPropV1(p,cx,cy)),after=__desertQA.pixels(()=>drawProp(p,cx,cy));
      if(p.type==='silenceGate'){
       // Approved 1.25 art moves this portal from the vertical prop pass to
       // the ground pass. Check the replacement rather than the retired art.
       const flags=JSON.stringify(G.flags);
       const ground=__desertQA.pixels(()=>{if(!CombatReadabilityV1.portal(p,cx,cy))throw Error('Ground portal was not handled')});
       if(__desertQA.nonempty(after)||!__desertQA.nonempty(ground))throw Error('Portal must render only on the ground');
       if(JSON.stringify(G.flags)!==flags)throw Error('Ground portal changed progression');
       planarPortals++;continue;
      }
      if(a.id==='forest'&&p.type==='frequencyStation'){
       if(!__desertQA.nonempty(after)||__desertQA.equal(before,after))throw Error('Missing instrument art '+p.bridgeKind);
       forestProps.push(p.bridgeKind);continue;
      }
      if(a.id==='radio9'&&p.type==='radioTuner'){
       if(!__desertQA.nonempty(after)||__desertQA.equal(before,after))throw Error('Missing radio tuner art');
       radioTuners++;continue;
      }
      if(a.id==='radio9'&&p.type==='voiceAntenna'){
       const flags=G.flags;
       try{
        G.flags={radioTuned:false};
        const oldAntenna=__desertQA.pixels(()=>desertPropV1(p,cx,cy));
        const off=__desertQA.pixels(()=>drawProp(p,cx,cy));
        G.flags.radioTuned=true;
        const on=__desertQA.pixels(()=>drawProp(p,cx,cy));
        if(!__desertQA.equal(oldAntenna,off)||__desertQA.equal(off,on))throw Error('Radio antenna must light up only when tuned');
       }finally{G.flags=flags}
       radioAntennas++;continue;
      }
      if(!__desertQA.equal(before,after))throw Error('Legacy prop pixels changed '+a.id+'/'+p.type);count++;
     }
     const types=[...new Set(a.tiles.flat())];for(const type of types){const before=__desertQA.pixels(()=>cenarioTileV2(type,100,100,3,3)),after=__desertQA.pixels(()=>drawTile(type,100,100,3,3));if(!__desertQA.equal(before,after))throw Error('Legacy tile pixels changed '+a.id+'/'+type)}
     tested.push({area:a.id,props:props.length,tileTypes:types.length});
    }return {areas:tested,propSamples:count,forestProps,radioTuners,radioAntennas,planarPortals};
   });
   assert.deepEqual(result.forestProps.sort(),['bell','log','marker','stone']);
   assert.equal(result.radioTuners,1);assert.equal(result.radioAntennas,1);assert.equal(result.planarPortals,1);return result;
  });
  await check('All six hero renderers remain pixel-identical with desert theme enabled or disabled',async()=>{
   return page.evaluate(()=>{
    const theme=CenariosV2.manifest.theme,area=G.area,active=G.active,mask=G.flags.masks,musicianVariants={...MusicianArtV1.variants},result=[];
    current=areas.distortion_district;G.area=current.id;act.hit=0;Combat10.dashTime=0;tick=4;ProtagonistArtV5.reset();NinjaArcherArtV1.reset();MusicianArtV1.reset();
    try{for(const hero of ['franco','ryuchi','alt','katana','synth','percussion'])for(const masked of [false,true])for(const dir of ['down','left','up','right']){
     G.active=hero;G.flags.masks=masked;if(MusicianArtV1.supports(hero))MusicianArtV1.setVariant(hero,masked?'masked':'unmasked');const p={style:hero,dir};CenariosV2.manifest.theme='qa-desert-disabled';const before=__desertQA.pixels(()=>drawActor(p,384,330,false));
     CenariosV2.manifest.theme=theme;const after=__desertQA.pixels(()=>drawActor(p,384,330,false));
     if(!__desertQA.nonempty(before)||!__desertQA.equal(before,after))throw Error('Hero changed or empty '+hero+'/'+masked+'/'+dir);result.push({hero,masked,dir,equal:true});
    }return {samples:result.length,results:result};}finally{CenariosV2.manifest.theme=theme;G.area=area;G.active=active;G.flags.masks=mask;Object.assign(MusicianArtV1.variants,musicianVariants)}
   });
  });
  await check('An existing district enemy generates its real combat windup on the desert floor',async()=>{
   return page.evaluate(async()=>{
    current=areas.distortion_district;G.area=current.id;mode='walk';bossActor=null;battle=null;C3.hazards=[];G.defeated=[];
    // Real patrols are intentionally hidden until a first route is complete.
    // Prepare that legitimate preview state, then use the real lazy hydrator.
    G.flags.bass=true;G.c3.usinaDone=true;
    const enemy=enemyActors().map(e=>hydrateEnemy(e)).find(e=>e.hp>0);if(!enemy)throw Error('No existing living district enemy after legitimate route state');
    const candidate=[[enemy.x+1,enemy.y],[enemy.x-1,enemy.y],[enemy.x,enemy.y+1],[enemy.x,enemy.y-1]].find(([x,y])=>canBody121(x,y));if(!candidate)throw Error('No body-valid approach to existing enemy');
    [G.x,G.y]=candidate;G.hp[G.active]=G.maxhp[G.active];act.invuln=10;enemy.cd=0;enemy.stun=0;enemy.wind=0;engage();if(mode!=='action')throw Error('Real engage rejected district combat');
    updateEnemy(enemy,.016,false);if(!(enemy.wind>0))throw Error('Actual enemy did not enter windup');
    await window.FinalAssetLoadingV1?.ready();cam.x=Math.max(0,enemy.x*T-384);cam.y=Math.max(0,enemy.y*T-180);transitionAlpha=0;screenShake=0;drawEnv();drawCombatLayer();
    const pixels=ctx.getImageData(0,0,768,432).data;if(!pixels.some((v,i)=>i%4===3&&v))throw Error('Empty real combat frame');
    return {enemyId:enemy.id,type:enemy.type,enemyPosition:[enemy.x,enemy.y],playerPosition:[G.x,G.y],windKind:enemy.windKind,wind:enemy.wind,mode,frameRendered:true,manuallyReviewed:false,spawnedSyntheticEnemy:false,preparedRouteState:'usinaDone=true; real enemyActors/hydrateEnemy'};
   });
  });
  report.passed=report.checks.every(c=>c.passed)&&report.browserErrors.length===0;
 }catch(error){report.passed=false;report.fatalError=error.stack||error.message;console.error(error)}
 finally{
  report.passedChecks=report.checks.filter(c=>c.passed).length;report.totalChecks=report.checks.length;
  report.limits=['Headless isolated browser context; no personal save used.','A rendered combat windup is not proof of manual combat readability or a completed fight.','No new full campaign, physical mobile, multitouch device or physical controller test.'];
  fs.writeFileSync(path.join(out,'RUNTIME_RESULTS.json'),JSON.stringify(report,null,2)+'\n');
  if(context)await context.close();if(browser)await browser.close();
 }
 console.log((report.passed?'PASS':'FAIL')+' · '+report.passedChecks+'/'+report.totalChecks+' desert checks');if(!report.passed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
