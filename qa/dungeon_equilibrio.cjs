/* Equilíbrio dos personagens e do co-op na Fenda das Ressonâncias.
 *   node qa/dungeon_equilibrio.cjs http://127.0.0.1:8771/
 * Robô com regras fixas (o mesmo do qa/dungeon_playtest.cjs, com o jogador 2 também
 * mantendo distância com Arqueiro e Sintetizador e esquivando), sorte com semente:
 * o resultado é determinístico para a mesma build.
 *   - solo: cada personagem sozinho na formação, 8 sementes;
 *   - dupla: a mesma dupla no solo (troca de líder quando um cai) e no co-op.
 * Falha se algum personagem ficar mais de 15% abaixo da média de ondas no solo,
 * ou se o co-op ficar fora de 85%–120% das ondas da mesma dupla no solo.
 * Mede o robô, não pessoas: serve para comparar personagens e versões entre si.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const root=path.resolve(__dirname,'..'),url=process.argv[2]||'http://127.0.0.1:8771/';
const progress=JSON.parse(fs.readFileSync(path.join(root,'qa/beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const HEROES=['franco','ryuchi','alt','katana','synth','percussion'],SEEDS=[11,23,97,131,257,409,733,977];
const PARTNER={franco:'ryuchi',ryuchi:'franco',alt:'katana',katana:'alt',synth:'percussion',percussion:'synth'};
const LIMIT_S=1500,MIN_SHARE=.85,COOP_RANGE=[.85,1.2];
function install(original){
 window.Equilibrio={
  pad(i){return{index:i,id:'Equilibrio pad',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))}},
  fixture(kind,hero,partner,seed){const coop=kind==='coop';G=normalizeSave(copy(original));buildMaps();G.formation=kind==='solo'?[hero]:[hero,partner];G.active=hero;G.potions=12;G.resonance=27;menuOrigin10=menuPage10=null;mode='walk';keys={};touchDir={};attackHeld=false;__pads=coop?[this.pad(0),this.pad(1)]:[];C3.pad.pads=__pads;C3.coop.member=coop?partner:null;Input121.wasCoop=false;Input121.focused=true;PostGame.clearCombat();setArea('last_torii',13.5,13.5,false);for(const id of ['start','overlay','dialogue'])$(id).classList.add('hidden');$('cinema').style.display='none';$('hud').style.display='block';ToriiSorte.semear(seed);PostGame.startDungeon(seed);transitionAlpha=0;},
  bot(seconds){let frame=0,nextSkill=0;const ranged=id=>['alt','synth'].includes(id);
   while(PostGame.active()&&frame<seconds*30){const r=PostGame.run(),dt=1/30;const e=[...current.enemies,bossActor].filter(e=>e&&e.hp>0).sort((a,b)=>Math.hypot(a.x-G.x,a.y-G.y)-Math.hypot(b.x-G.x,b.y-G.y))[0];keys.w=keys.a=keys.s=keys.d=false;keys.Shift=true;
    if(e&&r.phase==='fight'){const dx=e.x-G.x,dy=e.y-G.y,d=Math.max(.001,Math.hypot(dx,dy));G.aim091=[dx/d,dy/d];G.dir=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';if(d>(ranged(G.active)?3.8:1.6)){keys.w=dy<-.2;keys.s=dy>.2;keys.a=dx<-.2;keys.d=dx>.2}if(e.wind>0&&d<2.5)dodgeAction();attackAction();if(frame>=nextSkill){skillAction();advancedSkill();if(G.resonance>=40)duoAction();nextSkill=frame+120}}
    if(C3.coopActive()){const p=C3.coop,t=[...current.enemies,bossActor].filter(e=>e&&e.hp>0).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];const pad=__pads[1];pad.axes=[0,0,0,0];if(t){const dx=t.x-p.x,dy=t.y-p.y,d=Math.max(.001,Math.hypot(dx,dy));p.dir=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';if(d>(ranged(p.member)?3.8:1.7))pad.axes=[dx/d,dy/d,0,0];if(t.wind>0&&d<2.5)C3.coopDodge(pad);C3.coopAttack(pad);if(frame%120===0)C3.coopSkill(pad)}}
    C3.pollControllers(tick*1000);tick+=dt;update(dt);frame++;
    if(r.phase==='rest'){keys.w=keys.a=keys.s=keys.d=false;document.querySelector('[data-respite]:not([disabled]),[data-echo-card]')?.click()}
   }keys={};const r=PostGame.run(),last=G.postgame.lastRun;return{seconds:Math.round(frame/30),wave:r?r.completedWave:last.wave,ended:!PostGame.active()}}
 };
}
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});const errors=[],rows=[];
 try{const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__pads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>__pads})});
  await page.goto(url,{waitUntil:'load',timeout:180000});await page.evaluate(install,progress);
  for(const kind of ['solo','dupla','coop'])for(const hero of HEROES)for(const seed of SEEDS){
   const r=await page.evaluate(({kind,hero,partner,seed,limit})=>{if(PostGame.active())PostGame.finishRun();closeOverlay();Equilibrio.fixture(kind,hero,partner,seed);return Equilibrio.bot(limit)},{kind,hero,partner:PARTNER[hero],seed,limit:LIMIT_S});
   rows.push({kind,hero,partner:kind==='solo'?null:PARTNER[hero],seed,...r});
  }
 }finally{await browser.close()}
 const avg=(kind,hero)=>mean(rows.filter(r=>r.kind===kind&&r.hero===hero).map(r=>r.wave));
 const solo=Object.fromEntries(HEROES.map(h=>[h,+avg('solo',h).toFixed(1)])),soloMean=mean(Object.values(solo));
 const pairs=Object.fromEntries(HEROES.map(h=>[h+'+'+PARTNER[h],{dupla:+avg('dupla',h).toFixed(1),coop:+avg('coop',h).toFixed(1)}]));
 const dupla=mean(HEROES.map(h=>avg('dupla',h))),coop=mean(HEROES.map(h=>avg('coop',h)));
 const checks={
  personagensDentroDe15PorCento:HEROES.every(h=>solo[h]>=soloMean*MIN_SHARE),
  coopIgualAoSoloComAMesmaDupla:coop/dupla>=COOP_RANGE[0]&&coop/dupla<=COOP_RANGE[1],
  semErros:!errors.length};
 const report={url,method:'Robô de regras fixas, 30 Hz, sementes fixas; ondas concluídas até a derrota ou '+LIMIT_S+' s simulados. Mede o robô, não a diversão nem a habilidade humana.',solo:{porPersonagem:solo,media:+soloMean.toFixed(1),minimo:+(soloMean*MIN_SHARE).toFixed(1)},duplas:pairs,coopSobreDupla:+(coop/dupla).toFixed(2),checks,errors,rows};
 const out=path.join(root,'qa/dungeon-v3');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'EQUILIBRIO.json'),JSON.stringify(report,null,1)+'\n');
 console.log(JSON.stringify({solo,media:report.solo.media,duplas:pairs,coopSobreDupla:report.coopSobreDupla,checks,errors:errors.slice(0,3)}));
 if(Object.values(checks).some(x=>!x))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
