/* Fase 4 da narrativa: leitura, narrador como cenário, falas de combate e consequências.
 *   node qa/narrativa_fase4.cjs [build.html ou URL]
 * Roda no jogo de verdade (navegador headless), com teclado e cliques reais.
 * Grava qa/narrativa/FASE4.json e capturas em qa/narrativa/.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const input=process.argv[2]||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html');
const url=(/^(file|https?):/.test(input)?input:pathToFileURL(input).href);
const out=path.join(root,'qa/narrativa');fs.mkdirSync(out,{recursive:true});
const campaign=JSON.parse(fs.readFileSync(path.join(root,'qa/beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const checks=[],errors=[];
async function check(name,fn){const detail=await fn();checks.push({name,detail});console.log('OK · '+name)}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear()}catch{}});
    await page.goto(url+'?semente=7',{waitUntil:'load',timeout:180000});
    await page.locator('#startNew').click();
    await page.waitForFunction(()=>typeof Narrativa!=='undefined'&&document.querySelector('.leitura-barra'),null,{timeout:30000});
    // Estado limpo de caminhada a partir de um save real da campanha.
    await page.waitForTimeout(1500);
    await page.evaluate(save=>{for(let i=0;i<40&&mode==='dialogue';i++)Narrativa.pularCena();if(mode==='overlay')closeOverlay();
      G=normalizeSave(copy(save));buildMaps();setArea(G.area,G.x,G.y,false);mode='walk'},campaign);
    // Cenas automáticas da área podem começar logo depois: espera o jogo assentar.
    for(let estavel=0,i=0;estavel<4&&i<40;i++){await page.waitForTimeout(300);
      const m=await page.evaluate(()=>{if(mode==='dialogue')Narrativa.pularCena();if(mode==='overlay')closeOverlay();const was=mode;mode='walk';return was});
      estavel=m==='walk'?estavel+1:0}
    const resto=await page.evaluate(()=>({mode,words:$('words').textContent}));if(resto.mode!=='walk')throw Error('estado inicial: '+JSON.stringify(resto));

    await check('Dados: seis personagens com muitas falas; trocas de no máximo duas falas',async()=>{
      const r=await page.evaluate(()=>{const D=Narrativa.dados,per={},longas=[];let conv=0;
        for(const g of Object.values(D.falas))for(const [w,l] of Object.entries(g)){per[w]=(per[w]||0)+l.length;for(const t of l)if(t.length>90)longas.push(t)}
        let maior=0;for(const c of D.conversas){conv+=c.falas.length;maior=Math.max(maior,c.falas.length);for(const [w,t] of c.falas){if(!D.personagens[w])throw Error('quem? '+w);per[w]++;if(t.length>90)longas.push(t)}}
        return{per,conversas:D.conversas.length,linhasConversa:conv,maior,longas}});
      for(const id of ['franco','ryuchi','alt','katana','synth','percussion'])assert(r.per[id]>=70,id+' '+r.per[id]);
      assert(r.conversas>=60,'conversas '+r.conversas);assert(r.maior<=2,'troca com mais de duas falas');assert.equal(r.longas.length,0,r.longas.join(' | '));
      return r;
    });

    await check('Digitação: o jogador completa a fala; o código avança uma fala por chamada',async()=>{
      await page.evaluate(()=>{Narrativa.definir('vel','lento');talk([{who:'franco',t:'Primeira fala bem comprida para dar tempo de digitar devagar.'},{who:'ryuchi',t:'Segunda fala.'}])});
      const a=await page.evaluate(()=>({digitando:Narrativa.digitando(),texto:$('words').textContent,visivel:$('words').querySelector('span')?.textContent.length??-1}));
      assert(a.digitando&&a.texto.startsWith('Primeira')&&a.visivel<a.texto.length,JSON.stringify(a));
      await page.keyboard.press('Space');
      const b=await page.evaluate(()=>({digitando:Narrativa.digitando(),texto:$('words').textContent}));
      assert(!b.digitando&&b.texto.startsWith('Primeira'),'espaço deveria completar: '+JSON.stringify(b));
      await page.keyboard.press('Space');
      const c=await page.evaluate(()=>$('words').textContent);assert.equal(c,'Segunda fala.');
      const fim=await page.evaluate(()=>{advanceDialogue();return{mode,words:$('words').textContent,quem:$('speaker').textContent,area:G.area}});
      assert.equal(fim.mode,'walk',JSON.stringify(fim));
      // Chamada do código no meio da digitação avança direto (robôs e testes).
      await page.evaluate(()=>talk([{who:'franco',t:'Uma fala longa que ainda está sendo digitada pelo efeito.'},{who:'franco',t:'Outra.'}]));
      await page.evaluate(()=>advanceDialogue());
      assert.equal(await page.evaluate(()=>$('words').textContent),'Outra.');
      await page.evaluate(()=>{advanceDialogue()});
      return{a,b,c};
    });

    await check('Velocidade do texto: V alterna e a escolha fica guardada',async()=>{
      await page.evaluate(()=>{Narrativa.definir('vel','rapido');talk([{who:'franco',t:'Teste de velocidade.'}])});
      const seq=[];for(let i=0;i<4;i++){await page.keyboard.press('v');seq.push(await page.evaluate(()=>Narrativa.opcoes().vel))}
      const guardado=await page.evaluate(()=>JSON.parse(localStorage.getItem('torii_leitura_vel')));
      const rotulo=await page.locator('#dialogue [data-leitura="vel"]').textContent();
      assert.deepEqual(seq,['instantaneo','lento','normal','rapido']);assert.equal(guardado,'rapido');assert(rotulo.includes('RÁPIDO'));
      await page.evaluate(()=>advanceDialogue());
      return{seq,rotulo};
    });

    await check('Avanço automático: O liga, a fala passa sozinha e o botão mostra o estado',async()=>{
      await page.evaluate(()=>{Narrativa.definir('vel','instantaneo');talk([{who:'franco',t:'Curta.'},{who:'ryuchi',t:'Segunda curta.'}])});
      await page.keyboard.press('o');
      const pressed=await page.locator('#dialogue [data-leitura="auto"]').getAttribute('aria-pressed');
      await page.waitForFunction(()=>$('words').textContent==='Segunda curta.',null,{timeout:5000});
      await page.waitForFunction(()=>mode==='walk',null,{timeout:5000});
      await page.keyboard.press('o');
      return{pressed,auto:await page.evaluate(()=>Narrativa.opcoes().auto)};
    });

    await check('Histórico: L abre no diálogo sem avançar; fora do diálogo pausa e volta',async()=>{
      await page.evaluate(()=>talk([{who:'franco',t:'Fala para o histórico.'},{who:'ryuchi',t:'Depois dela.'}]));
      await page.keyboard.press('l');
      const aberto=await page.evaluate(()=>({aberto:Narrativa.historicoAberto(),mode,texto:document.querySelector('#leituraHistorico .lh-lista').textContent,words:$('words').textContent}));
      assert(aberto.aberto&&aberto.mode==='dialogue'&&aberto.texto.includes('Fala para o histórico.')&&aberto.words==='Fala para o histórico.',JSON.stringify(aberto));
      await page.keyboard.press('e');
      assert.equal(await page.evaluate(()=>$('words').textContent),'Fala para o histórico.','tecla de avançar com histórico aberto não avança');
      assert.equal(await page.evaluate(()=>Narrativa.historicoAberto()),true);
      await page.screenshot({path:path.join(out,'historico.png')});
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(()=>Narrativa.historicoAberto()),false);
      await page.evaluate(()=>{advanceDialogue();advanceDialogue()});
      await page.keyboard.press('l');
      const pausa=await page.evaluate(()=>mode);
      await page.keyboard.press('l');
      const volta=await page.evaluate(()=>mode);
      assert.equal(pausa,'overlay');assert.equal(volta,'walk');
      return{pausa,volta};
    });

    await check('Pular cena: atravessa cenas encadeadas, guarda no histórico e para numa escolha',async()=>{
      await page.evaluate(()=>{window.__fim=0;talk([{who:'franco',t:'Um.'},{who:'ryuchi',t:'Dois.'},{who:'franco',t:'Três.'}],()=>talk([{who:'ryuchi',t:'Quatro.'}],()=>{window.__fim=1}))});
      await page.locator('#dialogue [data-leitura="pular"]').click();
      const r=await page.evaluate(()=>({mode,fim:window.__fim,puladas:Narrativa.historico().filter(h=>h.tipo==='pulada').map(h=>h.texto)}));
      assert(r.mode==='walk'&&r.fim===1&&r.puladas.includes('Três.'),JSON.stringify(r));
      const esc=await page.evaluate(()=>{talk([{who:'franco',t:'Antes da escolha.'}],()=>chooseDialogue('Pergunta de teste?',[{label:'A',value:'traveler',lines:[]},{label:'B',value:'silence',lines:[]}]));Narrativa.pularCena();return mode});
      assert.equal(esc,'overlay','a escolha não pode ser pulada');
      await page.evaluate(()=>{closeOverlay();mode='walk';G.choices.ema=undefined});
      return{...r,escolha:esc};
    });

    await check('Narrador como cenário: legenda no topo, com efeito, sem ocupar a caixa de diálogo',async()=>{
      const r=await page.evaluate(()=>{
        talk([{who:'narrator',t:'Quando o último eco cai, Ryuchi Percussionista não segue para a saída. Ele escuta três notas escapando de uma sala de controle que deveria estar vazia.'},{who:'percussion',t:'Tem alguém improvisando atrás dessa porta. Isso não é retorno da máquina.'}]);
        return{legenda:document.getElementById('cenaLegenda')?.textContent,ativa:Narrativa.legendaAtiva(),caixa:$('words').textContent,quem:$('speaker').textContent};
      });
      assert.equal(r.legenda,'Três notas escapam de uma sala de controle que devia estar vazia.');
      assert(r.ativa&&r.caixa.startsWith('Tem alguém'),JSON.stringify(r));
      await page.screenshot({path:path.join(out,'legenda-cenario.png')});
      await page.evaluate(()=>{advanceDialogue()});
      // Cena só de narrador: não abre caixa nenhuma.
      const so=await page.evaluate(()=>{talk([{who:'narrator',t:'O viajante retira a máscara.'}]);return mode});
      assert.equal(so,'walk');
      return r;
    });

    await check('Falas de combate: balão sobre quem fala, conversa entre versões e desligar funciona',async()=>{
      const r=await page.evaluate(()=>{
        G.formation=['franco','alt','synth'];G.active='franco';mode='walk';
        Narrativa.definir('barks',true);
        Narrativa.forcar('inicio','synth');Narrativa.despachar();
        const um=Narrativa.barks().ativos.slice();
        const conv=Narrativa.forcar('conversa:andando');Narrativa.despachar();
        const depois=Narrativa.barks();
        Narrativa.definir('barks',false);const antes=depois.contagem;Narrativa.forcar('inicio','franco');Narrativa.despachar();
        const desligado=Narrativa.barks().contagem===antes;
        Narrativa.definir('barks',true);
        return{um,conv,quem:depois.ativos.map(a=>a.quem),desligado,el:document.querySelectorAll('#barksCamada .bark').length};
      });
      assert(r.um.length===1&&r.um[0].quem==='synth'&&r.um[0].texto.startsWith('SYNTH'),JSON.stringify(r.um));
      assert(r.conv&&r.quem.length>=2,'conversa: '+JSON.stringify(r));
      assert(r.desligado);
      await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'falas-combate.png')});
      return r;
    });

    await check('Falas de combate disparam pelo estado do jogo (perigo, troca de líder) sem parar o jogo',async()=>{
      const r=await page.evaluate(()=>{
        document.querySelectorAll('#barksCamada .bark').forEach(b=>b.remove());
        G.formation=['franco','ryuchi','katana'];G.active='franco';mode='walk';for(const id of G.formation){G.maxhp[id]=G.maxhp[id]||40;G.hp[id]=G.maxhp[id]}
        tick+=100;Narrativa.ciclo();const c0=Narrativa.barks().contagem;
        tick+=10;G.hp.ryuchi=Math.floor(G.maxhp.ryuchi*.2);Narrativa.ciclo();Narrativa.despachar();
        const perigo=Narrativa.barks().contagem>c0;
        tick+=10;G.hp.ryuchi=G.maxhp.ryuchi;Narrativa.ciclo();
        tick+=10;const c1=Narrativa.barks().contagem;let troca=false;
        for(let i=0;i<8&&!troca;i++){G.active=G.active==='franco'?'katana':'franco';tick+=10;Narrativa.ciclo();Narrativa.despachar();troca=Narrativa.barks().contagem>c1}
        return{perigo,troca,mode};
      });
      assert(r.perigo&&r.troca&&r.mode==='walk',JSON.stringify(r));
      return r;
    });

    for(const rota of ['usina','canal']){
      await check('Rota '+rota+' primeiro: rádio no Mar de Nuvens e ajuda na luta contra O Silêncio',async()=>{
        const r=await page.evaluate(([save,rota])=>{
          G=normalizeSave(copy(save));buildMaps();G.c3={...C3.defaults(),...G.c3,firstDestination:rota};G.choices={...(G.choices||{})};delete G.choices.f4Nuvens;delete G.choices.f4Suprimentos;
          mode='walk';tick+=100;G.area='distortion_district';Narrativa.ciclo();
          G.area='cloud_sea';tick+=10;Narrativa.ciclo();Narrativa.despachar();
          const radio=Narrativa.barks().ativos.filter(a=>a.radio).map(a=>a.texto);
          const pot0=G.potions;C3.spawnSilence();const b1={hp:bossActor.hp,max:bossActor.max??bossActor.maxhp??null};const pot1=G.potions;
          C3.spawnSilence();const pot2=G.potions;
          return{radio,nuvens:G.choices.f4Nuvens,pot0,pot1,pot2,boss:b1,toast:$('toast').textContent};
        },[campaign,rota]);
        assert.equal(r.nuvens,rota);assert(r.radio.length>=1,'rádio: '+JSON.stringify(r));
        if(rota==='usina'){assert(r.toast.includes('USINA'));assert(r.boss.max>0&&r.boss.hp<=Math.round(r.boss.max*.88),JSON.stringify(r.boss));assert.equal(r.pot1,r.pot0)}
        else{assert(r.toast.includes('CANAL'));assert.equal(r.pot1,r.pot0+2);assert.equal(r.pot2,r.pot1,'suprimentos só uma vez')}
        return r;
      });
    }

    for(const ema of ['traveler','silence']){
      await check('Resposta à Ema ('+ema+') volta no confronto e no fim',async()=>{
        const r=await page.evaluate(ema=>{
          closeOverlay?.();mode='walk';G.choices.ema=ema;G.c3.firstDestination='canal';const lidas=[];
          const ler=()=>{let n=0;while(mode==='dialogue'&&n++<40){lidas.push($('words').textContent);advanceDialogue()}};
          C3.scene('C3_023',()=>{});ler();C3.scene('C3_026',()=>{});ler();
          return lidas;
        },ema);
        const D=await page.evaluate(()=>Narrativa.dados.consequencias);
        const confronto=D.ema[ema].confronto[0].t,final=D.ema[ema].final[0].t,aliado=D.rota.canal.final[0].t;
        assert(r.includes(confronto),'confronto ausente');assert(r.includes(final),'final ausente');assert(r.includes(aliado),'aliado da rota ausente');
        assert(r.indexOf(final)<r.indexOf(aliado),'Ema antes do aliado');
        return{falas:r.length};
      });
    }

    await check('Celular deitado: barra de leitura cabe na caixa de diálogo e os botões têm 36 px',async()=>{
      const m=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
      m.on('pageerror',e=>errors.push('mobile: '+e.message));
      await m.goto(url,{waitUntil:'load',timeout:180000});await m.locator('#startNew').tap();
      await m.waitForFunction(()=>document.querySelector('.leitura-barra')&&mode==='dialogue',null,{timeout:30000});
      const r=await m.evaluate(()=>{const d=$('dialogue').getBoundingClientRect();return[...document.querySelectorAll('.leitura-barra button')].map(b=>{const x=b.getBoundingClientRect();return{t:b.textContent,h:Math.round(x.height),dentro:x.left>=d.left-1&&x.right<=d.right+1&&x.right<=innerWidth&&x.bottom<=innerHeight}})});
      await m.screenshot({path:path.join(out,'celular-dialogo.png')});
      const words0=await m.evaluate(()=>$('words').textContent);
      await m.locator('.leitura-barra [data-leitura="vel"]').tap();
      const words1=await m.evaluate(()=>$('words').textContent);
      await m.close();
      for(const b of r)assert(b.h>=36&&b.dentro,JSON.stringify(b));
      assert.equal(words1,words0,'tocar num botão da barra não avança a fala');
      return r;
    });

    assert.deepEqual(errors,[],errors.join('\n'));
  }catch(e){errors.push(String(e&&e.stack||e));process.exitCode=1}
  finally{
    fs.writeFileSync(path.join(out,'FASE4.json'),JSON.stringify({build:path.basename(input),checks,errors},null,1)+'\n');
    console.log(JSON.stringify({aprovadas:checks.length,erros:errors.slice(0,3)}));
    await browser.close();
  }
})();
