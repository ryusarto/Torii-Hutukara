/* Integration against the real build. Usage: node qa/lumi_mobile_fenda.cjs URL [results.json] */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const save=JSON.parse(fs.readFileSync(path.join(__dirname,'beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const url=process.argv[2];
const out=process.argv[3];
const result={checks:[],errors:[],screens:[]};

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,
   userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const page=await context.newPage();
  page.on('pageerror',error=>result.errors.push(error.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const shot=async name=>{
   if(!out)return;
   await page.locator('#playtestEntry').waitFor({state:'detached'});
   await page.waitForFunction(()=>transitionAlpha===0);
   const filename=path.join(path.dirname(out),name+'.png');
   await page.screenshot({path:filename});result.screens.push(name+'.png');
  };
  const check=async (name,fn)=>{
   const detail=await fn();result.checks.push({name,detail});console.log('OK · '+name);
  };
  await page.locator('#startOptions10').tap();
  await page.locator('#preview10').tap();
  await page.locator('#dif_normal').tap();
  await check('Lumi abre pelo diálogo do NPC e a gravação original é decodificada',async()=>{
   await page.evaluate(()=>{
    if(mode==='dialogue')Narrativa.pularCena();
    setArea('voices',26,18,false);
    current.npcs.find(n=>n.id==='lumi').say();
    Narrativa.pularCena();
   });
   await page.locator('#lumiListen').tap();
   await page.waitForFunction(()=>$('lumiAudioStatus').textContent==='Trecho da gravação · Veracidade');
   const detail=await page.evaluate(()=>({duration:Music11.buffer.get('veracidade')?.duration,source:!!ALBUM11.veracidade}));
   assert(detail.duration>90&&detail.source);
   return detail;
  });
  await check('Sem áudio, pista visível, nota errada e recompensa única',async()=>{
   await page.evaluate(()=>{audioEnabled=false});
   await page.locator('#lumiShow').tap();
   assert.match(await page.locator('#lumiHint').textContent(),/Dó♯ → Ré♯ → Si♭/);
   await page.locator('[data-vnote="0"]').tap();
   assert.match(await page.locator('#lumiProgress').textContent(),/não encaixou/);
   for(const n of [1,2,0])await page.locator('[data-vnote="'+n+'"]').tap();
   assert.match(await page.locator('#lumiProgress').textContent(),/Frase completa/);
   await shot('lumi-mobile');
   const before=await page.evaluate(()=>G.potions);
   await page.locator('#lumiFinish').tap();
   const after=await page.evaluate(()=>({potions:G.potions,lumi:G.flags.lumiSong,violin:G.flags.violin11}));
   assert.deepEqual(after,{potions:before+1,lumi:true,violin:true});
   const revisit=await page.evaluate(()=>{Narrativa.pularCena();lumiNPC();Narrativa.pularCena();return{potions:G.potions,mode}});
   assert.equal(revisit.potions,after.potions);assert.equal(revisit.mode,'walk');
   return after;
  });
  await check('Um aviso real da fase III congela ao pausar e resolve ao retomar',async()=>{
   const detail=await page.evaluate(()=>{
    if(mode==='dialogue')Narrativa.pularCena();
    G.flags.bass=true;G.difficulty='normal';setArea('ruins',35.4,18.5,false);spawnBossFight();
    if(mode==='dialogue')Narrativa.pularCena();
    bossActor.hp=bossActor.max*.2;bossActor.cd=0;
    let frames=0;
    while(!ToriiDificuldade.perigos.length&&frames++<1800){act.invuln=3;tick+=1/60;update(1/60)}
    const first=ToriiDificuldade.perigos[0];
    if(!first)return {frames,mode};
    const remaining=first.time;
    openSystem();for(let i=0;i<90;i++)update(1/60);
    const froze=ToriiDificuldade.perigos.includes(first)&&first.time===remaining;
    closeOverlay();update(1/60);
    const advancing=first.time<remaining;
    G.x=first.x;G.y=first.y;act.invuln=0;
    // Advance only the same warning, leaving position under the marked danger.
    const hp=G.hp[G.active];
    for(let i=0;i<120&&ToriiDificuldade.perigos.includes(first);i++)update(1/60);
    return{remaining,froze,advancing,resolved:!ToriiDificuldade.perigos.includes(first),damage:hp-G.hp[G.active]};
   });
   assert(detail.remaining>0&&detail.froze&&detail.advancing&&detail.resolved&&detail.damage>0,JSON.stringify(detail));
   return detail;
  });
  await check('Fenda explica regras e separa suspensão de encerramento',async()=>{
   await page.evaluate(save=>{
    if(mode==='overlay')closeOverlay();bossActor=battle=null;
    G=normalizeSave(save);buildMaps();setArea('last_torii',13.5,13.5,false);openSystem();
   },save);
   await page.locator('#postSystemDungeon').tap();
   assert.match(await page.locator('#overlayInner').innerText(),/Fitas ficam fora da Fenda/);
   assert.match(await page.locator('#overlayInner').innerText(),/onda atual recomeça/);
   await page.locator('#postBeginRun').tap();
   assert(await page.evaluate(()=>PostGame.active()));
   const before=await page.evaluate(()=>{
    const r=PostGame.run(),leader=G.active;
    const start={leader,hp:r.hpStart[leader],res:r.resonanceStart,score:r.bankedScore,wave:r.wave};
    G.hp[leader]-=9;G.resonance=3;r.score+=100;r.kills++;r.encore=true;
    openSystem();return start;
   });
   assert(await page.locator('#postSystemDungeon').isVisible());
   await page.locator('#postSystemSuspend').tap();
   assert.match(await page.locator('#overlayInner').innerText(),/ressonância e os pontos do início/);
   await page.locator('#postSuspendConfirm').tap();
   await page.locator('#startContinue').tap();
   await page.locator('#postResumeRun').waitFor();
   const after=await page.evaluate(()=>{
    const r=PostGame.run();
    return{leader:G.active,hp:G.hp[G.active],res:G.resonance,score:r.score,wave:r.wave,encore:r.encore,mode};
   });
   assert.deepEqual(after,{...before,encore:false,mode:'overlay'});
   await page.locator('#postResumeRun').tap();
   return {before,after};
  });
  await check('A Fenda dispensa falas de fita e o mobile é legível em sete tamanhos',async()=>{
   await page.waitForFunction(()=>mode==='action'&&current.enemies.some(e=>e.hp>0));
   const allyAlpha=await page.evaluate(()=>{
    const original=drawActor;
    let alpha=1;
    drawActor=()=>{alpha=ctx.globalAlpha};
    try{drawMobileFollower121(partyMembers().find(id=>id!==G.active),{x:G.x+.5,y:G.y,dir:G.dir},false)}
    finally{drawActor=original}
    return alpha;
   });
   assert(allyAlpha>0&&allyAlpha<.5);
   const detail=[];
   for(const [width,height] of [[320,568],[360,640],[390,844],[412,915],[568,320],[640,360],[844,390]]){
    await page.setViewportSize({width,height});
    await page.waitForFunction(([w,h])=>Math.abs(innerWidth-w)<=1&&Math.abs(innerHeight-h)<=1&&Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--mobile-height'))-h)<=1,[width,height]);
    const row=await page.evaluate(()=>{
     G.resonance=18;act.skill=2.2;act.skillX=4.8;act.duo=0;act.dashCD=.7;
     updateMobileReadout121();
     const r=$('game').getBoundingClientRect();
     const states=Object.fromEntries([...document.querySelectorAll('#mobileDeck121 [data-mobile-action]')].map(el=>[el.dataset.mobileAction,el.getAttribute('aria-label')]));
     const buttons=[...document.querySelectorAll('#mobileDeck121 button')];
     const clipped=buttons.some(el=>{const a=el.getBoundingClientRect();return a.right>innerWidth+.7||a.bottom>innerHeight+.7||a.left<-.7||a.top<-.7});
     const title=$('mobileCharge121').textContent;
     return{fraction:r.height/innerHeight,worldFraction:Math.min(1,current.h*T/VH)*r.height/innerHeight,viewport:[innerWidth,innerHeight,VW,VH],frame:$('frame').getBoundingClientRect().height,ratio:getComputedStyle($('frame')).aspectRatio,states,clipped,title,noFita:!$('tapeButton')?.getClientRects().length};
    });
    assert(!row.clipped&&row.title.includes('18/100')&&row.noFita,JSON.stringify(row));
    assert.match(row.states.skill,/2,2 s/);assert.match(row.states.advanced,/4,8 s/);assert.match(row.states.signature,/40/);
    if(width<height)assert(row.fraction>=.53,JSON.stringify(row));
    if(width===390)assert(row.worldFraction>=.60,JSON.stringify(row));
    if(width===390||width===844)await shot('fenda-'+width+'x'+height);
    detail.push({width,height,...row});
   }
   const noFita=await page.evaluate(()=>{
    Input121.mobile=false;
    for(let n=0;n<36;n++){Narrativa.forcar('perigo','franco');Narrativa.despachar();if(Narrativa.barks().ativos.some(a=>/\bfitas?\b/i.test(a.texto)))return false}
    return true;
   });
   assert(noFita);
   return detail;
  });
  assert.deepEqual(result.errors,[]);
 }finally{await browser.close()}
})().catch(error=>{result.failure=error.stack;console.error(error);process.exitCode=1})
 .finally(()=>{if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n')});
