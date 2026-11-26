/* Rádio 9 · captação da faixa e abertura da rede de retransmissores. */
const Radio9=(()=>{
  'use strict';
  const TRACK='esquecer',FIRST=6,LAST=10,CHANNELS=9,TARGET=6;
  const receiver={id:'radioReceiver',x:18,y:8};
  const relayFlags=['relayPlaza','relayMarket','relayRoof'];
  let session=null;
  let staticBuffer=null;

  function tuned(g=G){
    const f=g?.flags;
    return !!(f&&(f.radioTuned||f.voicesTower||f.voicesBoss||f.voicesDone||
      f.voicesKatana||relayFlags.some(flag=>f[flag])));
  }
  function stable(s){return s.channel===TARGET}
  function quality(s){return 1-Math.min(1,Math.abs(s.channel-TARGET)/6)}
  function visible(){
    return session?.game===G&&G?.area==='radio9'&&mode==='overlay'&&
      !$('overlay').classList.contains('hidden')&&!!$('radioTuner');
  }

  function noise(){
    if(staticBuffer?.sampleRate===AC.sampleRate)return staticBuffer;
    staticBuffer=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);
    const samples=staticBuffer.getChannelData(0);
    let seed=9029;
    for(let i=0;i<samples.length;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      samples[i]=(seed/4294967296-.5)*2;
    }
    return staticBuffer;
  }

  function excerpt(buffer){
    const start=Math.floor(FIRST*buffer.sampleRate),length=Math.floor((LAST-FIRST)*buffer.sampleRate);
    const output=AC.createBuffer(buffer.numberOfChannels,length,buffer.sampleRate);
    const fade=Math.floor(.018*buffer.sampleRate);
    for(let channel=0;channel<buffer.numberOfChannels;channel++){
      const samples=output.getChannelData(channel);
      samples.set(buffer.getChannelData(channel).subarray(start,start+length));
      for(let i=0;i<fade;i++){
        const gain=i/fade;
        samples[i]*=gain;samples[length-1-i]*=gain;
      }
    }
    return output;
  }

  function stopAudio(s=session){
    if(!s)return;
    s.request=null;
    const audio=s.audio;
    if(!audio)return;
    s.audio=null;
    for(const source of audio.sources){try{source.stop()}catch{}}
    for(const node of audio.nodes)node.disconnect();
  }

  function tuneAudio(s){
    const audio=s.audio;
    if(!audio)return;
    const q=quality(s),now=AC.currentTime;
    audio.low.frequency.setTargetAtTime(430+q**4*17100,now,.065);
    audio.high.frequency.setTargetAtTime(34+(1-q)*460,now,.065);
    audio.songGain.gain.setTargetAtTime(.12+.56*q**2,now,.065);
    audio.noiseGain.gain.setTargetAtTime(.13*(1-q)**1.5,now,.065);
  }

  async function startAudio(s){
    if(s.request||s.audio||s.failed||!audioEnabled||!AC||Music11.hidden||document.hidden)return;
    const request={};s.request=request;
    const resume=AC.state==='running'?Promise.resolve():AC.resume().catch(()=>{});
    const [buffer]=await Promise.all([decodeAlbum11(TRACK),resume]);
    if(!visible()||s!==session||s.request!==request)return;
    s.request=null;
    if(!audioEnabled||Music11.hidden||AC.state!=='running')return;
    if(!buffer||buffer.duration<LAST){s.failed=true;return}
    const song=AC.createBufferSource(),hiss=AC.createBufferSource(),
      low=AC.createBiquadFilter(),high=AC.createBiquadFilter(),band=AC.createBiquadFilter(),
      songGain=AC.createGain(),noiseGain=AC.createGain();
    song.buffer=excerpt(buffer);song.loop=true;
    hiss.buffer=noise();hiss.loop=true;
    low.type='lowpass';high.type='highpass';band.type='bandpass';band.frequency.value=2300;band.Q.value=.64;
    songGain.gain.value=0;noiseGain.gain.value=0;
    song.connect(high).connect(low).connect(songGain).connect(AC.destination);
    hiss.connect(band).connect(noiseGain).connect(AC.destination);
    s.audio={low,high,songGain,noiseGain,sources:[song,hiss],nodes:[song,hiss,low,high,band,songGain,noiseGain]};
    tuneAudio(s);
    const now=AC.currentTime;
    try{song.start(now);hiss.start(now)}catch{stopAudio(s);s.failed=true}
  }

  function drawScope(s){
    const scope=$('radioScope'),ctx=scope.getContext('2d');
    const w=scope.width,h=scope.height,q=quality(s),locked=stable(s);
    const t=G.options10?.reducedMotion?0:s.clock;
    ctx.fillStyle='#101e26';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#263b44';
    for(let x=16;x<w;x+=16)ctx.fillRect(x,0,1,h);
    for(let y=12;y<h;y+=12)ctx.fillRect(0,y,w,1);
    ctx.fillStyle='#41545a';ctx.fillRect(0,h/2,w,1);
    ctx.strokeStyle=locked?'#b7efce':'#ffc784';ctx.lineWidth=2;
    ctx.beginPath();
    for(let x=0;x<w;x+=2){
      const phase=x*.061-t*5;
      const wave=Math.sin(phase)*15+Math.sin(phase*2)*4;
      const jitter=Math.sin(x*9.67+Math.floor(t*19)*2.73)*19+Math.sin(x*.83+t*17)*8;
      const y=h/2+(wave*q+jitter*(1-q));
      if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  function paint(s){
    const locked=stable(s);
    $('radioTuner').classList.toggle('radio-locked',locked);
    $('radioChannel').textContent=(88.1+s.channel*.2).toFixed(1).replace('.',',');
    $('radioQuality').textContent=locked?'Sinal limpo':quality(s)>.5?'Sinal próximo':'Estática';
    $('radioDown').disabled=s.channel===0;
    $('radioUp').disabled=s.channel===CHANNELS-1;
    $('radioSend').disabled=!locked;
    drawScope(s);
  }

  function change(s,step){
    if(s!==session||!visible())return;
    s.channel=clamp(s.channel+step,0,CHANNELS-1);
    paint(s);tuneAudio(s);startAudio(s);
  }

  function transmit(s){
    if(s!==session||!visible()||!stable(s))return;
    const first=!tuned();
    G.flags.radioTuned=true;G.flags.voicesTech=true;
    closeOverlay();save(true);updateHUD();
    emitMusic(19.5*T,4.55*T,26,'green');
    if(first)talk([
      {who:'iris',t:'Aqui é a Rádio 9. Alguém me ouve?'},
      {who:'iris',t:'O Arauto levou nosso técnico. Agora que temos sinal, os três retransmissores podem acordar.'}
    ]);
    else toast('RÁDIO 9 · NO AR');
  }

  function open(){
    if(G?.area!=='radio9')return;
    if(!G.flags.voicesCoupler&&!tuned())return talk([{who:'iris',t:'Precisamos do acoplador que o Belga está montando.'}]);
    stopAudio();
    const s={game:G,channel:tuned()?TARGET:2,clock:0,pulse:0,request:null,audio:null,failed:false};
    session=s;
    enterMenu10(`<section id="radioTuner" aria-labelledby="radioTitle">
      <div class="eyebrow">ESTÚDIO DE TRANSMISSÃO</div>
      <h2 id="radioTitle">Rádio 9</h2>
      <p>Ajuste o dial até a onda ficar estável.</p>
      <div class="radio-display">
        <div class="radio-readout"><span><b id="radioChannel"></b> FM</span><span id="radioQuality" role="status"></span></div>
        <canvas id="radioScope" width="384" height="96" aria-hidden="true"></canvas>
      </div>
      <div class="radio-dial" role="group" aria-label="Ajustar frequência">
        <button class="action" id="radioDown" aria-label="Diminuir frequência">←</button>
        <button class="action" id="radioUp" aria-label="Aumentar frequência">→</button>
      </div>
      <div class="row radio-actions"><button class="action strong" id="radioSend" disabled>TRANSMITIR</button>
      <button class="action" id="radioClose">VOLTAR</button></div>
    </section>`,'radio9');
    $('radioDown').onclick=()=>change(s,-1);
    $('radioUp').onclick=()=>change(s,1);
    $('radioSend').onclick=()=>transmit(s);
    $('radioClose').onclick=()=>closeOverlay();
    paint(s);soundscape();startAudio(s);
  }

  function key(event){
    if(!visible()||event.altKey||event.ctrlKey||event.metaKey)return false;
    if(!['ArrowLeft','ArrowRight','Escape'].includes(event.key))return false;
    event.preventDefault();event.stopImmediatePropagation();
    if(event.key==='Escape')closeOverlay();
    else change(session,event.key==='ArrowLeft'?-1:1);
    return true;
  }

  function step(dt){
    if(!session)return;
    if(!visible()){stopAudio();session=null;return}
    const s=session;
    s.clock+=dt;s.pulse+=dt;
    if(s.pulse<.04||G.options10?.reducedMotion)return;
    s.pulse=0;drawScope(s);
  }

  function worldLight(p,cx,cy){
    const x=Math.round(p.x*T-cx),y=Math.round(p.y*T-cy);
    ctx.save();
    if(p.type==='radioTuner'){
      rect(x-18,y-15,36,17,'#2c2635');
      rect(x-15,y-15,30,2,'#b69165');
      rect(x-13,y-12,18,7,'#141f2b');
      rect(x-11,y-9,14,1,tuned()?'#a0d9bb':'#c59664');
      rect(x+8,y-11,6,6,'#907154');rect(x+10,y-9,2,2,'#e5c598');
      rect(x-14,y+1,28,2,'#221e2f');
    }else if(tuned()){
      rect(x-2,y-38,5,5,'#b7efce');
      rect(x-5,y-36,11,1,'#9cd5b4');
    }
    ctx.restore();
  }

  function install(area){
    const point=area.events.find(e=>e.id===receiver.id);
    point.label='RÁDIO 9 · SINTONIZAR';
    point.doit=open;
    const bench=area.events.find(e=>e.id==='techBench');
    bench.label='BANCADA DO TÉCNICO';
    bench.doit=()=>talk([{who:'iris',t:'O mostrador de sintonia fica junto à antena da Rádio 9.'}]);
    const iris=area.npcs.find(n=>n.id==='iris');
    const previous=iris.say;
    iris.say=()=>!G.flags.voicesCoupler||G.flags.voicesDone?previous():
      talk([{who:'iris',t:tuned()?'O sinal voltou. Reativem os retransmissores nos bairros.':'Liguem o acoplador no mostrador da antena. A música fica limpa quando vocês acham a frequência.'}]);
    prop(area,'radioTuner',receiver.x,receiver.y,{worldGroundY:receiver.y});
  }

  const style=document.createElement('style');
  style.textContent=`
    #radioTuner .radio-display{background:#151c28;border:1px solid #947756;padding:9px;margin:10px 0 12px}
    #radioTuner .radio-readout{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:8px;color:#ffdb9f;font:700 13px/1.2 monospace}
    #radioChannel{font-size:clamp(18px,5vw,26px)}
    #radioTuner.radio-locked .radio-readout{color:#b7efce}
    #radioScope{display:block;width:100%;height:clamp(48px,13vh,96px);border:1px solid #46535a;background:#101e26;image-rendering:pixelated}
    #radioTuner .radio-dial{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    #radioTuner .radio-dial button{width:100%;min-height:48px;font:700 23px/1 monospace;touch-action:manipulation}
    #radioTuner .radio-actions{margin-top:10px}
    #radioTuner .radio-actions button{min-height:44px}
    #radioTuner button:focus-visible{outline:2px solid #fff1cb;outline-offset:2px}
  `;
  document.head.appendChild(style);

  const mainTrack=albumTrack11;
  albumTrack11=function(){return visible()?null:mainTrack()};
  const mainSoundscape=soundscape;
  soundscape=function(){
    if(!visible())return mainSoundscape();
    if(Music11.gain&&Music11.lastLevel!==0){
      const gain=Music11.gain.gain,now=AC.currentTime;
      gain.cancelScheduledValues(now);gain.setTargetAtTime(0,now,.03);Music11.lastLevel=0;
    }
  };
  window.addEventListener('blur',()=>stopAudio());
  window.addEventListener('focus',()=>{if(visible())startAudio(session)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();else if(visible())startAudio(session)});
  addEventListener('pagehide',()=>stopAudio());

  return Object.freeze({install,tuned,worldLight,step,key,receiver,close:()=>{stopAudio();session=null}});
})();

const radioBuildMaps=buildMaps;
buildMaps=function(...args){const result=radioBuildMaps(...args);Radio9.install(areas.radio9);return result};
const radioUpdate=update;
update=function(dt,...args){const result=radioUpdate(dt,...args);Radio9.step(dt);return result};
const radioDrawProp=drawProp;
drawProp=function(p,cx,cy){
  if(p.type==='radioTuner')return Radio9.worldLight(p,cx,cy);
  const result=radioDrawProp(p,cx,cy);
  if(G?.area==='radio9'&&p.type==='voiceAntenna')Radio9.worldLight(p,cx,cy);
  return result;
};
const radioCloseOverlay=closeOverlay;
closeOverlay=function(...args){Radio9.close();return radioCloseOverlay(...args)};
const radioNormalize=normalizeSave;
normalizeSave=function(raw,...args){
  const g=radioNormalize(raw,...args);
  if(g){g.flags.radioTuned=!!(raw?.progress||raw)?.flags?.radioTuned||Radio9.tuned(g);g.flags.voicesTech=g.flags.radioTuned}
  return g;
};
const radioObjective=objectiveData;
objectiveData=function(){
  const o=radioObjective();
  if(!G?.flags?.voicesCoupler||Radio9.tuned())return o;
  const {x,y}=Radio9.receiver;
  return {text:'Sintonize a Rádio 9.',hint:'Leve o acoplador à rádio, a leste do canal.',area:'radio9',x,y,name:'Mostrador de sintonia'};
};
