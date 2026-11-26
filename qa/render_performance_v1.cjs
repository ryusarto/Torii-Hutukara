'use strict';
// Pixel/context comparison against the three approved 1.25 reference methods.
// Current exports exercise installed methods; old baselines inject the source.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),url=process.argv[2];
if(!/^https?:/.test(url||''))throw Error('Pass a current HTTP export or approved baseline URL');
const source=fs.readFileSync(path.join(root,'game/source/chapter-03/cenarios_v2.js'),'utf8');
const method=(name,next)=>source.slice(source.indexOf('  '+name+'('),source.indexOf('  '+next+'('));
const methods=[method('available','sprite'),method('tileImage','material'),method('material','paver')].join('\n');
const moduleSource=fs.readFileSync(path.join(root,'game/source/chapter-03/render_performance_v1.js'),'utf8');
const out=path.resolve(process.env.RENDER_PERF_OUT||path.join(root,'qa/performance-v1/render-equivalence.json'));
const report={method:'Actual HTTP runtime versus independent 1.25 reference methods; installed optimization or source injection on older baseline. Exact RGBA/context comparison with readback backend pinned. Not physical-device FPS certification.',checks:[],errors:[]};let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]});const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options)}});
 await page.goto(url,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>typeof CenariosV2!=='undefined'&&typeof EnvironmentAtmosphereV1!=='undefined');
 const result=await page.evaluate(async({methods,moduleSource})=>{
  await CenariosV2.ready();await props10.decode();
  G=fresh();buildMaps();G.area='forest';current=areas.forest;cam.x=cam.y=0;mode='walk';tick=12;EnvironmentAtmosphereV1.clock=3;
  const check=(ok,label)=>{if(!ok)throw Error(label)};
  const installed=!!window.RenderPerformanceV1;
  const candidate=installed?{available:CenariosV2.available,tileImage:CenariosV2.tileImage,material:CenariosV2.material}:(0,eval)('({'+methods+'})');
  // Kept as a small independent reference: descriptor allocation and the
  // original unconditional canvas save/restore around exactly the same pixels.
  const original={
   available(item){const a=this.manifest.items[item],image=a&&this.image(a.sheet);return image?.complete&&image.naturalWidth?{a,image}:null},
   tileImage(item,x,y){const r=this.available(item);if(!r)return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(r.image,...r.a.content,Math.round(x),Math.round(y),T,T);ctx.restore();return true},
   material(item,x,y,xx,yy){const r=this.available(item);if(!r)return false;if(!this.textures[item]){const c=document.createElement('canvas');c.width=c.height=192;const q=c.getContext('2d');q.imageSmoothingEnabled=false;for(const [px,py,sx,sy]of [[0,0,1,1],[192,0,-1,1],[0,192,1,-1],[192,192,-1,-1]]){q.save();q.translate(px,py);q.scale(sx,sy);q.drawImage(r.image,...r.a.content,0,0,96,96);q.restore()}this.textures[item]=c}const sx=((xx%8)+8)%8*T,sy=((yy%8)+8)%8*T;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(this.textures[item],sx,sy,T,T,Math.round(x),Math.round(y),T,T);ctx.restore();return true}
  };
  const state=()=>JSON.stringify({alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation,smoothing:ctx.imageSmoothingEnabled,filter:ctx.filter,fill:ctx.fillStyle,stroke:ctx.strokeStyle,font:ctx.font,width:ctx.lineWidth,m:Array.from(ctx.getTransform().toFloat64Array())});
  function capture(fn,variant=0){
   ctx.save();try{
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowBlur=ctx.shadowOffsetX=ctx.shadowOffsetY=0;
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.fillStyle='#365a72';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.imageSmoothingEnabled=variant%2===0;
    if(variant>=2){ctx.translate(19.25,14.5);ctx.scale(1.3,.8);ctx.globalAlpha=.63;ctx.globalCompositeOperation='multiply';ctx.filter='brightness(.83)';ctx.beginPath();ctx.rect(3,4,124,111);ctx.clip();ctx.fillStyle='#ea652a';ctx.strokeStyle='#ffeedd';ctx.font='19px monospace';ctx.lineWidth=3}
    const before=state(),answer=fn(),after=state();check(before===after,'Renderer leaked canvas state');
    return{data:ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data,answer};
   }finally{ctx.restore()}
  }
  const equal=(a,b,label)=>{check(a.answer===b.answer,label+' changed result');check(a.data.length===b.data.length&&a.data.every((v,i)=>v===b.data[i]),label+' changed pixels')};
  function use(set){Object.assign(CenariosV2,set)}
  const materialNames=['asfalto_seco','asfalto_molhado','calcada_pedra','metal_industrial','metal_terminal','madeira_oficina','madeira_clube','tabuas_ponte','pedra_santuario','basalto_nucleo','agua_canal','paineis_parede','ceu_nuvens_fundo','abismo_fundo','cloud_top_a'].filter(n=>CenariosV2.manifest.items[n]);
  let materialCases=0,tileCases=0;
  for(const item of materialNames)for(let variant=0;variant<4;variant++){
   use(original);const a=capture(()=>CenariosV2.material(item,37.4,46.7,-3,11),variant);
   use(candidate);const b=capture(()=>CenariosV2.material(item,37.4,46.7,-3,11),variant);equal(a,b,item+'/material/'+variant);materialCases++;
   use(original);const c=capture(()=>CenariosV2.tileImage(item,37.4,46.7),variant);
   use(candidate);const d=capture(()=>CenariosV2.tileImage(item,37.4,46.7),variant);equal(c,d,item+'/tileImage/'+variant);tileCases++;
  }
  use(candidate);const sample=materialNames[0],first=CenariosV2.available(sample);check(first===CenariosV2.available(sample),'Resource descriptor was reallocated');
  const sheet=first.a.sheet,old=CenariosV2.images[sheet];
  try{CenariosV2.images[sheet]={complete:false,naturalWidth:0};check(CenariosV2.available(sample)===null,'Unloaded replacement remained available')}
  finally{CenariosV2.images[sheet]=old}
  check(CenariosV2.available(sample).image===old,'Restored atlas was not selected');
  if(!window.RenderPerformanceV1)(0,eval)(moduleSource);
  const tree=drawTree,priorTree=(...args)=>{const enabled=RenderPerformanceV1.enabled;RenderPerformanceV1.enabled=false;try{return tree(...args)}finally{RenderPerformanceV1.enabled=enabled}},optimizedTree=(...args)=>{const enabled=RenderPerformanceV1.enabled;RenderPerformanceV1.enabled=true;try{return tree(...args)}finally{RenderPerformanceV1.enabled=enabled}};
  let treeCases=0,visibleTreeCases=0;
  const points=[[-170,120],[-112,120],[-57,120],[-20,120],[0,120],[VW+20,120],[VW+57,120],[VW+113,120],[150,-18],[150,-8],[150,0],[150,VH+120],[150,VH+245],[150,150]];
  for(const large of[false,true])for(const [x,y]of points)for(const variant of[0,2]){
   const a=capture(()=>priorTree(x,y,large,.7),variant),b=capture(()=>optimizedTree(x,y,large,.7),variant);equal(a,b,'tree/'+[large,x,y,variant]);treeCases++;if(x===150&&y===150)visibleTreeCases++;
  }
  check(RenderPerformanceV1.skipped>0,'No offscreen raster work was actually skipped');
  const countCalls=fn=>{const counts={save:0,restore:0},before={save:ctx.save,restore:ctx.restore};for(const k of Object.keys(counts))ctx[k]=function(...a){counts[k]++;return before[k].apply(this,a)};try{fn();return counts}finally{Object.assign(ctx,before)}};
  use(original);const before=countCalls(()=>{for(let i=0;i<800;i++)CenariosV2.material(sample,10,10,i,7)});
  use(candidate);const after=countCalls(()=>{for(let i=0;i<800;i++)CenariosV2.material(sample,10,10,i,7)});
  check(before.save===800&&before.restore===800&&after.save===0&&after.restore===0,'Material state-stack work not eliminated');
  return{source:window.TORII_PLAYTEST_BUILD?.sourceSha256||null,guard:installed?'installed runtime':'candidate injected on baseline',materialCases,tileCases,treeCases,visibleTreeCases,resourceReplacement:true,treeStats:{visited:RenderPerformanceV1.visited,skipped:RenderPerformanceV1.skipped},stateStackCalls:{before,after}};
 },{methods,moduleSource});
 report.checks.push({name:'Candidate renderer preserves exact pixels, context and resources while skipping redundant work',passed:true,details:result});assert.deepEqual(report.errors,[]);console.log('PASS · '+JSON.stringify(result));
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')});
