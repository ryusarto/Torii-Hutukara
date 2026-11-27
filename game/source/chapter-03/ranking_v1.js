/* TORII & HUTUKARA — Ranking online do Calabouço Infinito.
 * Ao entrar no calabouço, a pessoa escreve o nome dela no briefing. No fim da
 * expedição, a pontuação vai para o ranking e a tela de resultado já mostra o
 * ranking completo. Só o nome, a pontuação e a onda saem do aparelho; save,
 * campanha e medidor de ritmo continuam locais. O servidor guarda a maior
 * pontuação de cada pessoa por modo (solo e co-op).
 * Cada nome usado neste aparelho ganha uma identidade própria, então quem divide
 * o navegador aparece separado. Sem internet, a pontuação espera numa fila e sai
 * na próxima conexão; o jogo nunca espera pela rede.
 * URL e chave pública: ranking_config.json (ou TORII_RANKING_URL e
 * TORII_RANKING_CHAVE no build). Sem elas, o calabouço funciona como antes e a
 * tela do ranking avisa que ele não está disponível. Esquema: production/supabase/. */
(function(){
'use strict';
const CONFIG=__RANKING_CONFIG__;
const STORE='torii_hutukara_ranking_v1',MODES=['solo','coop'],LABEL={solo:'SOLO',coop:'CO-OP'},TOP=20,TIMEOUT=8000,QUEUE_MAX=20;
const NAME=/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _.\-]{2,16}$/,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_RULE='Use de 2 a 16 caracteres: letras, números, espaço, ponto, hífen ou _.';
const node=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const uuid=()=>{if(globalThis.crypto?.randomUUID)return crypto.randomUUID();const b=new Uint8Array(16);(globalThis.crypto||{getRandomValues:a=>a.map(()=>Math.random()*256|0)}).getRandomValues(b);b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)};
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE))||{}}catch{return {}}};
const key=name=>String(name).toLocaleLowerCase('pt-BR');
const STYLE='#overlayInner .rk1-tabs{display:flex;gap:8px;margin:10px 0}#overlayInner .rk1-tabs .on{outline:2px solid #f0bd5a}'+
 '#overlayInner .rk1-list{list-style:none;margin:8px 0;padding:0;max-height:min(42vh,400px);overflow:auto}'+
 '#overlayInner .rk1-list li{display:grid;grid-template-columns:3.2em minmax(0,1fr) auto auto;gap:10px;align-items:baseline;padding:5px 8px;border-bottom:1px solid rgba(240,214,163,.14)}'+
 '#overlayInner .rk1-list li.me{background:rgba(240,189,90,.18);color:#f3d79c}#overlayInner .rk1-list .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
 '#overlayInner .rk1-list .w{opacity:.7;font-size:.85em}#overlayInner .rk1-join{margin:12px 0 4px}#overlayInner .rk1-join label{display:block;font-weight:700}'+
 '#overlayInner .rk1-name{display:block;width:100%;max-width:22em;margin:6px 0 2px;padding:8px 10px;font:inherit;background:#120f1c;color:#f0ddba;border:1px solid #c9b38f;border-radius:4px}'+
 '#overlayInner .rk1-status{min-height:1.4em}#overlayInner .rk1-status.err{color:#f3a27a}';

