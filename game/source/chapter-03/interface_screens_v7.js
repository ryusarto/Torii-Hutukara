/* Complete the approved UI inside legacy panels. Keep every original node,
 * callback, disabled state and story transition; presentation never edits G. */
(function(){
'use strict';
const el=id=>document.getElementById(id),ui=()=>window.ToriiUI7;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let queued=false;
const log=[];
function frame(node,type='panel'){
 if(!node||!ui())return;if(!node.classList.contains('ui7-machine'))node.classList.add('ui7-machine');
 if(!node.querySelector(':scope > .ui7-skin'))node.insertAdjacentHTML('afterbegin',ui().skin(type));
}
function iconFor(button){
 const id=button.id,label=button.textContent.toLocaleLowerCase('pt-BR');
 if(/export|import|save|shop|fita/.test(id.toLowerCase())||/salvar|comprar|gravar|fita/.test(label))return 'tape';
 if(/party|member|equipe|companheiro|reservar|escalar/i.test(id+' '+label))return 'bass';
 if(/map|travel|area|chapter/i.test(id)||/capítulo|explorar|caminho|atravessar/.test(label))return 'map';
 if(/journal|histor|memória|diário/i.test(id+' '+label))return 'diary';
 if(/audio|sound|som |ouvir|melodia/i.test(id+' '+label))return 'wave';
 if(/option|setting|controles|efeitos|texto|dificuldade/i.test(id+' '+label))return 'settings';
 return 'play';
}
function buttonSkin(button){
 if(!button||button.closest('#touchLayoutEditorV1')||button.matches('.ui7-note,[data-tl-control],[data-note],[data-vnote],[data-c3note]'))return;
 if(button.classList.contains('ui7-machine')&&!button.classList.contains('ui7-screen-button')){if(!button.querySelector(':scope > .ui7-skin')&&!button.classList.contains('ui7-note'))frame(button,'button');return}
 if(!button.classList.contains('ui7-screen-button'))button.classList.add('ui7-screen-button');frame(button,'button');
 if(!button.querySelector(':scope > .ui7-screen-icon')){
  const art=ui().icon(iconFor(button),'ui7-screen-icon');if(art)button.insertAdjacentHTML('afterbegin',art);
 }
 if(!button.dataset.skinEvents7){button.dataset.skinEvents7='1';const paint=()=>{const skin=button.querySelector(':scope > .ui7-skin');if(skin){skin.dataset.selected=String(document.activeElement===button);ui()?.paint(button)}};button.addEventListener('focus',paint);button.addEventListener('blur',paint)}
}
function screenKind(root){
 if(root.querySelector('#touchLayoutEditorV1'))return 'editor';
 if(root.querySelector('.ui7-pause-sidebar'))return 'pause';
 if(root.querySelector('[data-c3member],[data-member10],[data-member]'))return 'party';
 if(root.querySelector('#c3Continue,#endExplore,#postEnter,#exploreVoices'))return 'chapter';
 if(root.querySelector('#retryCheckpoint'))return 'defeat';
 if(root.querySelector('[data-echo-card],[data-respite]'))return 'dungeon-choice';
 if(root.querySelector('#dif_normal'))return 'difficulty';
 if(root.querySelector('#choiceGrid,#c3FirstPlant,#c3ArchiveTape'))return 'story-choice';
 if(root.querySelector('[data-c3note],[data-vnote]'))return 'instrument';
 if(root.querySelector('#keymapBack6'))return 'bindings';
 if(root.querySelector('#tlPortraitV1'))return 'touch-settings';
 if(root.querySelector('#postResumeRun,#postSuspendConfirm,#postExitConfirm,#postBeginRun,#postRunAgain'))return 'expedition';
 if(root.querySelector('[data-post-area]'))return 'travel';
 if(root.querySelector('#areaMini,#c3MapClose,#vcloseMap'))return 'map';
 if(root.querySelector('#c3JournalClose,#closeJournal,#vcloseJournal'))return 'journal';
 if(root.querySelector('#shopOne,#buyPotion'))return 'shop';
 if(root.querySelector('#save10,#ui7TitleAudio,#ui7A11yBack'))return 'settings';
 if(root.querySelector('#helpBack10,#helpClose'))return 'help';
 return 'panel';
}
function party(root){
 const rows=[...root.querySelectorAll('.formation-row10')];if(!rows.length)return;
 let grid=root.querySelector('.ui7-party-grid');if(!grid){grid=document.createElement('div');grid.className='ui7-party-grid';rows[0].before(grid);for(const row of rows)grid.append(row)}
 const team=partyMembers();
 if(!root.querySelector('.ui7-team-slots')){
  const strip=document.createElement('div');strip.className='ui7-team-slots';strip.setAttribute('aria-label','Formação atual');
  strip.innerHTML=Array.from({length:3},(_,i)=>{const id=team[i];return '<div class="ui7-team-slot ui7-machine">'+ui().skin('small')+'<small>'+(i+1)+'</small>'+(id?'<img alt="" src="'+escape(portraitURI10(id))+'"><span>'+escape(labels10[id]||id)+'</span>':'<span class="ui7-empty-slot">Vaga livre</span>')+'</div>'}).join('');grid.before(strip);
 }
 for(const row of rows){
  const button=row.querySelector('[data-c3member],[data-member10],[data-member]');if(!button)continue;
  const id=button.dataset.c3member||button.dataset.member10||button.dataset.member;row.dataset.hero7=id;row.dataset.selected=String(team.includes(id));
  frame(row,'panel');row.classList.add('ui7-hero-card');const image=row.querySelector('img');if(image)image.classList.add('ui7-party-portrait');
  if(!row.dataset.content7){row.dataset.content7='true';const content=[...row.children].find(n=>n.tagName==='DIV'&&!n.classList.contains('ui7-team-slot'));
   if(content){content.className='ui7-party-copy';const life=Math.max(0,G.hp[id]||0),max=G.maxhp[id]||1,role=typeof C3!=='undefined'?C3.roles?.[id]||'':'';const names=skillNames10[id]||[];const shortcut=act=>{if(Input121.mobile)return '';const label=window.ToriiInterface6?.KeyMap.label(act)||'';return label?'<kbd>'+escape(label)+'</kbd> ':''};
    content.innerHTML='<div class="ui7-party-head"><b>'+escape(labels10[id]||id)+'</b><span class="ui7-party-state">'+(id===G.active?'Líder':team.includes(id)?'Na equipe':'Reserva')+'</span></div><small class="ui7-party-level">Nível '+(G.levels[id]||1)+' · '+(G.xp[id]||0)+' XP</small>'+(role?'<p class="ui7-party-role">'+escape(role)+'</p>':'')+'<div class="ui7-party-life"><span>Vida</span><b>'+life+' / '+max+'</b></div><div class="ui7-party-meter" role="meter" aria-label="Vida de '+escape(labels10[id]||id)+'" aria-valuemin="0" aria-valuenow="'+life+'" aria-valuemax="'+max+'"><i style="width:'+Math.max(0,Math.min(100,life/max*100))+'%"></i></div><div class="ui7-party-skills">'+names.map((name,i)=>'<span>'+shortcut(['attack','skill','skill2'][i])+escape(name)+'</span>').join('')+(typeof SIGNATURE11!=='undefined'&&SIGNATURE11[id]?'<span>'+shortcut('super')+escape(SIGNATURE11[id].name)+' · '+SIGNATURE11[id].cost+' ♫</span>':'')+'</div>';
   }
  }
  button.setAttribute('aria-label',(team.includes(id)?'Reservar ':'Escalar ')+(labels10[id]||id));
 }
 const description=root.querySelector(':scope > p');if(description&&!description.dataset.copy7){description.dataset.copy7='true';description.textContent='Escolha até três integrantes. Reserve alguém para abrir uma vaga e escalar outro companheiro.'}
}
function chapter(root){
 if(root.querySelector('.ui7-chapter-emblem'))return;
 const title=root.querySelector('h2');if(!title)return;
 const badge=document.createElement('div');badge.className='ui7-chapter-emblem';badge.setAttribute('aria-hidden','true');badge.innerHTML=ui().icon('tape')+'<span></span>'+ui().icon('wave')+'<span></span>'+ui().icon('map');title.before(badge);
 for(const image of root.querySelectorAll(':scope > img'))image.classList.add('ui7-chapter-scene');
 for(const button of root.querySelectorAll('button'))if(/continuar.*capítulo|atravessar.*capítulo|entrar no calabouço/i.test(button.textContent))button.classList.add('ui7-primary-destination');
}
function decorate(){
 const root=el('overlayInner');if(!root||!ui())return;
 const kind=screenKind(root);root.dataset.ui7Screen=kind;root.classList.add('ui7-screen');
 if(kind==='editor')return;
 if(kind==='party')party(root);if(kind==='chapter')chapter(root);
 for(const node of root.querySelectorAll('.checkpoint-panel,.stat,.lore')){if(node.closest('.ui7-hero-card,.ui7-card'))continue;node.classList.add('ui7-screen-section');frame(node,'rail')}
 root.querySelectorAll('button').forEach(buttonSkin);
 if(!root.classList.contains('ui7-pause-window'))frame(root,'panel');
 ui().paint(root);
 const title=root.querySelector('h2')?.textContent||'';const signature=kind+'|'+title;
 if(log.at(-1)?.signature!==signature){log.push({signature,kind,title,buttons:root.querySelectorAll('button').length});if(log.length>100)log.shift()}
}
function history(){
 const box=el('leituraHistorico')?.querySelector('.lh-janela');if(!box||!ui())return;frame(box,'panel');if(!box.classList.contains('ui7-history-screen'))box.classList.add('ui7-history-screen');box.querySelectorAll('button').forEach(buttonSkin);ui().paint(box);
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate();history()})}
for(const name of ['openOverlay','enterMenu10','openParty','endingScreen','voiceEnding','openMap','openJournal','openSettings10','showDefeat']){const before=window[name];if(typeof before==='function')window[name]=function(...args){const result=before.apply(this,args);schedule();return result}}
const beforeInit=init;init=function(...args){const result=beforeInit.apply(this,args);const style=document.createElement('style');style.textContent=__UI7_SCREENS_CSS__;document.head.appendChild(style);
 new MutationObserver(schedule).observe(el('overlayInner'),{childList:true,subtree:true});
 new MutationObserver(()=>{if(el('leituraHistorico')){const box=el('leituraHistorico');if(!box.dataset.observed7){box.dataset.observed7='true';new MutationObserver(schedule).observe(box,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}history()}}).observe(document.body,{childList:true});
 document.querySelectorAll('#rhythm button:not([data-note])').forEach(buttonSkin);ui()?.paint(el('rhythm'));new ResizeObserver(()=>{decorate();history()}).observe(el('frame')||document.body);schedule();return result};
window.ToriiScreensV7={decorate,history,log:()=>log.map(row=>({...row})),screenKind};
})();
