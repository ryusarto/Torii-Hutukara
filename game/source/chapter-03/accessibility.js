/* TORII & HUTUKARA — Acessibilidade.
 * "Texto maior": amplia diálogo, objetivo, avisos e o prompt de interação.
 * Fica no menu Sistema, ao lado de "Efeitos suaves" (que já reduz tremor de
 * tela e piscadas). A escolha é lembrada no aparelho, antes mesmo do save.
 */
(function(){
const KEY='torii_hutukara_acessibilidade_v1';
const read=()=>{try{const data=JSON.parse(localStorage.getItem(KEY));if(!data||typeof data!=='object'||Array.isArray(data))return {};const clean=Object.fromEntries(Object.entries(data).filter(([k])=>!['__proto__','constructor','prototype'].includes(k)));if(typeof clean.bigText!=='boolean')delete clean.bigText;return clean}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
const style=document.createElement('style');
style.textContent=`
html.big-text #words{font-size:1.28em!important;line-height:1.45!important}
html.big-text #speaker{font-size:1.15em!important}
html.big-text .questline{font-size:clamp(13px,1.6vw,19px)!important;max-width:46%!important}
html.big-text #toast{font-size:17px!important;max-width:80%!important}
html.big-text .prompt{font-size:15px!important}
html.big-text #mobileObjective{font-size:14px!important}
html.big-text #tapeButton{font-size:14px!important;padding:6px 11px!important}
@media(max-width:790px){html.big-text #toast{font-size:13px!important}html.big-text .questline{font-size:13px!important;max-width:62%!important}html.big-text #words{font-size:1.18em!important}}
`;
document.head.appendChild(style);
function apply(){document.documentElement.classList.toggle('big-text',!!read().bigText)}
apply();
const settingsBefore=openSettings10;
openSettings10=function(...args){
  const r=settingsBefore.apply(this,args);
  try{
    const motion=document.getElementById('motion10');
    if(motion&&!document.getElementById('bigText10')){
      const b=document.createElement('button');b.className='action';b.id='bigText10';
      b.textContent=read().bigText?'TEXTO MAIOR':'TEXTO NORMAL';b.title='Alternar o tamanho do texto';
      b.onclick=()=>{const v=read();v.bigText=!v.bigText;write(v);apply();b.textContent=v.bigText?'TEXTO MAIOR':'TEXTO NORMAL'};
      motion.insertAdjacentElement('afterend',b);
    }
  }catch{}
  return r;
};
window.ToriiAcessibilidade={apply,read};
})();
