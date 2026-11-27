/* TORII & HUTUKARA — Ranking online do Calabouço Infinito.
 * Participação opcional. Com ela ligada, o jogo envia ao Supabase só o apelido,
 * a maior pontuação e a onda de cada modo (solo e co-op). Save, campanha e o
 * medidor de ritmo continuam só no aparelho. Sem internet, o recorde espera e
 * sai na próxima conexão; o jogo nunca espera pela rede.
 * A URL e a chave pública vêm de ranking_config.json (ou das variáveis
 * TORII_RANKING_URL e TORII_RANKING_CHAVE no build). Sem elas, a tela avisa
 * que o ranking ainda não está disponível. Esquema: production/supabase/. */
(function(){
'use strict';
const CONFIG=__RANKING_CONFIG__;
const STORE='torii_hutukara_ranking_v1',MODES=['solo','coop'],LABEL={solo:'SOLO',coop:'CO-OP'},TOP=20,TIMEOUT=8000;
const NAME=/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _.\-]{2,16}$/;
const node=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const uuid=()=>{if(globalThis.crypto?.randomUUID)return crypto.randomUUID();const b=new Uint8Array(16);(globalThis.crypto||{getRandomValues:a=>a.map(()=>Math.random()*256|0)}).getRandomValues(b);b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)};
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE))||{}}catch{return {}}};
const STYLE='#overlayInner .rk1-tabs{display:flex;gap:8px;margin:10px 0}#overlayInner .rk1-tabs .on{outline:2px solid #f0bd5a}'+
 '#overlayInner .rk1-list{list-style:none;margin:8px 0;padding:0;max-height:min(46vh,420px);overflow:auto}'+
 '#overlayInner .rk1-list li{display:grid;grid-template-columns:3.2em minmax(0,1fr) auto auto;gap:10px;align-items:baseline;padding:5px 8px;border-bottom:1px solid rgba(240,214,163,.14)}'+
 '#overlayInner .rk1-list li.me{background:rgba(240,189,90,.18);color:#f3d79c}#overlayInner .rk1-list .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
 '#overlayInner .rk1-list .w{opacity:.7;font-size:.85em}#overlayInner .rk1-name{display:block;width:100%;max-width:22em;margin:6px 0 2px;padding:8px 10px;font:inherit;background:#120f1c;color:#f0ddba;border:1px solid #c9b38f;border-radius:4px}'+
 '#overlayInner .rk1-status{min-height:1.4em}';

