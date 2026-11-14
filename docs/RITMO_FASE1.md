# Fase 1 — Medição de ritmo

Medido em 14/11/2026 na Alpha 1.2.4, com o medidor de ritmo do jogo e uma jogada automática completa (Capítulo 1 até o epílogo).

## Como foi medido
- **Medidor** (`game/source/telemetry/pace_meter.js`): registra, só no aparelho, o tempo andando, lendo, lutando e em menus, por área e por etapa da missão. Nada é enviado pela internet.
- **Jogada automática** (`qa/pace_bot.cjs`): segue o objetivo do próprio jogo, luta com o inimigo mais próximo, resolve os puzzles como uma pessoa que leu a dica e lê os diálogos num ritmo humano.
  - perfil **rápido**: corre sempre, lê 20 caracteres/s (jogador apressado, que já conhece o caminho);
  - perfil **típico**: anda sem correr, lê 14 caracteres/s.
- O robô nunca se perde nem explora. Por isso os tempos dele são o **mínimo**. Os playtests reais (30–60 min) somam exploração, tentativa e erro.

Relatórios brutos: `qa/ritmo/antes/bot-newGame-rapido-1.2.4.txt` e `qa/ritmo/antes/bot-newGame-tipico-1.2.4.txt`.

## Resultado

| | Rápido | Típico | Playtests reais |
|---|---|---|---|
| Jornada completa | 20 min | 27,5 min | 30–60 min |
| Capítulo 1 | 5,9 min | 7,8 min | — |
| Capítulo 2 | 4,5 min | 6,3 min | — |
| Capítulo 3 | 9,9 min | 13,3 min | "cansados ao chegar" |

**Onde o tempo vai (perfil típico):**

| | Cap. 1 | Cap. 2 | Cap. 3 | Total |
|---|---|---|---|---|
| Lendo diálogo | **83%** | 68% | 70% | **73%** |
| Andando | 11% | 24% | 18% | 17% |
| Combate | 5% | 8% | 12% | **9%** |

- **225 falas** obrigatórias (≈15 mil caracteres): 76 no Cap. 1, 40 no Cap. 2 e **109 no Cap. 3**.
- **17 encontros** de combate na jornada inteira. Primeiro combate aos **2 min 17 s** (perfil rápido).
- Maior trecho sem lutar: **4,3 min** (Cidade das Vozes).
- O Distrito da Distorção é atravessado **7 vezes** no Capítulo 3: é o hub de ida e volta.
- Narrador: 17% das falas (39). Franco e Ryuchi: 48 cada.

### Etapas mais longas (perfil típico)
| Tempo | Cap. | Falas | Lendo | Etapa |
|---|---|---|---|---|
| 2 min 05 s | 3 | 15 | 65% | Atravesse o Último Torii e enfrente O Silêncio |
| 1 min 36 s | 3 | 13 | 82% | Separe a interferência do canal |
| 1 min 26 s | 3 | 10 | 84% | Encontre Belga no Clube Contratempo |
| 1 min 23 s | 3 | 13 | 74% | Encontre Colli na Oficina de Mazza |
| 1 min 10 s | 1 | 10 | 64% | Ative as duas pedras de ressonância |
| 1 min 10 s | 2 | 7 | 63% | Suba à Torre e enfrente o Silêncio |
| 1 min 08 s | 1 | 13 | 80% | Siga o som. Encontre a origem da melodia |
| 57 s | 3 | 10 | 89% | Forme a primeira passarela de nuvem |
| 57 s | 1 | 11 | 100% | Converse com seu novo aliado |
| 50 s | 3 | 15 | 100% | Volte ao estúdio e abra uma sessão nova |