const Ranking={
 MODES,
 config:CONFIG&&typeof CONFIG.url==='string'&&/^https:\/\/[^\s/]+$/.test(CONFIG.url.replace(/\/+$/,''))&&typeof CONFIG.chave==='string'&&CONFIG.chave.length>20?{url:CONFIG.url.replace(/\/+$/,''),chave:CONFIG.chave}:null,
 data:null,busy:null,retry:0,tab:'solo',
 enabled(){return !!this.config},
 limite(wave){const w=Math.max(0,Math.floor(wave))+1;return 5000+25000*w+1000*w*w},
 cleanName(s){return String(s||'').replace(/\s+/g,' ').trim()},
 validName(s){return NAME.test(this.cleanName(s))},

 // Estado local: jogadores deste aparelho (nome → identidade), quem está jogando e a fila de envios.
 load(){
  const d=read(),out={v:2,players:{},current:'',queue:[]};
  const add=(name,id)=>{name=this.cleanName(name);if(this.validName(name)&&UUID.test(id||''))out.players[key(name)]={name,id}};
  if(d.players&&typeof d.players==='object')for(const p of Object.values(d.players))add(p?.name,p?.id);
  if(d.v!==2&&d.optIn===true)add(d.name,d.id); // versão anterior: um apelido por aparelho
  const cur=this.cleanName(d.v===2?d.current:d.optIn===true?d.name:'');out.current=out.players[key(cur)]?out.players[key(cur)].name:'';
  if(Array.isArray(d.queue))for(const q of d.queue.slice(-QUEUE_MAX))if(q&&UUID.test(q.id||'')&&this.validName(q.name)&&MODES.includes(q.mode)&&Number.isFinite(q.score)&&q.score>0&&Number.isFinite(q.wave)&&q.wave>=0)out.queue.push({id:q.id,name:this.cleanName(q.name),mode:q.mode,score:Math.floor(q.score),wave:Math.floor(q.wave),build:String(q.build||'').slice(0,32)});
  this.data=out;if(d.v!==2)this.persist();return out;
 },
 state(){return this.data||this.load()},
 persist(){try{localStorage.setItem(STORE,JSON.stringify(this.data))}catch{}},
 player(){const s=this.state();return s.current?s.players[key(s.current)]||null:null},
 lastName(){return this.player()?.name||''},
 // Escolhe quem vai jogar. Um nome novo ganha identidade nova; um nome já usado aqui reaproveita a dele.
 choose(raw){
  const name=this.cleanName(raw);if(!this.validName(name))return null;
  const s=this.state(),k=key(name);if(!s.players[k])s.players[k]={name,id:uuid()};
  s.players[k].name=name;s.current=name;this.persist();return s.players[k];
 },
 build(){return typeof document!=='undefined'?(document.title.split('·').pop()||'').trim().slice(0,32):''},

 // No fim da expedição: a pontuação de quem jogou entra na fila de envio.
 record(last){
  const p=this.player();if(!this.enabled()||!p||!last||last.legacy||!(last.score>0))return false;
  const s=this.state(),mode=last.mode==='coop'?'coop':'solo',same=s.queue.find(q=>q.id===p.id&&q.mode===mode);
  if(same){if(last.score>same.score){same.score=Math.floor(last.score);same.wave=Math.floor(last.wave)}same.name=p.name}
  else s.queue.push({id:p.id,name:p.name,mode,score:Math.floor(last.score),wave:Math.floor(last.wave||0),build:this.build()});
  s.queue=s.queue.slice(-QUEUE_MAX);this.persist();return true;
 },
 pending(mode){const p=this.player(),q=this.state().queue;return q.filter(i=>(!mode||i.mode===mode)&&(!p||i.id===p.id))},

 async call(fn,body){
  if(!this.enabled())throw new Error('sem configuração');
  const ctrl=typeof AbortController==='function'?new AbortController():null,timer=ctrl?setTimeout(()=>ctrl.abort(),TIMEOUT):0;
  const headers={'Content-Type':'application/json',apikey:this.config.chave};
  if(/^eyJ/.test(this.config.chave))headers.Authorization='Bearer '+this.config.chave;
  try{
   const res=await fetch(this.config.url+'/rest/v1/rpc/'+fn,{method:'POST',headers,body:JSON.stringify(body),signal:ctrl?.signal,cache:'no-store'});
   if(!res.ok)throw new Error('HTTP '+res.status);
   return await res.json();
  }finally{if(timer)clearTimeout(timer)}
 },

 // Envia a fila. Uma execução por vez; o que falhar por rede fica para depois.
 sync(){
  if(!this.enabled()||this.busy)return this.busy||Promise.resolve(false);
  if(!this.state().queue.length)return Promise.resolve(false);
  if(typeof navigator!=='undefined'&&navigator.onLine===false){this.later();return Promise.resolve(false)}
  this.busy=(async()=>{
   let sent=false;const s=this.state();
   for(const item of s.queue.slice()){
    try{
     const status=await this.call('enviar_recorde',{p_id:item.id,p_mode:item.mode,p_name:item.name,p_score:item.score,p_wave:item.wave,p_build:item.build});
     if(status==='aguarde'){this.later();continue}
     s.queue=s.queue.filter(q=>q!==item);this.persist();sent=true;
     if(status==='invalido')console.warn('Ranking: pontuação '+item.mode+' recusada pelo servidor.');
    }catch(e){this.later();break}
   }
   return sent;
  })().finally(()=>{this.busy=null});
  return this.busy;
 },
 later(){if(this.retry)return;this.retry=setTimeout(()=>{this.retry=0;this.sync()},6000+Math.random()*4000)},

 // ---------- Briefing: nome de quem vai jogar ----------
 style(){if(node('rk1Style'))return;const s=document.createElement('style');s.id='rk1Style';s.textContent=STYLE;document.head.appendChild(s)},
 decorateBriefing(back){
  const root=node('overlayInner'),start=node('postBeginRun');if(!root||!start)return;
  this.addButton(()=>PostGame.openBriefing(back));
  if(!this.enabled()||node('rk1Form'))return;this.style();
  const name=this.lastName(),form=document.createElement('form');form.id='rk1Form';form.className='rk1-join';
  form.innerHTML=`<label for="rk1Name">Seu nome no ranking</label><input id="rk1Name" class="rk1-name" maxlength="16" autocomplete="nickname" spellcheck="false" placeholder="Escreva seu nome" value="${esc(name)}"><p class="tiny">Seu nome e sua pontuação aparecem no ranking online do calabouço, visível para todos.</p><p class="rk1-status tiny" id="rk1Status"></p>`;
  start.closest('.row').before(form);
  // interface_controls_v7 já impede que teclas digitadas acionem o jogo; Enter confirma pelo formulário.
  form.onsubmit=e=>{e.preventDefault();this.begin()};start.onclick=()=>this.begin();
  if(!name)node('rk1Name').focus();
 },
 begin(){
  const input=node('rk1Name'),raw=input?.value||'';
  if(!this.choose(raw)){const st=node('rk1Status');if(st){st.textContent=this.cleanName(raw)?NAME_RULE:'Escreva seu nome para entrar no calabouço.';st.classList.add('err')}input?.focus();return false}
  return PostGame.startDungeon();
 },

 // ---------- Telas do ranking ----------
 open(back){
  this.back=typeof back==='function'?back:(typeof closeOverlay==='function'?closeOverlay:()=>{});this.style();
  if(!this.enabled())return this.showUnavailable();
  return this.showBoard(this.tab);
 },
 showUnavailable(){
  const r=typeof G!=='undefined'&&G?.postgame?.records;
  enterMenu10(`<div class="eyebrow">CALABOUÇO INFINITO</div><h2>Ranking online</h2><p>O ranking online ainda não está disponível nesta versão. Seus recordes continuam guardados neste save.</p><div class="stat"><span>Seus recordes · neste save</span><b>SOLO ${fmt(r?.solo?.score)} · CO-OP ${fmt(r?.coop?.score)}</b></div><div class="row"><button class="action strong" id="rk1Back">VOLTAR</button></div>`,'postgame');
  node('rk1Back').onclick=()=>this.back();
 },
 status(text,error=false){const el=node('rk1Status');if(el){el.textContent=text;el.classList.toggle('err',!!error)}},
 tabsHtml(){return `<div class="rk1-tabs">${MODES.map(m=>`<button class="action${m===this.tab?' on':''}" id="rk1Tab_${m}" aria-pressed="${m===this.tab}">${LABEL[m]}</button>`).join('')}</div>`},
 listHtml(){return '<ol class="rk1-list" id="rk1List" aria-live="polite"><li><span></span><span class="n">Carregando…</span></li></ol><p class="rk1-status" id="rk1Status"></p>'},
 showBoard(mode='solo'){
  this.tab=MODES.includes(mode)?mode:'solo';const p=this.player();
  enterMenu10(`<div class="eyebrow">CALABOUÇO INFINITO · RANKING ONLINE</div><h2>Maiores pontuações · ${LABEL[this.tab]}</h2>${this.tabsHtml()}${this.listHtml()}${p?`<p class="tiny">Última pessoa a jogar aqui: <b>${esc(p.name)}</b>.</p>`:''}<div class="row"><button class="action strong" id="rk1Back">VOLTAR</button><button class="action" id="rk1Refresh">ATUALIZAR</button>${p?'<button class="action" id="rk1Leave">TIRAR MEU NOME</button>':''}</div>`,'postgame');
  for(const m of MODES)node('rk1Tab_'+m).onclick=()=>this.showBoard(m);
  node('rk1Back').onclick=()=>this.back();node('rk1Refresh').onclick=()=>this.showBoard(this.tab);
  if(p)node('rk1Leave').onclick=()=>this.leave();
  this.fill(this.tab);
 },
 // Fim da expedição: resultado e ranking completo na mesma tela.
 showResult(last,reason){
  this.style();this.tab=last.mode==='coop'?'coop':'solo';const p=this.player();
  enterMenu10(`<div class="eyebrow">${reason==='defeat'?'A EXPEDIÇÃO TERMINOU':'EXPEDIÇÃO ENCERRADA'} · ${LABEL[this.tab]}</div><h2>${fmt(last.score)} pontos${p?' · '+esc(p.name):''}</h2><p class="tiny">${fmt(last.wave)} ${last.wave===1?'onda concluída':'ondas concluídas'} · ${fmt(last.kills)} inimigos vencidos · ${Math.floor(last.elapsed/60)}min ${last.elapsed%60}s de combate</p><h3 class="eyebrow">RANKING ONLINE · ${LABEL[this.tab]}</h3>${this.listHtml()}<div class="row"><button class="action strong" id="postRunAgain">NOVA TENTATIVA</button><button class="action" id="postRunMap">VIAGENS</button><button class="action" id="postRunClose">FICAR NO TORII</button></div>`,'postgame');
  node('postRunAgain').onclick=()=>PostGame.startDungeon();node('postRunMap').onclick=()=>PostGame.openTravel();node('postRunClose').onclick=closeOverlay;
  this.fill(this.tab,true);
 },
 async leave(){
  const s=this.state(),p=this.player();if(!p)return;
  this.status('Tirando seu nome do ranking…');
  try{await this.call('ranking_remover',{p_id:p.id})}catch{this.status('Sem conexão com o ranking. Tente de novo quando a internet voltar.',true);return}
  delete s.players[key(p.name)];s.queue=s.queue.filter(q=>q.id!==p.id);s.current='';this.persist();this.showBoard(this.tab);
 },
 async fill(mode,afterRun=false){
  const token=this.token=(this.token||0)+1,p=this.player();
  await this.sync().catch(()=>false);
  let rows,me=null;
  try{
   [rows,me]=await Promise.all([this.call('ranking_top',{p_mode:mode,p_limit:TOP}),p?this.call('ranking_posicao',{p_id:p.id,p_mode:mode}).then(r=>r?.[0]||null).catch(()=>null):null]);
  }catch(e){
   const list=node('rk1List');if(token!==this.token||!list)return;
   list.innerHTML='<li><span></span><span class="n">Não foi possível carregar o ranking.</span></li>';
   this.status(this.pending(mode).length?'Sem conexão: sua pontuação será enviada quando a internet voltar.':'Verifique a conexão e tente de novo.',true);return;
  }
  const list=node('rk1List');if(token!==this.token||!list)return;
  rows=Array.isArray(rows)?rows:[];
  list.innerHTML=rows.length?rows.map(r=>`<li class="${me&&Number(r.posicao)===Number(me.posicao)?'me':''}"><span>#${Number(r.posicao)}</span><span class="n">${esc(r.name)}</span><b>${fmt(r.score)}</b><span class="w">onda ${fmt(r.wave)}</span></li>`).join(''):'<li><span></span><span class="n">Ninguém pontuou neste modo ainda. A primeira posição está livre.</span></li>';
  if(me)this.status(`${p?p.name+': ':''}#${fmt(me.posicao)} de ${fmt(me.total)} · recorde de ${fmt(me.score)} pontos`);
  else if(this.pending(mode).length)this.status('Sua pontuação será enviada assim que possível.');
  else if(afterRun&&!p)this.status('Esta expedição começou sem nome, então não entrou no ranking.');
  else this.status(p?'Conclua uma expedição neste modo para entrar no ranking.':'Escreva seu nome ao entrar no calabouço para aparecer no ranking.');
 },

 // Botão RANKING ONLINE nas telas do calabouço.
 addButton(back){
  const root=node('overlayInner');if(!root||node('rk1Open'))return;
  const row=root.querySelector('.row');if(!row)return;
  const b=document.createElement('button');b.className='action';b.id='rk1Open';b.type='button';b.textContent='RANKING ONLINE';b.onclick=()=>this.open(back);row.appendChild(b);
 }
};
window.RankingV1=Ranking;

