/* Approved Ressonâncias interface. Presentation only; preserve original handlers and saves. */
(function(){
'use strict';
const assets=__UI7_ASSETS__;
const style=document.createElement('style');style.textContent=__UI7_CSS__;document.head.appendChild(style);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(kind,cls='')=>assets[kind]?`<img class="ui7-icon ${cls}" alt="" src="${assets[kind]}">`:'';
const skin=(type='panel',selected=false)=>`<canvas class="ui7-skin" data-ui7-skin="${type}" data-selected="${selected}" aria-hidden="true"></canvas>`;
function drawSkin(c){
 const p=c.parentElement,w=p.clientWidth,h=p.clientHeight;if(w<1||h<1)return;c.width=w;c.height=h;
 // Painéis com rolagem: a moldura acompanha a área visível em vez de rolar junto com o conteúdo.
 const follow=()=>{c.style.transform=p.scrollTop?`translateY(${p.scrollTop}px)`:''};if(!c.dataset.ui7Follow){c.dataset.ui7Follow='1';p.addEventListener('scroll',follow,{passive:true})}follow();const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 const type=c.dataset.ui7Skin,selected=c.dataset.selected==='true',r=(a,b,ww,hh,col)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh)};
 const outline=(a,b,ww,hh,col)=>{r(a+3,b,ww-6,hh,col);r(a,b+3,ww,hh-6,col)};
 outline(0,0,w,h,'#12111c');outline(1,1,w-2,h-2,'#5d3d35');outline(2,2,w-4,h-4,selected?'#dfb773':'#b88a58');outline(3,3,w-6,h-6,'#71513e');
 if(type==='deck'){r(4,4,w-8,h-8,'#3e2b2f');for(let y=9;y<h-5;y+=11){r(5,y,w-10,1,'#513733');r(5,y+1,w-10,1,'#31252c');for(let n=0;n<5;n++)r(10+(n*83+y*7)%(w-24),y+3,10,1,'#493132')}return}
 const pad=['small','button','rail','inner'].includes(type)?4:7;
 r(pad,pad,w-pad*2,h-pad*2,'#201d2a');r(pad+1,pad+1,w-pad*2-2,1,'#49404b');
 if(['panel','instrument','desk','dialogue','module','banner'].includes(type)){
  for(let y=9;y<h-7;y+=8){r(4,y,2,3,'#9b6845');r(w-6,y+2,2,3,'#53363a')}
  for(let n=12;n<w-10;n+=23){r(n,4,8,1,'#d1a16a');r(n+3,h-5,6,1,'#4a3035')}
 }
 if(type==='banner'){r(9,9,w-18,h-18,'#452732');r(10,10,w-20,1,'#765044')}
 if(type==='instrument'){
  r(8,81,w-16,h-89,'#493135');for(let y=87;y<h-12;y+=9)r(9,y,w-18,1,'#563b37');
  // The cables connect physical pads to the note sequencer; only the outer rails carry texture.
  const count=c.parentElement.querySelectorAll('[data-note]').length||3;
  const points=count===4?[78,182,286,390]:[100,234,368];
  for(const [i,xx]of points.entries()){
   const end=161+i*37,yy=78+(i%2)*3,left=Math.min(xx,end),length=Math.abs(xx-end)+1;
   r(xx-1,yy,3,13,'#17131e');r(left,yy-1,length,3,'#17131e');r(end-1,69,3,yy-68,'#17131e');
   r(xx,yy,1,12,'#b7814f');r(left,yy,length,1,'#b7814f');r(end,69,1,yy-68,'#b7814f');
   r(xx-3,86,7,3,'#2b2029');r(xx-2,86,5,1,'#c99c62');
  }
  for(let i=0;i<23;i++){const gx=15+(i*47)%(w-35),gy=91+(i*17)%(h-114);r(gx,gy,4+(i%5),1,'#604039')}
  r(14,165,w-28,2,'#261d29');r(15,165,w-30,1,'#a4764d');
 }
 if(type==='module'&&!(p.classList.contains('ui7-difficulty-card')&&matchMedia('(max-width:550px)').matches)){r(10,29,w-20,104,'#272331');r(11,30,w-22,1,'#5b4644');r(10,132,w-20,1,'#6f4d3d');if(selected){r(w-9,14,3,3,'#91c7c8');r(6,14,3,3,'#91c7c8');r(8,h-12,w-16,1,'#d3b17a')}}
 if(type==='button'&&selected){r(5,5,w-10,h-10,'#514044');r(5,5,2,h-10,'#d7b270')}
 const rivet=(a,b)=>{r(a,b,3,3,'#2b1e26');r(a,b,2,2,'#d0a36a');r(a+1,b+1,1,1,'#6d4e3c')};
 const inset=type==='small'||type==='button'||type==='rail'?4:5;
 rivet(inset,inset);rivet(w-inset-3,inset);if(h>30){rivet(inset,h-inset-3);rivet(w-inset-3,h-inset-3)}
}
function drawPad(c,kind,symbol,transparent=false){
 if(kind)c.dataset.ui7Pad=kind;if(symbol)c.dataset.symbol=symbol;
 if(transparent)return transparentPad(c);
 c.width=64;c.height=56;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const base={circle:'#346873',triangle:'#a2763b',square:'#693549',diamond:'#664c73'}[kind]||'#346873';
 const r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
 function shape(inset,col){for(let y=5+inset;y<51-inset;y++){let left=7+inset,right=57-inset;if(kind==='circle'){let rr=23-inset,dy=y-28;if(Math.abs(dy)>rr)continue;let span=Math.floor(Math.sqrt(rr*rr-dy*dy));left=32-span;right=32+span}else if(kind==='triangle'){left=32-Math.floor((y-5-inset)*.57);right=64-left}else if(kind==='diamond'){let span=24-inset-Math.abs(y-28);if(span<0)continue;left=32-span;right=32+span}r(left,y,right-left+1,1,col)}}
 shape(0,'#191421');shape(1,'#c0955c');shape(3,'#5b3e39');shape(4,base);
 const ink='#f1d6a2';
 if(!c.dataset.symbol&&kind==='circle'){
  r(25,19,10,3,ink);r(23,22,5,5,ink);r(32,22,5,6,ink);r(29,28,6,4,ink);r(25,32,7,3,ink);r(22,35,6,3,ink);r(39,22,3,3,ink);r(39,29,3,3,ink);
 }else if(!c.dataset.symbol&&kind==='square'){
  r(30,14,3,29,ink);r(28,17,3,3,ink);r(33,15,4,4,ink);r(26,23,11,3,ink);r(23,26,4,6,ink);r(27,32,12,3,ink);r(36,27,3,5,ink);r(28,39,5,3,ink);
 }else{
  r(29,18,3,20,ink);r(32,18,9,3,ink);r(39,20,3,5,ink);r(22,35,9,5,ink);r(24,33,7,2,ink);
 }
 if(!c.dataset.symbol&&kind==='diamond'){r(21,15,23,27,base);for(let yy=19;yy<39;yy++){const span=Math.max(1,Math.round(9-Math.abs(yy-29)*.8));r(32-span,yy,span*2,1,ink)}}
 const sym=c.dataset.symbol;if(sym==='attack'){r(25,16,13,24,base);for(let i=0;i<15;i++){r(24+i,36-i,3,2,'#f1d6a2')}r(22,34,3,3,'#f1d6a2')}
 if(sym==='switch'){r(21,16,23,25,base);r(23,24,18,2,'#f1d6a2');r(21,32,18,2,'#f1d6a2');r(38,21,3,3,'#f1d6a2');r(38,26,3,3,'#f1d6a2');r(21,29,3,3,'#f1d6a2');r(21,34,3,3,'#f1d6a2')}
 if(sym==='dodge'){r(21,16,23,25,base);for(let i=0;i<17;i++)r(23+i,27+Math.round(Math.sin(i*.3)*4),2,2,'#f1d6a2')}
}
function transparentPad(canvas){
 canvas.width=64;canvas.height=56;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const kind=canvas.dataset.ui7Pad,r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)},inside=(x,y,inset=0)=>{
  if(kind==='circle')return (x-32)**2+(y-28)**2<=(23-inset)**2;
  if(kind==='triangle')return y>=6+inset&&y<=50-inset&&Math.abs(x-32)<=Math.floor((y-6-inset)*.57);
  if(kind==='diamond')return Math.abs(x-32)+Math.abs(y-28)<=24-inset;
  return x>=7+inset&&x<=57-inset&&y>=6+inset&&y<=50-inset;
 };
 for(let y=3;y<53;y++)for(let x=4;x<60;x++)if(inside(x,y)){r(x,y,1,1,inside(x,y,2)?'#17172622':'#f0e2c5d0')}
 const ink='#f1e6cedd',id=canvas.dataset.symbol;
 if(id==='attack'){for(let i=0;i<17;i++)r(23+i,36-i,2,2,ink);r(21,35,5,2,ink);r(24,38,2,3,ink)}
 else if(id==='switch'){r(23,23,18,2,ink);r(21,32,18,2,ink);r(38,21,3,3,ink);r(38,25,3,3,ink);r(21,30,3,3,ink);r(21,34,3,3,ink)}
 else if(id==='dodge'){for(let i=0;i<18;i++)r(23+i,27+Math.round(Math.sin(i*.3)*4),1,2,ink)}
 else{r(29,18,2,20,ink);r(31,18,10,2,ink);r(40,20,2,4,ink);r(23,35,7,4,ink)}
}

