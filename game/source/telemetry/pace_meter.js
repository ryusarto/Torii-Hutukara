/* TORII & HUTUKARA — Medidor de ritmo (Fase 1).
 * Mede, só no aparelho do jogador, quanto tempo se passa andando, lendo,
 * lutando e em menus, por área e por etapa da missão. Nada é enviado pela
 * internet. O relatório aparece com ?ritmo na URL (botão "RITMO") ou por
 * window.ToriiRitmo no console.
 */
(function(){
const STORE='torii_hutukara_ritmo_v1';
const MAX_SESSIONS=6;
const CATS=['andando','parado','dialogo','combate','menu','ritmo'];
const LABEL={andando:'Andando',parado:'Parado (sem diálogo)',dialogo:'Lendo diálogo',combate:'Combate',menu:'Menus/mapa/diário',ritmo:'Desafio de ritmo'};
const zero=()=>Object.fromEntries(CATS.map(c=>[c,0]));
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE))||{sessions:[]}}catch{return {sessions:[]}}};
let db=read(),s=null,lastSave=0,lastObjCheck=-1,lastWords='',lastX=null,lastY=null,prevT=null,inAction=false,quietSince=0,stepKey=null;

function newSession(label){
  s={label,startedAt:new Date().toISOString(),build:document.title,total:0,modes:zero(),areas:{},steps:[],
     dialogue:{lines:0,chars:0,speakers:{}},combat:{encounters:0,firstAt:null,longestQuiet:0,longestQuietWhere:''},
     deaths:0,areaChanges:0};
  db.sessions.push(s);if(db.sessions.length>MAX_SESSIONS)db.sessions.splice(0,db.sessions.length-MAX_SESSIONS);
  stepKey=null;quietSince=0;inAction=false;lastWords='';lastObjCheck=-1;lastX=lastY=null;persist(true);
}
function persist(force){const now=performance.now();if(!force&&now-lastSave<5000)return;lastSave=now;try{localStorage.setItem(STORE,JSON.stringify(db))}catch{}}
function category(moved){
  if(typeof mode==='undefined')return null;
  if(mode==='dialogue')return 'dialogo';
  if(mode==='action')return 'combate';
  if(mode==='overlay')return 'menu';
  if(mode==='rhythm')return 'ritmo';
  if(mode==='walk')return moved?'andando':'parado';
  return null;
}
function objectiveText(){try{const o=objectiveData();return o&&o.text?String(o.text):'—'}catch{return '—'}}
function step(area){
  const key=objectiveText();
  if(key!==stepKey){stepKey=key;s.steps.push({objetivo:key,area,inicio:+s.total.toFixed(1),segundos:0,modos:zero(),falas:0})}
  return s.steps[s.steps.length-1];
}
function sample(dt){
  if(!s||typeof G==='undefined'||!G||mode==='title')return;
  const area=G.area||'?';
  const moved=lastX!==null&&(Math.abs(G.x-lastX)+Math.abs(G.y-lastY))>1e-4;lastX=G.x;lastY=G.y;
  const cat=category(moved);if(!cat)return;
  s.total+=dt;s.modes[cat]+=dt;
  const a=s.areas[area]||(s.areas[area]=Object.assign(zero(),{visitas:0}));a[cat]+=dt;
  // o objetivo é consultado a cada meio segundo de jogo
  if(!s.steps.length||s.total-lastObjCheck>=.5){lastObjCheck=s.total;step(area)}
  const cur=s.steps[s.steps.length-1];cur.segundos+=dt;cur.modos[cat]+=dt;
  // diálogo: conta cada fala nova exibida
  if(cat==='dialogo'){const w=document.getElementById('words'),sp=document.getElementById('speaker');const text=w?w.textContent:'';
    if(text&&text!==lastWords){lastWords=text;s.dialogue.lines++;s.dialogue.chars+=text.length;cur.falas++;const who=(sp&&sp.textContent||'?').trim();s.dialogue.speakers[who]=(s.dialogue.speakers[who]||0)+1}}
  else lastWords='';
  // combate: encontros e maior trecho sem lutar
  if(cat==='combate'&&!inAction){inAction=true;s.combat.encounters++;if(s.combat.firstAt===null)s.combat.firstAt=+s.total.toFixed(1);
    const gap=s.total-quietSince;if(gap>s.combat.longestQuiet){s.combat.longestQuiet=+gap.toFixed(1);s.combat.longestQuietWhere=area}}
  if(cat!=='combate'&&inAction){inAction=false;quietSince=s.total}
  persist(false);
}