## Conclusões
1. **O jogo é, na prática, uma leitura com caminhadas.** Três quartos do tempo de quem joga sem se perder é lendo. Combate é menos de um décimo.
2. **O cansaço no Capítulo 3 tem causa medida:** ele concentra metade do tempo e quase metade das falas (109), com ida e volta pelo Distrito. Quem chega lá já leu 116 falas nos capítulos anteriores.
3. **O Capítulo 1 é o mais "lido"** (83%). É a primeira impressão de quem vem pela divulgação.
4. **Os puzzles e o ritmo quase não aparecem** (menos de 1% do tempo), mesmo sendo a premissa musical.
5. A diferença entre o robô (20–28 min) e as pessoas (30–60 min) é o tempo procurando o caminho. Isso pede caminhos mais curtos e claros, não só menos texto.

## Metas para as próximas fases
| Métrica | Hoje (típico) | Meta |
|---|---|---|
| Lendo diálogo | 73% | ≤ 35% |
| Combate + puzzles | 9% | ≥ 35% |
| Falas obrigatórias | 225 | ≤ 110 (as demais viram opcionais) |
| Falas no Cap. 3 | 109 | ≤ 45 |
| Primeiro combate | 2 min 17 s | ≤ 90 s |
| Maior trecho sem lutar | 4,3 min | ≤ 2 min |
| Travessias do Distrito no Cap. 3 | 7 | ≤ 3 |
| Jornada (pessoa real) | 30–60 min | 40–60 min, com mais ação e menos leitura |

A duração total não precisa cair muito. O que precisa mudar é a **proporção**: trocar tempo lendo e andando por tempo jogando.

## Bug encontrado e corrigido
As falas de `synth`, `percussion` e `metronome` apareciam como **SYNTH**, **PERCUSSION** e **METRONOME**, com o retrato errado. Agora aparecem como FRANCO SINTETIZADOR, RYUCHI PERCUSSIONISTA e O METRÔNOMO, com os retratos certos.

## Como medir os próximos playtests
1. Abra o site com `?ritmo` no fim do endereço: `https://ryusarto.github.io/Torii-Hutukara/?ritmo`.
2. Jogue normalmente. Um botão **RITMO** aparece no topo da tela.
3. No fim, toque em **RITMO → Baixar relatório (.txt)** e envie o arquivo.

Quem abre o site sem `?ritmo` não vê o botão. A medição fica guardada só no aparelho.

Para repetir a jogada automática depois de cada mudança:
```bash
ruby game/source/chapter-03/build_alpha.rb
PERFIL=tipico node qa/pace_bot.cjs newGame
```

## Depois dos cortes de diálogo (Fase 5)

| | Antes | Depois |
|---|---|---|
| Falas obrigatórias | 225 | 139 |
| Jornada (típico) | 27,5 min | 20,3 min |
| Capítulo 1 / 2 / 3 | 7,8 / 6,3 / 13,3 min | 5,8 / 4,4 / 10,1 min |
| Lendo diálogo | 73% | 65% |
| Combate | 9% | 12% |

A leitura caiu em tempo absoluto (de ~20 para ~13 min), mas a **proporção** ainda é alta porque o jogo tem pouca ação. As Fases 3 (combate) e 4 (ritmo dos capítulos) precisam preencher esse espaço. Relatórios em `qa/ritmo/` (antes em `qa/ritmo/antes/`).

## Depois das Fases 3 e 4 (parte 1)

| Perfil típico | Original | Fase 5 | Agora |
|---|---|---|---|
| Jornada | 27,5 min | 20,3 min | 20,8 min |
| Encontros | 17 | 18 | 23 |
| Primeiro combate | 190 s | 145 s | **40 s** |
| Maior trecho sem lutar | 4,3 min | 3,0 min | **2,1 min** |
| Lendo / combate | 73% / 9% | 65% / 12% | 64% / 14% |
| Derrotas da jogada automática | 1 | 1 | **0** |

A ação aparece mais cedo e com mais frequência, sem aumentar a duração. A proporção de leitura ainda é alta: o próximo passo é dar variedade e peso às lutas (novos tipos de inimigo, padrões de chefe, golpe no tempo da música).
