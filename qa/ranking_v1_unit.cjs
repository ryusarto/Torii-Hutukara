'use strict';
// Ranking online do calabouço: configuração, nome, jogadores do aparelho, teto de pontos e fila de envio.
// Roda o módulo isolado, sem rede: fetch é simulado.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'game/source/chapter-03/ranking_v1.js'),'utf8');
const pg=fs.readFileSync(path.join(root,'game/source/chapter-03/postgame.js'),'utf8');
let cases=0;

function load(config,{online=true,stored=null}={}){
 const store=new Map(stored?[['torii_hutukara_ranking_v1',JSON.stringify(stored)]]:[]),calls=[],replies=[];
 const ctx={console:{warn(){},log(){}},Math,Number,JSON,String,Array,Object,Promise,Error,Uint8Array,setTimeout:()=>1,clearTimeout(){},crypto:require('node:crypto').webcrypto,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  navigator:{onLine:online},document:{title:'TORII & HUTUKARA — A Última Frequência · Beta 1.27.0',getElementById:()=>null},
  G:{postgame:{records:{solo:{score:0,wave:0},coop:{score:0,wave:0}}}},
  fetch:async(url,opt)=>{calls.push({url,opt,body:JSON.parse(opt.body)});const r=replies.length?replies.shift():'ok';if(r instanceof Error)throw r;return {ok:true,json:async()=>r}}};
 ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
 vm.runInContext(source.replace('__RANKING_CONFIG__',JSON.stringify(config)),ctx);
 return {R:ctx.RankingV1,ctx,calls,replies,store};
}
const CFG={url:'https://abcdefgh.supabase.co/',chave:'sb_publishable_0123456789abcdefghijklmn'};

// Configuração ausente ou malformada desliga o ranking.
for(const c of [null,{url:null,chave:null},{url:'http://x.supabase.co',chave:CFG.chave},{url:CFG.url,chave:'curta'}])assert.equal(load(c).R.enabled(),false);
assert.equal(load(CFG).R.config.url,'https://abcdefgh.supabase.co');cases++;

// Apelidos.
{const {R}=load(CFG);for(const ok of ['Ryuchi','Franco The Sir','eco_42','A.B-c','Ação'])assert(R.validName(ok),ok);
 for(const bad of ['a','x'.repeat(17).slice(0,17)+'!','<b>oi</b>','   ','nome;drop'])assert(!R.validName(bad),bad);
 assert.equal(R.cleanName('  Muito   espaço  '),'Muito espaço');cases++}

// O teto do servidor fica acima de qualquer pontuação real: 18 ecos por onda (36 com divisão),
// todos ressonantes do tipo mais valioso, multiplicador máximo, plateia no máximo, sem dano e chefe em toda onda.
{const ctx={console,Math,Number,Set,Date,G:{},areas:{},combatAreas10:new Set(),copy:x=>JSON.parse(JSON.stringify(x)),C3:{AREAS:[],COMBAT_AREAS:[],labels:{},unlockedRoster:()=>[],coopActive:()=>false}};
 for(const n of ['fresh','normalizeSave','buildMaps','setArea','drawDetailedNPC','openMap','openSystem','enemyActors','gainXP','hitEnemy','save','showDefeat','restoreCheckpoint','update','updateHUD','objectiveData','exportSave','getRoute','drawGuideMarker','updateActionHUD','damageHero','continueGame','importSave'])ctx[n]=()=>{};
 ctx.partyMembers=()=>[];vm.createContext(ctx);vm.runInContext(pg,ctx);const P=vm.runInContext('PostGame',ctx),{R}=load(CFG);
 const crowd=P.amount('crowd',1e6),top=Math.max(...Object.values({boss:900,hush:50,whisper:60,compasso:90,espelho:100,abafador:120,c3_drone:80,c3_echo:110}).filter(v=>v<900));
 let total=0;for(let w=1;w<=3000;w++){
  const run={wave:w,combo:5,clean:true,upgrades:{crowd:1e6}},mult=P.multiplier(run)*(1+crowd);
  total+=36*Math.round(P.killValue('abafador',w,true)*mult)+Math.round(P.killValue('boss',w,true)*mult)+P.waveValue(run)+P.skipValue(run);
  assert(top===120&&total<=R.limite(w),'onda '+w+': '+total+' > '+R.limite(w));
  // Pontos da onda em andamento (ainda não concluída) também cabem no teto da onda anterior.
  assert(total<=R.limite(w-1)+R.limite(w)-R.limite(w-1)+R.limite(0))}
 // Limite igual ao do SQL.
 const sql=fs.readFileSync(path.join(root,'production/supabase/ranking_calabouco.sql'),'utf8');assert(sql.includes('5000::bigint + 25000::bigint * (p_wave + 1) + 1000::bigint * (p_wave + 1) * (p_wave + 1)'));cases++}

