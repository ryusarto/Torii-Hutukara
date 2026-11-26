'use strict';
// Compare original collaborator art at candidate display sizes in real maps.
// Preview mode changes only draw dimensions in the observer; release mode
// checks the dimensions actually installed by the build.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const url=process.argv[2],preview=process.env.NPC_SCALE_PREVIEW==='1';
if(!/^https?:/.test(url||''))throw Error('Pass an HTTP export URL');
const out=path.resolve(process.env.NPC_SCALE_OUT||path.join(__dirname,'performance-v1','npc-scale'));
fs.mkdirSync(out,{recursive:true});
const report={url,preview,method:preview?'Sizing preview in real scenes: only collaborator draw dimensions are overridden; same PNGs, cells, foot anchor and scene renderer. Not installed release validation.':'Installed collaborator render dimensions in real scenes, with alpha measurements, foot anchors and simulation invariance. Scripted snapshots, not human campaign testing.',cases:[],errors:[]};
let browser;
function fixture(){
 let sizing=null,observed=[];
 const sheet=c3SheetSprite,draw=ctx.drawImage;
 c3SheetSprite=function(image,col,row,cols,rows,x,y,w,h){if(sizing&&image===C3.images.prebeta_collabs_move){w=sizing.w;h=sizing.h}return sheet.call(this,image,col,row,cols,rows,x,y,w,h)};
 ctx.drawImage=function(image,...args){if(image===C3.images.prebeta_collabs_move)observed.push({source:args.slice(0,4),destination:args.slice(4),smoothing:ctx.imageSmoothingEnabled});return draw.call(this,image,...args)};
 const snapshot=()=>JSON.stringify({flags:G.flags,c3:G.c3,x:G.x,y:G.y,hp:G.hp,blocked:[...current.blocked].sort(),npcs:current.npcs.map(n=>({id:n.id,x:n.x,y:n.y,say:String(n.say)})),events:current.events.map(e=>({id:e.id,x:e.x,y:e.y,run:String(e.run)}))});
 function bounds(image,sx,sy,sw,sh){const c=document.createElement('canvas');c.width=sw;c.height=sh;const q=c.getContext('2d',{willReadFrequently:true});q.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);const d=q.getImageData(0,0,sw,sh).data;let left=sw,top=sh,right=0,bottom=0;for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(d[(y*sw+x)*4+3]>=128){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1)}return{left,top,right,bottom,width:right-left,height:bottom-top}}
 async function prepare(spec){
  G=fresh();Object.assign(G.flags,{masks:true,bass:true,reveal:true,voicesKatana:true});Object.assign(G.c3,{started:true,metMaia:true,twoRoutesOpen:true});G.formation=['franco','ryuchi'];G.active='franco';G.knownMembers=['franco','ryuchi'];buildMaps();setArea(spec.area,2.5,2.5,false);
  await window.FinalAssetLoadingV1?.ready();C3.loadDeferredImages();await C3.images.prebeta_collabs_move.decode();await CenariosV2.ready();await EnvironmentDepthV1.ready();await WorldPolishV1.ready();
  for(const id of ['franco','ryuchi'])await ProtagonistArtV5.image(id+'_idle').decode();
  const n=current.npcs.find(n=>n.id===spec.id);if(!n)throw Error('Missing native collaborator '+spec.id);
  G.x=n.x-2.5;G.y=n.y+.1;G.dir=spec.direction;G.isRunning10=false;G.moveSpeed10=0;lastStep=10;trail=[];mode='walk';battle=bossActor=null;keys={};touchDir={};transitionAlpha=screenShake=0;resetMotion10();
  for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';
  NpcLifeV1.sync();const s=NpcLifeV1.state(n);s.dir=spec.direction;s.frame=0;s.moving=false;s.state='idle';s.age=.25;ProtagonistArtV5.reset();ProtagonistArtV5.clock=0;tick=4;cam.x=current.w*T<VW?(current.w*T-VW)/2:ClubStage.cameraX(CanalViolin.cameraX(clamp(n.x*T-VW/2,0,current.w*T-VW)));cam.y=current.h*T<VH?(current.h*T-VH)/2:ClubStage.cameraY(clamp(n.y*T-VH/2,0,current.h*T-VH));
  sizing=spec.preview?spec.size:null;observed=[];const before=snapshot();drawEnv();const after=snapshot();
  const row=NpcLifeV1.collaboratorRow(n),cell=C3.images.prebeta_collabs_move.naturalWidth/8,col=NpcLifeV1.directions.indexOf(spec.direction)*2;
  const call=observed.find(c=>c.source[0]===col*cell&&c.source[1]===row*cell);if(!call)throw Error('Native collaborator did not render');
  const alpha=bounds(C3.images.prebeta_collabs_move,col*cell,row*cell,cell,cell),heroRow=4+NpcLifeV1.directions.indexOf(spec.direction),heroes={};
  for(const id of ['franco','ryuchi']){const a=bounds(ProtagonistArtV5.image(id+'_idle'),0,heroRow*256,256,256);heroes[id]={alpha:a,visibleWidth:a.width*88/256,visibleHeight:a.height*88/256}}
  return{before,after,area:current.id,id:n.id,name:n.name,row,col,position:{x:n.x,y:n.y},footAnchor:{x:n.x*T-cam.x,y:n.y*T-cam.y},call,alpha,visible:{width:alpha.width*call.destination[2]/cell,height:alpha.height*call.destination[3]/cell},heroes,png:$('game').toDataURL('image/png')};
 }
 window.NpcScaleQA={prepare};
}
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});await page.goto(url,{waitUntil:'load',timeout:180000});await page.evaluate(fixture);report.source=await page.evaluate(()=>window.TORII_PLAYTEST_BUILD?.sourceSha256||null);if(process.env.EXPECTED_SOURCE_SHA)assert.equal(report.source,process.env.EXPECTED_SOURCE_SHA);
 const sizes=preview?[{w:80,h:70},{w:80,h:80}]:[{w:80,h:80}];
 for(const [area,id]of [['contratempo','c3_maia'],['sky_canal','c3_nara_canal'],['ciro_workshop','c3_ciro']])for(const direction of ['down','left','up','right'])for(const size of sizes){
  const spec={area,id,direction,size,preview};let r=await page.evaluate(s=>NpcScaleQA.prepare(s),spec);if(!report.cases.length){await page.waitForLoadState('networkidle');r=await page.evaluate(s=>NpcScaleQA.prepare(s),spec)}const png=r.png;delete r.png;assert.equal(r.before,r.after,'Render changed simulation or interactions');assert.equal(r.call.smoothing,false);assert.deepEqual(r.call.destination.slice(2),[size.w,size.h]);assert(Math.abs(r.call.destination[1]+r.call.destination[3]-r.footAnchor.y)<=.51,'Foot cell anchor moved');
  const name=id+'-'+direction+'-'+size.w+'x'+size.h;fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));report.cases.push({direction,size,...r});console.log('PASS '+name+' visible '+r.visible.width.toFixed(1)+'x'+r.visible.height.toFixed(1));
 }
 if(!preview){
  report.lift=await page.evaluate(async()=>{
   G=fresh();Object.assign(G.flags,{masks:true,bass:true,reveal:true,voicesKatana:true});Object.assign(G.c3,{started:true});G.formation=['franco','ryuchi'];G.active='franco';buildMaps();setArea('sky_lift',11.5,13.5,false);await window.FinalAssetLoadingV1?.ready();await CenariosV2.ready();await EnvironmentDepthV1.ready();
   for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';mode='walk';battle=bossActor=null;keys={};touchDir={};transitionAlpha=screenShake=0;lastStep=10;drawEnv();
   return{floorDecor:current.props.filter(p=>p.item==='platform_embark').length,receiver:current.props.filter(p=>p.type==='c3_wind_receiver').length,bassLock:current.props.filter(p=>p.type==='c3_bass_lock').length,controls:current.events.filter(e=>e.id==='c3_lift_control').length,gates:current.gates.map(g=>g.to),terminalDecor:areas.sky_terminal.props.filter(p=>p.item==='platform_embark').length,districtDecor:areas.distortion_district.props.filter(p=>p.item==='platform_embark').length,png:$('game').toDataURL('image/png')};
  });
  assert.equal(report.lift.floorDecor,0);assert.equal(report.lift.receiver,1);assert.equal(report.lift.bassLock,1);assert.equal(report.lift.controls,1);assert(report.lift.gates.includes('cloud_sea')&&report.lift.gates.includes('distortion_district'));assert.equal(report.lift.terminalDecor,1);assert.equal(report.lift.districtDecor,1);
  fs.writeFileSync(path.join(out,'sky_lift-cleared-floor.png'),Buffer.from(report.lift.png.split(',')[1],'base64'));delete report.lift.png;console.log('PASS sky_lift decorative floor removed; controls and other platforms retained');
 }
 assert.deepEqual(report.errors,[]);console.log('PASS '+report.cases.length+' collaborator scale cases');
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n')});
