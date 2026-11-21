/* Carregador de imagens por prioridade do site (só navegador, sem service worker).
 * O jogo cria todas as imagens logo ao abrir. Aqui, quem recebe um endereço de
 * media/ entra numa fila: baixa primeiro o que a campanha usa antes (ordem medida
 * por qa/media_usage.cjs) e passa à frente qualquer imagem que o jogo tente
 * desenhar ou consultar. Tudo acaba carregado; só muda a ordem.
 * A lista de prioridade é inserida pelo build_playtest.rb.
 */
(() => {
  'use strict';
  const proto = HTMLImageElement.prototype;
  const srcDesc = Object.getOwnPropertyDescriptor(proto, 'src');
  if (!srcDesc || !srcDesc.set) return;
  const PRIORITY = __MEDIA_PRIORITY__;
  const rank = new Map(PRIORITY.map((file, i) => [file, i]));
  const MAX_ACTIVE = 6;
  const pending = new Map(); // imagem → { url, prio }
  let active = 0, seq = 0, scheduled = false;
  const stats = { queued: 0, promoted: 0, loaded: 0, failed: 0, firstPromotion: null };

  const begin = (img) => {
    const entry = pending.get(img);
    if (!entry) return;
    pending.delete(img);
    active++;
    const done = (ok) => () => {
      active--;
      ok ? stats.loaded++ : stats.failed++;
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      pump();
    };
    // Decodifica fora da thread principal assim que chega, para o primeiro
    // drawImage não travar o quadro (atlas grandes levam 80–140 ms).
    const onLoad = () => { if (decode) decode.call(img).catch(() => {}).finally(finish); else finish(); };
    const finish = done(true), onError = done(false);
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    srcDesc.set.call(img, entry.url);
  };
  const pump = () => {
    scheduled = false;
    while (active < MAX_ACTIVE && pending.size) {
      let best = null, bestPrio = Infinity;
      for (const [img, entry] of pending) if (entry.prio < bestPrio) { best = img; bestPrio = entry.prio; }
      begin(best);
    }
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; queueMicrotask(pump); }
  };
  // O jogo pediu esta imagem agora: começa já, sem esperar a fila.
  const promote = (img) => {
    if (!pending.has(img)) return false;
    stats.promoted++;
    if (stats.firstPromotion === null) stats.firstPromotion = Math.round(performance.now());
    begin(img);
    return true;
  };

  Object.defineProperty(proto, 'src', {
    configurable: true, enumerable: srcDesc.enumerable,
    get() {
      const entry = pending.get(this);
      return entry ? new URL(entry.url, document.baseURI).href : srcDesc.get.call(this);
    },
    set(value) {
      const url = String(value);
      const key = url.match(/^(?:\.\/)?(media\/[0-9a-f]{64}\.[a-z0-9]+)$/);
      if (!key) { pending.delete(this); return srcDesc.set.call(this, value); }
      // Imagem que já está na página (retratos do diálogo, menus) troca na hora:
      // segurar o endereço deixaria a imagem anterior à mostra.
      if (this.isConnected) { pending.delete(this); return srcDesc.set.call(this, value); }
      // Imagem com onload é etapa de um processamento (recolorir, recortar): o
      // resultado vai para outra imagem, que é a que o jogo desenha. Ela nunca
      // seria promovida pelo desenho, então já entra na frente.
      const etapa = typeof this.onload === 'function';
      pending.set(this, { url, prio: etapa ? -1 - (seq++) / 1e6 : rank.has(key[1]) ? rank.get(key[1]) : PRIORITY.length + seq++ });
      stats.queued++;
      if (etapa) stats.etapas = (stats.etapas || 0) + 1;
      schedule();
    }
  });
  // E a que entra na página depois de receber o endereço também começa já.
  new MutationObserver((records) => {
    for (const r of records) for (const node of r.addedNodes) {
      if (node instanceof HTMLImageElement) promote(node);
      else if (node.querySelectorAll) for (const img of node.querySelectorAll('img')) promote(img);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  // Consultar se a imagem está pronta também a passa à frente.
  for (const name of ['complete', 'naturalWidth', 'naturalHeight', 'width', 'height']) {
    const d = Object.getOwnPropertyDescriptor(proto, name);
    if (!d || !d.get) continue;
    Object.defineProperty(proto, name, {
      configurable: true, enumerable: d.enumerable,
      get() { if (pending.has(this)) { promote(this); return name === 'complete' ? false : 0; } return d.get.call(this); },
      set: d.set && function (v) { d.set.call(this, v); }
    });
  }
  const decode = proto.decode;
  // Com a fila, algumas imagens terminam de carregar (e às vezes trocam o
  // próprio src, como as recoloridas via toDataURL) depois de alguém já ter
  // pedido decode(). O decode nativo rejeita quando o src muda no meio; aqui
  // ele espera a imagem assentar e tenta de novo, até 4 vezes.
  const carregada = (img) => new Promise((resolve, reject) => {
    const semSrc = !srcDesc.get.call(img) && !pending.has(img);
    if (!semSrc && img.complete) return resolve();
    // Sem src ainda (resultado de um processamento em andamento): espera a
    // imagem receber o resultado e carregar, por até 20 s.
    const limite = semSrc ? setTimeout(() => { img.removeEventListener('load', ok); img.removeEventListener('error', falha); resolve(); }, 20000) : null;
    const ok = () => { clearTimeout(limite); img.removeEventListener('error', falha); resolve(); };
    const falha = () => { clearTimeout(limite); img.removeEventListener('load', ok); reject(new DOMException('Falha ao carregar imagem', 'EncodingError')); };
    img.addEventListener('load', ok, { once: true });
    img.addEventListener('error', falha, { once: true });
  });
  if (decode) proto.decode = function () {
    const img = this;
    promote(img);
    const tentar = (resto) => carregada(img).then(() => {
      const antes = srcDesc.get.call(img);
      return decode.call(img).catch((erro) => {
        const mudou = srcDesc.get.call(img) !== antes || !img.complete || pending.has(img);
        if (resto > 0 && mudou) return tentar(resto - 1);
        throw erro;
      });
    });
    return tentar(4);
  };
  const wrap = (ctxProto, name) => {
    const f = ctxProto && ctxProto[name];
    if (!f) return;
    ctxProto[name] = function (img, ...rest) {
      if (img instanceof HTMLImageElement) promote(img);
      return f.call(this, img, ...rest);
    };
  };
  wrap(window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype, 'drawImage');
  wrap(window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype, 'createPattern');
  wrap(window.OffscreenCanvasRenderingContext2D && OffscreenCanvasRenderingContext2D.prototype, 'drawImage');

  window.ToriiMedia = Object.freeze({
    stats: () => ({ ...stats, pending: pending.size, active }),
    idle: () => pending.size === 0 && active === 0
  });
})();