const Ranking={
 MODES,
 config:CONFIG&&typeof CONFIG.url==='string'&&/^https:\/\/[^\s/]+$/.test(CONFIG.url.replace(/\/+$/,''))&&typeof CONFIG.chave==='string'&&CONFIG.chave.length>20?{url:CONFIG.url.replace(/\/+$/,''),chave:CONFIG.chave}:null,
 data:null,busy:null,retry:0,tab:'solo',
 enabled(){return !!this.config},
 limite(wave){const w=Math.max(0,Math.floor(wave))+1;return 5000+25000*w+1000*w*w},
 cleanName(s){return String(s||'').replace(/\s+/g,' ').trim()},
 validName(s){return NAME.test(this.cleanName(s))},
 suggestion(){return 'Ouvinte '+String(1000+Math.floor(Math.random()*9000))},
 load(){
  const d=read(),out={v:1,id:/^[0-9a-f-]{36}$/i.test(d.id||'')?d.id:uuid(),name:this.validName(d.name)?this.cleanName(d.name):'',optIn:d.optIn===true?true:d.optIn===false?false:null,sent:{}};
  for(const m of MODES)out.sent[m]=Number.isFinite(d.sent?.[m])&&d.sent[m]>0?Math.floor(d.sent[m]):0;
  this.data=out;if(d.id!==out.id)this.persist();return out;
 },
 state(){return this.data||this.load()},
 persist(){try{localStorage.setItem(STORE,JSON.stringify(this.data))}catch{}},
 participating(){return this.enabled()&&this.state().optIn===true&&this.validName(this.state().name)},
 records(){const p=typeof G!=='undefined'&&G?.postgame;return Object.fromEntries(MODES.map(m=>[m,{score:Math.floor(p?.records?.[m]?.score||0),wave:Math.floor(p?.records?.[m]?.wave||0)}]))},
 pending(){const s=this.state(),r=this.records();return MODES.filter(m=>r[m].score>s.sent[m])},
 build(){return typeof document!=='undefined'?(document.title.split('·').pop()||'').trim().slice(0,32):''},

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

 // Envia os recordes que ainda não chegaram ao servidor. Uma execução por vez.
 sync(){
  if(!this.participating()||this.busy)return this.busy||Promise.resolve(false);
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return Promise.resolve(false);
  this.busy=(async()=>{
   let sent=false;const s=this.state(),records=this.records();
   for(const mode of this.pending()){
    const rec=records[mode];
    try{
     const status=await this.call('enviar_recorde',{p_id:s.id,p_mode:mode,p_name:s.name,p_score:rec.score,p_wave:rec.wave,p_build:this.build()});
     if(status==='aguarde'){this.later();continue}
     s.sent[mode]=rec.score;this.persist();sent=true;
     if(status==='invalido')console.warn('Ranking: recorde '+mode+' recusado pelo servidor.');
    }catch(e){this.later();break}
   }
   return sent;
  })().finally(()=>{this.busy=null});
  return this.busy;
 },
 later(){if(this.retry)return;this.retry=setTimeout(()=>{this.retry=0;this.sync()},6000+Math.random()*4000)},

 // ---------- Telas ----------
 style(){if(node('rk1Style'))return;const s=document.createElement('style');s.id='rk1Style';s.textContent=STYLE;document.head.appendChild(s)},
 open(back){
  this.back=typeof back==='function'?back:(typeof closeOverlay==='function'?closeOverlay:()=>{});this.style();
  if(!this.enabled())return this.showUnavailable();
  if(this.state().optIn===null)return this.showConsent();
  return this.showBoard(this.tab);
 },
 showUnavailable(){
  enterMenu10(`<div class="eyebrow">CALABOUÇO INFINITO</div><h2>Ranking online</h2><p>O ranking online ainda não está disponível nesta versão. Seus recordes continuam guardados neste save.</p>${this.localStats()}<div class="row"><button class="action strong" id="rk1Back">VOLTAR</button></div>`,'postgame');
  node('rk1Back').onclick=()=>this.back();
 },
 localStats(){const r=this.records();return `<div class="stat"><span>Seus recordes · neste save</span><b>SOLO ${fmt(r.solo.score)} · CO-OP ${fmt(r.coop.score)}</b></div>`},
 showConsent(error='',typed=null){
  const s=this.state(),value=typed??(s.name||this.suggestion());
  enterMenu10(`<div class="eyebrow">CALABOUÇO INFINITO</div><h2>Participar do ranking online?</h2><p>O ranking mostra a maior pontuação de cada pessoa na Fenda das Ressonâncias, separada em solo e co-op.</p><p class="lore">Para participar, o jogo envia ao servidor do ranking somente o seu apelido, o seu recorde e a onda de cada modo. Esses dados ficam visíveis para quem abrir o ranking. O save e o resto da jornada continuam só neste aparelho. Você pode sair quando quiser, e seus dados são apagados do ranking.</p><form id="rk1Form"><label for="rk1Name">Apelido (2 a 16 letras, números, espaço, ponto, hífen ou _)</label><input id="rk1Name" class="rk1-name" maxlength="16" autocomplete="nickname" spellcheck="false" value="${esc(value)}"></form><p class="rk1-status tiny" id="rk1Status">${esc(error)}</p><div class="row"><button class="action strong" id="rk1Join">PARTICIPAR</button><button class="action" id="rk1Watch">SÓ VER O RANKING</button><button class="action" id="rk1Back">VOLTAR</button></div>`,'postgame');
  // interface_controls_v7 já impede que teclas digitadas acionem o jogo; Enter confirma pelo formulário.
  node('rk1Form').onsubmit=e=>{e.preventDefault();this.join(node('rk1Name').value)};
  node('rk1Join').onclick=()=>this.join(node('rk1Name').value);
  node('rk1Watch').onclick=()=>{this.state().optIn=false;this.persist();this.showBoard(this.tab)};
  node('rk1Back').onclick=()=>this.back();
 },
 join(raw){
  const name=this.cleanName(raw);
  if(!this.validName(name))return this.showConsent('Use de 2 a 16 caracteres: letras, números, espaço, ponto, hífen ou _.',String(raw||'').slice(0,16));
  const s=this.state(),changed=s.name!==name;s.name=name;s.optIn=true;
  // Um apelido novo é reenviado com os recordes atuais.
  if(changed)for(const m of MODES)s.sent[m]=0;
  this.persist();this.showBoard(this.tab);
 },
 async leave(){
  const s=this.state(),id=s.id;
  this.status('Saindo do ranking…');
  try{await this.call('ranking_remover',{p_id:id})}catch{this.status('Sem conexão com o ranking. Tente sair de novo quando a internet voltar.');return}
  s.optIn=false;s.id=uuid();for(const m of MODES)s.sent[m]=0;this.persist();this.showBoard(this.tab);
 },
 status(text){const el=node('rk1Status');if(el)el.textContent=text},
 showBoard(mode='solo'){
  this.tab=MODES.includes(mode)?mode:'solo';const on=this.participating(),s=this.state();
  const tabs=MODES.map(m=>`<button class="action${m===this.tab?' on':''}" id="rk1Tab_${m}" aria-pressed="${m===this.tab}">${LABEL[m]}</button>`).join('');
  const own=on?`<button class="action" id="rk1Rename">MUDAR APELIDO</button><button class="action" id="rk1Leave">SAIR DO RANKING</button>`:`<button class="action" id="rk1JoinLater">PARTICIPAR</button>`;
  enterMenu10(`<div class="eyebrow">CALABOUÇO INFINITO · RANKING ONLINE</div><h2>Maiores pontuações · ${LABEL[this.tab]}</h2><div class="rk1-tabs">${tabs}</div><ol class="rk1-list" id="rk1List" aria-live="polite"><li><span></span><span class="n">Carregando…</span></li></ol><p class="rk1-status" id="rk1Status"></p>${this.localStats()}${on?`<p class="tiny">Participando como <b>${esc(s.name)}</b>.</p>`:''}<div class="row"><button class="action strong" id="rk1Back">VOLTAR</button><button class="action" id="rk1Refresh">ATUALIZAR</button>${own}</div>`,'postgame');
  for(const m of MODES)node('rk1Tab_'+m).onclick=()=>this.showBoard(m);
  node('rk1Back').onclick=()=>this.back();node('rk1Refresh').onclick=()=>this.showBoard(this.tab);
  if(on){node('rk1Rename').onclick=()=>this.showConsent();node('rk1Leave').onclick=()=>this.leave()}
  else node('rk1JoinLater').onclick=()=>this.showConsent();
  this.fill(this.tab);
 },
 async fill(mode){
  const token=this.token=(this.token||0)+1,list=node('rk1List');
  if(this.participating())await this.sync().catch(()=>false);
  let rows,me=null;
  try{
   [rows,me]=await Promise.all([this.call('ranking_top',{p_mode:mode,p_limit:TOP}),this.participating()?this.call('ranking_posicao',{p_id:this.state().id,p_mode:mode}).then(r=>r?.[0]||null).catch(()=>null):null]);
  }catch(e){
   if(token!==this.token||!node('rk1List'))return;
   list.innerHTML='<li><span></span><span class="n">Não foi possível carregar o ranking.</span></li>';
   this.status(this.pending().length&&this.participating()?'Sem conexão: seu recorde será enviado quando a internet voltar.':'Verifique a conexão e tente ATUALIZAR.');return;
  }
  if(token!==this.token||!node('rk1List'))return;
  rows=Array.isArray(rows)?rows:[];
  list.innerHTML=rows.length?rows.map(r=>`<li class="${me&&Number(r.posicao)===Number(me.posicao)?'me':''}"><span>#${Number(r.posicao)}</span><span class="n">${esc(r.name)}</span><b>${fmt(r.score)}</b><span class="w">onda ${fmt(r.wave)}</span></li>`).join(''):'<li><span></span><span class="n">Ninguém pontuou neste modo ainda. A primeira posição está livre.</span></li>';
  if(me)this.status(`Sua posição: #${fmt(me.posicao)} de ${fmt(me.total)} · ${fmt(me.score)} pontos`);
  else if(this.participating())this.status(this.records()[mode].score>0?(this.pending().includes(mode)?'Seu recorde será enviado assim que possível.':'Seu recorde ainda não aparece neste modo.'):'Conclua uma expedição neste modo para entrar no ranking.');
  else this.status('Você não está participando. Seus recordes ficam só neste save.');
 },

 // Botão RANKING nas telas do calabouço.
 addButton(back){
  const root=node('overlayInner');if(!root||node('rk1Open'))return;
  const row=root.querySelector('.row');if(!row)return;
  const b=document.createElement('button');b.className='action';b.id='rk1Open';b.type='button';b.textContent='RANKING ONLINE';b.onclick=()=>this.open(back);row.appendChild(b);
 }
};
window.RankingV1=Ranking;

