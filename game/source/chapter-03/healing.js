/* TORII & HUTUKARA — Cura: fitas, mercadores e gravadores.
 * - Fita de cura: R no teclado, Share/Create no controle ou o botão FITA na
 *   tela. Recupera 40% da vida do integrante ativo (mínimo 15).
 * - Mercadores: Mercadora (Cap. 1), banca do Colli no Mercado das Fitas
 *   (Cap. 2) e balcão do Belga no Contratempo (Cap. 3). Moeda: fragmentos de eco.
 * - Gravadores que curam a equipe e salvam o ponto no Capítulo 3.
 * Antes desta camada as fitas eram compradas e ganhas, mas não havia como usá-las.
 */
(function(){
const TAPE={pct:.4,min:15,cooldown:1.2};
const PRICES={one:3,pack:8};
let tapeCooldown=0;

function activeId(){try{return fighterName()}catch{return G&&G.active}}
function useTape(){
  if(!G||!['walk','action'].includes(mode)||tapeCooldown>0)return;
  const id=activeId();if(!id||!G.maxhp[id])return;
  if((G.potions||0)<=0){toast('SEM FITAS DE CURA · COMPRE COM UM MERCADOR');return}
  if(G.hp[id]>=G.maxhp[id]){toast('VIDA CHEIA');return}
  const heal=Math.max(TAPE.min,Math.round(G.maxhp[id]*TAPE.pct));
  G.hp[id]=Math.min(G.maxhp[id],G.hp[id]+heal);G.potions--;tapeCooldown=TAPE.cooldown;
  try{playTone(523.3,.12,'triangle',.07);setTimeout(()=>playTone(784,.16,'triangle',.06),90)}catch{}
  try{addCombatFX(G.x,G.y,'xp',1.2)}catch{}
  toast(`♥ FITA DE CURA · +${heal} · RESTAM ${G.potions}`);
  try{updateHUD();if(mode==='action')updateActionHUD()}catch{}
  try{save()}catch{}
  refreshButton();
}

// ---------- entrada ----------
addEventListener('keydown',e=>{if((e.key==='r'||e.key==='R')&&!e.repeat&&G&&['walk','action'].includes(mode)){e.preventDefault();useTape()}});
let padHeld=false;
function pollPads(){
  try{const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];
    const down=pads.some(p=>p.buttons&&p.buttons[8]&&p.buttons[8].pressed);
    if(down&&!padHeld)useTape();padHeld=down}catch{}
}
// Cada capítulo novo começa com a equipe recuperada (antes, o Capítulo 3
// começava com a vida que sobrou da luta na torre do Capítulo 2).
let lastChapter=null;
function chapterHeal(){if(!G)return;const c=G.chapter||1;if(lastChapter!==null&&c>lastChapter){healTeam();try{toast('NOVO MUNDO · EQUIPE RECUPERADA');updateHUD()}catch{}}lastChapter=c}
const updateBeforeHealing=update;
update=function(dt,...rest){const r=updateBeforeHealing.call(this,dt,...rest);tapeCooldown=Math.max(0,tapeCooldown-(dt||0));pollPads();chapterHeal();return r};
for(const name of ['newGame','continueGame','startChapterTwoPreview']){const before=window[name];if(typeof before==='function')window[name]=function(...args){lastChapter=null;return before.apply(this,args)}}

// Botão na tela (toque e mouse).
let button=null;
function ensureButton(){
  if(button||!document.getElementById('hud'))return;
  button=document.createElement('button');button.id='tapeButton';button.type='button';
  button.title='Usar fita de cura (R)';
  button.style.cssText='position:absolute;top:54px;right:14px;z-index:6;pointer-events:auto;background:#2b1d2ee6;color:#ffd9c2;border:1px solid #e9939f;padding:4px 9px;font:11px monospace;cursor:pointer;border-radius:3px';
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();useTape()});
  button.addEventListener('pointerdown',e=>e.stopPropagation());
  document.getElementById('hud').appendChild(button);
}
function refreshButton(){ensureButton();if(!button)return;const n=G?(G.potions||0):0;button.textContent=`♥ FITA ×${n}`;button.style.opacity=n?'1':'.55';button.style.display=G&&mode!=='title'?'block':'none'}
const hudBeforeHealing=updateHUD;
updateHUD=function(...args){const r=hudBeforeHealing.apply(this,args);try{refreshButton()}catch{}return r};

