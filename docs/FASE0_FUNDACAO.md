# Fase 0 · Arrumar a fundação

Decisão do autor (21/11/2026): **o jogo roda sempre no navegador, como página.** Nada de PWA, service worker ou instalação. A otimização acontece no tamanho e na ordem do que a página baixa.

## Estado de cada frente

| # | Frente | Situação |
|---|---|---|
| 3 | Tirar os assets do Base64 / carregar por necessidade | **Primeira etapa entregue** (site): WebP sem perda + fila por prioridade |
| 4 | ~~PWA~~ → página no navegador, otimizada | Substituído pela decisão acima; ver item 3 |
| 5 | Sorte com semente | **Entregue** (`game/source/engine/sorte.js`) |
| 6 | Robôs de QA obrigatórios + taxa de derrota | **Entregue no CI** (falta só marcar como obrigatório no GitHub, ver abaixo) |
| 1 | Módulos de verdade, uma versão de cada função | Inventário feito; próxima etapa |
| 2 | Conteúdo em JSON (mapas, diálogos, inimigos, missões) | Depende do item 1 |

## 3. Carregamento do site

**Medição antes de mexer** (`qa/media_usage.cjs`, com `MEDIA_USAGE` no `campaign_review.cjs`): numa campanha completa (rotas Usina e Canal, PC e celular), o jogo usa **141 dos 349 arquivos** (175 de 366 MB). O site antigo pedia os 349 logo ao abrir, porque cada `new Image().src=…` dispara o download na hora.

**O que mudou** (só no site; o HTML portátil fica igual):

- `production/otimizar_media.py` converte as imagens para **WebP sem perda**. Os pixels ficam idênticos (o script confere) e as imagens caem de 323 MB para 234 MB (−28%). O resultado fica em cache por hash (`production/.media-cache/`, também em cache no CI).
  - WebP com perda foi testado e recusado: mesmo na qualidade 95, a arte fica com PSNR de ~30 dB (diferença visível nos contornos). Se um dia valer a troca, o limite fica em `MIN_PSNR`.
- `web/playtest/loader.js` entra como primeiro script da página e põe as imagens de `media/` numa fila:
  - a ordem é a do primeiro uso medido na campanha (`web/playtest/media_priority.json`);
  - qualquer imagem que o jogo tente desenhar (`drawImage`/`createPattern`) ou consultar (`complete`, `naturalWidth`…) passa à frente na hora;
  - no máximo 6 downloads ao mesmo tempo, e tudo termina carregado: só muda a ordem;
  - `ToriiMedia.stats()` mostra a fila no console.
- A música já era baixada sob demanda (`ALBUM11` via `fetch`), duas faixas por vez em memória.

**Resultado** (`qa/carregamento_site.cjs`, celular emulado, 4G de 12 Mbps e 70 ms, sem cache):

| | Antes | Depois |
|---|---|---|
| Tela de título pronta | 1,1 s · 1,3 MB | 1,1 s · 1,3 MB |
| Estúdio com todas as imagens que ele usa | **44 s · 66 MB** | **13,7 s · 18 MB** |
| Mídia total no servidor | 366 MB | 277 MB |

O teste falha se o título passar de 5 s ou se o estúdio não completar.

**Próximos passos do item 3**

- Atlas por capítulo: hoje as imagens do estúdio são atlas 4096×2048 que servem o jogo todo. Dividir por capítulo reduz os 18 MB iniciais.
- 225 arquivos (239 MB) não aparecem na campanha. Parte é pós-jogo, coop e variações; parte parece ser arte substituída por versões novas (`protagonist_art_v5` por cima das anteriores). Confirmar com o robô do pós-jogo e apagar da build o que estiver morto.
- Música: Opus com MP3 de reserva (Safari antigo) e mostrar "Agora tocando".
- Gerar o `media_priority.json` de novo a cada versão (o script avisa o que é novo; arquivos novos vão para o fim da fila).