if(typeof PostGame!=='undefined'){
 const finish=PostGame.finishRun;PostGame.finishRun=function(...args){const r=finish.apply(this,args);if(r){Ranking.addButton(closeOverlay);Ranking.sync()}return r};
 const ending=PostGame.showEnding;PostGame.showEnding=function(...args){const r=ending.apply(this,args);if(G?.c3?.complete)Ranking.addButton(()=>PostGame.showEnding());return r};
 const briefing=PostGame.openBriefing;PostGame.openBriefing=function(back,...args){const r=briefing.call(this,back,...args);if(r)Ranking.addButton(()=>PostGame.openBriefing(back));return r};
}
if(typeof openSystem==='function'){const system=openSystem;openSystem=function(...args){const r=system.apply(this,args);const anchor=node('postSystemDungeon');if(anchor&&!PostGame.active()&&!node('rk1System')){const b=document.createElement('button');b.id='rk1System';b.className=anchor.className;b.textContent='RANKING DO CALABOUÇO';b.onclick=()=>Ranking.open(openSystem);anchor.after(b)}return r}}
if(typeof addEventListener==='function')addEventListener('online',()=>Ranking.sync());
// Recordes feitos antes de ligar a internet (ou de um save importado) saem ao continuar.
if(typeof continueGame==='function'){const cont=continueGame;continueGame=function(...args){const r=cont.apply(this,args);setTimeout(()=>Ranking.sync(),1500);return r}}
})();