// Uma camada: a medição acontece a cada quadro desenhado.
const loopBeforeRitmo=loop;
loop=function(t,...rest){
  if(typeof t==='number'){const dt=prevT===null?0:(t-prevT)/1000;prevT=t;if(dt>0&&dt<1)sample(dt)}
  return loopBeforeRitmo(t,...rest);
};
const setAreaBeforeRitmo=setArea;
setArea=function(...args){const r=setAreaBeforeRitmo(...args);if(s&&typeof G!=='undefined'&&G){s.areaChanges++;const a=s.areas[G.area]||(s.areas[G.area]=Object.assign(zero(),{visitas:0}));a.visitas++}return r};
const defeatBeforeRitmo=showDefeat;
showDefeat=function(...args){if(s)s.deaths++;persist(true);return defeatBeforeRitmo(...args)};
for(const [fn,label] of [['newGame','Nova jornada'],['continueGame','Continuação'],['startChapterTwoPreview','Teste Capítulo 2']]){
  const before=window[fn];if(typeof before!=='function')continue;
  window[fn]=function(...args){newSession(label);return before.apply(this,args)};
}
if(typeof C3!=='undefined'&&typeof C3.start==='function'){const before=C3.start;C3.start=function(preview,...rest){if(preview)newSession('Teste Capítulo 3');return before.call(this,preview,...rest)}}

