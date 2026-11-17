/* Isolated built-map review. Requires playwright-core and local Chrome.
 * PLAYWRIGHT_CORE=/path/to/playwright-core node qa/npcs/map_review.cjs
 * CHROME_PATH optionally overrides the Chrome executable. No user saves. */
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=process.argv[2]||path.resolve(__dirname,'../..'),out=path.join(root,'qa/npcs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1100,height:800}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await page.goto(pathToFileURL(path.join(root,'game/builds/beta-1.1.0/TORII_HUTUKARA_BETA_1_1_0.html')).href,{waitUntil:'load',timeout:120000});
 await page.evaluate(async()=>{await Promise.all(Object.values(C3.images).filter(im=>im.src).map(im=>im.decode().catch(()=>{})));G=fresh();buildMaps();mode='walk';});
 const cases=[];
 for(const [id,area] of [['bento','bento_shop'],['nilo','voices']]){
  const views=[];
  for(const [dir,dx,dy]of [['down',0,2],['left',-2,0],['up',0,-2],['right',2,0]]){
   const v=await page.evaluate(({id,area,dir,dx,dy})=>{
    current=areas[area];G.area=area;const n=current.npcs.find(n=>n.id===id);if(!n)throw Error('NPC missing '+id);
    const before=JSON.stringify(n);G.x=n.x+dx;G.y=n.y+dy;G.dir=dir;G.guidance=false;bossActor=null;battle=null;tick=1;
    cam.x=current.w*T<VW?(current.w*T-VW)/2:clamp(G.x*T-VW/2,0,current.w*T-VW);cam.y=current.h*T<VH?(current.h*T-VH)/2:clamp(G.y*T-VH/2,0,current.h*T-VH);
    drawEnv();const image=cv.toDataURL('image/png');
    return {id,area,dir,pose:c3NpcPose(n).dir,unchanged:before===JSON.stringify(n),image};
   },{id,area,dir,dx,dy});assert.equal(v.pose,dir);assert(v.unchanged);views.push(v.image);delete v.image;cases.push(v);
  }
  await page.evaluate(async({views,id})=>{let c=document.getElementById('qa-contact');if(c)c.remove();c=document.createElement('canvas');c.id='qa-contact';c.width=1536;c.height=912;c.style.cssText='position:fixed;z-index:999999;top:0;left:0;width:1536px;height:912px';document.body.append(c);const q=c.getContext('2d');q.fillStyle='#171522';q.fillRect(0,0,c.width,c.height);for(let i=0;i<views.length;i++){const im=new Image();im.src=views[i];await im.decode();q.drawImage(im,(i%2)*768,Math.floor(i/2)*456+24);q.fillStyle='#fff';q.font='18px monospace';q.fillText(id+' · '+['down','left','up','right'][i],(i%2)*768+12,Math.floor(i/2)*456+19);}}, {views,id});
  await page.locator('#qa-contact').screenshot({path:path.join(out,id.toUpperCase()+'_MAPAS.png')});await page.locator('#qa-contact').evaluate(el=>el.remove());
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'MAP_RESULTS.json'),JSON.stringify({cases,browserErrors:errors,method:'Chrome headless isolated context; actual built maps and renderer; no campaign playthrough'},null,2)+'\n');
 console.log('PASS: 8 real map views, NPC state unchanged, zero runtime errors.');await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
