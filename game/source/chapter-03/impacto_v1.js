/* TORII & HUTUKARA — Fase 2: sensação de golpe.
 *
 * Nos níveis Normal e Difícil (o História fica como hoje):
 *   - hit-stop: 2 quadros por golpe, 3 no golpe que derruba ou quebra a guarda;
 *   - faísca de acerto desenhada em código (dourada quando acerta a abertura
 *     de um escudo, cinza quando o escudo bloqueia);
 *   - tremor leve no golpe forte; "Efeitos suaves" já zera o tremor em drawEnv;
 *   - o som do impacto sai no mesmo quadro do golpe, com uma batida grave
 *     a mais no golpe que derruba.
 * Em qualquer nível: números de dano opcionais (Menu → Sistema), desligados
 * por padrão. Com "Efeitos suaves" os números não sobem, só somem.
 */
(function(){
'use strict';
const D=window.ToriiDificuldade;
const QUADRO=1/60;
const F={parada:0,faiscas:[],numeros:[],congelados:0};
const ligado=()=>!!(D&&D.ativo()&&D.cfg().impacto);
const numerosLigados=()=>!!G?.options10?.damageNumbers;
const suave=()=>!!G?.options10?.reducedMotion;

function faisca(x,y,tipo){F.faiscas.push({x,y,tipo,t:0,max:tipo==='queda'?.32:.2,seed:Math.random()*6.28});if(F.faiscas.length>30)F.faiscas.shift()}
function numero(x,y,valor,tipo){F.numeros.push({x,y,valor,tipo,t:0,max:.9});if(F.numeros.length>24)F.numeros.shift()}

let abertura=false,bloqueio=false;
addEventListener('torii:abertura',()=>{abertura=true});
addEventListener('torii:bloqueio',()=>{bloqueio=true});
addEventListener('torii:cura-inimigo',ev=>{if(numerosLigados())numero(ev.detail.x,ev.detail.y,'+'+ev.detail.valor,'cura')});

const hitAntes=hitEnemy;
hitEnemy=function(e,damage,...rest){
  abertura=false;bloqueio=false;
  const vivo=e&&e.hp>0,hp=vivo?e.hp:0;
  const r=hitAntes.call(this,e,damage,...rest);
  const tirou=vivo?Math.max(0,hp-Math.max(0,e.hp)):0;
  if(vivo&&tirou>0){
    const caiu=e.hp<=0,forte=caiu||abertura||damage>=15;
    if(ligado()){
      F.parada=Math.max(F.parada,(forte?3:2)*QUADRO);
      faisca(e.x,e.y,bloqueio?'bloqueio':caiu?'queda':abertura?'abertura':'normal');
      if(forte)screenShake=Math.max(screenShake,caiu?.2:.16);
      if(caiu)try{playTone(62,.12,'sine',.08)}catch{}
      else if(abertura)try{playTone(523,.07,'triangle',.05)}catch{}
    }
    if(numerosLigados())numero(e.x,e.y,String(Math.round(tirou)),bloqueio?'bloqueio':abertura||caiu?'forte':'normal');
  }
  return r;
};
const danoAntes=damageHero;
damageHero=function(dmg,from,...rest){
  const id=(()=>{try{return fighterName()}catch{return G?.active}})(),antes=G?.hp?.[id];
  const r=danoAntes.call(this,dmg,from,...rest);
  try{const perdeu=(antes??0)-(G?.hp?.[id]??0);if(perdeu>0&&numerosLigados())numero(G.x,G.y,'-'+perdeu,'sofrido')}catch{}
  return r;
};

// Hit-stop: a simulação para por 2–3 quadros; o desenho continua.
const updateAntes=update;
update=function(dt,...rest){
  const passo=Math.max(0,Math.min(dt||0,.1));
  for(const f of F.faiscas)f.t+=passo;F.faiscas=F.faiscas.filter(f=>f.t<f.max);
  for(const n of F.numeros)n.t+=passo;F.numeros=F.numeros.filter(n=>n.t<n.max);
  if(F.parada>0&&mode==='action'&&ligado()){F.parada-=passo;F.congelados++;return}
  F.parada=0;
  return updateAntes.call(this,dt,...rest);
};

const camadaAntes=drawCombatLayer;
drawCombatLayer=function(...args){
  const r=camadaAntes.apply(this,args);
  try{
    if(!G)return r;
    ctx.save();
    for(const f of F.faiscas){
      const k=f.t/f.max,x=f.x*T-cam.x,y=f.y*T-cam.y-26;
      const cor=f.tipo==='bloqueio'?'#cfd3e6':f.tipo==='abertura'?'#ffd15c':f.tipo==='queda'?'#ffffff':'#ffe9f2';
      const raios=f.tipo==='queda'?10:f.tipo==='bloqueio'?5:7,len=(f.tipo==='queda'?26:16)*(.4+k);
      ctx.globalAlpha=1-k;ctx.strokeStyle=cor;ctx.lineWidth=f.tipo==='queda'?3:2;ctx.beginPath();
      for(let i=0;i<raios;i++){const a=f.seed+i*Math.PI*2/raios;ctx.moveTo(x+Math.cos(a)*len*.35,y+Math.sin(a)*len*.35);ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len)}
      ctx.stroke();
      if(f.tipo==='abertura'||f.tipo==='queda'){ctx.globalAlpha=(1-k)*.7;ctx.beginPath();ctx.ellipse(x,y+24,12+30*k,(12+30*k)*.55,0,0,Math.PI*2);ctx.stroke()}
    }
    ctx.font='bold 13px monospace';ctx.textAlign='center';
    for(const n of F.numeros){
      const k=n.t/n.max,x=n.x*T-cam.x,y=n.y*T-cam.y-52-(suave()?0:k*18);
      ctx.globalAlpha=Math.min(1,(1-k)*1.6);
      const cor=n.tipo==='sofrido'?'#ff6a7a':n.tipo==='cura'?'#7cf0a8':n.tipo==='bloqueio'?'#aab0c8':n.tipo==='forte'?'#ffd15c':'#ffffff';
      ctx.fillStyle='#120a16';ctx.fillText(n.valor,x+1,y+1);ctx.fillStyle=cor;ctx.fillText(n.valor,x,y);
    }
    ctx.restore();
  }catch{}
  return r;
};

// Menu → Sistema: números de dano.
if(typeof openSettings10==='function'){
  const sistemaAntes=openSettings10;
  openSettings10=function(...a){
    const r=sistemaAntes.apply(this,a);
    try{
      const status=$('status10');if(!status||!G)return r;
      const linha=$('difficulty10')?.parentNode||(()=>{const d=document.createElement('div');d.className='row';status.parentNode.insertBefore(d,status);return d})();
      const b=document.createElement('button');b.className='action';b.id='damageNumbers10';
      b.textContent='NÚMEROS DE DANO · '+(numerosLigados()?'SIM':'NÃO');
      b.onclick=()=>{G.options10={...(G.options10||{}),damageNumbers:!numerosLigados()};save(true);openSettings10()};
      linha.appendChild(b);
    }catch(e){console.warn('fase2: menu',e)}
    return r;
  };
}

window.ToriiImpacto={estado:F,ligado};
})();
