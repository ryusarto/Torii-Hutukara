/* Art integration regression. Uses an isolated context, never a player's save.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CDP_URL=http://127.0.0.1:9237
 * node qa/ninja_archer_art.cjs [hosted build URL]
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const output=path.join(root,'qa',version.versao);fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9237');
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.__pads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>window.__pads});window.__pad=i=>({index:i,id:'DualSense isolated QA '+i,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))})});
 await page.goto(process.argv[2]||'http://127.0.0.1:8767/',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>typeof NinjaArcherArtV1!=='undefined');
 async function check(name,fn){const detail=await fn();checks.push({name,passed:true,detail});console.log('OK · '+name)}
 async function arena(p1='katana',p2='alt') {await page.evaluate(({p1,p2})=>{
   G=fresh();G.active=p1;G.formation=[p1,p2];G.flags.voicesAlt=G.flags.voicesKatana=G.flags.bass=true;
   for(const id of [p1,p2]){G.hp[id]=G.maxhp[id]=100;}
   current=mk('forest',40,30,'grass');G.area='forest';G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
   mode='walk';battle=null;bossActor=null;keys={};Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,dashCD:0,invuln:0});
   resetMotion10();Input121.game=G;Input121.lastArea=G.area;C3.pad.previous.clear();window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;
   C3.coop.member=p2;C3.syncCoop(true);C3.coop.invuln=0;NinjaArcherArtV1.reset();
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('toast').classList.add('hidden');cam.x=cam.y=0;
 },{p1,p2});}
 await check('Locked variant sheets do not load on the title screen',async()=>{
   const count=await page.evaluate(()=>Object.keys(NinjaArcherArtV1.images).length);assert.equal(count,0);return count;
 });
 await check('96 directional sequences decode with alpha, common cell and exact closing frame',async()=>{
   const result=await page.evaluate(async()=>{
     const art=NinjaArcherArtV1,canvas=document.createElement('canvas');canvas.width=canvas.height=256;const q=canvas.getContext('2d',{willReadFrequently:true});let count=0;
     for(const animation of art.manifest.animations){
       const image=new Image();image.src=art.assets[animation.hero+'_'+animation.state];await image.decode();
       if(image.naturalWidth!==2304||image.naturalHeight!==1024)throw Error('Wrong atlas dimensions');
       let first,last;
       for(let frame=0;frame<9;frame++){
         q.clearRect(0,0,256,256);q.drawImage(image,frame*256,animation.row*256,256,256,0,0,256,256);
         const data=q.getImageData(0,0,256,256).data;
         if(data[3]||data[(256*256-1)*4+3])throw Error('Opaque cell corner');
         if(!data.some((n,i)=>i%4===3&&n>0))throw Error('Empty frame');
         if(frame===(animation.state==='defeat'?7:0))first=new Uint8ClampedArray(data);
         if(frame===8)last=data;
       }
       if(!first.every((n,i)=>n===last[i]))throw Error('Open cycle: '+animation.hero+'/'+animation.state);
       count++;
     }return count;
   });assert.equal(result,96);return {sequences:result,frames:864};
 });
 await check('P1 and P2 attacks and rolls keep their own hero and direction',async()=>{
   await arena();const result=await page.evaluate(()=>{
     attackAction();C3.coop.cool=0;C3.coopAttack(window.__pads[1]);
     const attacks=NinjaArcherArtV1.players.map(p=>({hero:p.hero,state:p.state}));
     act.dashCD=0;startRoll121();C3.coop.dashCD=0;C3.coopDodge(window.__pads[1]);
     const a=NinjaArcherArtV1.pose({style:'katana',dir:'right'},0,true),b=NinjaArcherArtV1.pose({style:'alt',dir:'down'},1,true);
     return {attacks,a,b,players:[G.active,C3.coopMember()]};
   });assert.deepEqual(result.attacks,[{hero:'katana',state:'attack_1'},{hero:'alt',state:'attack_1'}]);
   assert.equal(result.a.state,'roll');assert.equal(result.b.state,'roll');assert.equal(result.a.hero,'katana');assert.equal(result.b.hero,'alt');return result;
 });
 await check('Accepted techniques and specials animate; rejected actions cannot restart animation',async()=>{
   const result=[];
   for(const hero of ['alt','katana'])for(const [fn,key,state]of [['skillAction','skill','skill'],['advancedSkill','skillX','advanced'],['duoAction','duo','signature']]){
     await arena(hero,hero==='alt'?'katana':'alt');
     const v=await page.evaluate(({fn,state})=>{G.resonance=100;window[fn]();const record=NinjaArcherArtV1.players[0];if(!record)throw Error('Missing action record');record.elapsed=.05;window[fn]();return {hero:record.hero,state:record.state,elapsed:record.elapsed,same:record===NinjaArcherArtV1.players[0]};},{fn,state});
     assert.equal(v.hero,hero);assert.equal(v.state,state);assert.equal(v.same,true);assert.equal(v.elapsed,.05);result.push(v);
   }return result;
 });
 await check('Switches, loads and area boundaries discard stale animation ownership',async()=>{
   await arena();const v=await page.evaluate(()=>{
     attackAction();G.active='alt';G.formation=['alt','katana'];update(0);const switched=NinjaArcherArtV1.players[0]===null;
     NinjaArcherArtV1.mark(0,'alt','signature',1,'up');G={...G};update(0);const loaded=NinjaArcherArtV1.players.every(x=>x===null);
     NinjaArcherArtV1.mark(0,'alt','skill',1,'left');G.area='studio';update(0);return {switched,loaded,area:NinjaArcherArtV1.players.every(x=>x===null)};
   });assert(v.switched&&v.loaded&&v.area);return v;
 });
 await check('Dialogue freezes action clocks and uses the matching variant portrait',async()=>{
   await arena();const v=await page.evaluate(()=>{
     NinjaArcherArtV1.mark(0,'katana','skill',.4,'right');const clock=NinjaArcherArtV1.clock;
     talk([{who:'katana',t:'Teste visual.'},{who:'alt',t:'Resposta visual.'}]);
     const ninja=$('portrait').getAttribute('src')===NinjaArcherArtV1.assets.katana_portrait_speaking;
     update(.1);const frozen=NinjaArcherArtV1.players[0].elapsed===0&&NinjaArcherArtV1.clock===clock;
     advanceDialogue();return {ninja,frozen,archer:$('portrait').getAttribute('src')===NinjaArcherArtV1.assets.alt_portrait_speaking};
   });assert(v.ninja&&v.archer&&v.frozen,JSON.stringify(v));return v;
 });
 await check('Legacy rendering of the other four heroes stays pixel-identical',async()=>{
   await arena('franco','ryuchi');const v=await page.evaluate(()=>{
     C3.pad.pads=[];const results=[];
     for(const hero of ['franco','ryuchi','synth','percussion']){
       G.active=hero;act.hit=0;Combat10.dashTime=0;G.flags.masks=true;const p={style:hero,dir:'down'};
       ctx.clearRect(0,0,768,432);ninjaArcherActorV1(p,180,180,false);const before=ctx.getImageData(100,70,180,180).data;
       ctx.clearRect(0,0,768,432);drawActor(p,180,180,false);const after=ctx.getImageData(100,70,180,180).data;
       results.push({hero,equal:before.every((n,i)=>n===after[i])});
     }return results;
   });assert(v.every(x=>x.equal));return v;
 });
 await check('Full resolution sheet cache remains bounded to eight decoded images',async()=>{
   const size=await page.evaluate(()=>{for(const hero of ['alt','katana'])for(const state of NinjaArcherArtV1.manifest.states)NinjaArcherArtV1.image(hero+'_'+state);return Object.keys(NinjaArcherArtV1.images).length});assert.equal(size,8);return size;
 });
 // An enlarged in-engine view for checking natural scale and grounded belt masks.
 await arena();await page.evaluate(async()=>{
   for(const hero of ['katana','alt']){const image=NinjaArcherArtV1.image(hero+'_idle');await image.decode();}
   ctx.clearRect(0,0,768,432);ctx.fillStyle='#292437';ctx.fillRect(0,0,768,432);ctx.save();ctx.scale(3,3);
   drawActor({style:'katana',dir:'down'},85,100,false);drawActor({style:'alt',dir:'down'},165,100,false);ctx.restore();
 });
 await page.locator('canvas').first().screenshot({path:path.join(output,'NINJA_ARQUEIRO_ENGINE.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'NINJA_ARQUEIRO_RESULTS.json'),JSON.stringify({version:version.versao,passed:checks.length,checks,browserErrors:errors,physicalControllersTested:false},null,2)+'\n');
 await context.close();await browser.close();console.log('PASS · '+checks.length+' checks');
})().catch(e=>{console.error(e);process.exitCode=1});