## 5. Sorte com semente

`game/source/engine/sorte.js` é o primeiro código do jogo (o `build_alpha.rb` o insere antes da base 1.1.2) e troca `Math.random` por um gerador sfc32 com semente. Isso cobre os sorteios da base e do Capítulo 3 sem mexer em cada chamada.

- Jogando normalmente, a semente é sorteada a cada abertura. Para o jogador, nada muda.
- `?semente=123` no endereço, ou `ToriiSorte.semear(123)`, fixa a sorte. Com a semente fixa, a Fenda também deixa de misturar o relógio na semente da tentativa.
- `ToriiSorte.estado()` e `restaurar()` guardam e retomam o ponto exato dos sorteios.

`qa/sorte_reproducao.cjs` joga a campanha inteira três vezes: duas com a mesma semente e uma com outra. Resultado: mesma semente, mesmo save final e os mesmos 9.286 sorteios. Semente diferente, sorteios diferentes. As três campanhas completas, sem erro.

## 6. QA obrigatório e taxa de derrota

- `quality.yml` roda em **todo PR e em todo push no main**, sem filtro de caminho. Assim ele pode virar verificação obrigatória.
- Os dois workflows instalam Pillow e numpy, guardam o cache das imagens convertidas e passaram a rodar `sorte_reproducao.cjs` (antes de gerar o site) e `carregamento_site.cjs` (no site gerado). O deploy só publica se os dois passarem.
- **Taxa de derrota do robô**: `qa/sorte/REPRODUCAO.json` → `taxaDerrotaRobo` conta as chamadas de `showDefeat` nas três campanhas. Hoje: **0 derrotas** (o robô zera tudo sem morrer). Isso indica que a campanha está fácil para quem joga de forma ótima; serve de referência para o balanceamento da Fase 3.
- **Falta o administrador:** em *Settings → Branches → main*, marcar o check **Gameplay regression / gameplay** como obrigatório. Isso não se faz pelo código.

## 1. Inventário das camadas (próxima etapa)

Reatribuições `nome=function…` encontradas (contagem aproximada por busca no código; inclui a base e os módulos do Capítulo 3):

| Função | Camadas | Onde |
|---|---|---|
| `update` | 24 | base 6, `flow_fixes` 2 e mais 16 módulos com 1 cada |
| `buildMaps` | 17 | base 9, mais 8 módulos |
| `drawActor` | 14 | base 6, `chapter3_runtime` 2, mais 6 módulos |
| `setArea` | 11 | base 4, mais 7 módulos |
| `normalizeSave` | 10 | base 5, `flow_fixes` 2, `postgame`, `dialogue_edits`, `chapter3_runtime` |
| `drawTile` | 10 | base 6, mais 4 módulos |
| `advanceDialogue` | 10 | base 4, `chapter3_runtime` 2, mais 4 módulos |
| `drawEnv` | 6 | base 3, mais 3 módulos |

Ordem proposta para achatar, uma função por vez e sempre com o robô provando a equivalência (agora possível com a semente fixa: mesmo save final e mesmo número de sorteios antes e depois):

1. **Decompor a base**: tirar o JS (~400 KB) e o CSS do HTML de 40 MB para `game/src/`, e as 26 imagens/faixas embutidas para arquivos. Um montador reconstrói a base **byte a byte** (o SHA-256 da build não muda), e o HTML de 40 MB sai do repositório.
2. `normalizeSave` primeiro: é a menor e tem o teste mais claro (saves antigos em `qa/`).
3. `buildMaps` e `setArea`, já levando mapas para JSON (item 2).
4. `drawTile`, `drawActor` e `drawEnv`, comparando capturas de tela pixel a pixel com a semente fixa.
5. `update` por último, porque é onde 18 módulos se penduram.

Vite fica como empacotador quando o código estiver em módulos. A saída continua sendo uma página estática: os arquivos rodam no navegador como hoje.
