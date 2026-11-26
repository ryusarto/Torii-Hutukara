/* Fase 2: níveis de dificuldade, fases dos chefes, inimigos novos, encontros e impacto.
 *   node qa/dificuldade_unit.cjs [build.html ou URL]
 * Roda no jogo de verdade (navegador headless). Grava qa/dificuldade/UNIT.json.
 * O nível História precisa continuar igual ao jogo de antes da Fase 2.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const root=path.resolve(__dirname,'..'),v=JSON.parse(fs.readFileSync(path.join(root,'game/VERSION.json')));
const input=process.argv[2]||path.join(root,'game/builds',v.versao,'TORII_HUTUKARA_'+v.sufixo+'.html');
const url=(/^(file|https?):/.test(input)?input:pathToFileURL(input).href);
const out=path.join(root,'qa/dificuldade');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];
async function check(name,fn){const detail=await fn();checks.push({name,detail});console.log('OK · '+name)}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{try{localStorage.clear()}catch{};window.requestAnimationFrame=()=>0});
    await page.goto(url+(url.includes('?')?'&':'?')+'semente=11',{waitUntil:'load',timeout:180000});
    // Utilidades dentro da página.
    await page.evaluate(()=>{
      window.__t=1e4;window.__frame=(n=1)=>{for(let i=0;i<n;i++){window.__t+=1000/60;loop(window.__t)}};
      window.__skip=()=>{for(let i=0;i<80&&mode==='dialogue';i++)advanceDialogue();if(mode==='overlay')closeOverlay()};
      window.__heal=()=>{for(const k in G.maxhp)if(G.maxhp[k])G.hp[k]=G.maxhp[k];act.invuln=0};
      window.__chefe=(nome,nivel)=>{
        if(nome==='viajante'){newGame();__skip();G.difficulty=nivel;G.flags.bass=true;__heal();setArea('ruins',35.4,18.5,false);spawnBossFight()}
        if(nome==='arauto'){startChapterTwoPreview();__skip();G.difficulty=nivel;setArea('voice_tower',13.5,16.5,false);spawnVoiceBoss()}
        if(nome==='metronomo'){C3.start(true);__skip();G.difficulty=nivel;setArea('cloud_terrace',15.5,14.5,false);__skip();C3.spawnMetronome()}
        if(nome==='silencio'){C3.start(true);__skip();G.difficulty=nivel;G.c3.metronomeDone=true;setArea('silence_core',17.5,20.5,false);__skip();C3.spawnSilence()}
        __frame(2);return {id:bossActor.id,hp:bossActor.hp,max:bossActor.max};
      };
      window.__limpar=()=>{bossActor=null;battle=null;mode='walk';hostileShots.length=0;ToriiDificuldade.limparPerigos()};
    });

    await check('Escolha da dificuldade ao começar: três níveis, Médio recomendado',async()=>{
      await page.locator('#startNew').click();
      const op=await page.evaluate(()=>[...document.querySelectorAll('#overlay button')].map(b=>b.id+':'+b.textContent.trim().slice(0,40)));
      for(const id of ['dif_historia','dif_normal','dif_dificil'])assert(op.some(o=>o.startsWith(id)),op.join(' | '));
      assert(op.some(o=>/recomendado/i.test(o)));
      await page.screenshot({path:path.join(out,'escolha-dificuldade.png')});
      await page.locator('#dif_normal').click();
      const r=await page.evaluate(()=>({nivel:G.difficulty,mode,area:G.area}));
      assert.deepEqual(r,{nivel:'normal',mode:'dialogue',area:'studio'});
      await page.evaluate(()=>{__skip();save(true)});
      const salvo=await page.evaluate(()=>safeLoad().difficulty);assert.equal(salvo,'normal');
      return op;
    });

    await check('Inícios diretos também perguntam o nível',async()=>{
      const r=await page.evaluate(()=>{mode='title';$('start').classList.remove('hidden');openTitleOptions10();$('previewC3').click();
        const ids=[...document.querySelectorAll('#overlay button')].map(b=>b.id);$('dif_dificil').click();__skip();return {ids,nivel:G.difficulty,c3:!!G.c3?.started}});
      assert(r.ids.includes('dif_historia'));assert.equal(r.nivel,'dificil');assert(r.c3);
      return r;
    });

    await check('História: vida dos chefes, inimigos e mapa iguais aos de antes',async()=>{
      const r=await page.evaluate(()=>{
        const vidas={};for(const n of ['viajante','arauto','metronomo','silencio']){vidas[n]=__chefe(n,undefined);__limpar()}
        G.difficulty='historia';buildMaps();
        G.flags.bass=true;G.flags.bridge=true;setArea('forest',40.5,20.5,false);mode='walk';
        const floresta=enemyActors().map(e=>e.id);for(let i=0;i<30;i++)__frame();
        return {vidas,floresta,encontro:ToriiEncontros.atual(),modo:mode,f2:enemyActors().filter(e=>e.id.startsWith('f2')).length};
      });
      assert.deepEqual(Object.values(r.vidas).map(x=>x.max),[340,560,360,690]);
      assert.equal(r.floresta.length,6,r.floresta.join(','));assert.equal(r.f2,0);assert.equal(r.encontro,null);
      return r;
    });

    await check('Normal: chefes com 2,5× de vida',async()=>{
      const r=await page.evaluate(()=>{const v={};for(const n of ['viajante','arauto','metronomo','silencio']){v[n]=__chefe(n,'normal').max;__limpar()}return v});
      assert.deepEqual(r,{viajante:850,arauto:1400,metronomo:900,silencio:1725});
      return r;
    });

    await check('Normal: Viajante e Arauto ganham a fase III, com transição imune e golpe novo',async()=>{
      const r=await page.evaluate(()=>{
        const out={};
        for(const n of ['viajante','arauto']){
          __chefe(n,'normal');const e=bossActor;__heal();
          e.hp=Math.round(e.max*.45);__frame(3);const fase2=e.f2.fase;__frame(90);
          e.hp=Math.round(e.max*.2);__frame(2);
          const tr={fase:e.f2.fase,imune:e.f2.imune>0,pausa:e.f2.pausa>0};
          const hp=e.hp;hitEnemy(e,30);const imuneOk=e.hp===hp;
          // Sobrevive ao laço até sair um golpe da fase III.
          let golpe3=0;for(let i=0;i<60*12&&!golpe3;i++){__heal();act.invuln=5;__frame();golpe3=(e.f2.log||[]).filter(x=>x==='golpe3').length}
          out[n]={fase2,tr,imuneOk,golpe3,hud:$('actionEnemy').textContent};__limpar();
        }
        return out;
      });
      for(const n of ['viajante','arauto']){const x=r[n];assert.equal(x.fase2,2);assert.equal(x.tr.fase,3);assert(x.tr.imune&&x.tr.pausa);assert(x.imuneOk);assert(x.golpe3>0,n+' sem golpe da fase III');assert(/FASE III/.test(x.hud),x.hud)}
      return r;
    });

    await check('Normal: Metrônomo e Silêncio anunciam as três fases',async()=>{
      const r=await page.evaluate(()=>{const out={};for(const n of ['metronomo','silencio']){__chefe(n,'normal');const e=bossActor;
        e.hp=Math.round(e.max*.6);__frame(3);const f2=e.f2.fase;__frame(100);e.hp=Math.round(e.max*.3);__frame(3);out[n]={f2,f3:e.f2.fase,log:e.f2.log};__limpar()}return out});
      for(const n of ['metronomo','silencio']){assert.equal(r[n].f2,2);assert.equal(r[n].f3,3)}
      return r;
    });

    await check('Normal: inimigos a mais, tipos novos e encontros na floresta',async()=>{
      const r=await page.evaluate(()=>{
        newGame();__skip();G.difficulty='normal';G.flags.bass=true;G.flags.bridge=true;setArea('forest',30.5,21.5,false);mode='walk';
        const contagem=enemyActors().length,tipos=[...new Set(enemyActors().map(e=>e.type))];
        G.x=41;G.y=20;__frame(3);const a=ToriiEncontros.atual();
        const inicio={id:a?.def.id,vivos:a?.vivos.length,mode};
        __frame(60);// surgimento
        for(const e of enemyActors())if(e.f2encontro)hitEnemy(e,9999);
        __frame(5);
        return {contagem,tipos,inicio,feito:ToriiEncontros.feito('c1_emboscada_ponte'),defeated:G.defeated.filter(x=>x.startsWith('f2e_')).length};
      });
      assert.equal(r.contagem,11,'6 de sempre + 5 extras');
      assert(r.tipos.includes('tambor_escudo')&&r.tipos.includes('flautim_atirador'));
      assert.equal(r.inicio.id,'c1_emboscada_ponte');assert.equal(r.inicio.vivos,3);assert.equal(r.inicio.mode,'action');
      assert(r.feito);assert.equal(r.defeated,0);
      return r;
    });

    await check('Arena trancada e onda de Silêncio: três ondas, saída fechada até o fim',async()=>{
      const r=await page.evaluate(()=>{
        __limpar();for(const e of enemyActors())hitEnemy(e,9999);__frame(5);mode='walk';battle=null;
        G.x=50;G.y=21;__frame(3);const a=ToriiEncontros.atual();const id=a?.def.id;const ondas=[];
        for(let w=0;w<3;w++){__frame(60);ondas.push(ToriiEncontros.atual()?.onda);G.x=30;G.y=21;__frame(2);
          const preso=Math.hypot(G.x-50,G.y-21);ondas.push(+preso.toFixed(2));
          for(const e of enemyActors())if(e.f2encontro){__heal();hitEnemy(e,9999)}__frame(80)}
        return {id,ondas,feito:ToriiEncontros.feito('c1_onda_silencio'),fitas:G.potions};
      });
      assert.equal(r.id,'c1_onda_silencio');assert(r.feito);
      assert.deepEqual([r.ondas[0],r.ondas[2],r.ondas[4]],[0,1,2]);
      for(const d of [r.ondas[1],r.ondas[3],r.ondas[5]])assert(d<=6.6,'escapou da arena: '+d);
      return r;
    });

    await check('Tipos novos: escudo bloqueia de frente, abre pelas costas; curador cura; maestro chama; atiradores avisam antes',async()=>{
      const r=await page.evaluate(()=>{
        __limpar();G.difficulty='normal';C3.start(true);__skip();G.difficulty='normal';G.c3.usinaDone=true;G.c3.metMaia=true;
        G.fase2={feitos:{c3_onda_silencio:true}};setArea('distortion_district',30.5,30.5,false);mode='walk';
        for(const e of enemyActors())hitEnemy(e,9999);__frame(5);G.defeated=[];
        const a=current;const novo=(tipo,x,y)=>{const id='t_'+tipo+'_'+Math.random().toString(36).slice(2,6);enemy(a,id,x,y,tipo);return hydrateEnemy(a.enemies.at(-1))};
        const res={};
        const m=novo('muralha_estatica',G.x+1.5,G.y);m.face=Math.PI;// virada para o jogador (à esquerda)
        let hp=m.hp;hitEnemy(m,20);res.frente=hp-m.hp;
        m.face=0;hp=m.hp;hitEnemy(m,20);res.costas=hp-m.hp;m.hp=0;G.defeated.push(m.id);
        const ferido=novo('hush',G.x+6,G.y);ferido.hp=Math.round(ferido.max*.4);const coro=novo('coro_curador',G.x+7,G.y+1);
        ferido.stun=99;companionCooldown=1e9;const antes=ferido.hp;engage();for(let i=0;i<60*4;i++){__heal();act.invuln=5;__frame()}res.cura=ferido.hp-antes;
        coro.hp=0;ferido.hp=0;G.defeated.push(coro.id,ferido.id);
        const maestro=novo('maestro_invocador',G.x+6,G.y);for(let i=0;i<60*3;i++){__heal();act.invuln=5;__frame()}
        res.chamados=(maestro.f2chamados||[]).length;hitEnemy(maestro,9999);__frame(2);
        res.chamadosDepois=current.enemies.filter(e=>e.f2chamado===maestro.id&&e.hp>0).length;
        const antena=novo('antena_feedback',G.x+5,G.y);engage();let aviso=0,tiro=false;const vida0=G.hp[G.active];
        for(let i=0;i<60*3;i++){act.invuln=0;__frame();if(ToriiDificuldade.perigos.some(h=>h.dono===antena))aviso++}
        res.avisoAntena=aviso;res.danoAntena=vida0-G.hp[G.active];antena.hp=0;G.defeated.push(antena.id);
        return res;
      });
      assert(r.frente<=3,'escudo deixou passar '+r.frente);assert.equal(r.costas,20);
      assert(r.cura>0,'curador não curou');assert(r.chamados>=1);assert.equal(r.chamadosDepois,0);
      assert(r.avisoAntena>=30,'feixe sem aviso suficiente');assert(r.danoAntena>0,'feixe sem dano');
      return r;
    });

    await check('Difícil: a Sombra atira em leque de três',async()=>{
      const r=await page.evaluate(()=>{
        __limpar();newGame();__skip();G.difficulty='dificil';G.flags.bass=true;setArea('forest',20.5,20.5,false);
        for(const e of enemyActors())hitEnemy(e,9999);G.defeated=[];
        const a=current;enemy(a,'t_sombra',G.x+4,G.y,'whisper');const s=hydrateEnemy(a.enemies.at(-1));s.cd=0;engage();
        let max=0;for(let i=0;i<72;i++){__heal();act.invuln=5;const n0=hostileShots.length;__frame();max=Math.max(max,hostileShots.length-n0)}
        const hist=(()=>{G.difficulty='historia';hostileShots.length=0;const t=hydrateEnemy((enemy(a,'t_sombra2',G.x-4,G.y,'whisper'),a.enemies.at(-1)));s.hp=0;G.defeated.push('t_sombra');t.cd=0;let m=0;for(let i=0;i<72;i++){__heal();act.invuln=5;const n0=hostileShots.length;__frame();m=Math.max(m,hostileShots.length-n0)}return m})();
        return {dificil:max,historia:hist,vida:s.max};
      });
      assert(r.dificil>=3,'Difícil: '+r.dificil);assert.equal(r.historia,1);assert.equal(r.vida,Math.round(62*1.15));
      return r;
    });

    await check('Impacto: hit-stop de 2–3 quadros só nos níveis com fases; números de dano opcionais',async()=>{
      const r=await page.evaluate(()=>{
        __limpar();const res={};
        for(const n of ['historia','normal']){
          G.difficulty=n;const a=current;enemy(a,'t_alvo_'+n,G.x+1,G.y,'hush');const e=hydrateEnemy(a.enemies.at(-1));engage();
          ToriiImpacto.estado.congelados=0;hitEnemy(e,5);__frame(6);res[n]=ToriiImpacto.estado.congelados;e.hp=0;G.defeated.push(e.id);
        }
        G.options10={...(G.options10||{}),damageNumbers:true};const a=current;enemy(a,'t_num',G.x+1,G.y,'hush');const e=hydrateEnemy(a.enemies.at(-1));hitEnemy(e,7);
        res.numeros=ToriiImpacto.estado.numeros.map(n=>n.valor);G.options10.damageNumbers=false;return res;
      });
      assert.equal(r.historia,0);assert(r.normal>=2&&r.normal<=3,'quadros parados: '+r.normal);assert(r.numeros.includes('7'));
      return r;
    });

    await check('Menu → Sistema troca o nível fora de combate; checkpoint mantém o nível',async()=>{
      const r=await page.evaluate(()=>{
        __limpar();G.difficulty='historia';mode='walk';battle=null;openSettings10();const b=$('difficulty10');const antes=b.textContent;b.click();
        const depois=G.difficulty;const nums=!!$('damageNumbers10');closeOverlay();
        setCheckpoint('teste',G.area,G.x,G.y,true);G.difficulty='dificil';restoreCheckpoint();
        return {antes,depois,nums,aposCheckpoint:G.difficulty};
      });
      assert(/FÁCIL/.test(r.antes));assert.equal(r.depois,'normal');assert(r.nums);assert.equal(r.aposCheckpoint,'dificil');
      return r;
    });

    await check('Posições: extras e encontros em chão livre e alcançável a partir da entrada',async()=>{
      const r=await page.evaluate(()=>{
        G.difficulty='normal';buildMaps();const ruins=[];
        // Partes da área abrem com puzzles (ponte, névoa, comporta): conta como alcançável o que liga a uma porta ou a um ponto de interação.
        const alcance=(a)=>{const seen=new Set();const q=[...a.gates,...(a.events||[]),...(a.npcs||[])].map(o=>[Math.floor(o.x),Math.floor(o.y)]);
          const ok=(x,y)=>x>=0&&y>=0&&x<a.w&&y<a.h&&tileWalkable(a,x+.5,y+.5);
          for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&ok(nx,ny)){seen.add(k);q.push([nx,ny])}}}return seen};
        const cache={};const viz=(id)=>cache[id]||(cache[id]=alcance(areas[id]));
        for(const [area,id] of ToriiEncontros.EXTRAS){const e=areas[area].enemies.find(x=>x.id===id);if(!e){ruins.push('sem lugar: '+id);continue}
          if(!viz(area).has(Math.floor(e.x)+','+Math.floor(e.y)))ruins.push('fora de alcance: '+id)}
        for(const d of ToriiEncontros.ENCONTROS){const a=areas[d.area];if(!tileWalkable(a,d.x,d.y))ruins.push('centro bloqueado: '+d.id);
          // Paredes podem dividir a área até um puzzle abrir: basta o centro ser chão.
          if(d.raio){let livres=0;for(let k=0;k<16;k++){const ang=k/16*Math.PI*2;if(ToriiEncontros.chaoLivre(a,d.x+Math.cos(ang)*3.5,d.y+Math.sin(ang)*3.5,3))livres++}if(livres<8)ruins.push('arena apertada: '+d.id+' '+livres)}}
        return {problemas:ruins,extras:ToriiEncontros.EXTRAS.length,encontros:ToriiEncontros.ENCONTROS.length,tipos:Object.keys(ToriiEncontros.TIPOS)};
      });
      assert.deepEqual(r.problemas,[]);assert(r.extras>=24);assert(r.encontros>=9);assert.equal(r.tipos.length,6);
      return r;
    });

    await check('Calabouço (Fenda): igual em todos os níveis; a escalada vem só das ondas',async()=>{
      const r=await page.evaluate(()=>{
        const rodar=nivel=>{
          G=fresh();buildMaps();G.difficulty=nivel;Object.assign(G.flags,{reveal:true,voicesKatana:true,masks:true,bass:true});
          Object.assign(G.c3,{started:true,synthUnlocked:true,percussionUnlocked:true,metronomeDone:true,silenceDone:true,complete:true,toriiSeen:true});
          G.formation=['franco','alt','percussion'];G.active='franco';for(const id of C3.unlockedRoster())G.hp[id]=G.maxhp[id]=100;
          PostGame.clearCombat();setArea('last_torii',13.5,13.5,false);mode='walk';Math.random=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(7);
          PostGame.startDungeon(42);let n=0;while(!current.enemies.length&&n++<300){tick+=1/60;update(1/60)}
          const inicio=current.enemies.map(e=>[e.type,e.hp,e.max,e.power]);
          ToriiImpacto.estado.congelados=0;const alvo=current.enemies[0];hitEnemy(alvo,5);
          for(let i=0;i<180;i++){act.invuln=5;tick+=1/60;update(1/60)}
          const r={ativo:ToriiDificuldade.ativo(),impacto:ToriiImpacto.ligado(),inicio,parados:ToriiImpacto.estado.congelados,perigos:ToriiDificuldade.perigos.length,
            depois:current.enemies.map(e=>[e.type,e.hp,+e.x.toFixed(2),+e.y.toFixed(2)]),onda:PostGame.run().wave};
          PostGame.finishRun();closeOverlay();return r;
        };
        return {historia:rodar('historia'),dificil:rodar('dificil'),normal:rodar('normal')};
      });
      for(const n of ['dificil','normal']){assert.equal(r[n].ativo,false);assert.equal(r[n].impacto,false);assert.equal(r[n].parados,0);assert.equal(r[n].perigos,0);
        assert.deepEqual(r[n].inicio,r.historia.inicio,n+': inimigos da Fenda mudaram');assert.deepEqual(r[n].depois,r.historia.depois,n+': luta da Fenda mudou')}
      return r;
    });

    assert.deepEqual(errors,[],'erros na página: '+errors.join(' | '));
  }finally{
    fs.writeFileSync(path.join(out,'UNIT.json'),JSON.stringify({build:v.versao,data:new Date().toISOString(),checks,errors},null,1)+'\n');
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