if(typeof PostGame!=='undefined'){
 const finish=PostGame.finishRun;PostGame.finishRun=function(reason,...args){
  const r=finish.call(this,reason,...args);
  if(r&&Ranking.enabled()){const last=G?.postgame?.lastRun;if(last){Ranking.record(last);Ranking.showResult(last,reason)}}
  else if(r)Ranking.addButton(closeOverlay);
  return r;
 };
 const ending=PostGame.showEnding;PostGame.showEnding=function(...args){const r=ending.apply(this,args);if(G?.c3?.complete)Ranking.addButton(()=>PostGame.showEnding());return r};
 const briefing=PostGame.openBriefing;PostGame.openBriefing=function(back,...args){const r=briefing.call(this,back,...args);if(r)Ranking.decorateBriefing(back);return r};
}
if(typeof openSystem==='function'){const system=openSystem;openSystem=function(...args){const r=system.apply(this,args);const anchor=node('postSystemDungeon');if(anchor&&!PostGame.active()&&!node('rk1System')){const b=document.createElement('button');b.id='rk1System';b.className=anchor.className;b.textContent='RANKING DO CALABOUÇO';b.onclick=()=>Ranking.open(openSystem);anchor.after(b)}return r}}
if(typeof addEventListener==='function')addEventListener('online',()=>Ranking.sync());
// Pontuações que ficaram na fila (sem internet) saem ao continuar o jogo.
if(typeof continueGame==='function'){const cont=continueGame;continueGame=function(...args){const r=cont.apply(this,args);setTimeout(()=>Ranking.sync(),1500);return r}}
})();
