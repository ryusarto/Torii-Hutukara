/* Continuous new-game campaign through real movement, interactions and combat.
 * Dialogue/60Hz simulation accelerated; no teleports, quest flags or HP bypass.
 * ROTA=usina|canal RECARREGAR=120 PLAYWRIGHT_CORE=... CHROME_PATH=... node qa/campaign_review.cjs [URL/HTML]
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),out=path.join(root,'qa/screenshots-local/review-110');fs.mkdirSync(out,{recursive:true});
const input=process.argv[2]||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html'),url=/^(file|https?):/.test(input)?input:pathToFileURL(input).href;
const source=fs.readFileSync(path.join(root,'qa/pace_bot.cjs'),'utf8');let code=source.slice(source.indexOf('function installBot(){'),source.lastIndexOf('\nmain().catch'));
// Sample drawing while exercising the actual update chain every simulation tick.
code=code.replace('loop(t);','tick+=DT;update(DT);if((window.__campaignPaint=(window.__campaignPaint||0)+1)%8===0)drawEnv();');
code=code.replace("else if(mode==='walk'){","else if(mode==='walk'&&CloudWorldV1.builds.length){release();}else if(mode==='walk'){");
code=code.replace('const DT=1/60;','const DT=1/60;let pathCache=null;');
code=code.replace('const w=a.w,h=a.h,S=',"const cacheKey=[a.id,Math.floor(sx),Math.floor(sy),Math.floor(gx),Math.floor(gy),JSON.stringify(G.flags),JSON.stringify(G.c3)].join('|');if(pathCache?.key===cacheKey)return pathCache.path;const w=a.w,h=a.h,S=");
code=code.replace('return path.reverse();','return (pathCache={key:cacheKey,path:path.reverse()}).path;');
code=code.replace('path.length>2','path.length>1').replace('path[Math.min(2,path.length-1)]','path[1]');
code=code.replace('clock-stuckSince>480','clock-stuckSince>120').replace('parado há 8 min','parado há 2 min');
code=code.replace("else newGame();say('Início: '+s)","else if(s!=='already')newGame();say('Início: '+s)");
const install=Function('return '+code)(),route=process.env.ROTA||'usina',reloadInterval=Number(process.env.RECARREGAR||0),mobile=process.env.DEVICE==='mobile',opts={run:true,cps:400,rota:route};
let browser;const report={version:v.numero,url,route,reloadInterval,device:mobile?'mobile-emulated':'desktop',rotations:[],errors:[],events:[],states:[],reloads:[],done:false,stuck:null,method:'Continuous newGame, actual 60Hz update/movement/combat/interactions, accelerated dialogue and render sampling. No position/HP/flags bypass. Not human/hardware validation.'};
(async()=>{browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});const page=await browser.newPage(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});await page.goto(url,{waitUntil:'load',timeout:120000});report.build=await page.evaluate(()=>window.TORII_PLAYTEST_BUILD||null);if(!report.build&&fs.existsSync(input)){const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(input))hash.update(chunk);report.build={sourceSha256:hash.digest('hex')}}
const setup=async()=>{await page.evaluate(install);await page.evaluate(o=>window.__botOpts=o,opts)};await setup();await page.locator('#startNew').click();await page.evaluate(()=>__bot.begin('already'));let lastArea='',lastObj='',lastReload=0,lastRotation=0;
const snapshot=()=>page.evaluate(()=>({area:G.area,active:G.active,position:{x:G.x,y:G.y},inventory:{potions:G.potions,shards:G.shards,resonance:G.resonance},defeated:[...G.defeated].sort(),discovered:[...G.discovered].sort(),choices:copy(G.choices||{}),checkpoint:G.checkpoint&&{id:G.checkpoint.id,area:G.checkpoint.area,x:G.checkpoint.x,y:G.checkpoint.y},hp:Object.fromEntries(partyMembers().map(id=>[id,G.hp[id]])),formation:partyMembers(),flags:Object.fromEntries(Object.entries(G.flags).filter(([,value])=>value).sort(([a],[b])=>a.localeCompare(b))),c3:{...C3.defaults(),...G.c3},xp:Object.fromEntries(partyMembers().map(id=>[id,G.xp[id]])),levels:Object.fromEntries(partyMembers().map(id=>[id,G.levels[id]]))}));
for(let n=0;n<700;n++){
 const st=await page.evaluate(()=>__bot.run(120));report.events.push(...st.events);if(st.area!==lastArea||st.objective!==lastObj){lastArea=st.area;lastObj=st.objective;report.states.push(st);console.log(JSON.stringify(st));}
 if(st.done||st.stuck||st.time>1400){report.done=st.done;report.stuck=st.stuck;break}
 if(reloadInterval&&st.time-lastReload>=reloadInterval&&st.mode==='walk'){
  lastReload=st.time;await page.evaluate(()=>save(true));const before=await snapshot();await page.reload({waitUntil:'load'});await setup();await page.evaluate(t=>{continueGame();__bot.setClock(t)},st.time);const after=await snapshot();const differences=Object.keys(before).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));report.reloads.push({time:st.time,area:before.area,differences,...(differences.length?{before,after}:{})});if(differences.length)throw Error('Reload changed '+differences.join(','));
 }
 if(mobile&&st.time-lastRotation>=90){lastRotation=st.time;const portrait=report.rotations.length%2===0;await page.setViewportSize(portrait?{width:390,height:844}:{width:844,height:390});await page.waitForTimeout(30);report.rotations.push({time:st.time,portrait,area:st.area});}
 if(n%30===0)await page.waitForTimeout(50);
}
report.final=await snapshot();report.mode=await page.evaluate(()=>mode);await page.evaluate(()=>{drawEnv();save(true)});await page.screenshot({path:path.join(out,'campaign-'+route+'-ending.png')});report.save=await page.evaluate(()=>copy(G));if(!report.done||report.errors.length)process.exitCode=1;
})().catch(e=>{report.fatal=e.stack;process.exitCode=1}).finally(async()=>{if(browser)await browser.close();fs.writeFileSync(path.join(out,'CAMPAIGN_'+route+(reloadInterval?'_RELOAD':'')+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({done:report.done,errors:report.errors,stuck:report.stuck,reloads:report.reloads,fatal:report.fatal}));});
