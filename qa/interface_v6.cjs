/* Fase 6 · interface, mobile e acessibilidade, no navegador.
 *   node qa/interface_v6.cjs http://127.0.0.1:8771/
 * - Zonas do HUD: em PC, celular em pé e celular deitado, no estúdio e na Fenda, com um
 *   aviso na tela, nenhum par de elementos do HUD pode se sobrepor (falha com os nomes).
 * - Menu por cima do diálogo; fila de avisos (um por vez, espera menu e diálogo).
 * - Mapa de teclas: rodapé e dicas gerados; tecla trocada chega ao jogo como a ação certa.
 * - Aliado nunca desenhado em cima do líder depois de trocar de área.
 * - Acessibilidade: avisos em âmbar, batida tolerante e pista da batida.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),url=process.argv[2]||'http://127.0.0.1:8771/',out=path.join(root,'qa/interface-v6');
const save=JSON.parse(fs.readFileSync(path.join(root,'qa/beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const LAYOUTS={pc:{viewport:{width:1280,height:800}},retrato:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:IPHONE},paisagem:{viewport:{width:844,height:390},isMobile:true,hasTouch:true,userAgent:IPHONE}};
// Elementos do HUD que não podem se cobrir (cada um é uma zona).
const ZONES=['.location','#bMenu','#bGuide','#bJournal','#bParty','#bSave','#vitals092','.questline','#prompt','#tapeButton','#toast','#guideChip','#mobileLeft121','#mobileRight121','#mobileGoal121','#mobileObjective','#bMap','#playtestEntry','#actionHUD .action-label','#actionHUD .action-party'];
const checks=[],errors=[];
async function open(browser,layout){const ctx=await browser.newContext(LAYOUTS[layout]);const p=await ctx.newPage();p.on('pageerror',e=>errors.push(layout+': '+e.message));
 await p.goto(url,{waitUntil:'load',timeout:180000});await p.evaluate(s=>{localStorage.clear();localStorage.setItem(KEY,JSON.stringify(s))},save);await p.reload({waitUntil:'load'});
 await p.waitForFunction(()=>document.getElementById('startContinue')&&!document.getElementById('startContinue').disabled,null,{timeout:60000});await p.click('#startContinue');await p.locator('#playtestEntry').waitFor({state:'detached'});await p.waitForTimeout(1200);
 await p.evaluate(()=>{closeOverlay();if(mode==='dialogue')for(let i=0;i<40&&mode==='dialogue';i++)advanceDialogue()});return{ctx,p}}
async function overlaps(p){return p.evaluate(zones=>{const vis=el=>{if(!el)return false;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0||el.classList.contains('hidden'))return false;const r=el.getBoundingClientRect();return r.width>2&&r.height>2&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight};
 const items=[];for(const sel of zones){const el=document.querySelector(sel);if(!vis(el))continue;const r=el.getBoundingClientRect();items.push({sel,el,r:{x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)}})}
 const bad=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(a.el.contains(b.el)||b.el.contains(a.el))continue;const ix=Math.min(a.r.x+a.r.w,b.r.x+b.r.w)-Math.max(a.r.x,b.r.x),iy=Math.min(a.r.y+a.r.h,b.r.y+b.r.h)-Math.max(a.r.y,b.r.y);if(ix>1&&iy>1)bad.push(a.sel+' × '+b.sel+' ('+ix+'×'+iy+')')}
 return{items:items.map(i=>({sel:i.sel,...i.r})),bad}},ZONES)}
async function check(name,fn){const detail=await fn();checks.push({name,passed:true,detail});console.log('OK · '+name)}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});fs.mkdirSync(out,{recursive:true});
 try{
  for(const layout of Object.keys(LAYOUTS)){const {ctx,p}=await open(browser,layout);
   for(const place of ['estudio','fenda']){
    await check(`Zonas do HUD sem sobreposição · ${layout} · ${place}`,async()=>{
     if(place==='fenda')await p.evaluate(()=>{PostGame.startDungeon(7);for(let i=0;i<900&&mode!=='action';i++){tick+=1/60;update(1/60)}updateActionHUD()});
     await p.evaluate(()=>{ToriiInterface6.Toasts.clear();toast('✦ PROGRESSO SALVO NO NAVEGADOR');ToriiInterface6.Zones.layout()});await p.waitForTimeout(300);
     const r=await overlaps(p);await p.screenshot({path:path.join(out,`ZONAS_${layout}_${place}.png`)});
     assert.deepEqual(r.bad,[],JSON.stringify(r));assert(r.items.some(i=>i.sel==='#toast'),'o aviso precisa estar visível');return r.items});
   }
   await ctx.close();
  }
  const {ctx,p}=await open(browser,'pc');
  await check('Menu de pausa fica por cima do diálogo',async()=>{const r=await p.evaluate(()=>{talk([{who:'narrator',t:'Teste de diálogo aberto.'}]);const before=getComputedStyle($('dialogue')).visibility;openSystem();const during=getComputedStyle($('dialogue')).visibility;closeOverlay();const after=getComputedStyle($('dialogue')).visibility;for(let i=0;i<5&&mode==='dialogue';i++)advanceDialogue();return{before,during,after}});assert.equal(r.during,'hidden');assert.equal(r.after,'visible');return r});
  await check('Fila de avisos: um por vez, espera menu e diálogo, descarta avisos velhos ao abrir cena',async()=>{
   const r=await p.evaluate(async()=>{const T6=ToriiInterface6.Toasts;T6.clear();const shown=()=>$('toast').classList.contains('hidden')?null:$('toast').textContent;toast('PRIMEIRO');toast('SEGUNDO');toast('SEGUNDO');const a=shown(),queued=T6.queue.length;
    T6.current.until=0;T6.pump();const b=shown();T6.clear();openSystem();toast('COM MENU');T6.pump();const c=shown();closeOverlay();T6.pump();const d=shown();T6.clear();toast('ÓRBITA VAZIA');talk([{who:'narrator',t:'Fim.'}]);T6.pump();const e=shown(),left=T6.queue.length;for(let i=0;i<5&&mode==='dialogue';i++)advanceDialogue();return{a,queued,b,c,d,e,left}});
   assert.equal(r.a,'PRIMEIRO');assert.equal(r.queued,1);assert.equal(r.b,'SEGUNDO');assert.equal(r.c,null);assert.equal(r.d,'COM MENU');assert.equal(r.e,null);assert.equal(r.left,0);return r});
  await check('Rodapé e dicas gerados do mapa de teclas; tecla trocada chega ao jogo',async()=>{
   const before=await p.evaluate(()=>document.querySelector('.footer > div').textContent);assert(before.includes('J atacar')&&before.includes('N diário')&&!before.includes('J diário'),before);
   // O que chega aos tratadores do jogo (fase de bolha na janela) é a tecla J.
   await p.evaluate(()=>{closeOverlay();ToriiInterface6.KeyMap.reset();ToriiInterface6.KeyMap.set('attack','f');window.__keys=[];addEventListener('keydown',e=>__keys.push(e.key));window.__att=0;const a=attackAction;attackAction=function(...x){__att++;return a.apply(this,x)};mode='walk'});
   await p.keyboard.press('f');const after=await p.evaluate(()=>({att:__att,keys:__keys.slice(),footer:document.querySelector('.footer > div').textContent}));
   assert.deepEqual(after.keys,['j'],JSON.stringify(after));assert(after.att>=1,'F deve atacar');assert(after.footer.includes('F atacar'),after.footer);
   const tech=await p.evaluate(()=>{ToriiInterface6.KeyMap.set('dodge','v');ToriiInterface6.refreshHints();updateHUD();return [...document.querySelectorAll('#vitals092 .tech-row10 span')].map(s=>s.textContent)});
   await p.evaluate(()=>ToriiInterface6.KeyMap.reset());assert(tech.some(t=>t.startsWith('V ')),JSON.stringify(tech));return{before,after,tech}});
  await check('Aliado não fica em cima do líder depois de trocar de área',async()=>{const r=await p.evaluate(()=>{const rows=[];for(const dir of ['up','down','left','right']){setArea('last_torii',13.5,13.5,false);G.dir=dir;G.aim091=null;getFollower(0);tick+=.3;const f=getFollower(0);rows.push({dir,dx:+(f.x-G.x).toFixed(2),dy:+(f.y-G.y).toFixed(2)})}return rows});for(const f of r)assert(Math.abs(f.dx)>=.7||Math.abs(f.dy)>=1.5,JSON.stringify(f));return r});
  await check('Acessibilidade: avisos em âmbar, batida tolerante e pista da batida',async()=>{
   const r=await p.evaluate(()=>{const A=ToriiInterface6.A11y,v=JSON.parse(localStorage.getItem('torii_hutukara_interface_v6')||'{}');v.colorblind=true;v.tolerant=true;v.beatCue=true;localStorage.setItem('torii_hutukara_interface_v6',JSON.stringify(v));
    PostGame.startDungeon(9);mode='action';drawEnv();const c=document.createElement('canvas').getContext('2d');c.strokeStyle='#ff798a';const amber=c.strokeStyle;mode='walk';c.strokeStyle='#ff798a';const normal=c.strokeStyle;
    const e={type:'compasso',hp:70,max:70,x:G.x+3,y:G.y,clock:0,endless:true};hydrateEnemy(e);e.clock=0;current.enemies=[e];mode='action';const t0=e.clock;for(let i=0;i<60;i++){tick+=1/60;update(1/60)}const slow=e.clock-t0;drawEnv();
    v.colorblind=v.tolerant=v.beatCue=false;localStorage.setItem('torii_hutukara_interface_v6',JSON.stringify(v));return{amber,normal,slow,warn:PostGame.HAZARD_WARN}});
   assert.notEqual(r.amber,'#ff798a');assert.equal(r.normal,'#ff798a');assert(r.slow<.9,JSON.stringify(r));assert.equal(r.warn,1.3);return r});
  await check('Menu Sistema mostra Controles e as três opções',async()=>{const r=await p.evaluate(()=>{closeOverlay();openSettings10();const ids=['controls6','colorblind6','beatCue6','tolerant6'].map(id=>!!$(id));$('controls6').click();const rows=document.querySelectorAll('[data-key6]').length;closeOverlay();return{ids,rows}});assert(r.ids.every(Boolean),JSON.stringify(r));assert(r.rows>=15);await p.evaluate(()=>{openSettings10();$('controls6').click()});await p.screenshot({path:path.join(out,'CONTROLES_pc.png')});await p.evaluate(()=>closeOverlay());return r});
  await ctx.close();
 }catch(e){errors.push(String(e.stack||e).slice(0,1500));process.exitCode=1}
 finally{await browser.close();const report={url,checks,errors};fs.writeFileSync(path.join(out,'INTERFACE.json'),JSON.stringify(report,null,1)+'\n');console.log(JSON.stringify({passed:checks.length,errors:errors.slice(0,3)}));if(errors.length)process.exitCode=1}
})();
