/* Isolated browser checks for the C3-only desert art layer.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CHROME_PATH=/path/to/Chrome
 * node qa/cenarios_deserto_v1.cjs http://127.0.0.1:<root-owned-server>/
 * Does not start a server, edit a real save or claim a physical playthrough.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/cenarios-deserto-v1');
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
  browser=await (process.env.CHROME_PATH?chromium.launch({executablePath:process.env.CHROME_PATH,headless:true}):chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9238'));
  context=await browser.newContext({viewport:{width:1280,height:800}});const page=await context.newPage();
  page.on('pageerror',error=>report.browserErrors.push(error.message));
  await page.addInitScript(()=>{
   const old=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,options){return old.call(this,type,type==='2d'&&this.id==='game'?{...options,willReadFrequently:true}:options)};
   window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]});
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof CenariosDesertoV1!=='undefined'&&typeof CenariosV2!=='undefined',null,{timeout:120000});
  report.browser=await browser.version();
  try{const r=await context.request.get(new URL('build-info.json',url).href);if(r.ok()){const b=await r.json();report.build={version:b.version,sourceSha256:b.sourceSha256,indexSha256:b.indexSha256}}}catch{}
  await page.evaluate(async()=>{
   C3.loadDeferredImages();C3.start(true);for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();mode='walk';transitionAlpha=0;screenShake=0;tick=4;keys={};bossActor=null;battle=null;trail=[];C3.pad.pads=[];
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('toast').classList.add('hidden');
   await CenariosV2.ready();await Promise.all(Object.values(C3.images).map(i=>i.decode()));
   for(const hero of ['franco','ryuchi'])await ProtagonistArtV5.image(hero+'_idle').decode();
   for(const hero of ['alt','katana'])await NinjaArcherArtV1.image(hero+'_idle').decode();
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
  await check('Merged desert library: 13 sheets / 134 nonempty cells with true transparent gutters',async()=>{
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
    return {theme:art.manifest.theme,sheets:Object.keys(art.manifest.sheets).length,items,desertExtras:Object.keys(art.manifest.items).filter(k=>k.startsWith('c3_desert_'))};
   });assert.equal(r.sheets,13);assert.equal(r.items,134);assert.equal(r.desertExtras.length,8);return r;
  });
  await check('All 25 map collision fields and every gate match the already-aligned V2 snapshot',async()=>{
   const currentMaps=await page.evaluate(()=>JSON.parse(JSON.stringify(Object.values(areas).map(a=>({id:a.id,w:a.w,h:a.h,tiles:a.tiles,blocked:[...a.blocked].sort(),gates:a.gates.map(g=>({...g,need:undefined}))})))));
   assert.equal(currentMaps.length,25);assert.equal(baseline.length,25);
   for(const old of baseline){const a=currentMaps.find(m=>m.id===old.id);assert(a,'Missing '+old.id);assert.equal(a.w,old.w,old.id+' width');assert.equal(a.h,old.h,old.id+' height');assert.deepEqual(a.tiles,old.tiles,old.id+' tiles');assert.deepEqual(a.blocked,[...old.blocked].sort(),old.id+' blocked');assert.deepEqual(a.gates,old.gates,old.id+' gates');}
   return {maps:25,transitions:currentMaps.reduce((n,a)=>n+a.gates.length,0),newCoordinateAllowlist:false,collisionChanges:false};
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
  await check('D11 ensure requests stay in their designated C3 areas and never C1/C2',async()=>{
   return page.evaluate(()=>{
    const previous=CenariosV2.image,calls=[],result=[];CenariosV2.image=function(id){calls.push(id);return previous.call(this,id)};
    try{for(const area of ['studio','city','voices','radio9','distortion_district','sky_lift','last_torii']){
     calls.length=0;CenariosDesertoV1.ensure(area);const extra=calls.filter(id=>/^D\d+$/.test(id));
     if(!C3.AREAS.includes(area)&&extra.length)throw Error('Extra requested outside C3 '+area);
     if(['distortion_district','sky_lift','last_torii'].includes(area)&&!extra.includes('D11'))throw Error('D11 not requested '+area);
     result.push({area,extra});
    }return result;}finally{CenariosV2.image=previous}
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
   return page.evaluate(()=>{
    const immutable=()=>JSON.stringify(Object.values(areas).map(a=>({id:a.id,props:a.props,gates:a.gates}))),before=immutable(),tested=[];
    for(const a of Object.values(areas)){
     current=a;G.area=a.id;const safe=safeSpawn121(a.w/2,a.h/2);G.x=safe?.x||a.w/2;G.y=safe?.y||a.h/2;cam.x=cam.y=0;trail=[];mode='walk';transitionAlpha=0;
     const saveBefore=JSON.stringify(G);drawEnv();if(JSON.stringify(G)!==saveBefore)throw Error('Save mutated during render '+a.id);tested.push(a.id);
    }
    if(before!==immutable())throw Error('A prop or gate changed during render');return {areas:tested,saveUnchanged:true,propsUnchanged:true,gatesUnchanged:true};
   });
  });
  await check('C1/C2 prop and tile pixels match the original V2 wrapper with no desert recoloring',async()=>{
   return page.evaluate(()=>{
    const tested=[];let count=0;
    for(const a of Object.values(areas).filter(a=>!C3.AREAS.includes(a.id))){
     current=a;G.area=a.id;cam.x=cam.y=0;const props=a.props;
     for(const p of props){const cx=(p.x+.5)*T-384,cy=(p.y+.65)*T-330;
      const before=__desertQA.pixels(()=>desertPropV1(p,cx,cy)),after=__desertQA.pixels(()=>drawProp(p,cx,cy));
      if(!__desertQA.equal(before,after))throw Error('Legacy prop pixels changed '+a.id+'/'+p.type);count++;
     }
     const types=[...new Set(a.tiles.flat())];for(const type of types){const before=__desertQA.pixels(()=>cenarioTileV2(type,100,100,3,3)),after=__desertQA.pixels(()=>drawTile(type,100,100,3,3));if(!__desertQA.equal(before,after))throw Error('Legacy tile pixels changed '+a.id+'/'+type)}
     tested.push({area:a.id,props:props.length,tileTypes:types.length});
    }return {areas:tested,propSamples:count};
   });
  });
  await check('All six hero renderers remain pixel-identical with desert theme enabled or disabled',async()=>{
   return page.evaluate(()=>{
    const theme=CenariosV2.manifest.theme,area=G.area,active=G.active,mask=G.flags.masks,result=[];
    current=areas.distortion_district;G.area=current.id;act.hit=0;Combat10.dashTime=0;tick=4;ProtagonistArtV5.reset();NinjaArcherArtV1.reset();
    try{for(const hero of ['franco','ryuchi','alt','katana','synth','percussion'])for(const masked of [false,true])for(const dir of ['down','left','up','right']){
     G.active=hero;G.flags.masks=masked;const p={style:hero,dir};CenariosV2.manifest.theme='qa-desert-disabled';const before=__desertQA.pixels(()=>drawActor(p,384,330,false));
     CenariosV2.manifest.theme=theme;const after=__desertQA.pixels(()=>drawActor(p,384,330,false));
     if(!__desertQA.nonempty(before)||!__desertQA.equal(before,after))throw Error('Hero changed or empty '+hero+'/'+masked+'/'+dir);result.push({hero,masked,dir,equal:true});
    }return {samples:result.length,results:result};}finally{CenariosV2.manifest.theme=theme;G.area=area;G.active=active;G.flags.masks=mask}
   });
  });
  await check('An existing district enemy generates its real combat windup on the desert floor',async()=>{
   return page.evaluate(()=>{
    current=areas.distortion_district;G.area=current.id;mode='walk';bossActor=null;battle=null;C3.hazards=[];G.defeated=[];
    // Real patrols are intentionally hidden until a first route is complete.
    // Prepare that legitimate preview state, then use the real lazy hydrator.
    G.flags.bass=true;G.c3.usinaDone=true;
    const enemy=enemyActors().map(e=>hydrateEnemy(e)).find(e=>e.hp>0);if(!enemy)throw Error('No existing living district enemy after legitimate route state');
    const candidate=[[enemy.x+1,enemy.y],[enemy.x-1,enemy.y],[enemy.x,enemy.y+1],[enemy.x,enemy.y-1]].find(([x,y])=>canBody121(x,y));if(!candidate)throw Error('No body-valid approach to existing enemy');
    [G.x,G.y]=candidate;G.hp[G.active]=G.maxhp[G.active];act.invuln=10;enemy.cd=0;enemy.stun=0;enemy.wind=0;engage();if(mode!=='action')throw Error('Real engage rejected district combat');
    updateEnemy(enemy,.016,false);if(!(enemy.wind>0))throw Error('Actual enemy did not enter windup');
    cam.x=Math.max(0,enemy.x*T-384);cam.y=Math.max(0,enemy.y*T-180);transitionAlpha=0;screenShake=0;drawEnv();drawCombatLayer();
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