// ---------- mercadores ----------
function openTapeShop(vendor,line){
  const n=G.potions||0,s=G.shards||0;
  openOverlay(`<div class="eyebrow">${vendor.toUpperCase()} · FITAS DE CURA</div><h2>${vendor}</h2><p>${line}</p>
  <div class="stat"><span>Fragmentos de eco</span><b>${s}</b></div>
  <div class="stat"><span>Suas fitas de cura</span><b>${n}</b></div>
  <div class="stat"><span>Fita de cura · recupera 40% da vida do integrante ativo</span><b>${PRICES.one} fragmentos</b></div>
  <div class="stat"><span>Pacote com 3 fitas</span><b>${PRICES.pack} fragmentos</b></div>
  <p class="tiny">Use uma fita com R, com o botão Share/Create do controle ou tocando em ♥ FITA no topo da tela. Inimigos derrotados deixam fragmentos.</p>
  <div class="row"><button class="action strong" id="shopOne" ${s<PRICES.one?'disabled':''}>COMPRAR 1 FITA</button><button class="action strong" id="shopPack" ${s<PRICES.pack?'disabled':''}>COMPRAR 3 FITAS</button><button class="action" id="shopClose">VOLTAR</button></div>`);
  const buy=(cost,qty)=>{if(G.shards<cost)return;G.shards-=cost;G.potions=(G.potions||0)+qty;try{playTone(660,.12,'triangle',.06);save()}catch{}toast(`+${qty} FITA${qty>1?'S':''} DE CURA`);openTapeShop(vendor,line)};
  document.getElementById('shopOne').onclick=()=>buy(PRICES.one,1);
  document.getElementById('shopPack').onclick=()=>buy(PRICES.pack,3);
  document.getElementById('shopClose').onclick=()=>{closeOverlay();refreshButton()};
}
// A Mercadora do Capítulo 1 passa a usar a loja nova.
openShop=function(){openTapeShop('Mercado das Canções','Um balcão de madeira antiga. As fitas vibram discretamente ao toque.')};

function freeSpot(a,x,y){
  const busy=(px,py)=>[...(a.events||[]),...(a.npcs||[]),...(a.gates||[])].some(o=>Math.hypot(o.x-px,o.y-py)<2.2);
  for(let r=0;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const px=Math.floor(x+dx)+.5,py=Math.floor(y+dy)+.5;
    if(px<1||py<1||px>=a.w-1||py>=a.h-1)continue;
    if(tileWalkable(a,px,py)&&!busy(px,py))return [px,py];
  }
  return null;
}
function healTeam(){for(const id of Object.keys(G.maxhp||{}))if(G.maxhp[id])G.hp[id]=G.maxhp[id]}
// Gravadores do Capítulo 3: [id, área, x, y, nome]
const RECORDERS=[
  ['c3_rec_club','distortion_district',18,23,'Distrito · Contratempo'],
  ['c3_rec_east','distortion_district',50,25,'Distrito · Usina e Canal'],
  ['c3_rec_clouds','cloud_sea',9,25,'Mar de Nuvens'],
];
function addStations(){
  // Capítulo 2: banca do Colli no Mercado das Fitas.
  const tm=areas.tape_market;
  if(tm&&!tm.events.some(e=>e.id==='tape_shop_colli')){const s=freeSpot(tm,8,8);if(s)evt(tm,'tape_shop_colli',s[0],s[1],'BANCA DO COLLI · FITAS DE CURA',()=>openTapeShop('Banca do Colli','Colli separa fitas que ainda guardam alguma voz. "Essas aqui seguram o fôlego de quem escuta."'))}
  // Capítulo 3: o Belga vende fitas no balcão do Contratempo.
  const club=areas.contratempo;
  if(club&&!club.events.some(e=>e.id==='c3_belga_counter')){const s=freeSpot(club,21,11);if(s)evt(club,'c3_belga_counter',s[0],s[1],'BALCÃO DO BELGA · FITAS DE CURA',()=>openTapeShop('Balcão do Belga','Belga apoia uma caixa de fitas no balcão. "Eu guardo os sons que a cidade tenta esquecer. Alguns ainda seguram o fôlego de quem escuta."'))}
  for(const [id,area,x,y,name] of RECORDERS){
    const a=areas[area];if(!a||a.events.some(e=>e.id===id))continue;const s=freeSpot(a,x,y);if(!s)continue;
    prop(a,'checkpointStone',Math.floor(s[0]),Math.floor(s[1])-1);
    evt(a,id,s[0],s[1],'GRAVADOR · CHECKPOINT',()=>{healTeam();setCheckpoint(id,area,s[0],s[1],true);try{save(true);updateHUD()}catch{}talk([{who:'narrator',t:'O gravador salva esta frequência. A equipe recupera as forças.',__edited:true}])});
  }
}
const buildBeforeHealing=buildMaps;
buildMaps=function(...args){const r=buildBeforeHealing.apply(this,args);try{addStations()}catch(e){console.warn('cura: estações',e)}return r};

window.ToriiCura={useTape,openTapeShop,RECORDERS};
})();
