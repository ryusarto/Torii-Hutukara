/* Sorte com semente (Fase 0). Entra antes de todo o código do jogo e troca
 * Math.random por um gerador sfc32 com semente. Jogando normalmente, a semente
 * é sorteada a cada abertura, então nada muda para o jogador. Para reproduzir
 * uma luta num teste: abra com ?semente=123 ou chame ToriiSorte.semear(123)
 * antes de começar; as mesmas entradas dão os mesmos sorteios.
 */
const ToriiSorte=(()=>{
  'use strict';
  const nativo=Math.random;
  let a=0,b=0,c=0,d=0,semente=0,fixa=false,usos=0;
  const sfc32=()=>{a>>>=0;b>>>=0;c>>>=0;d>>>=0;let t=(a+b)|0;a=b^(b>>>9);b=(c+(c<<3))|0;c=(c<<21)|(c>>>11);d=(d+1)|0;t=(t+d)|0;c=(c+t)|0;return(t>>>0)/4294967296};
  const semear=(valor,explicita=true)=>{
    semente=Number(valor)>>>0;fixa=!!explicita;usos=0;
    a=0x9e3779b9;b=0x243f6a88;c=0xb7e15162;d=semente;
    for(let i=0;i<15;i++)sfc32();
    return semente;
  };
  const aleatoria=()=>{try{const v=new Uint32Array(1);crypto.getRandomValues(v);return v[0]}catch{return(Date.now()^Math.floor(nativo()*4294967296))>>>0}};
  const daUrl=()=>{try{const v=new URLSearchParams(location.search).get('semente');return v!==null&&/^\d+$/.test(v)?Number(v):null}catch{return null}};
  const daUrlValor=daUrl();
  semear(daUrlValor===null?aleatoria():daUrlValor,daUrlValor!==null);
  const proximo=function random(){usos++;return sfc32()};
  Math.random=proximo;
  return Object.freeze({
    semear,
    semente:()=>semente,
    fixa:()=>fixa,
    usos:()=>usos,
    estado:()=>({a,b,c,d,semente,fixa,usos}),
    restaurar(s){({a,b,c,d,semente,fixa,usos}=s)},
    gerador:proximo,
    nativo
  });
})();