(async()=>{
 const run=(score,wave=3,mode='solo',extra={})=>({score,wave,kills:9,mode,legacy:false,elapsed:60,...extra});

 // Sem nome escolhido, nada entra na fila nem vai para a rede.
 {const {R,calls}=load(CFG);assert.equal(R.record(run(500)),false);await R.sync();assert.equal(calls.length,0);assert.equal(R.player(),null);cases++}

 // Nome escolhido: a pontuação da expedição vai uma vez, com nome, modo e build.
 {const {R,calls,store}=load(CFG);const p=R.choose('  Ryuchi ');assert.equal(p.name,'Ryuchi');assert.match(p.id,/^[0-9a-f-]{36}$/);
  assert(R.record(run(1200,4)));await R.sync();assert.equal(calls.length,1);const c=calls[0];
  assert.equal(c.url,'https://abcdefgh.supabase.co/rest/v1/rpc/enviar_recorde');assert.equal(c.opt.headers.apikey,CFG.chave);assert.equal(c.opt.headers.Authorization,undefined);
  assert.deepEqual({id:c.body.p_id,mode:c.body.p_mode,name:c.body.p_name,score:c.body.p_score,wave:c.body.p_wave,build:c.body.p_build},{id:p.id,mode:'solo',name:'Ryuchi',score:1200,wave:4,build:'Beta 1.27.0'});
  await R.sync();assert.equal(calls.length,1);const saved=JSON.parse(store.get('torii_hutukara_ranking_v1'));assert.equal(saved.current,'Ryuchi');assert.deepEqual(saved.queue,[]);
  R.record(run(300,2,'coop'));await R.sync();assert.equal(calls.at(-1).body.p_mode,'coop');cases++}

 // Cada nome usado no aparelho é uma pessoa diferente; repetir o nome (com outra caixa) reaproveita a identidade.
 {const {R}=load(CFG);const a=R.choose('Franco'),b=R.choose('Belga'),a2=R.choose('FRANCO');assert.notEqual(a.id,b.id);assert.equal(a2.id,a.id);assert.equal(R.player().name,'FRANCO');
  assert.equal(R.choose('!'),null);assert.equal(R.choose(''),null);assert.equal(R.player().name,'FRANCO');cases++}

 // Expedições antigas (regras anteriores) e sem pontos não entram.
 {const {R}=load(CFG);R.choose('Mazza');assert.equal(R.record(run(0)),false);assert.equal(R.record(run(100,1,'solo',{legacy:true})),false);assert.equal(R.state().queue.length,0);cases++}

 // Chave antiga (JWT anon) também vai no Authorization.
 {const jwt='eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.assinatura-de-teste';const {R,calls}=load({url:CFG.url,chave:jwt});R.choose('Franco');R.record(run(10,1));await R.sync();assert.equal(calls[0].opt.headers.Authorization,'Bearer '+jwt);cases++}

 // Sem rede: fica na fila (só a maior por pessoa e modo) e sai depois.
 {const {R,ctx,calls,replies}=load(CFG);R.choose('Belga');replies.push(new Error('rede'));R.record(run(300,2));
  await R.sync();assert.equal(R.pending('solo').length,1);R.record(run(250,2));R.record(run(450,3));assert.equal(R.state().queue.length,1);assert.equal(R.state().queue[0].score,450);
  await R.sync();assert.equal(R.pending().length,0);assert.equal(calls.at(-1).body.p_score,450);
  ctx.navigator.onLine=false;R.record(run(500,3));const before=calls.length;await R.sync();assert.equal(calls.length,before);assert.equal(R.pending().length,1);cases++}

 // 'aguarde' mantém na fila; 'invalido' tira da fila.
 {const {R,replies}=load(CFG);R.choose('Colli');R.record(run(50,1));replies.push('aguarde');await R.sync();assert.equal(R.state().queue.length,1);
  replies.push('invalido');await R.sync();assert.equal(R.state().queue.length,0);cases++}

 // Tirar o nome apaga no servidor e esquece a pessoa neste aparelho.
 {const {R,calls}=load(CFG);const p=R.choose('Dney');R.showBoard=()=>{};R.status=()=>{};await R.leave();
  assert(calls.at(-1).url.endsWith('/rpc/ranking_remover'));assert.equal(calls.at(-1).body.p_id,p.id);assert.equal(R.player(),null);assert.equal(R.choose('Dney').id===p.id,false);cases++}

 // Quem participava na versão anterior continua com a mesma identidade.
 {const id='0b9a6f0e-6a3c-4c39-9d44-7b6f2d3e8a11';const {R,store}=load(CFG,{stored:{id,name:'Ryuchi',optIn:true,sent:{solo:70}}});assert.equal(R.player().id,id);assert.equal(JSON.parse(store.get('torii_hutukara_ranking_v1')).v,2);
  assert.equal(load(CFG,{stored:{id,name:'Ryuchi',optIn:false}}).R.player(),null);cases++}

 // Dados locais corrompidos não quebram o módulo.
 {const {R}=load(CFG,{stored:{v:2,players:{x:{name:'<b>',id:'1'},y:null,z:{name:'Ok',id:'nao-uuid'}},current:'<b>',queue:[{id:'x'},null,{id:'0b9a6f0e-6a3c-4c39-9d44-7b6f2d3e8a11',name:'Ok',mode:'solo',score:-1,wave:1}]}});
  const s=R.state();assert.deepEqual({...s.players},{});assert.equal(s.current,'');assert.equal(s.queue.length,0);cases++}

 const report={passed:cases};console.log(report);
})().catch(e=>{console.error(e);process.exit(1)});
