/* Art integration regression. Uses an isolated context, never a player's save.
 * PLAYWRIGHT_CORE=/path/to/playwright-core CDP_URL=http://127.0.0.1:9237
 * node qa/ninja_archer_art.cjs [hosted build URL]
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const output=path.join(root,'qa',version.versao);fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await (process.env.CHROME_PATH ? chromium.launch({executablePath:process.env.CHROME_PATH,headless:true}) : chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9237').catch(()=>chromium.launch()));
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   // Pixel comparisons must stay on the same readback path. Otherwise Chrome
   // can switch the game canvas from GPU to CPU after the first getImageData.
   const getContext=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,options){return getContext.call(this,type,type==='2d'&&this.id==='game'?{...options,willReadFrequently:true}:options)};
   window.requestAnimationFrame=()=>0;window.__pads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>window.__pads});window.__pad=i=>({index:i,id:'DualSense isolated QA '+i,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))})
 });
 await page.goto(process.argv[2]||'http://127.0.0.1:8767/',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>typeof ProtagonistArtV5!=='undefined');
 async function check(name,fn){const detail=await fn();checks.push({name,passed:true,detail});console.log('OK · '+name)}
 async function arena(p1='ryuchi',p2='franco') {await page.evaluate(({p1,p2})=>{
   G=fresh();G.active=p1;G.formation=[p1,p2];G.flags.voicesAlt=G.flags.voicesKatana=G.flags.bass=true;
   for(const id of [p1,p2]){G.hp[id]=G.maxhp[id]=100;G.levels[id]=5;}
   current=mk('forest',40,30,'grass');G.area='forest';G.x=10.5;G.y=12.5;G.dir='right';G.aim091=[1,0];
   mode='walk';battle=null;bossActor=null;keys={};Object.assign(act,{cool:0,skill:0,skillX:0,duo:0,hit:0,dashCD:0,invuln:0,combo:0,comboTime:-10});
   resetMotion10();Input121.game=G;Input121.lastArea=G.area;C3.pad.previous.clear();window.__pads=[window.__pad(0),window.__pad(1)];C3.pad.pads=window.__pads;
   Object.assign(C3.coop,{member:p2,combo:0,lastAttack:-10,skill:0,advanced:0,signature:0,cool:0,recovery:0});C3.syncCoop(true);C3.coop.invuln=0;ProtagonistArtV5.reset();
   $('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';$('toast').classList.add('hidden');cam.x=cam.y=0;
 },{p1,p2});}
 await check('Protagonist sheets do not load on the title screen',async()=>{
   const count=await page.evaluate(()=>Object.keys(ProtagonistArtV5.images).length);assert.equal(count,0);return count;
 });
 await check('192 directional sequences decode with unique played cells and compatible physical/virtual closure',async()=>{
   const result=await page.evaluate(async()=>{
     const art=ProtagonistArtV5,canvas=document.createElement('canvas');canvas.width=canvas.height=256;const q=canvas.getContext('2d',{willReadFrequently:true});let count=0;const sequences=new Set();
     const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('');
     for(const animation of art.manifest.animations){
       const name=animation.hero+'/'+animation.state+'/'+animation.row;if(sequences.has(name))throw Error('Duplicate sequence: '+name);sequences.add(name);
       const image=new Image();image.src=art.assets[animation.hero+'_'+animation.state];await image.decode();
       if(image.naturalWidth!==animation.frames*256||image.naturalHeight!==2048)throw Error('Wrong atlas dimensions: '+name);
       const locomotion=['walk','run'].includes(animation.state),played=animation.playFrames,closure=animation.closureFrame??(animation.holdLast?played-1:0);
       if(!Number.isInteger(played)||played<1||played>animation.frames)throw Error('Invalid playFrames: '+name);
       if(!Number.isInteger(closure)||closure<0||closure>=played)throw Error('Invalid closureFrame: '+name);
       if(locomotion&&(played!==16||animation.frames!==played||closure!==0||animation.loop!==true))throw Error('Wrong V7 virtual closure: '+name);
       if(!locomotion&&animation.frames!==played+1)throw Error('Missing legacy physical closure: '+name);
       const hashes=[];
       for(let frame=0;frame<animation.frames;frame++){
         q.clearRect(0,0,256,256);q.drawImage(image,frame*256,animation.row*256,256,256,0,0,256,256);
         const data=q.getImageData(0,0,256,256).data;
         if(data[3]||data[(256*256-1)*4+3])throw Error('Opaque cell corner: '+name);
         if(!data.some((n,i)=>i%4===3&&n>0))throw Error('Empty frame: '+name);
         hashes.push(await digest(data));
       }
       if(new Set(hashes.slice(0,played)).size!==played)throw Error('Repeated played bitmap: '+name);
       if(locomotion){
         if(art.phaseFrame(animation,0)!==closure||art.phaseFrame(animation,1-1e-9)!==played-1)throw Error('Invalid temporal boundary: '+name);
         if(art.phaseFrame(animation,1%1)!==closure)throw Error('Open virtual cycle: '+name);
       }else if(hashes[animation.frames-1]!==hashes[closure])throw Error('Open physical cycle: '+name);
       count++;
     }return count;
   });assert.equal(result,192);return {sequences:result,frames:await page.evaluate(()=>ProtagonistArtV5.manifest.animations.reduce((n,a)=>n+a.frames,0))};
 });
 await check('P1 and P2 attacks and rolls keep their own hero and direction',async()=>{
   await arena();const result=await page.evaluate(()=>{
     attackAction();C3.coop.cool=0;C3.coopAttack(window.__pads[1]);
     const attacks=ProtagonistArtV5.players.map(p=>({hero:p.hero,state:p.state}));
     act.dashCD=0;startRoll121();C3.coop.dashCD=0;C3.coopDodge(window.__pads[1]);
     const a=ProtagonistArtV5.pose({style:'ryuchi',dir:'right'},0,true),b=ProtagonistArtV5.pose({style:'franco',dir:'down'},1,true);
     return {attacks,a,b,players:[G.active,C3.coopMember()]};
   });assert.deepEqual(result.attacks,[{hero:'ryuchi',state:'attack_1'},{hero:'franco',state:'attack_1'}]);
   assert.equal(result.a.state,'roll');assert.equal(result.b.state,'roll');assert.equal(result.a.hero,'ryuchi');assert.equal(result.b.hero,'franco');return result;
 });
 await check('Accepted techniques and specials animate; rejected actions cannot restart animation',async()=>{
   const result=[];
   for(const hero of ['franco','ryuchi'])for(const [fn,key,state]of [['skillAction','skill','skill'],['advancedSkill','skillX','advanced'],['duoAction','duo','signature']]){
     await arena(hero,hero==='franco'?'ryuchi':'franco');
     const v=await page.evaluate(({fn,state})=>{G.resonance=100;window[fn]();const record=ProtagonistArtV5.players[0];if(!record)throw Error('Missing action record');record.elapsed=.05;window[fn]();return {hero:record.hero,state:record.state,elapsed:record.elapsed,same:record===ProtagonistArtV5.players[0]};},{fn,state});
     assert.equal(v.hero,hero);assert.equal(v.state,state);assert.equal(v.same,true);assert.equal(v.elapsed,.05);result.push(v);
   }return result;
 });
 await check('Three combo attacks and all P2 techniques preserve player ownership',async()=>{
   const result=[];
   for(const hero of ['franco','ryuchi']){
     await arena(hero,hero==='franco'?'ryuchi':'franco');
     result.push(await page.evaluate(()=>{
       const states=[];for(let i=0;i<3;i++){act.cool=0;act.recovery=0;attackAction();states.push(ProtagonistArtV5.players[0]?.state);}
       return states;
     }));
     for(const [fn,key,state]of [['coopSkill','skill','skill'],['coopAdvanced','advanced','advanced'],['coopSignature','signature','signature']]){
       await arena(hero==='franco'?'ryuchi':'franco',hero);
       const v=await page.evaluate(({fn,key})=>{mode='action';G.resonance=100;C3.coop[key]=0;C3[fn](window.__pads[1]);const r=ProtagonistArtV5.players[1];C3[fn](window.__pads[1]);return {hero:r?.hero,state:r?.state,same:r===ProtagonistArtV5.players[1],p1:ProtagonistArtV5.players[0]};},{fn,key});
       assert.equal(v.hero,hero);assert.equal(v.state,state);assert(v.same);assert.equal(v.p1,null);
     }
   }assert.deepEqual(result,[['attack_1','attack_2','attack_3'],['attack_1','attack_2','attack_3']]);return result;
 });
 await check('Switches, loads and area boundaries discard stale animation ownership',async()=>{
   await arena();const v=await page.evaluate(()=>{
     attackAction();G.active='franco';G.formation=['franco','ryuchi'];update(0);const switched=ProtagonistArtV5.players[0]===null;
     ProtagonistArtV5.mark(0,'franco','signature',1,'up');G={...G};update(0);const loaded=ProtagonistArtV5.players.every(x=>x===null);
     ProtagonistArtV5.mark(0,'franco','skill',1,'left');G.area='studio';update(0);return {switched,loaded,area:ProtagonistArtV5.players.every(x=>x===null)};
   });assert(v.switched&&v.loaded&&v.area);return v;
 });
 await check('Dialogue freezes action clocks and uses the matching variant portrait',async()=>{
   await arena();const v=await page.evaluate(()=>{
     ProtagonistArtV5.mark(0,'ryuchi','skill',.4,'right');const clock=ProtagonistArtV5.clock;
     talk([{who:'ryuchi',t:'Teste visual.'},{who:'franco',t:'Resposta visual.'}]);
     const ninja=$('portrait').getAttribute('src')===ProtagonistArtV5.assets.ryuchi_portrait_unmasked_speaking;
     update(.1);const frozen=ProtagonistArtV5.players[0].elapsed===0&&ProtagonistArtV5.clock===clock;
     advanceDialogue();return {ninja,frozen,archer:$('portrait').getAttribute('src')===ProtagonistArtV5.assets.franco_portrait_unmasked_speaking};
   });assert(v.ninja&&v.archer&&v.frozen,JSON.stringify(v));return v;
 });
 await check('Previously integrated Ninja and Archer rendering stays pixel-identical',async()=>{
   await arena('franco','ryuchi');const v=await page.evaluate(async()=>{
     C3.pad.pads=[];const results=[];
     for(const hero of ['alt','katana']){
       G.active=hero;act.hit=0;Combat10.dashTime=0;G.flags.masks=true;const p={style:hero,dir:'down'};
       // Stabilize first-draw initialization and canvas readbacks observed on
       // macOS Chrome; the measured comparison still requires exact pixels.
       ctx.clearRect(0,0,768,432);protagonistActorV5(p,180,180,false);
       await NinjaArcherArtV1.image(hero+'_idle').decode();
       for(let warm=0;warm<3;warm++){
         ctx.clearRect(0,0,768,432);protagonistActorV5(p,180,180,false);
         ctx.getImageData(100,70,180,180);
       }
       ctx.clearRect(0,0,768,432);protagonistActorV5(p,180,180,false);const before=ctx.getImageData(100,70,180,180).data;
       ctx.clearRect(0,0,768,432);drawActor(p,180,180,false);const after=ctx.getImageData(100,70,180,180).data;
       results.push({hero,equal:before.every((n,i)=>n===after[i]),visible:after.some((n,i)=>i%4===3&&n>0)});
     }return results;
   });assert(v.every(x=>x.equal&&x.visible),JSON.stringify(v));return v;
 });
 await check('Mask acquisition selects authored rows and matching portraits',async()=>{
   await arena();const v=await page.evaluate(()=>{
     const art=ProtagonistArtV5, out=[];
     for(const masks of [false,true]){G.flags.masks=masks;
       for(const hero of ['franco','ryuchi'])for(const direction of ['down','left','up','right']){
         const pose=art.pose({style:hero,dir:direction},-1,false);
         out.push({masks,hero,direction,row:pose.row,portrait:portraitURI10(hero)===art.assets[hero+'_portrait_'+(masks?'masked':'unmasked')+'_neutral']});
       }
     }return out;
   });assert(v.every(x=>x.row===['down','left','up','right'].indexOf(x.direction)+(x.masks?4:0)&&x.portrait));return v;
 });
 await check('Damage animates only actual HP loss and respects invulnerability',async()=>{
   await arena();const v=await page.evaluate(()=>{
     const art=ProtagonistArtV5;mode='action';damageHero(1);const first=art.players[0];
     const hp=G.hp[G.active];damageHero(1);
     const blocked=G.hp[G.active]===hp&&first===art.players[0];
     C3.coop.invuln=0;C3.damageCoop(1);return {state:first?.state,blocked,coop:art.players[1]?.state};
   });assert.equal(v.state,'hurt');assert(v.blocked);assert.equal(v.coop,'hurt');return v;
 });
 await check('Full resolution sheet cache remains bounded to eight decoded images',async()=>{
   const size=await page.evaluate(()=>{for(const hero of ['franco','ryuchi'])for(const state of [...new Set(ProtagonistArtV5.manifest.animations.map(a=>a.state))])ProtagonistArtV5.image(hero+'_'+state);return Object.keys(ProtagonistArtV5.images).length});assert.equal(size,8);return size;
 });
 // An enlarged in-engine view for checking natural scale and grounded belt masks.
 await arena();await page.evaluate(async()=>{
   for(const hero of ['ryuchi','franco']){const image=ProtagonistArtV5.image(hero+'_idle');await image.decode();}
   ctx.clearRect(0,0,768,432);ctx.fillStyle='#292437';ctx.fillRect(0,0,768,432);ctx.save();ctx.scale(3,3);
   drawActor({style:'ryuchi',dir:'down'},85,100,false);drawActor({style:'franco',dir:'down'},165,100,false);ctx.restore();
 });
 await page.locator('canvas').first().screenshot({path:path.join(output,'PROTAGONISTAS_V5_ENGINE.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'PROTAGONISTAS_V5_RESULTS.json'),JSON.stringify({version:version.versao,passed:checks.length,checks,browserErrors:errors,physicalControllersTested:false},null,2)+'\n');
 await context.close();await browser.close();console.log('PASS · '+checks.length+' checks');
})().catch(e=>{console.error(e);process.exit(1)});

