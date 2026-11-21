/* Registra a ordem em que cada arquivo de media/ é usado pela primeira vez
 * (desenho no canvas, <img> visível ou fundo CSS), para o carregador por prioridade.
 *   node qa/media_usage.cjs http://127.0.0.1:8771/
 * Uso interno: é chamado com MEDIA_USAGE=1 dentro do campaign_review.cjs.
 */
'use strict';
module.exports.init=()=>{
  const seen=new Map();let phase='inicio';const t0=performance.now();
  const key=u=>{if(!u)return null;const m=String(u).match(/media\/[0-9a-f]{64}\.(png|webp|mp3|avif)/);return m?m[0]:null};
  const mark=u=>{const k=key(u);if(k&&!seen.has(k))seen.set(k,{order:seen.size,phase,area:(typeof G!=='undefined'&&G&&G.area)||null,ms:Math.round(performance.now()-t0)})};
  const wrap=(proto,name)=>{const f=proto[name];proto[name]=function(img,...a){try{if(img&&img.src)mark(img.src)}catch{}return f.call(this,img,...a)}};
  wrap(CanvasRenderingContext2D.prototype,'drawImage');wrap(CanvasRenderingContext2D.prototype,'createPattern');
  const scanDom=()=>{for(const el of document.querySelectorAll('*')){if(el.tagName==='IMG'&&el.offsetParent)mark(el.currentSrc||el.src);const bg=getComputedStyle(el).backgroundImage;if(bg&&bg!=='none'&&el.offsetParent!==null)for(const m of bg.matchAll(/url\("?([^")]+)"?\)/g))mark(m[1])}};
  const ff=window.fetch;window.fetch=function(u,...a){mark(u);return ff.call(this,u,...a)};
  window.__mediaUsage={setPhase:p=>{phase=p},scanDom,dump:()=>[...seen].map(([file,v])=>({file,...v}))};
};
