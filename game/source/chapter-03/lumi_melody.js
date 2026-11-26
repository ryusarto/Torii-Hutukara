/* As três notas foram mapeadas no trecho de Veracidade
 * ouvido no estúdio. O áudio vem do mesmo master estéreo do jogo. */
const LumiMelody=(()=>{
 'use strict';
 const track='veracidade';
 const notes=[
  {name:'Si♭',key:'1',frequency:466.164},
  {name:'Dó♯',key:'2',frequency:554.365},
  {name:'Ré♯',key:'3',frequency:622.254}
 ];
 const phrase=[{note:1,at:3.17},{note:2,at:3.39},{note:0,at:3.87}];
 const clipStart=3.11,clipEnd=4.36;
 let session=null;

 function isOpen(){
  return !!session&&session.game===G&&mode==='overlay'&&!$('overlay').classList.contains('hidden')&&!!$('lumiMelody');
 }
 function stop(){
  if(!session)return;
  for(const timer of session.timers)clearTimeout(timer);
  session.timers.length=0;
  if(session.source){try{session.source.stop()}catch{}session.source=null}
  session.playId++;
  for(const button of document.querySelectorAll('[data-vnote]'))button.classList.remove('lumi-cue');
 }
 function later(callback,ms){
  const current=session;
  current.timers.push(setTimeout(()=>{if(session===current&&isOpen())callback()},ms));
 }
 function preview(whole=false){
  if(!isOpen())return;
  stop();
  const current=session,id=current.playId;
  const status=$('lumiAudioStatus');
  const playCues=(audibleFallback=false)=>{
   for(const item of phrase){
    later(()=>{
     for(const button of document.querySelectorAll('[data-vnote]'))button.classList.toggle('lumi-cue',Number(button.dataset.vnote)===item.note);
     if(audibleFallback&&audioEnabled)playTone(notes[item.note].frequency,.21,'triangle',.07);
    },(item.at-clipStart)*1000);
   }
   later(()=>{for(const button of document.querySelectorAll('[data-vnote]'))button.classList.remove('lumi-cue')},(clipEnd-clipStart)*1000);
  };
  if(!audioEnabled||!AC){
   status.textContent='Acompanhe as notas destacadas.';
   playCues();return;
  }
  status.textContent='Carregando o trecho de Veracidade…';
  if(AC.state==='suspended')AC.resume().catch(()=>{});
  decodeAlbum11(track).then(buffer=>{
   if(session!==current||!isOpen()||current.playId!==id)return;
   if(!buffer||buffer.duration<clipEnd||AC.state!=='running'){
    status.textContent='Gravação indisponível. Acompanhe as notas destacadas.';
    playCues(true);return;
   }
   try{
    const source=AC.createBufferSource(),gain=AC.createGain(),now=AC.currentTime,duration=clipEnd-clipStart;
    source.buffer=buffer;source.connect(gain);gain.connect(AC.destination);
    gain.gain.setValueAtTime(0,now);
    gain.gain.linearRampToValueAtTime(.64,now+.035);
    gain.gain.setValueAtTime(.64,now+duration-.09);
    gain.gain.linearRampToValueAtTime(0,now+duration);
    source.onended=()=>{source.disconnect();gain.disconnect();if(current.source===source)current.source=null};
    current.source=source;source.start(now,clipStart,duration);
    status.textContent=whole?'A frase voltou à gravação.':'Trecho da gravação · Veracidade';
    playCues();
   }catch{
    status.textContent='Acompanhe as notas destacadas.';
    playCues(true);
   }
  });
 }
 function finish(){
  if(!isOpen()||!session.solved||G.flags.lumiSong)return false;
  G.flags.lumiSong=true;grantViolin11();gainXP(42);G.potions++;
  save(true);
  closeOverlay();
  talk([{who:'lumi',t:'É essa. No estúdio vocês ouviram a gravação. Agora eu consegui tocar junto.'},
   {who:'narrator',t:'Violino das Vozes recebido. Toque perto da névoa dos telhados para separar a interferência.'}],()=>{save(true);updateHUD()});
  return true;
 }
 function choose(note){
  if(!isOpen()||session.solved)return;
  stop();
  $('lumiAudioStatus').textContent='';
  playTone(notes[note].frequency,.23,'triangle',.085);
  if(note!==phrase[session.progress].note){
   session.progress=0;
   $('lumiProgress').textContent='Essa nota não encaixou. Tente a frase de novo.';
  }else{
   session.progress++;
   $('lumiProgress').textContent=session.progress===phrase.length?'Frase completa.':'Notas recuperadas · '+session.progress+' de '+phrase.length;
  }
  for(const [i,slot] of [...document.querySelectorAll('[data-lumi-slot]')].entries())slot.textContent=i<session.progress?notes[phrase[i].note].name:'—';
  if(session.progress!==phrase.length)return;
  session.solved=true;
  for(const button of document.querySelectorAll('[data-vnote]'))button.disabled=true;
  $('lumiFinish').hidden=false;$('lumiFinish').focus();
  preview(true);
 }
 function open(){
  if(!G||G.flags.lumiSong)return;
  stop();
  session=null;
  const keys=notes.map((note,index)=>`<button type="button" class="voice-note" data-vnote="${index}" aria-label="${note.name}${controlHint121(', tecla '+note.key,'')}">${note.name}${controlHint121('<small>'+note.key+'</small>','')}</button>`).join('');
  const slots=phrase.map((_,index)=>`<span data-lumi-slot="${index}">—</span>`).join('');
  enterMenu10(`<section id="lumiMelody"><div class="eyebrow">CIDADE DAS VOZES</div><h2>A melodia de Lumi</h2>
   <p>Complete a frase de <strong>Veracidade</strong>. Toque na ordem, no seu tempo.</p>
   <div class="lumi-slots" aria-hidden="true">${slots}</div>
   <div class="row"><button class="action strong" id="lumiListen">OUVIR TRECHO</button><button class="action" id="lumiShow" aria-expanded="false" aria-controls="lumiHint">MOSTRAR NOTAS</button></div>
   <p id="lumiHint" hidden>${phrase.map(item=>notes[item.note].name).join(' → ')}</p>
   <div class="voice-note-grid">${keys}</div>
   <p id="lumiProgress" role="status">Notas recuperadas · 0 de ${phrase.length}</p><p id="lumiAudioStatus" class="tiny" role="status"></p>
   <div class="row"><button class="action strong" id="lumiFinish" hidden>DEVOLVER A MELODIA</button><button class="action" id="lumiClose">VOLTAR À PRAÇA</button></div>
  </section>`,'lumi');
  session={game:G,timers:[],playId:0,source:null,progress:0,solved:false};
  soundscape();
  $('lumiListen').onclick=()=>preview(session.solved);
  $('lumiShow').onclick=()=>{
   const hint=$('lumiHint');hint.hidden=!hint.hidden;
   $('lumiShow').setAttribute('aria-expanded',String(!hint.hidden));
   $('lumiShow').textContent=hint.hidden?'MOSTRAR NOTAS':'OCULTAR NOTAS';
  };
  $('lumiFinish').onclick=finish;$('lumiClose').onclick=closeOverlay;
  for(const button of document.querySelectorAll('[data-vnote]'))button.onclick=()=>choose(Number(button.dataset.vnote));
  $('lumiListen').focus();
 }
 document.addEventListener('keydown',e=>{
  if(!isOpen()||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  const index=notes.findIndex(note=>note.key===e.key);
  if(index<0)return;
  e.preventDefault();e.stopImmediatePropagation();choose(index);
 },true);
 const close=closeOverlay;
 closeOverlay=function(...args){if(session){stop();session=null}return close(...args)};
 const openMenu=enterMenu10;
 enterMenu10=function(...args){if(isOpen()){stop();session=null}return openMenu(...args)};
 const areaTrack=albumTrack11;
 albumTrack11=function(){return isOpen()?null:areaTrack()};
 const areaSound=soundscape;
 soundscape=function(){
  if(!isOpen())return areaSound();
  if(Music11.gain&&Music11.lastLevel!==0){
   const now=AC.currentTime,gain=Music11.gain.gain;
   gain.cancelScheduledValues(now);gain.setTargetAtTime(0,now,.035);Music11.lastLevel=0;
  }
 };
 const suspendPlayback=()=>{if(session)stop()};
 addEventListener('pagehide',suspendPlayback);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendPlayback()});
 const style=document.createElement('style');
 style.textContent=`
 #lumiMelody [hidden]{display:none!important}
 .lumi-slots{display:flex;gap:8px;padding:6px 0 12px}
 .lumi-slots span{display:grid;place-items:center;min-width:2.8em;padding:6px;border:1px solid #9e825c;color:#ffdfa3}
 #lumiMelody .voice-note{min-height:56px;font-size:clamp(15px,4vw,24px)}
 #lumiMelody .voice-note.lumi-cue{outline:2px solid #ffe4a8;background:#51416e}
 #lumiMelody #lumiAudioStatus:empty{display:none}
 `;
 document.head.appendChild(style);
 return Object.freeze({open});
})();
openLumiPuzzle=LumiMelody.open;
lumiNPC=function(){
 if(G.flags.lumiSong)return talk([{who:'lumi',t:'Eu consegui tocar de novo. Se fechar os olhos, ainda escuto a frase inteira.'}]);
 talk([{who:'lumi',t:'Eu guardava uma melodia que chamava Veracidade. Ouve este trecho. Quero ver se ainda consigo tocar junto.'}],openLumiPuzzle);
};
