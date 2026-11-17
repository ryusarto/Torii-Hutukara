/* Isolated visual inventory. Overviews use the game's actual tile/prop renderers;
 * viewport shots use drawEnv at the production 768x432 camera. No player save.
 */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),stage=process.argv[2]||'antes';
const output=path.join(root,'qa/cenarios-v2',stage);fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await (process.env.CHROME_PATH?chromium.launch({executablePath:process.env.CHROME_PATH,headless:true}):chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9238')),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(process.env.TORII_URL||'http://127.0.0.1:8767/',{waitUntil:'load',timeout:120000});
 await page.evaluate(()=>{C3.loadDeferredImages();C3.start(true);for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();mode='walk';$('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('toast').classList.add('hidden');G.formation=['franco','ryuchi'];bossActor=null;keys={};});
 await page.waitForFunction(()=>Object.values(C3.images).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:120000});
 if(await page.evaluate(()=>typeof CenariosV2!=='undefined'))await page.evaluate(()=>CenariosV2.ready());
 const inventory=await page.evaluate(()=>Object.values(areas).map(a=>({id:a.id,w:a.w,h:a.h,tiles:a.tiles,blocked:[...a.blocked],props:a.props,gates:a.gates.map(g=>({...g,need:undefined})),events:a.events.map(e=>({id:e.id,x:e.x,y:e.y,label:e.label})),npcs:a.npcs.map(n=>({id:n.id,x:n.x,y:n.y,name:n.name,spriteKey:n.spriteKey}))})));
 fs.writeFileSync(path.join(output,'MAPAS.json'),JSON.stringify(inventory,null,2));
 const ids=inventory.map(a=>a.id),captures=[];
 for(const id of ids){
   const size=await page.evaluate(id=>{
     current=areas[id];G.area=id;G.x=current.w/2;G.y=current.h/2;mode='walk';bossActor=null;cam.x=cam.y=0;tick=4;screenShake=0;transitionAlpha=0;
     VW=current.w*T;VH=current.h*T;cv.width=VW;cv.height=VH;
     ctx.imageSmoothingEnabled=false;ctx.fillStyle='#171321';ctx.fillRect(0,0,VW,VH);
     for(let y=0;y<current.h;y++)for(let x=0;x<current.w;x++)drawTile(current.tiles[y][x],x*T,y*T,x,y);
     const props=[...current.props].sort((a,b)=>a.y-b.y);for(const p of props)drawProp(p,0,0);
     for(const n of current.npcs)drawDetailedNPC(n,Math.round(n.x*T),Math.round(n.y*T));
     return [VW,VH];
   },id);
   fs.writeFileSync(path.join(output,id+'-mapa.png'),Buffer.from((await page.evaluate(()=>cv.toDataURL('image/png'))).split(',')[1],'base64'));
   await page.evaluate(id=>{current=areas[id];VW=768;VH=432;cv.width=VW;cv.height=VH;G.x=current.w/2;G.y=current.h/2;{const safe=safeSpawn121(G.x,G.y);if(safe){G.x=safe.x;G.y=safe.y}trail=[];}cam.x=Math.max(0,G.x*T-VW/2);cam.y=Math.max(0,G.y*T-VH/2);transitionAlpha=0;drawEnv();},id);
   fs.writeFileSync(path.join(output,id+'-camera.png'),Buffer.from((await page.evaluate(()=>cv.toDataURL('image/png'))).split(',')[1],'base64'));captures.push({id,size});
 }
 for(const [name,id,x,y] of [['distrito-entradas','distortion_district',20,17],['distrito-noroeste','distortion_district',11,10],['nuvens-percurso','cloud_sea',20,23],['ruinas-pilares','ruins',24,17]]){
   await page.evaluate(({id,x,y})=>{current=areas[id];G.area=id;G.x=x;G.y=y;{const safe=safeSpawn121(G.x,G.y);if(safe){G.x=safe.x;G.y=safe.y}trail=[];}cam.x=Math.max(0,x*T-VW/2);cam.y=Math.max(0,y*T-VH/2);transitionAlpha=0;drawEnv();},{id,x,y});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from((await page.evaluate(()=>cv.toDataURL('image/png'))).split(',')[1],'base64'));
 }
 fs.writeFileSync(path.join(output,'CAPTURAS.json'),JSON.stringify({stage,renderer:'production tile/prop renderers; full map overview and actual drawEnv viewport',captures,browserErrors:errors},null,2));
 await context.close();await browser.close();console.log(JSON.stringify({stage,areas:ids.length,captures:ids.length*2+4,errors}));
})().catch(e=>{console.error(e);process.exitCode=1});
