/* Correções da crítica da Beta 1.15.0 (game/source/chapter-03/revisao_v7.js), no navegador.
 *   node qa/revisao_v7.cjs http://127.0.0.1:8771/
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),url=process.argv[2]||'http://127.0.0.1:8771/',out=path.join(root,'qa/revisao-v7');
const save=JSON.parse(fs.readFileSync(path.join(root,'qa/beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const checks=[],errors=[];
async function check(name,fn){const detail=await fn();checks.push({name,passed:true,detail});console.log('OK · '+name)}
async function open(browser,opts,withSave=true){const ctx=await browser.newContext(opts);const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url,{waitUntil:'load',timeout:180000});if(withSave){await p.evaluate(s=>{localStorage.clear();localStorage.setItem(KEY,JSON.stringify(s))},save);await p.reload({waitUntil:'load'});
 await p.waitForFunction(()=>document.getElementById('startContinue')&&!document.getElementById('startContinue').disabled,null,{timeout:60000});await p.click('#startContinue');await p.waitForTimeout(800);
 await p.evaluate(()=>{closeOverlay();for(let i=0;i<40&&mode==='dialogue';i++)advanceDialogue();mode='walk'})}return {ctx,p}}
const step=(p,n)=>p.evaluate(n=>{for(let i=0;i<n;i++){tick+=1/60;update(1/60)}},n);
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});fs.mkdirSync(out,{recursive:true});
 try{
  const {ctx,p}=await open(browser,{viewport:{width:1280,height:800}});
  await check('Cair do Mar de Nuvens volta à borda com dano, sem perder o Elevador',async()=>{
   const r=await p.evaluate(()=>{Object.assign(G.c3,{liftOpen:true,cloudPathA:false,cloudPlatform:false,cloudPathB:false,metronomeSeen:false,complete:false});setCheckpoint('c3_district','distortion_district',15.5,21.5,true);
    setArea('cloud_sea',5.5,26.5,false);const cp=G.checkpoint.area,hp0=G.hp[G.active];keys={a:true};for(let i=0;i<300&&mode==='walk';i++){tick+=1/60;update(1/60)}keys={};
    for(let i=0;i<120&&mode==='cloud_fall';i++){tick+=1/60;update(1/60)}const res={cp,area:G.area,mode,lift:G.c3.liftOpen,hp0,hp:G.hp[G.active],ov:!$('overlay').classList.contains('hidden')};G.c3.complete=true;return res});
   assert.equal(r.cp,'cloud_sea');assert.equal(r.area,'cloud_sea');assert.equal(r.mode,'walk');assert.equal(r.lift,true);assert.equal(r.ov,false);return r});
  await check('Falas soltas somem com menu aberto e o rádio fica abaixo do quadro de vida',async()=>{
   const r=await p.evaluate(()=>{setArea('last_torii',13.5,13.5,false);mode='walk';Narrativa.forcar('andando','franco');Narrativa.despachar();
    const lay=document.getElementById('barksCamada');const before=getComputedStyle(lay).visibility;openSystem();RevisaoV7.frame();const during=getComputedStyle(lay).visibility;closeOverlay();RevisaoV7.frame();const after=getComputedStyle(lay).visibility;
    const radio=document.createElement('div');radio.className='bark radio visivel';radio.innerHTML='<b>COLLI</b><span>teste</span>';lay.appendChild(radio);RevisaoV7.placeRadio();const rr=radio.getBoundingClientRect(),v=$('vitals092').getBoundingClientRect();radio.remove();
    return {before,during,after,radioTop:rr.top,vitalsBottom:v.bottom}});
   assert.equal(r.during,'hidden');assert.equal(r.after,'visible');assert(r.radioTop>=r.vitalsBottom,JSON.stringify(r));return r});
  await check('Botões de nota da composição cabem no botão',async()=>{
   const r=await p.evaluate(()=>{C3.openPhrase('final');const b=[...document.querySelectorAll('#overlay .notes .note')].map(n=>({w:n.clientWidth,sw:n.scrollWidth}));closeOverlay();return b});
   assert.equal(r.length,4);for(const b of r)assert(b.sw<=b.w+1,JSON.stringify(r));return r});
  await check('Grupo parado não se sobrepõe nas quatro direções',async()=>{
   const r=await p.evaluate(()=>{const rows=[];for(const dir of ['up','down','left','right']){setArea('voice_tower',12,12,false);mode='walk';G.dir=dir;G.aim091=null;for(let i=0;i<60;i++){tick+=1/60;update(1/60)}
    const pts=[{x:G.x,y:G.y},getFollower(0),getFollower(1)];let min=99;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const dx=Math.abs(pts[i].x-pts[j].x),dy=Math.abs(pts[i].y-pts[j].y);min=Math.min(min,Math.max(dx/1.3,dy/1.9))}rows.push({dir,min:+min.toFixed(2)})}return rows});
   for(const x of r)assert(x.min>=1,JSON.stringify(r));return r});
  await check('Legenda do narrador fica abaixo do aviso',async()=>{
   const r=await p.evaluate(()=>{ToriiInterface6.Toasts.clear();toast('AVISO DE TESTE');ToriiInterface6.Toasts.pump();talk([{who:'narrator',t:'Uma legenda de cenário bem comprida para testar.',cena:true},{who:'ryuchi',t:'ok'}]);RevisaoV7.placeCaption();
    const c=$('cenaLegenda').getBoundingClientRect(),t=$('toast').getBoundingClientRect(),hidden=$('toast').classList.contains('hidden');for(let i=0;i<5&&mode==='dialogue';i++)advanceDialogue();return {c:[c.top,c.bottom],t:[t.top,t.bottom],hidden}});
   if(!r.hidden)assert(r.c[0]>=r.t[1],JSON.stringify(r));return r});
  await check('Nomes únicos no diálogo, no HUD e na equipe',async()=>{
   const r=await p.evaluate(()=>{const sp={};for(const w of ['alt','katana','synth','percussion']){talk([{who:w,t:'x'}]);sp[w]=$('speaker').textContent;for(let i=0;i<4&&mode==='dialogue';i++)advanceDialogue()}
    updateHUD();const hud=$('vitals092').innerText;openParty();const team=$('overlayInner').innerText;closeOverlay();return {sp,hud,team}});
   assert.deepEqual(r.sp,{alt:'FRANCO ARQUEIRO',katana:'RYUCHI KATANA',synth:'FRANCO SINTETIZADOR',percussion:'RYUCHI PERCUSSIONISTA'});
   assert(!/Franco A\.|Franco · arco|Ryuchi · katana/.test(r.hud+r.team),r.hud+r.team);assert(/Franco Arqueiro/.test(r.team));return r.sp});
  await check('Porta de volta não responde no ponto de chegada',async()=>{
   const r=await p.evaluate(()=>{setArea('studio',12.5,10.5,false);mode='walk';const g=current.gates.find(g=>g.to==='corridor');G.x=g.x;G.y=g.y;setArea(g.to,g.tx,g.ty);const name=n=>n&&n.type+':'+(n.value.to||n.value.id);
    const atArrival=name(nearestInteraction());G.x+=1;const away=name(nearestInteraction());G.x-=1;const back=name(nearestInteraction());return {atArrival,away,back}});
   assert.equal(r.atArrival,null);assert.equal(r.back,'gate:studio');return r});
  await check('Calabouço: objetivo sem "Escolha uma melhoria" fora da escolha; ondas 1–3 mais leves',async()=>{
   const r=await p.evaluate(()=>{closeOverlay();mode='walk';setArea('last_torii',13.5,13.5,false);PostGame.startDungeon(3);const run=PostGame.run();run.phase='rest';run.wave=1;PostGame.hud();const text=$('quest').textContent;
    const p1=PostGame.profile(1).power,p4=PostGame.profile(4).power;PostGame.finishRun('exit');closeOverlay();return {text,p1,p4}});
   assert(!/Escolha uma melhoria/.test(r.text),r.text);assert(r.p1<r.p4*.75,JSON.stringify(r));return r});
  await p.screenshot({path:path.join(out,'PC.png')});await ctx.close();
  const m=await open(browser,{viewport:{width:390,height:664},isMobile:true,hasTouch:true,userAgent:IPHONE},false);
  await check('Celular em pé: diálogo sobre os controles e dicas de toque',async()=>{
   await m.p.evaluate(()=>newGame());await m.p.waitForTimeout(600);
   const r=await m.p.evaluate(()=>{RevisaoV7.mobileDialogue();RevisaoV7.touchHints();const d=$('dialogue').getBoundingClientRect(),g=$('game').getBoundingClientRect();return {dTop:d.top,gBottom:g.bottom,cont:document.querySelector('#dialogue .continue').textContent,btns:[...document.querySelectorAll('#dialogue .leitura-barra button')].map(b=>b.textContent)}});
   assert(r.dTop>=r.gBottom,JSON.stringify(r));assert(!/ESPAÇO|ENTER/.test(r.cont));assert(r.btns.every(t=>!/ · [A-Z]$/.test(t)),JSON.stringify(r.btns));
   await m.p.screenshot({path:path.join(out,'CELULAR_retrato.png')});return r});
  await m.ctx.close();
 }catch(e){errors.push(String(e.stack||e).slice(0,1500));process.exitCode=1}
 finally{await browser.close();fs.writeFileSync(path.join(out,'REVISAO_V7.json'),JSON.stringify({url,checks,errors},null,1)+'\n');console.log(JSON.stringify({passed:checks.length,errors:errors.slice(0,3)}));if(errors.length)process.exitCode=1}
})();