// ---------- relatório ----------
const fmt=x=>{x=Math.round(x);const m=Math.floor(x/60),r=x%60;return m?`${m}min ${String(r).padStart(2,'0')}s`:`${r}s`};
const pct=(x,t)=>t?Math.round(100*x/t)+'%':'0%';
function dominant(m){let best='andando';for(const c of CATS)if(m[c]>m[best])best=c;return best}
function summary(x=s){
  if(!x)return 'Nenhuma sessão medida ainda. Comece uma jornada.';
  const t=x.total,L=[];
  L.push(`RELATÓRIO DE RITMO · ${x.label} · ${x.startedAt.slice(0,16).replace('T',' ')}`);
  L.push(`Tempo de jogo medido: ${fmt(t)}`);L.push('');
  L.push('ONDE O TEMPO FOI');
  for(const c of CATS)L.push(`  ${LABEL[c].padEnd(24)} ${fmt(x.modes[c]).padStart(10)}  ${pct(x.modes[c],t).padStart(4)}`);
  const action=x.modes.combate+x.modes.ritmo;
  L.push(`  → Jogando de fato (combate + ritmo): ${pct(action,t)} · Andando + lendo: ${pct(x.modes.andando+x.modes.dialogo,t)}`);L.push('');
  L.push('COMBATE');
  L.push(`  Encontros: ${x.combat.encounters} · Derrotas: ${x.deaths}`);
  L.push(`  Primeiro combate em: ${x.combat.firstAt===null?'ainda não houve':fmt(x.combat.firstAt)}`);
  const openQuiet=x===s&&!inAction?x.total-quietSince:0;const longest=Math.max(x.combat.longestQuiet,openQuiet);
  L.push(`  Maior trecho sem lutar: ${fmt(longest)}${longest===openQuiet&&openQuiet>0?' (ainda em andamento)':x.combat.longestQuietWhere?' (terminou em '+x.combat.longestQuietWhere+')':''}`);L.push('');
  const narr=Object.entries(x.dialogue.speakers).filter(([k])=>/NARRADOR/i.test(k)).reduce((a,[,v])=>a+v,0);
  L.push('DIÁLOGO');
  L.push(`  Falas lidas: ${x.dialogue.lines} · Caracteres: ${x.dialogue.chars} · Narrador: ${pct(narr,x.dialogue.lines)}`);
  const top=Object.entries(x.dialogue.speakers).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`${k} ${v}`).join(' · ');
  if(top)L.push(`  Quem mais fala: ${top}`);L.push('');
  L.push('ETAPAS MAIS LONGAS (onde cortar primeiro)');
  [...x.steps].sort((a,b)=>b.segundos-a.segundos).slice(0,10).forEach((p,i)=>{
    L.push(`  ${String(i+1).padStart(2)}. ${fmt(p.segundos).padStart(9)} · ${LABEL[dominant(p.modos)].toLowerCase()} ${pct(p.modos[dominant(p.modos)],p.segundos)} · ${p.falas} falas · ${p.objetivo}`)});
  L.push('');L.push('POR ÁREA');
  Object.entries(x.areas).sort((a,b)=>{const s1=CATS.reduce((q,c)=>q+a[1][c],0),s2=CATS.reduce((q,c)=>q+b[1][c],0);return s2-s1}).forEach(([k,v])=>{
    const tt=CATS.reduce((q,c)=>q+v[c],0);
    L.push(`  ${k.padEnd(20)} ${fmt(tt).padStart(9)} · andando ${pct(v.andando,tt)} · diálogo ${pct(v.dialogo,tt)} · combate ${pct(v.combate,tt)} · entradas ${v.visitas}`)});
  return L.join('\n');
}
function download(name,text,type){const b=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function openPanel(){
  persist(true);let p=document.getElementById('ritmoPanel');if(p){p.remove();return}
  p=document.createElement('div');p.id='ritmoPanel';
  p.style.cssText='position:fixed;inset:5%;z-index:99999;background:#12101cf2;border:2px solid #e6bc88;color:#ffe7c0;font:12px/1.45 monospace;padding:12px;overflow:auto;white-space:pre-wrap';
  const bar=document.createElement('div');bar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px';
  const btn=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='background:#2d545b;color:#fff;border:1px solid #9dd2c7;padding:6px 10px;font:12px monospace;cursor:pointer';b.onclick=f;bar.appendChild(b)};
  const stamp=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
  btn('Baixar relatório (.txt)',()=>download(`torii-ritmo-${stamp}.txt`,summary(),'text/plain'));
  btn('Baixar dados (.json)',()=>download(`torii-ritmo-${stamp}.json`,JSON.stringify(db,null,1),'application/json'));
  btn('Copiar resumo',()=>{try{navigator.clipboard.writeText(summary())}catch{}});
  btn('Zerar medições',()=>{if(confirm('Apagar todas as medições de ritmo deste aparelho?')){db={sessions:[]};s=null;persist(true);p.remove()}});
  btn('Fechar',()=>p.remove());
  const pre=document.createElement('div');pre.textContent=summary();p.append(bar,pre);document.body.appendChild(p);
}
window.ToriiRitmo={summary,report:()=>JSON.parse(JSON.stringify(db)),current:()=>s,newSession,open:openPanel};
if(/[?&]ritmo\b/.test(location.search)){
  const b=document.createElement('button');b.id='ritmoButton';b.textContent='RITMO';b.title='Relatório de ritmo (playtest)';
  b.style.cssText='position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:99998;background:#2d545bd0;color:#fff;border:1px solid #9dd2c7;padding:3px 8px;font:11px monospace;cursor:pointer';
  b.onclick=openPanel;document.body.appendChild(b);
}
window.addEventListener('pagehide',()=>persist(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist(true)});
})();
