/* Franco's actual rendered frames under delayed image delivery and real input.
 * Network delays are controlled fixtures; no artwork, physics or player save is changed.
 * Usage: PLAYWRIGHT_CORE=... CHROME_PATH=... node qa/franco_locomotion_regression.cjs URL
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),out=path.join(root,'qa',version.versao),url=process.argv[2]||'http://127.0.0.1:8877/';
const report={version:version.numero,checks:[],errors:[],method:'Chromium real keyboard + full runtime update/drawActor; requests for locomotion media are held then released. Each sample measures displacement, drawImage source cells and hashes of rendered actor pixels. Controlled map fixtures; not human fluency or physical hardware.'};let browser,releasePending=()=>{};
function check(name,details,pass=true){assert(pass,name+' '+JSON.stringify(details));report.checks.push({name,passed:true,details});console.log('OK · '+name)}
(async()=>{
 fs.mkdirSync(out,{recursive:true});browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});await page.goto(url,{waitUntil:'load',timeout:120000});
 report.build=await page.evaluate(()=>window.TORII_PLAYTEST_BUILD||null);
 const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/protagonistas/v8-corrida/atlas/franco_run.png'))).digest('hex');
 const optimizer=JSON.parse(fs.readFileSync(path.join(root,'production/playtest-dist/media-optimization.json'))),stride=optimizer['media/'+hash+'.png']?.file||'media/'+hash+'.png';
 const sources=await page.evaluate(()=>({walk:ProtagonistArtV5.assets.franco_walk,run:ProtagonistArtV5.assets.franco_run}));sources.stride=stride;
 const gates={},release={};for(const kind of Object.keys(sources))gates[kind]=new Promise(r=>release[kind]=r);releasePending=()=>Object.values(release).forEach(f=>f());
 await page.route('**/media/**',async route=>{const kind=Object.keys(sources).find(k=>route.request().url().endsWith(sources[k]));if(kind)await gates[kind];await route.continue()});
 await page.evaluate(async()=>{
  G=fresh();G.active='franco';G.formation=['franco','ryuchi'];G.flags.masks=false;G.flags.bass=true;G.levels.franco=G.levels.ryuchi=5;G.hp.franco=G.hp.ryuchi=G.maxhp.franco=G.maxhp.ryuchi=100;buildMaps();
  current=mk('forest',100,100,'grass');areas.forest=current;G.area='forest';G.x=G.y=30.5;mode='walk';battle=bossActor=null;keys={};touchDir={};resetMotion10();Input121.game=G;Input121.lastArea=G.area;Input121.focused=true;C3.pad.pads=[];
  for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';$('playtestEntry')?.remove();
  const im=ProtagonistArtV5.image('franco_idle');if(!im.complete)await new Promise(r=>{im.onload=r;im.onerror=r});
  window.__francoSample=function(count=120){
   const poses=new Set(),pixels=new Set(),original=ctx.drawImage,body=G,rec=RunStrideV1.image('franco');let distance=0;
   ctx.drawImage=function(im,...a){const key=im===rec.bitmap?'stride':Object.entries(ProtagonistArtV5.images).find(([,v])=>im===v)?.[0]||Object.entries(animate10).find(([,v])=>im===v)?.[0]||'legacy';poses.add(key+'/'+a[0]/a[2]+'/'+a[1]/a[3]);return original.call(this,im,...a)};
   try{for(let i=0;i<count;i++){
    const x=body.x,y=body.y;tick+=1/60;update(1/60);distance+=Math.hypot(body.x-x,body.y-y);cam.x=body.x*T-VW/2;cam.y=body.y*T-VH/2;
    ctx.clearRect(0,0,VW,VH);drawActor({style:body.active,dir:body.dir},VW/2,VH/2,true);
    const data=ctx.getImageData(VW/2-44,VH/2-77,88,88).data;let h=2166136261;for(const byte of data)h=Math.imul(h^byte,16777619);pixels.add(h>>>0);
   }}finally{ctx.drawImage=original}
   return{distance,poses:[...poses],pixelFrames:pixels.size};
  };
 });
 await page.keyboard.down('d');let sample=await page.evaluate(()=>__francoSample());check('Slow first walk never slides as idle/0',sample,sample.distance>4&&sample.pixelFrames>=2&&(!sample.poses.length||!sample.poses.every(p=>p.startsWith('franco_idle/0/'))));await page.keyboard.up('d');
 await page.keyboard.down('Shift');await page.keyboard.down('d');sample=await page.evaluate(()=>__francoSample());check('Slow first run remains animated while both run atlases load',sample,sample.distance>8&&sample.pixelFrames>=2);await page.keyboard.up('d');await page.keyboard.up('Shift');
 release.walk();await page.waitForFunction(()=>ProtagonistArtV5.images.franco_walk?.complete&&ProtagonistArtV5.images.franco_walk.naturalWidth>0,null,{polling:50,timeout:15000});
 await page.keyboard.down('Shift');await page.keyboard.down('s');sample=await page.evaluate(()=>__francoSample());check('A decoded walk animates while the target run is pending',sample,sample.distance>8&&sample.pixelFrames>=8&&sample.poses.some(p=>p.startsWith('franco_walk/')));await page.keyboard.up('s');await page.keyboard.up('Shift');
 release.run();release.stride();await page.evaluate(()=>RunStrideV1.image('franco').ready);
 for(const masked of [false,true])for(const run of [false,true])for(const [dir,key,row]of [['down','s',0],['left','a',1],['up','w',2],['right','d',3]]){
  await page.evaluate(masked=>{G.flags.masks=masked;G.x=G.y=40.5;keys={};resetMotion10();ProtagonistArtV5.players[0]=null},masked);if(run)await page.keyboard.down('Shift');await page.keyboard.down(key);sample=await page.evaluate(()=>__francoSample());await page.keyboard.up(key);if(run)await page.keyboard.up('Shift');
  check((run?'Run':'Walk')+' renders native changing frames · '+dir+' · '+(masked?'masked':'unmasked'),sample,sample.distance>4&&sample.pixelFrames>=12&&sample.poses.every(p=>p.startsWith(run?'stride/':'franco_walk/'))&&sample.poses.every(p=>Number(p.split('/')[2])===row+(masked?4:0)));
 }
 await page.keyboard.down('Shift');await page.keyboard.down('d');await page.evaluate(()=>__francoSample(20));await page.evaluate(()=>openSystem());sample=await page.evaluate(()=>__francoSample(50));check('Pause freezes the displayed run without moving its body',sample,sample.distance===0&&sample.pixelFrames===1);await page.locator('#resume10').click();await page.keyboard.up('d');await page.keyboard.up('Shift');await page.keyboard.down('Shift');await page.keyboard.down('d');sample=await page.evaluate(()=>__francoSample(90));check('Resume returns to running frames instead of a stale still pose',sample,sample.distance>6&&sample.pixelFrames>=12);await page.keyboard.up('d');await page.keyboard.up('Shift');
 await page.evaluate(()=>{G.active='ryuchi';update(1/60);G.active='franco';update(1/60)});await page.keyboard.down('Shift');await page.keyboard.down('w');sample=await page.evaluate(()=>__francoSample(90));check('Returning to the principal Franco restores his own locomotion',sample,sample.distance>6&&sample.pixelFrames>=12);await page.keyboard.up('w');await page.keyboard.up('Shift');
 await page.keyboard.down('Shift');await page.keyboard.down('d');await page.keyboard.press('j');const action=await page.evaluate(()=>ProtagonistArtV5.players[0]?.state);sample=await page.evaluate(()=>__francoSample(120));check('Accepted attack keeps its action and then returns to running', {action,...sample},/attack_/.test(action)&&sample.poses.some(p=>p.startsWith('stride/'))&&sample.pixelFrames>=12);await page.keyboard.up('d');await page.keyboard.up('Shift');
 await page.evaluate(()=>{mode='walk';battle=null;current.enemies=[];G.x=G.y=40.5;resetMotion10();const wall=Math.floor(G.x)+1;for(let y=0;y<current.h;y++)current.blocked.add(wall+','+y)});await page.keyboard.down('Shift');await page.keyboard.down('d');await page.evaluate(()=>__francoSample(90));sample=await page.evaluate(()=>__francoSample(60));check('Holding against a wall does not run in place',sample,sample.distance===0&&!sample.poses.some(p=>p.startsWith('stride/')));await page.keyboard.up('d');await page.keyboard.up('Shift');
 await page.evaluate(()=>{current.blocked.clear();G.x=G.y=40.5;mode='walk';keys={};transitionAlpha=0});await page.keyboard.down('Shift');await page.keyboard.down('d');await page.evaluate(()=>{__francoSample(20);drawEnv()});await page.screenshot({path:path.join(out,'franco_corrida.png')});await page.keyboard.up('d');await page.keyboard.up('Shift');check('No runtime errors',report.errors,report.errors.length===0);
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{releasePending();await browser?.close();fs.writeFileSync(path.join(out,'FRANCO_LOCOMOTION_BROWSER.json'),JSON.stringify(report,null,2)+'\n')});