function drawMeter(c){const x=c.getContext('2d'),w=c.width,h=c.height;const r=(a,b,ww,hh,col)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh)};r(0,0,w,h,'#14131f');r(1,1,w-2,h-2,'#b38956');r(3,3,w-6,h-6,c.dataset.ui7Meter==='wave'?'#1e343d':'#c5ab74');if(c.dataset.ui7Meter==='wave'){for(let i=6;i<w-6;i++){const a=Math.sin(i*.4)*Math.sin(i*.08)*7;r(i,Math.round(h/2+a),1,2,'#8cbdbe')}}else{for(let i=8;i<w-8;i+=5)r(i,8,1,3,'#6d4b3d');for(let i=0;i<15;i++)r(28-Math.round(i*.6),24-i,1,1,'#703e37');r(26,23,5,2,'#5b3a36')}}

function paint(root=document){root.querySelectorAll("canvas[data-ui7-meter]").forEach(drawMeter);root.querySelectorAll('canvas[data-ui7-skin]').forEach(drawSkin);root.querySelectorAll('canvas[data-ui7-pad]').forEach(c=>drawPad(c,c.dataset.ui7Pad,c.dataset.symbol,c.dataset.transparent==='true'))}
function framed(el,type='panel'){if(!el||el.querySelector(':scope > .ui7-skin'))return;el.classList.add('ui7-machine');el.insertAdjacentHTML('afterbegin',skin(type))}
function control(el,label,kind){if(!el)return;el.classList.add('ui7-control','ui7-machine');el.innerHTML=skin('button')+icon(kind)+`<span>${esc(label)}</span>`}
function titleRefresh(){const b=$('ui7Dungeon');if(b){const saved=safeLoad();b.disabled=!saved?.c3?.complete;b.title=b.disabled?'Conclua a história para abrir a Fenda das Ressonâncias.':'Entrar na Fenda das Ressonâncias'}paint($('start'))}
function installTitle(){
 const start=$('start');if(start.dataset.ui7)return;start.dataset.ui7='true';start.classList.add('ui7-title');start.style.setProperty('--ui7-studio',`url("${assets.titleStudio}")`);
 const nodes=['startContinue','startNew','startOptions10'].map(id=>$(id)).filter(Boolean);
 const hidden=document.createElement('div');hidden.hidden=true;while(start.firstChild)hidden.append(start.firstChild);start.append(hidden);
 const panel=document.createElement('div');panel.className='ui7-title-menu';panel.innerHTML='<small>RPG MUSICAL</small><h1>TORII &amp;<br>HUTUKARA</h1><p class="ui7-subtitle">A ÚLTIMA FREQUÊNCIA</p><nav aria-label="Menu principal"></nav><small class="ui7-build">'+esc('__BUILD_LABEL__')+'</small>';start.append(panel);
 const nav=panel.querySelector('nav');for(const id of ['startContinue','startNew']){const b=nodes.find(n=>n.id===id);if(b){b.textContent=id==='startContinue'?'Continuar':'Novo jogo';nav.append(b)}}
 const dungeon=document.createElement('button');dungeon.id='ui7Dungeon';dungeon.className='menuButton';dungeon.textContent='Calabouço';dungeon.onclick=()=>{const saved=safeLoad();if(!saved?.c3?.complete)return;continueGame();if(!PostGame.active())PostGame.openBriefing()};nav.append(dungeon);
 const credits=document.createElement('button');credits.id='ui7Credits';credits.className='menuButton';credits.textContent='Créditos';credits.onclick=openCredits;
 let options=nodes.find(n=>n.id==='startOptions10')||document.createElement('button');options.id='startOptions10';options.className='menuButton';options.textContent='Opções';options.onclick=openTitleSettings;nav.append(options);nav.append(credits);
 titleRefresh();
}
// Créditos: edite somente esta lista. Cada bloco é [título, linhas].
const CREDITS=[
 ['Uma obra de',['Ryuchi','Franco, The Sir']],
 ['Colaboradores do álbum',['Belga','Colli','Mazza','Dney']],
 ['Músicas',['Ryuchi e Franco, The Sir','Versões 16-bit das faixas do álbum']],
 ['Licenças',['Código: MIT','Arte, roteiro e cenários: CC BY 4.0','Músicas, máscaras e identidades: CC BY-NC-ND 4.0']],
 ['',['Obrigado por jogar.']]
];
function openCredits(){
 enterMenu10('<h2>Créditos</h2><p class="ui7-credits-title">TORII &amp; HUTUKARA · A ÚLTIMA FREQUÊNCIA</p><div class="ui7-credits">'+CREDITS.map(([title,lines])=>'<section>'+(title?'<h3>'+esc(title)+'</h3>':'')+lines.map(line=>'<p>'+esc(line)+'</p>').join('')+'</section>').join('')+'</div><button class="action" id="ui7CreditsBack">Voltar</button>','ui7-credits');
 $('ui7CreditsBack').onclick=()=>{closeOverlay();titleRefresh()};
}
function openTitleSettings(){
 enterMenu10('<h2>Opções</h2><div class="menu-grid10"><button class="action" id="ui7TitleAudio">'+(audioEnabled?'Som ligado':'Som desligado')+'</button><button class="action" id="ui7TitleControls">Controles</button><button class="action" id="ui7TitleA11y">Acessibilidade</button><button class="action" id="preview10">Jogar capítulo 2</button><button class="action" id="previewC3">Jogar capítulo 3</button><button class="action" id="ui7TitleImport">Importar salvamento</button><button class="action" id="ui7TitleHelp">Como jogar</button><button class="action" id="ui7TitleTouch">Posição dos botões</button></div><button class="action" id="ui7TitleBack">Voltar</button>','ui7-title-settings');
 $('ui7TitleAudio').onclick=()=>{if(audioEnabled)audioEnabled=false;else enableAudio();openTitleSettings()};$('ui7TitleControls').onclick=()=>ToriiInterface6.openControls();$('ui7TitleA11y').onclick=openTitleA11y;$('preview10').onclick=()=>ToriiDificuldade.escolher(n=>{startChapterTwoPreview();ToriiDificuldade.definir(n)},'CAPÍTULO 02');$('previewC3').onclick=()=>ToriiDificuldade.escolher(n=>{C3.start(true);ToriiDificuldade.definir(n)},'CAPÍTULO 03');$('ui7TitleImport').onclick=()=>$('importFile').click();$('ui7TitleHelp').onclick=openHelp;$('ui7TitleTouch').onclick=()=>window.TouchLayoutV1?.openSettings(openTitleSettings);$('ui7TitleBack').onclick=()=>{closeOverlay();titleRefresh()};
}
function openTitleA11y(){
 const a=ToriiInterface6.A11y;enterMenu10('<h2>Acessibilidade</h2>'+[['colorblind','Avisos em âmbar'],['beatCue','Pista da batida'],['tolerant','Batida tolerante']].map(([key,label])=>'<button class="action" data-a11y7="'+key+'" aria-pressed="'+a[key]+'">'+label+' · '+(a[key]?'Ligado':'Desligado')+'</button>').join('')+'<button class="action" id="ui7A11yBack">Voltar</button>','ui7-title-a11y');
 document.querySelectorAll('[data-a11y7]').forEach(b=>b.onclick=()=>{a.toggle(b.dataset.a11y7);openTitleA11y()});$('ui7A11yBack').onclick=openTitleSettings;
}
const oldSettings=openSettings10;openSettings10=function(...args){if(!G||menuOrigin10==='title')return openTitleSettings();return oldSettings.apply(this,args)};
function returnTitle(){if(PostGame.active())return PostGame.confirmSuspend(openSystem);save(true);closeOverlay();mode='title';menuPage10=null;menuOrigin10=null;$('hud').style.display='none';$('actionHUD').classList.add('hidden');$('start').style.display='';$('start').classList.remove('hidden');$('startContinue').disabled=!safeLoad();titleRefresh()}
function pauseB(){
 const root=$('overlayInner');if(menuPage10!=='main'||$('retryCheckpoint')||!root)return;
 const resume=$('resume10');if(!resume)return;
 const party=$('party10'),settings=$('system10'),extra=[...root.querySelectorAll('[id^="postSystem"]')];
 const sidebar=document.createElement('section');sidebar.className='ui7-pause-sidebar ui7-machine';sidebar.innerHTML=skin('desk')+'<h2>Pausa</h2><p class="ui7-pause-note">Entre duas canções</p><nav aria-label="Pausa"></nav><div class="ui7-pause-bottom"></div>';
 const nav=sidebar.querySelector('nav');control(resume,'Continuar','play');nav.append(resume);control(party,'Equipe','bass');if(party)nav.append(party);
 for(const [label,kind,fn,page] of [['Mapa','map',openMap,'map'],['Diário','diary',openJournal,'journal']]){const b=document.createElement('button');b.className='action';b.id='ui7Pause'+page;control(b,label,kind);b.onclick=()=>{fn();menuPage10=page;schedule()};nav.append(b)}
 control(settings,'Opções','settings');if(settings)nav.append(settings);
 const bottom=sidebar.querySelector('.ui7-pause-bottom');const goal=document.createElement('p');goal.textContent=$('quest')?.textContent||'';bottom.append(goal);
 for(const b of extra){b.classList.add('ui7-pause-extra');bottom.append(b)}
 const title=document.createElement('button');title.className='action';title.id='ui7PauseTitle';title.textContent='Voltar ao título';title.onclick=returnTitle;bottom.append(title);
 const hint=document.createElement('small');hint.textContent=controlHint121('Esc · Continuar','Toque em Continuar','Options · Continuar');bottom.append(hint);
 root.replaceChildren(sidebar);$('overlay').classList.add('ui7-pause');root.classList.add('ui7-pause-window');paint(root);resume.focus();
}
function draft(){
 const root=$('overlayInner'),cards=[...root.querySelectorAll('[data-echo-card], [data-respite]')];if(!cards.length)return;
 root.classList.add('ui7-draft');root.querySelector('h2').textContent=cards[0].dataset.echoCard?'Escolha sua ressonância':'Um momento para respirar';
 for(const b of cards){if(b.dataset.ui7)continue;b.dataset.ui7='true';const id=b.dataset.echoCard||b.dataset.respite;
 if(b.dataset.echoCard){const r=PostGame.run(),card=PostGame.cards[id],now=r.upgrades[id]||0,next=Math.min(card.maxLevel||Infinity,now+(r.rare?PostGame.RARE_LEVELS:1)),rarity=PostGame.RARITY[card.rarity||'comum'];
 b.innerHTML=skin('module')+`<span class="ui7-rarity" style="color:${rarity.color}">${esc(rarity.label)}${card.hero?' · '+esc(PostGame.names[card.hero]):''}</span>`+icon(id,'ui7-card-icon')+`<h3>${esc(card.name)}</h3><p>${esc(card.text)}</p><div class="ui7-card-stat">Nv. ${next} · ${esc(PostGame.cardValue(id,now))} → ${esc(PostGame.cardValue(id,next))}</div>`;
 }else{const title=b.querySelector('b')?.textContent||'',text=b.querySelector('small')?.textContent||'';b.innerHTML=skin('module')+icon(id,'ui7-card-icon')+`<h3>${esc(title)}</h3><p>${esc(text)}</p>`}
 b.classList.add('ui7-machine','ui7-card');b.parentElement.classList.add('ui7-draft-grid');b.addEventListener('focus',()=>{b.querySelector('.ui7-skin').dataset.selected='true';paint(b)});b.addEventListener('blur',()=>{b.querySelector('.ui7-skin').dataset.selected='false';paint(b)});
 }
 if(!root.querySelector('.ui7-active')){const r=PostGame.run(),active=Object.entries(r.upgrades||{}).filter(([,n])=>n>0);if(active.length){const rail=document.createElement('div');rail.className='ui7-active ui7-machine';rail.innerHTML=skin('rail')+'<small>RESSONÂNCIAS ATIVAS</small>'+active.map(([id,n])=>`<span title="${esc(PostGame.cards[id]?.name)} · Nv. ${n}">${icon(id)}<b>${n}</b></span>`).join('');root.querySelector('.ui7-draft-grid').after(rail)}}
}
function music(root=document){
 for(const group of root.querySelectorAll('#noteButtons, .voice-note-grid, .notes:has([data-c3note])')){
  group.classList.add('ui7-pads');const four=!!group.querySelector('[data-c3note="3"]');group.classList.toggle('ui7-four',four);
  for(const [i,b] of [...group.querySelectorAll('[data-note],[data-vnote],[data-c3note]')].entries()){
   if(b.dataset.ui7)continue;b.dataset.ui7='true';const name=b.hasAttribute('data-vnote')&&$('lumiMelody')?['Si♭','Dó♯','Ré♯'][i]:['Grave','Média','Aguda','Aberta'][i];
   b.classList.add('ui7-note');b.innerHTML=`<canvas width="64" height="56" data-ui7-pad="${['circle','triangle','square','diamond'][i]}" aria-hidden="true"></canvas><span>${name}</span>${Input121.mobile?'':'<small>'+(i+1)+'</small>'}`;
  }
  const machine=group.closest('.rhythmBox')||$('lumiMelody')||group.parentElement;machine.classList.add('ui7-instrument');framed(machine,'instrument');const frameSkin=machine.querySelector(':scope > .ui7-skin');if(frameSkin)frameSkin.dataset.ui7Skin='instrument';
  if(!machine.querySelector('.ui7-sequence')&&!$('lumiMelody')){const seq=document.createElement('div');seq.className='ui7-sequence';seq.setAttribute('aria-hidden','true');seq.innerHTML=Array.from({length:four?4:group.id==='noteButtons'?4:3},()=>'<span>·</span>').join('');group.before(seq);seq.insertAdjacentHTML('beforebegin','<div class="ui7-mini-meters" aria-hidden="true"><canvas data-ui7-meter="vu" width="57" height="30"></canvas><canvas data-ui7-meter="wave" width="57" height="30"></canvas></div>')}
 }
 for(const id of ['rhythmFeedback','c3PhraseProgress','lumiProgress']){const el=$(id);if(el){el.setAttribute('role','status');el.setAttribute('aria-live','polite')}}
}
/* Skin-only decoration keeps the original difficulty and dialogue-choice callbacks. */
function decorateChoiceMenus(root){
 const difficulty=!!root.querySelector('#dif_normal'),choices=!!root.querySelector('#choiceGrid');
 root.classList.toggle('ui7-difficulty',difficulty);root.classList.toggle('ui7-dialogue-choice',choices);
 if(difficulty){
  const data={historia:['breath','No seu ritmo'],normal:['tempo','Uma jornada em equilíbrio'],dificil:['overdrive','Encare a dissonância']};
  for(const [id,[art,caption]]of Object.entries(data)){const b=$('dif_'+id);if(!b||b.dataset.ui7Choice)continue;
   const title=b.querySelector('b')?.textContent||b.textContent,detail=b.querySelector('small')?.textContent||caption;
   b.dataset.ui7Choice='true';b.classList.add('ui7-machine','ui7-difficulty-card');
   b.innerHTML=skin('module')+'<span class="ui7-difficulty-tag"'+(id==='normal'?'':' aria-hidden="true"')+'>'+(id==='normal'?'Recomendado':'')+'</span>'+icon(art,'ui7-difficulty-icon')+'<b>'+esc(title.replace(/\s*·\s*recomendado$/i,''))+'</b><small>'+esc(detail)+'</small>';
  }
  const back=$('dif_voltar');if(back&&!back.dataset.ui7Choice){back.dataset.ui7Choice='true';control(back,'Voltar','play')}
 }
 if(choices){
  const grid=$('choiceGrid');for(const b of grid.querySelectorAll('button')){if(b.dataset.ui7Choice)continue;b.dataset.ui7Choice='true';const label=b.textContent;control(b,label,'note');}
  if(!root.querySelector('.ui7-choice-speaker')){
   const head=document.createElement('div');head.className='ui7-choice-speaker';
   const image=$('portrait'),speaker=$('speaker');head.innerHTML=(image?.src?'<img alt="" src="'+esc(image.src)+'">':'')+'<span>'+esc(speaker?.textContent||'Diálogo')+'</span>';
   root.querySelector('h2')?.before(head);
  }
 }
}
function dialogueLayout(){const el=$('dialogue');if(!el)return;framed(el,'dialogue');if(!el.classList.contains('hidden'))paint(el)}
function syncSequence(){for(const group of document.querySelectorAll('.ui7-instrument')){const slots=group.querySelectorAll('.ui7-sequence span');if(!slots.length)continue;const input=group.querySelector('[data-c3note]')?C3.phraseInput:group.querySelector('[data-note]')?rhythmInput:[];slots.forEach((s,i)=>{const text=i<(input?.length||0)?['♪','♫','♬','✦'][input[i]]:'·';if(s.textContent!==text)s.textContent=text;s.classList.toggle('empty',i>=(input?.length||0))})}}
let pending=false;
function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;decorate()})}
function decorate(){
 const root=$('overlayInner');if(!root)return;if($('title10'))$('title10').onclick=returnTitle;if(mode==='title')titleRefresh();
 const pause=!!root.querySelector('.ui7-pause-sidebar');$('overlay').classList.toggle('ui7-pause',pause);root.classList.toggle('ui7-pause-window',pause);
 if(!root.querySelector('[data-echo-card],[data-respite]'))root.classList.remove('ui7-draft');
 if(!pause)framed(root,'panel');decorateChoiceMenus(root);draft();music();paint(root);
}
const portraitCache=new Map();
function portrait(id){const key=id+':'+G?.ryuchiStyle+':'+G?.flags?.reveal+':'+G?.flags?.masks;if(!portraitCache.has(key))portraitCache.set(key,portraitURI10(id));return portraitCache.get(key)}
function hudInstall(){
 const hud=$('hud');if(!hud||$('ui7Party'))return;hud.insertAdjacentHTML('beforeend','<div id="ui7Party" class="ui7-machine">'+skin('small')+'</div><div id="ui7Objective" class="ui7-machine">'+skin('small')+'<small></small><p></p></div><button id="ui7PausePC" class="ui7-machine">'+skin('button')+'Esc · Pausa</button><div id="ui7Actions"></div>');$('ui7PausePC').onclick=()=>openSystem();
 const defs=[['attack','Ataque','bass',attackAction],['dodge','Esquiva','play',dodgeAction],['skill','Técnica','note',skillAction],['skill2','Téc. II','wave',advancedSkill],['super','Especial','speaker',duoAction]];
 for(const [key,label,img,fn]of defs){const b=document.createElement('button');b.className='ui7-ability ui7-machine';b.dataset.action7=key;b.innerHTML=skin('button')+icon(img)+'<kbd></kbd><span>'+label+'</span>';b.onclick=()=>{if(['walk','action'].includes(mode))fn()};$('ui7Actions').append(b)}
}
let hudKey='',hudVisible=false;
function hudPaint(){const hud=$('hud');if(!hud||!hud.getBoundingClientRect().width)return;const width=($('frame')||hud).getBoundingClientRect().width;document.documentElement.style.setProperty('--ui7-scale',String(Math.max(.8,Math.min(1.6,width/768))));paint(hud)}
function hudRefresh(){if(!G)return;const mobile=!!document.documentElement.classList.contains('mobile121')||!!document.body.classList.contains('mobile121');document.documentElement.classList.toggle('ui7-desktop',!mobile);hudInstall();
 const team=partyMembers(),key=JSON.stringify([G.active,team.map(id=>[id,G.hp[id],G.maxhp[id]]),G.resonance,G.ryuchiStyle,G.flags.masks]);
 if(key!==hudKey){hudKey=key;$('ui7Party').innerHTML=skin('small')+team.map((id,i)=>`<div class="ui7-hero ${id===G.active?'leader':'ally'}"><img alt="" src="${portrait(id)}"><div><div class="ui7-hero-name"><span>${esc(typeof labels10!=='undefined'?labels10[id]||id:id)}</span><span>${Math.max(0,G.hp[id]|0)}/${G.maxhp[id]}</span></div><div class="ui7-meter"><i style="width:${Math.max(0,Math.min(100,G.hp[id]/G.maxhp[id]*100))}%"></i></div>${id===G.active?`<div class="ui7-res-label">RESSONÂNCIA <span>${Math.round(G.resonance||0)}/100</span></div><div class="ui7-meter res"><i style="width:${Math.max(0,Math.min(100,G.resonance||0))}%"></i></div>`:''}</div></div>`).join('');paint($('ui7Party'))}
 const visible=$('hud').getBoundingClientRect().width>0;if(visible&&!hudVisible)hudPaint();hudVisible=visible;
 const objective=$('ui7Objective');for(const [sel,text] of [['small',$('areaName')?.textContent],['p',$('quest')?.textContent]])if(objective.querySelector(sel).textContent!==text)objective.querySelector(sel).textContent=text||'';
 for(const b of document.querySelectorAll('[data-action7]')){
 const id=b.dataset.action7,label=ToriiInterface6.KeyMap.label(id);if(b.querySelector('kbd').textContent!==label)b.querySelector('kbd').textContent=label;
 const field={attack:'cool',dodge:'dashCD',skill:'skill',skill2:'skillX',super:'duo'}[id],time=act[field]||0,cost=SIGNATURE11[G.active]?.cost||40,unlocked=C3.combatUnlocked()&&combatAreas10.has(G.area);
 let state='',kind='ready';if(id!=='dodge'&&!unlocked){state='Bloqueado';kind='locked'}else if(id==='skill2'&&['franco','ryuchi'].includes(G.active)&&(G.levels[G.active]||1)<3){state='Nível 3';kind='locked'}else if(time>0){state=time.toFixed(1)+' s';kind='cooldown'}else if(id==='super'){state=cost+' ♫';if(G.resonance<cost)kind='locked'}
 b.dataset.ready=kind;let hint=b.querySelector('.ui7-ready');if(!hint){hint=document.createElement('small');hint.className='ui7-ready';b.append(hint)}if(hint.textContent!==state)hint.textContent=state;
 b.disabled=kind!=='ready'||!['walk','action'].includes(mode);b.setAttribute('aria-label',b.querySelector('span').textContent+(state?' · '+state:''));
 }
 const pause=$('ui7PausePC'),pauseKey=ToriiInterface6.KeyMap.label('menu');pause.lastChild.textContent=pauseKey+' · Pausa';
}
// An explicit question must keep its answer. Historical editorial cuts removed
// both traveler replies, making a real Ema choice silently close the conversation.
const beforeChoice=chooseDialogue;
chooseDialogue=function(question,options){return beforeChoice(question,options.map(option=>({...option,lines:(option.lines||[]).map(line=>typeof line==='string'?{who:'narrator',t:line,__edited:true}:{...line,__edited:true})})))};
const beforeSystem=openSystem;openSystem=function(...args){const r=beforeSystem.apply(this,args);pauseB();return r};
for(const name of ['openOverlay','closeOverlay','enterMenu10']){const before=window[name];if(typeof before==='function')window[name]=function(...args){const r=before.apply(this,args);schedule();return r}}
const beforeInit=init;init=function(...args){const r=beforeInit.apply(this,args);document.documentElement.classList.add('ui7');installTitle();hudInstall();document.head.append(style);framed($('dialogue'),'dialogue');const dialogueObserver=new ResizeObserver(dialogueLayout);dialogueObserver.observe($('dialogue'));new MutationObserver(dialogueLayout).observe($('dialogue'),{attributes:true,attributeFilter:['class','style']});music();paint();new MutationObserver(schedule).observe($('overlayInner'),{childList:true});new ResizeObserver(()=>{paint();hudPaint()}).observe($('frame')||$('app')||document.body);return r};
setInterval(()=>{hudRefresh();syncSequence()},160);
window.ToriiUI7={assets,icon,skin,paint,drawPad,drawSkin,openTitleSettings,decorate,refresh:hudRefresh,dialogueLayout};
})();
