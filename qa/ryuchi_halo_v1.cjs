/* Actual decoded atlas and renderer, preserving native alpha/opaque art. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),out=path.join(root,'qa',v.versao);fs.mkdirSync(out,{recursive:true});
const input=process.argv[2]||pathToFileURL(path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html')).href;
const baseline=process.argv.includes('--baseline');
const report={baseline,method:'Actual RunStrideV1 decode and drawActor output in isolated Chromium. The original loaded image is compared numerically; no source image edited. No physical device/human playtest.',checks:[],errors:[]};let browser;
function check(name,details,passed=true){assert(passed,name+' '+JSON.stringify(details));report.checks.push({name,passed:true,details});console.log('OK · '+name)}
(async()=>{browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]})});await page.goto(input,{waitUntil:'load',timeout:120000});await page.evaluate(async()=>{const NativeImage=window.Image;window.Image=function(...args){const image=new NativeImage(...args);window.__ryuchiOriginalImage=image;return image};window.Image.prototype=NativeImage.prototype;let record;try{record=RunStrideV1.image('ryuchi')}finally{window.Image=NativeImage}await record.ready;if(!window.__ryuchiOriginalImage)throw Error('Expected cold Ryuchi decode for halo comparison')});
const audit=await page.evaluate(async()=>{
 const image=window.__ryuchiOriginalImage;await image.decode();const fixed=RunStrideV1.image('ryuchi').bitmap,original=document.createElement('canvas');original.width=fixed.width;original.height=fixed.height;const q=original.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(image,0,0,original.width,original.height);
 window.__ryuchiBefore=original;window.__ryuchiFixed=fixed;
 const a=q.getImageData(0,0,original.width,original.height).data,b=fixed.getContext('2d').getImageData(0,0,fixed.width,fixed.height).data,w=fixed.width,h=fixed.height,c=RunStrideV1.image('ryuchi').cell;
 let alpha=0,masked=0,opaque=0,inside=0,changed=0,beforeBright=0,afterBright=0;
 const rows=Array.from({length:8},()=>({beforeBright:0,afterBright:0,changed:0}));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,al=a[i+3],row=Math.floor(y/c),diff=a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2];if(al!==b[i+3])alpha++;if(row>=4&&diff)masked++;if(al===255&&diff)opaque++;if(diff){changed++;rows[row].changed++}if(!al)continue;
  let edge=false;for(let yy=Math.max(0,y-1);yy<Math.min(h,y+2)&&!edge;yy++)for(let xx=Math.max(0,x-1);xx<Math.min(w,x+2);xx++)if(!a[(yy*w+xx)*4+3]){edge=true;break}
  const bright=data=>Math.min(data[i],data[i+1],data[i+2])>125&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<=40&&al<230;
  if(edge&&row<4){if(bright(a)){beforeBright++;rows[row].beforeBright++}if(bright(b)){afterBright++;rows[row].afterBright++}}
  if(!edge&&al===255&&diff)inside++;
 }
 return{width:w,height:h,cell:c,alphaChanges:alpha,maskedChanges:masked,opaqueChanges:opaque,interiorOpaqueChanges:inside,changed,beforeBright,afterBright,rows,corrected:RunStrideV1.image('ryuchi').edgeMattePixels};
});
check('Decoded atlas keeps dimensions, silhouette alpha and opaque details',audit,audit.width===1408&&audit.height===704&&audit.cell===88&&audit.alphaChanges===0&&audit.opaqueChanges===0&&audit.interiorOpaqueChanges===0);
check('All masked rows remain byte-identical',audit.maskedChanges,audit.maskedChanges===0);
if(baseline)check('Baseline reproduces the unmasked pale fringe',audit,audit.beforeBright>200&&audit.afterBright===audit.beforeBright);else check('Unmasked white fringe is substantially reduced in every direction',audit.rows.slice(0,4),audit.beforeBright>200&&audit.afterBright<audit.beforeBright*.3&&audit.rows.slice(0,4).every(r=>r.afterBright<r.beforeBright*.5));
// Compare the two decoded sheets against both background polarities. These
// canvases display exact source pixels; no filtering/repainting is added to art.
await page.evaluate(()=>{const old=document.getElementById('haloCompareV1');old?.remove();const wrap=document.createElement('section');wrap.id='haloCompareV1';wrap.style.cssText='position:fixed;inset:0;z-index:999999;background:#15141f;padding:20px;overflow:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;color:#efdbad;font:14px monospace';for(const bg of ['#10121d','#e2d3b5'])for(const [label,sheet]of [['Antes: matte claro',__ryuchiBefore],['Depois: contorno nativo',__ryuchiFixed]]){const item=document.createElement('div');item.textContent=label+' · '+bg;const c=document.createElement('canvas');c.width=480;c.height=360;c.style.cssText='display:block;max-width:100%;image-rendering:pixelated';const q=c.getContext('2d');q.imageSmoothingEnabled=false;q.fillStyle=bg;q.fillRect(0,0,c.width,c.height);for(let row=0;row<4;row++)for(let f=0;f<4;f++)q.drawImage(sheet,f*4*88,row*88,88,88,f*120+15,row*88,88,88);item.append(c);wrap.append(item)}document.body.append(wrap)});await page.screenshot({path:path.join(out,'ryuchi_halo_comparativo.png')});await page.evaluate(()=>$('haloCompareV1').remove());
await page.evaluate(()=>{G=fresh();G.flags.bass=true;G.active='ryuchi';G.formation=['ryuchi','franco'];G.levels.ryuchi=5;G.ryuchiStyle='durag';current=mk('forest',80,80,'grass');G.area='forest';G.x=G.y=30.5;mode='walk';battle=null;bossActor=null;trail=[];keys={};touchDir={};resetMotion10();Input121.focused=true;Input121.game=G;Input121.lastArea=G.area;$('start').classList.add('hidden');$('dialogue').classList.add('hidden');$('overlay').classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';transitionAlpha=0});
const actual=await page.evaluate(()=>{
 const sheet=RunStrideV1.image('ryuchi').bitmap,draw=ctx.drawImage.bind(ctx);let record=[];
 ctx.drawImage=function(image,...args){if(image===sheet)record.push(args.slice(0,4));return draw(image,...args)};
 const result=[];
 for(const masked of [false,true])for(const [dir,key,row]of [['down','s',0],['left','a',1],['up','w',2],['right','d',3]]){G.flags.masks=masked;G.x=G.y=30.5;keys={Shift:true,[key]:true};resetMotion10();record=[];for(let i=0;i<120;i++){tick+=1/60;update(1/60);drawActor({style:'ryuchi',dir:G.dir},Math.round(G.x*T-cam.x),Math.round(G.y*T-cam.y),true)}const frames=[...new Set(record.map(r=>r[0]/88))];result.push({masked,dir,frames,rows:[...new Set(record.map(r=>r[1]/88))],distance:Math.hypot(G.x-30.5,G.y-30.5)})}
 ctx.drawImage=draw;keys={};return result;
});
for(const row of actual)check('Real Ryuchi run remains animated · '+row.dir+' · '+(row.masked?'masked':'unmasked'),row,row.frames.length===16&&row.rows.length===1&&row.rows[0]===['down','left','up','right'].indexOf(row.dir)+(row.masked?4:0)&&row.distance>10);
await page.evaluate(()=>{G.flags.masks=false;G.x=G.y=30.5;cam.x=G.x*T-VW/2;cam.y=G.y*T-VH/2;keys={Shift:true,d:true};for(let i=0;i<10;i++){tick+=1/60;update(1/60)}drawEnv();ToriiUI7.refresh()});await page.screenshot({path:path.join(out,'ryuchi_corrida_sem_halo.png')});
check('No runtime errors',report.errors,report.errors.length===0);
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,baseline?'RYUCHI_HALO_BEFORE.json':'RYUCHI_HALO_BROWSER.json'),JSON.stringify(report,null,2)+'\n');await browser?.close()});
