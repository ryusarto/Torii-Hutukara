/* TORII & HUTUKARA — Edições de diálogo (Fase 5).
 * Aplica design/dialogo/EDICOES_DIALOGO.json na hora de exibir cada fala:
 * cortar, trocar texto/quem fala, acrescentar falas e transformar avisos de
 * sistema em notificação rápida. O texto original continua no código; para
 * desfazer uma edição, basta tirá-la do JSON.
 * Também: cena do Canal não repete e a Rádio 9 deixa de ser parada obrigatória.
 */
(function(){
const DATA=__DIALOGUE_EDITS__;
const byText=new Map(DATA.edicoes.map(e=>[e.t,e]));
const asLine=l=>typeof l==='string'?{who:'narrator',t:l}:l;

function editLines(lines){
  const out=[],notices=[];
  for(const raw of lines||[]){
    const l=asLine(raw);
    if(!l||l.__edited){out.push(l);continue}
    const e=byText.get(l.t);
    if(!e){out.push(l);continue}
    if(e.acao==='aviso'){notices.push(l.t);continue}
    if(e.acao!=='cortar'){
      const next={...l,__edited:true};
      if(e.quem)next.who=e.quem;
      if(e.novo)next.t=e.novo;
      out.push(next);
    }
    for(const extra of e.depois||[])out.push({who:extra.quem,t:extra.t,__edited:true});
  }
  if(notices.length)showNotices(notices);
  return out;
}
let noticeQueue=[],noticeBusy=false;
function showNotices(list){noticeQueue.push(...list);if(!noticeBusy)nextNotice()}
function nextNotice(){
  const n=noticeQueue.shift();if(!n){noticeBusy=false;return}
  noticeBusy=true;try{toast(n)}catch{}
  setTimeout(nextNotice,1700);
}

const talkBeforeEdits=talk;
talk=function(lines,end){return talkBeforeEdits(editLines(lines),end)};
// Falas acrescentadas direto na fila (ex.: relíquia da Lumi) também passam pelas edições.
const advanceBeforeEdits=advanceDialogue;
advanceDialogue=function(...args){
  if(mode==='dialogue'&&dialogueQueue.some(l=>!(l&&l.__edited)&&byText.has(asLine(l).t)))dialogueQueue=editLines(dialogueQueue);
  return advanceBeforeEdits(...args);
};

// Cenas automáticas não se repetem depois de uma derrota (o checkpoint volta
// o estado da missão, mas quem joga já viu a cena).
const SEEN_KEY='torii_hutukara_cenas_vistas_v1';
const AUTO_SCENES=new Set(['C3_001','C3_016','C3_017','C3_018','C3_019','C3_020']);
let seenScenes=new Set();try{seenScenes=new Set(JSON.parse(localStorage.getItem(SEEN_KEY))||[])}catch{}
const rememberScene=id=>{seenScenes.add(id);try{localStorage.setItem(SEEN_KEY,JSON.stringify([...seenScenes]))}catch{}};
const forgetScenes=()=>{seenScenes=new Set();try{localStorage.removeItem(SEEN_KEY)}catch{}};
const newGameBeforeEdits=newGame;
newGame=function(...args){forgetScenes();return newGameBeforeEdits.apply(this,args)};
const ch2BeforeEdits=startChapterTwoPreview;
startChapterTwoPreview=function(...args){forgetScenes();return ch2BeforeEdits.apply(this,args)};
if(typeof C3!=='undefined'&&typeof C3.start==='function'){const c3StartBeforeEdits=C3.start;C3.start=function(preview,...rest){if(preview)forgetScenes();return c3StartBeforeEdits.call(this,preview,...rest)}}

// Cena do Canal (C3_008): toca uma vez na chegada. Depois, Colli e o
// Percussionista só lembram o que fazer, em vez de repetir a cena inteira.
if(typeof C3!=='undefined'&&typeof C3.scene==='function'){
  const sceneBeforeEdits=C3.scene;
  C3.scene=function(id,end){
    if(AUTO_SCENES.has(id)){if(seenScenes.has(id)){if(end)end();return}rememberScene(id)}
    if(id==='C3_008'&&G&&G.c3){
      if(G.c3.canalSceneSeen||seenScenes.has('C3_008')){
        return talk([{who:'nilo',t:'O violino da Lumi separa a interferência. Toquem perto da passagem e eu marco o caminho.',__edited:true}],end);
      }
      G.c3.canalSceneSeen=true;rememberScene('C3_008');
    }
    return sceneBeforeEdits.call(this,id,end);
  };
}

// A chegada ao Canal (fala da Colli + cena) também não se repete após derrota.
if(typeof C3!=='undefined'&&typeof C3.areaStory==='function'){
  const areaStoryBeforeEdits=C3.areaStory;
  C3.areaStory=function(id,...rest){
    if(id==='sky_canal'&&G&&G.c3&&!G.c3.canalIntro&&seenScenes.has('C3_008')){G.c3.canalIntro=true;G.c3.canalSceneSeen=true}
    return areaStoryBeforeEdits.call(this,id,...rest);
  };
}

// Capítulo 2: o Belga entrega o acoplador e a Íris guia pelo rádio, então
// os retransmissores já podem ser ativados sem a parada na Rádio 9.
const couplerBeforeEdits=assembleCoupler;
assembleCoupler=function(...args){
  const r=couplerBeforeEdits.apply(this,args);
  if(G&&G.flags.voicesCoupler&&!G.flags.voicesTech){G.flags.voicesTech=true;try{updateHUD()}catch{}}
  return r;
};
const normalizeBeforeEdits=normalizeSave;
normalizeSave=function(...args){
  const g=normalizeBeforeEdits.apply(this,args);
  if(g&&g.flags&&g.flags.voicesCoupler)g.flags.voicesTech=true;
  if(g&&g.c3&&g.c3.canalIntro)g.c3.canalSceneSeen=true;
  return g;
};
window.ToriiDialogo={editLines,edits:DATA.edicoes.length};
})();
