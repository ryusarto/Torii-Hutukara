/* Ranking online do calabouço no jogo construído, com o Supabase simulado.
 * node qa/ranking_v1_browser.cjs [caminho-ou-url-do-html]
 * Nenhuma requisição sai da máquina: as chamadas ao servidor são respondidas pelo teste. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json'))),out=path.join(root,'qa/ranking');
const input=process.argv[2]||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html'),url=/^(file|http)/.test(input)?input:pathToFileURL(input).href;
const HOST='https://ranking-teste.supabase.co',KEY='sb_publishable_teste_0123456789abcdef';
const checks=[],errors=[],requests=[];let browser,db=[],offline=false;fs.mkdirSync(out,{recursive:true});

function rpc(name,body){
 const sorted=mode=>db.filter(r=>r.mode===mode).sort((a,b)=>b.score-a.score||b.wave-a.wave||a.t-b.t);
 if(name==='enviar_recorde'){let row=db.find(r=>r.id===body.p_id&&r.mode===body.p_mode);if(!row){row={id:body.p_id,mode:body.p_mode,score:0,wave:0,t:Date.now()};db.push(row)}row.name=body.p_name;const better=body.p_score>row.score;if(better){row.score=body.p_score;row.wave=body.p_wave}return better?'ok':'mantido'}
 if(name==='ranking_top')return sorted(body.p_mode).slice(0,body.p_limit).map((r,i)=>({posicao:i+1,name:r.name,score:r.score,wave:r.wave}));
 if(name==='ranking_posicao'){const list=sorted(body.p_mode),i=list.findIndex(r=>r.id===body.p_id);return i<0?[]:[{posicao:i+1,score:list[i].score,wave:list[i].wave,total:list.length}]}
 if(name==='ranking_remover'){const n=db.length;db=db.filter(r=>r.id!==body.p_id);return n-db.length}
 throw Error('rpc desconhecida '+name);
}

(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route(HOST+'/**',async route=>{
  const req=route.request(),name=req.url().split('/rpc/')[1];requests.push({name,headers:req.headers(),body:req.postDataJSON()});
  if(offline)return route.abort('internetdisconnected');
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(rpc(name,req.postDataJSON()))});
 });
 await context.route(/^https?:\/\/(?!ranking-teste\.supabase\.co|127\.0\.0\.1|localhost)/,route=>route.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 await page.goto(url,{waitUntil:'load',timeout:120000});
 const check=async(name,fn)=>{const detail=await fn();checks.push({name,passed:true,detail});console.log('OK · '+name)};
 const text=sel=>page.$eval(sel,el=>el.textContent);
 // requestAnimationFrame fica parado neste teste; a espera usa intervalo.
 const until=fn=>page.waitForFunction(fn,null,{polling:100,timeout:15000});

 await check('sem configuração, o ranking aparece como indisponível e não acessa a rede',async()=>{
  const r=await page.evaluate(()=>{const built=RankingV1.config;RankingV1.config=null;G=fresh();buildMaps();Object.assign(G.c3,{started:true,complete:true});RankingV1.open(closeOverlay);return {built:built?.url||null,enabled:RankingV1.enabled(),html:$('overlayInner').textContent}});
  const cfg=JSON.parse(fs.readFileSync(path.join(root,'game/source/chapter-03/ranking_config.json'),'utf8'));if(!process.env.TORII_RANKING_URL)assert.equal(r.built,cfg.url?cfg.url.replace(/\/+$/,''):null);
  assert.equal(r.enabled,false);assert.match(r.html,/ainda não está disponível/);assert.equal(requests.length,0);return r.built;
 });

 // Daqui em diante, o servidor simulado.
 db=[{id:'a',mode:'solo',name:'Franco',score:9000,wave:12,t:1},{id:'b',mode:'solo',name:'<img src=x onerror=alert(1)>',score:4000,wave:6,t:2},{id:'c',mode:'coop',name:'Duo',score:2000,wave:3,t:3}];
 await page.evaluate(({HOST,KEY})=>{RankingV1.config={url:HOST,chave:KEY};
  G=fresh();buildMaps();Object.assign(G.flags,{reveal:true,voicesKatana:true,masks:true,bass:true});Object.assign(G.c3,{started:true,synthUnlocked:true,percussionUnlocked:true,metronomeDone:true,silenceDone:true,complete:true,toriiSeen:true});
  G.formation=['franco','alt','percussion'];G.active='franco';for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id]=100;PostGame.clearCombat();setArea('last_torii',13.5,13.5,false);mode='walk';
  for(const id of ['start','dialogue'])$(id).classList.add('hidden');
  window.endRun=(score,wave,reason='defeat')=>{const r=PostGame.run();r.score=r.bankedScore=score;r.completedWave=wave;r.kills=wave*5;PostGame.finishRun(reason)};
  PostGame.openBriefing();
 },{HOST,KEY});

 await check('o briefing do calabouço pede o nome antes de entrar',async()=>{
  assert.equal(await page.isVisible('#rk1Name'),true);assert.equal(await page.inputValue('#rk1Name'),'');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'rk1Name');assert.match(await text('#rk1Form'),/visível para todos/);
  await page.click('#postBeginRun');assert.match(await text('#rk1Status'),/Escreva seu nome/);assert.equal(await page.evaluate(()=>PostGame.active()),false);
  assert.equal(requests.length,0);return await text('#rk1Status');
 });

 await check('digitar o nome não aciona atalhos do jogo (espaço, M, J, E, setas)',async()=>{
  await page.click('#rk1Name');await page.keyboard.type('Ryu me je');await page.keyboard.press('ArrowLeft');await page.keyboard.type('!');
  const r=await page.evaluate(()=>({value:$('rk1Name').value,mode,page:menuPage10,focus:document.activeElement.id}));
  assert.deepEqual(r,{value:'Ryu me j!e',mode:'overlay',page:'postgame',focus:'rk1Name'});return r;
 });

 await check('nome inválido é recusado; nome válido com Enter inicia a expedição',async()=>{
  await page.keyboard.press('Enter');assert.match(await text('#rk1Status'),/2 a 16 caracteres/);assert.equal(await page.evaluate(()=>PostGame.active()),false);
  await page.fill('#rk1Name','Ryuchi');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>PostGame.active()),true);assert.equal(requests.length,0);return await page.evaluate(()=>RankingV1.player().name);
 });

 await check('no fim da expedição, a pontuação é enviada e o ranking completo aparece no resultado',async()=>{
  await page.evaluate(()=>endRun(5200,7));await until(()=>/de 3/.test($('rk1Status')?.textContent||''));
  const sent=requests.filter(r=>r.name==='enviar_recorde');assert.equal(sent.length,1);
  assert.deepEqual({mode:sent[0].body.p_mode,name:sent[0].body.p_name,score:sent[0].body.p_score,wave:sent[0].body.p_wave},{mode:'solo',name:'Ryuchi',score:5200,wave:7});
  assert.equal(sent[0].headers.apikey,KEY);
  assert.match(await text('#overlayInner h2'),/5\.200 pontos · Ryuchi/);
  const rows=await page.$$eval('#rk1List li',li=>li.map(l=>({me:l.classList.contains('me'),text:l.textContent})));
  assert.equal(rows.length,3);assert.match(rows[1].text,/#2Ryuchi5\.200onda 7/);assert(rows[1].me&&!rows[0].me);
  assert.match(await text('#rk1Status'),/Ryuchi: #2 de 3/);
  for(const id of ['postRunAgain','postRunMap','postRunClose'])assert.equal(await page.isVisible('#'+id),true);
  return rows.map(r=>r.text);
 });

 await check('nomes com HTML aparecem como texto',async()=>{
  assert.equal(await page.$$eval('#rk1List img',n=>n.length),0);assert.match(await text('#rk1List'),/<img src=x/);return true;
 });
 await page.screenshot({path:path.join(out,'ranking_resultado.png')});

 await check('NOVA TENTATIVA segue com o mesmo nome; sem internet a pontuação espera e sai depois',async()=>{
  await page.click('#postRunAgain');assert.equal(await page.evaluate(()=>PostGame.active()),true);assert.equal(await page.evaluate(()=>RankingV1.player().name),'Ryuchi');
  offline=true;await page.evaluate(()=>endRun(6100,8,'exit'));await until(()=>/Sem conexão/.test($('rk1Status')?.textContent||''));
  assert.equal(await page.evaluate(()=>RankingV1.pending().length),1);
  offline=false;await page.evaluate(()=>RankingV1.sync());assert.equal(await page.evaluate(()=>RankingV1.pending().length),0);
  assert.equal(db.find(r=>r.name==='Ryuchi').score,6100);return true;
 });

 await check('outra pessoa no mesmo aparelho entra no ranking separada',async()=>{
  await page.evaluate(()=>{closeOverlay();PostGame.openBriefing()});assert.equal(await page.inputValue('#rk1Name'),'Ryuchi');await page.fill('#rk1Name','Belga');await page.click('#postBeginRun');
  await page.evaluate(()=>endRun(3000,5));await until(()=>/Belga: #4 de 4/.test($('rk1Status')?.textContent||''));
  const names=db.filter(r=>r.mode==='solo').map(r=>r.name);assert(names.includes('Ryuchi')&&names.includes('Belga'));
  assert.notEqual(db.find(r=>r.name==='Ryuchi').id,db.find(r=>r.name==='Belga').id);return names;
 });

 await check('menu de sistema abre o ranking, com abas SOLO e CO-OP',async()=>{
  await page.evaluate(()=>{closeOverlay();openSystem()});assert.equal(await page.isVisible('#rk1System'),true);
  await page.click('#rk1System');await until(()=>/Belga/.test($('rk1List')?.textContent||''));
  await page.click('#rk1Tab_coop');await until(()=>/Duo/.test($('rk1List').textContent));
  assert.match(await text('#overlayInner h2'),/CO-OP/);assert.match(await text('#rk1Status'),/Conclua uma expedição/);return await text('#rk1List');
 });

 await check('TIRAR MEU NOME apaga a pessoa do ranking e deste aparelho',async()=>{
  await page.click('#rk1Leave');await until(()=>!document.getElementById('rk1Leave')&&/Escreva seu nome/.test($('rk1Status')?.textContent||''));
  assert(!db.some(r=>r.name==='Belga'));assert(db.some(r=>r.name==='Ryuchi'));
  await page.click('#rk1Back');await page.evaluate(()=>PostGame.openBriefing());assert.equal(await page.inputValue('#rk1Name'),'');return db.length;
 });

 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'BROWSER.json'),JSON.stringify({checks,requests:requests.length,physicalHardware:false},null,2)+'\n');
 await browser.close();console.log({passed:checks.length});
})().catch(async e=>{console.error(e);console.error(errors);if(browser)await browser.close();process.exit(1)});
