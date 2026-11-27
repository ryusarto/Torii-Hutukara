'use strict';
// Ranking online do calabouço: configuração, apelido, teto de pontos e envio dos recordes.
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
 assert.equal(R.cleanName('  Muito   espaço  '),'Muito espaço');assert(R.validName(R.suggestion()));cases++}

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
 // Sem participação, nada é enviado.
 {const {R,ctx,calls}=load(CFG);ctx.G.postgame.records.solo={score:500,wave:3};await R.sync();assert.equal(calls.length,0);assert.equal(R.state().optIn,null);cases++}

 // Participando: envia só o que é maior que o último envio, uma vez.
 {const {R,ctx,calls,store}=load(CFG,{stored:{optIn:true,name:'Ryuchi'}});ctx.G.postgame.records.solo={score:1200,wave:4};ctx.G.postgame.records.coop={score:0,wave:0};
  await R.sync();assert.equal(calls.length,1);const c=calls[0];
  assert.equal(c.url,'https://abcdefgh.supabase.co/rest/v1/rpc/enviar_recorde');assert.equal(c.opt.headers.apikey,CFG.chave);assert.equal(c.opt.headers.Authorization,undefined);
  assert.deepEqual({mode:c.body.p_mode,name:c.body.p_name,score:c.body.p_score,wave:c.body.p_wave,build:c.body.p_build},{mode:'solo',name:'Ryuchi',score:1200,wave:4,build:'Beta 1.27.0'});
  assert.match(c.body.p_id,/^[0-9a-f-]{36}$/);await R.sync();assert.equal(calls.length,1);
  assert.equal(JSON.parse(store.get('torii_hutukara_ranking_v1')).sent.solo,1200);
  ctx.G.postgame.records.solo={score:1500,wave:5};ctx.G.postgame.records.coop={score:90,wave:1};await R.sync();assert.equal(calls.length,3);assert.deepEqual(calls.slice(1).map(c=>c.body.p_mode),['solo','coop']);cases++}

 // Chave antiga (JWT anon) também vai no Authorization.
 {const jwt='eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.assinatura-de-teste';const {R,ctx,calls}=load({url:CFG.url,chave:jwt},{stored:{optIn:true,name:'Franco'}});ctx.G.postgame.records.solo={score:10,wave:1};await R.sync();assert.equal(calls[0].opt.headers.Authorization,'Bearer '+jwt);cases++}

 // Falha de rede ou offline: o recorde continua pendente e sai depois.
 {const {R,ctx,calls,replies}=load(CFG,{stored:{optIn:true,name:'Belga'}});ctx.G.postgame.records.solo={score:300,wave:2};replies.push(new Error('rede'));
  await R.sync();assert.deepEqual(Array.from(R.pending()),['solo']);await R.sync();assert.deepEqual(Array.from(R.pending()),[]);assert.equal(calls.length,2);
  ctx.navigator.onLine=false;ctx.G.postgame.records.solo={score:400,wave:3};await R.sync();assert.equal(calls.length,2);cases++}

 // 'aguarde' não marca como enviado; 'invalido' para de insistir.
 {const {R,ctx,replies}=load(CFG,{stored:{optIn:true,name:'Colli'}});ctx.G.postgame.records.solo={score:50,wave:1};replies.push('aguarde');await R.sync();assert.equal(R.state().sent.solo,0);
  replies.push('invalido');await R.sync();assert.equal(R.state().sent.solo,50);cases++}

 // Mudar o apelido reenvia os recordes; sair apaga no servidor e troca o id.
 {const {R,ctx,calls}=load(CFG,{stored:{optIn:true,name:'Mazza',sent:{solo:70}}});ctx.G.postgame.records.solo={score:70,wave:1};
  R.showBoard=()=>{};R.showConsent=()=>{};R.join('Mazza Nova');assert.equal(R.state().name,'Mazza Nova');assert.equal(R.state().sent.solo,0);await R.sync();assert.equal(calls.at(-1).body.p_name,'Mazza Nova');
  R.join('!');assert.equal(R.state().name,'Mazza Nova');
  const id=R.state().id;await R.leave();assert.equal(calls.at(-1).url.endsWith('/rpc/ranking_remover'),true);assert.equal(calls.at(-1).body.p_id,id);assert.equal(R.state().optIn,false);assert.notEqual(R.state().id,id);
  const before=calls.length;await R.sync();assert.equal(calls.length,before);cases++}

 // Dados locais corrompidos não quebram o módulo.
 {const {R}=load(CFG,{stored:{id:'<script>',name:'<b>x</b>',optIn:'sim',sent:{solo:-5,coop:'x'}}});const s=R.state();assert.match(s.id,/^[0-9a-f-]{36}$/);assert.equal(s.name,'');assert.equal(s.optIn,null);assert.deepEqual({...s.sent},{solo:0,coop:0});cases++}

 const report={passed:cases};console.log(report);
})().catch(e=>{console.error(e);process.exit(1)});
