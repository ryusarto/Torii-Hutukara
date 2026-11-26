'use strict';
// Compare no-op guards against the unconditional reference tile pass, using
// the same production painters. A trailing stroke exposes current-path changes.
// Current exports exercise the installed guard; older exports inject the source.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),url=process.argv[2];if(!/^https?:/.test(url||''))throw Error('Pass the current HTTP export or approved baseline URL');
const source=fs.readFileSync(path.join(root,'game/source/chapter-03/environment_depth_v1.js'),'utf8');
const candidate=source.slice(source.indexOf(' const cellInRect='),source.indexOf(' api.facade='));
const floorTypes=JSON.parse(source.match(/const floorTypes=new Set\((\[[^\n]+\])\);/)[1].replace(/'/g,'"'));
const out=path.resolve(process.env.DEPTH_PERF_OUT||path.join(root,'qa/performance-v1/depth-noop-equivalence.json'));
const report={method:'Actual HTTP runtime; exact RGBA, context and current path against the unconditional reference pass using production painters. Installed guard or source injection on older baseline. Readback backend pinned; not an FPS benchmark.',errors:[]};let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]});const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options)}});await page.goto(url,{waitUntil:'load',timeout:120000});
 report.details=await page.evaluate(async({candidate,floorTypes})=>{
  await CenariosV2.ready();G=fresh();buildMaps();ctx.canvas.width=ctx.canvas.height=160;
  const api=EnvironmentDepthV1,floors=new Set(floorTypes),installed=typeof api.floorAffects==='function',next=installed?api:Object.create(api);
  if(!installed)new Function('api','floorTypes',candidate)(next,floors);
  // Reference contract before the optimization: every supported non-void tile
  // gets a clipped state pass, whether or not its production painter draws.
  const oldTile=function(type,x,y,xx,yy){
   const p=this.enabled&&this.profile();if(!p||!current||type==='void'||type==='c3_sky')return;
   ctx.save();ctx.beginPath();ctx.rect(x,y,T,T);ctx.clip();
   try{const boundary=xx===0||yy===0||xx===current.w-1||yy===current.h-1;if(type==='wall092'||boundary){ctx.globalAlpha*=.24;this.wallTile(p,x,y,xx,yy)}else if(floors.has(type))this.floorTile(p,type,x,y,xx,yy)}finally{ctx.restore()}
  };
  const check=(v,label)=>{if(!v)throw Error(label)};
  const snapshot=()=>JSON.stringify({m:Array.from(ctx.getTransform().toFloat64Array()),alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation,filter:ctx.filter,smoothing:ctx.imageSmoothingEnabled,fill:ctx.fillStyle,stroke:ctx.strokeStyle,lineWidth:ctx.lineWidth,font:ctx.font});
  function capture(fn,variant=0){ctx.save();try{
   ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.clearRect(0,0,160,160);ctx.fillStyle='#32546f';ctx.fillRect(0,0,160,160);ctx.imageSmoothingEnabled=variant===0;ctx.font='17px monospace';ctx.fillStyle='#ab3e21';ctx.strokeStyle='#235abc';ctx.lineWidth=3;
   if(variant){ctx.translate(1.25,2.5);ctx.scale(1.2,.9);ctx.globalAlpha=.61;ctx.globalCompositeOperation='multiply';ctx.filter='brightness(.87)';ctx.beginPath();ctx.rect(35,35,66,61);ctx.clip()}
   ctx.beginPath();ctx.moveTo(30,28);ctx.lineTo(120,100);const before=snapshot();fn();check(snapshot()===before,'Tile leaked context state');
   ctx.strokeStyle='#f5e91b';ctx.lineWidth=1;ctx.stroke();
   return ctx.getImageData(24,24,112,112).data;
  }finally{ctx.restore()}}
  const equal=(a,b,label)=>{const different=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i]&&different.length<8)different.push([i,a[i],b[i]]);check(a.length===b.length&&!different.length,'Pixels/current path changed: '+label+' '+JSON.stringify(different))};
  let cellCases=0,contextCases=0;const profiles=[];
  for(const id of Object.keys(api.profiles)){
   G.area=id;current=areas[id];if(!current)throw Error('Missing profile area '+id);
   let cells=0;
   for(let yy=0;yy<current.h;yy++)for(let xx=0;xx<current.w;xx++){
    const type=current.tiles[yy][xx],args=[type,64,64,xx,yy];
    equal(capture(()=>oldTile.apply(api,args)),capture(()=>next.tile(...args)),id+'/'+xx+','+yy+'/'+type);cellCases++;cells++;
    if((xx+yy*current.w)%31===0||xx===0||yy===0||xx===current.w-1||yy===current.h-1){equal(capture(()=>oldTile.apply(api,args),1),capture(()=>next.tile(...args),1),id+'/transformed/'+xx+','+yy);contextCases++}
   }
   profiles.push({id,style:api.profile().style,cells});
  }
  // Cover material classes absent from a particular authored map and both
  // states of the factory's blocked center column.
  let boundaryCases=0;
  for(const id of Object.keys(api.profiles))for(const type of [...floorTypes,'wall092','void','c3_sky','grass'])for(const [xx,yy]of [[0,0],[1,1],[6,6],[8,19],[17,12],[22,13],[28,20]]){
   G.area=id;current=areas[id];const args=[type,64,64,xx,yy];equal(capture(()=>oldTile.apply(api,args),1),capture(()=>next.tile(...args),1),id+'/synthetic/'+type+'/'+xx+','+yy);boundaryCases++;
  }
  G.area='power_plant';current=areas.power_plant;const cell='17,12',was=current.blocked.has(cell);
  try{for(const blocked of [false,true]){if(blocked)current.blocked.add(cell);else current.blocked.delete(cell);const args=['c3_factory',64,64,17,12];equal(capture(()=>oldTile.apply(api,args)),capture(()=>next.tile(...args)),'factory/blocked='+blocked);boundaryCases++}}
  finally{if(was)current.blocked.add(cell);else current.blocked.delete(cell)}
  let ambientCases=0;
  for(const id of ['forest','distortion_district'])for(const enabled of [false,true]){G.area=id;current=areas[id];api.enabled=enabled;equal(capture(()=>oldTile.call(api,'grass',64,64,5,5)),capture(()=>next.tile('grass',64,64,5,5)),'ambient/'+id+'/'+enabled);ambientCases++}api.enabled=true;
  G.area='studio';current=areas.studio;api.enabled=false;equal(capture(()=>oldTile.call(api,'wood',64,64,8,6),1),capture(()=>next.tile('wood',64,64,8,6),1),'profile disabled');ambientCases++;api.enabled=true;
  current=null;equal(capture(()=>oldTile.call(api,'wood',64,64,8,6)),capture(()=>next.tile('wood',64,64,8,6)),'missing current area');ambientCases++;current=areas.studio;
  const profile=api.profiles.studio;
  try{api.profiles.studio={...profile,style:'future-unknown'};equal(capture(()=>oldTile.call(api,'wood',64,64,8,6)),capture(()=>next.tile('wood',64,64,8,6)),'unknown profile remains on original pass');ambientCases++}
  finally{api.profiles.studio=profile}
  G.area='studio';current=areas.studio;
  const a=capture(()=>oldTile.call(api,'wood',64,64,2,10)),bad=capture(()=>{});check(a.some((v,i)=>v!==bad[i]),'Positive control did not detect omitted rectangle path');
  const counts=fn=>{const row={save:0,restore:0,clip:0,beginPath:0,rect:0},old={};for(const k of Object.keys(row)){old[k]=ctx[k];ctx[k]=function(...args){row[k]++;return old[k].apply(this,args)}}try{fn();return row}finally{Object.assign(ctx,old)}};
  const frames=[];
  for(const spec of [{id:'studio',x:12,y:8},{id:'power_plant',x:25,y:13},{id:'contratempo',x:14,y:11}]){
   G.area=spec.id;current=areas[spec.id];const left=Math.max(0,Math.floor(clamp(spec.x*T-VW/2,0,Math.max(0,current.w*T-VW))/T)-1),top=Math.max(0,Math.floor(clamp(spec.y*T-VH/2,0,Math.max(0,current.h*T-VH))/T)-1);
   const draw=(target,tile)=>{for(let y=top;y<Math.min(current.h,top+Math.ceil(VH/T)+3);y++)for(let x=left;x<Math.min(current.w,left+36);x++)tile.call(target,current.tiles[y][x],64,64,x,y)};
   const before=counts(()=>draw(api,oldTile)),after=counts(()=>draw(next,next.tile));check(before.beginPath===after.beginPath&&before.rect===after.rect,'Path construction count changed in '+spec.id);check(after.clip<before.clip,'Empty clip passes not reduced in '+spec.id);frames.push({area:spec.id,before,after});
  }
  return{source:window.TORII_PLAYTEST_BUILD?.sourceSha256||null,guard:installed?'installed runtime':'candidate injected on baseline',profiles,cellCases,contextCases,boundaryCases,ambientCases,positivePathControl:true,frames};
 },{candidate,floorTypes});assert.deepEqual(report.errors,[]);console.log('PASS · '+JSON.stringify(report.details));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')});
