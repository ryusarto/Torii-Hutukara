# Corrida mascarada, inimigos adicionais e HUD dos bosses

Incremento local da Beta 1.17.0. Sem merge ou publicação.

## Protagonistas com máscara

A verificação anterior da fase e do topo do sprite não revelava um problema de apoio: na corrida mascarada V8 do Franco, vários desenhos consecutivos mantinham os pés longe do chão. O A/B no mundo favoreceu as oito poses canônicas já existentes para os dois protagonistas mascarados. Essas poses são os quadros pares dos atlas V7, correspondentes aos originais V5. Nenhum PNG de personagem foi redesenhado.

`run_stride_v1.js` consulta `nativeRunRows=[4,5,6,7]` em Franco e Ryuchi e mantém a fase por distância, direção pós-colisão e pausa. As corridas sem máscara aprovadas continuam com 16 poses V8; os quatro outros integrantes mantêm suas rotas anteriores. O gerador `production/register_locomotion_v9.py` registra essa escolha e os mapas por variante no manifesto.

Foram corrigidos ainda dois problemas de transição: o reposicionamento inicial de P2 não conta como passada, e a pose congelada durante o diálogo recalcula a variante quando a máscara é adquirida. A fase física permanece contínua. A aquisição real foi exercitada com imagens frias e já carregadas, incluindo o desenho no próprio callback da máscara, antes de sair do diálogo.

## Corpos dos seis inimigos adicionais

Os seis tipos do Médio e Difícil usavam corpos antigos recoloridos e símbolos de função. Agora têm folhas e animações próprias em `assets/enemies/variants-v2/`:

| Tipo | Leitura do corpo |
| --- | --- |
| Tambor-Escudo | Madeira, musgo, cobre e tambor circular como proteção |
| Flautim Atirador | Silhueta leve e instrumento de disparo reconhecível |
| Coro de Reparo | Presença musical de cura distinta dos combatentes |
| Maestro Oco | Batuta e gesto de invocação próprios |
| Muralha de Estática | Corpo pesado e placa retangular de metal |
| Antena de Feedback | Equipamento e silhueta de emissão de feixe |

Dez folhas originais foram geradas com o `image_gen` integrado. As fontes, prompts e proveniência estão preservados. São 320 desenhos autorais em 40 sequências: descanso, preparação, golpe e reação. Os dois escudos têm frente, perfil e costas autorais; a vista esquerda espelha o perfil direito do desenho bilateral. O corpo fica ereto e a orientação corresponde a `e.face`; não se gira o humanoide inteiro.

O manifesto usa células 128 × 128, oito colunas, pivô (64,104), filtragem nearest e margens transparentes. Os atlas dos escudos têm 1024 × 1536 e os demais, 1024 × 512. A exportação remove resíduos de alfa 1–8 dos derivados e mantém os originais gerados. A validação decodifica todas as células, confere margens, hashes e limites.

Uma captura enviada pelo usuário revelou cortes de escudos e fragmentos em quadros vizinhos: a grade uniforme atravessava 17 poses das folhas originais. As margens externas do atlas não detectavam esse erro porque eram aplicadas após o recorte. A exportação agora associa componentes físicos inteiros globalmente antes de recortar; as dez fontes têm 32 corpos completos cada, e todos os pixels sólidos são atribuídos exatamente uma vez. A nova divisão preserva as âncoras nominais e o deslocamento autoral, sem recentrar cada caixa por quadro. As fontes originais ficam intactas, os derivados rejeitados estão em `history/` e `SEGMENTATION_REPAIR.png` registra o antes/depois. Não houve alteração de colisões ou dano.

`enemy_variant_art_v2.js` entra antes da aura/proxy no renderer de encontros por um único hook do builder. A cadeia externa de avisos, projéteis e vidas continua ativa. Somente o glifo de cast redundante é suprimido quando o novo corpo está pronto. O fallback de mídia usa arte nativa limitada. As vidas consultam a altura do novo corpo já carregado; enquanto houver fallback, usam a silhueta antiga correspondente.

Preparação e resolução seguem os dados reais. Os escudos apresentam golpe antes da pose vulnerável, sem alterar a duração da abertura. Cancelamento da AI enquanto o boss retém o encontro não inventa um ataque; resoluções reais de perigos são observadas separadamente. Dano, HP, colisões, RNG, recursos e timers permanecem no código da simulação original.

## Efeitos das habilidades

Os efeitos são separados da animação corporal. O atlas `combat-readability/v1` já contém oito quadros por sequência para o cone do Tambor (`cone_drum`), tiro do Flautim (`flute_bolt`), cura do Coro (`heal_chord`), invocação do Maestro (`summon_knot`), escudo da Muralha (`cone_iron`) e feixe da Antena (`beam_feedback`). A investida da Muralha usa `line_lunge`, compartilhado com investidas de outros inimigos; texturas secundárias do chão também são compartilhadas por família. Não se afirma que todo efeito secundário seja exclusivo.

Avisos, projéteis e efeitos de resolução usam o perigo real da simulação e seus tempos/áreas. A troca do corpo preserva essa cadeia e suprime somente o símbolo de cast redundante sobre o ator.

## Vida grande exclusiva dos bosses

`enemy_health_v7.js` mantém as barras compactas acima dos inimigos comuns. O `bossActor` recebe uma única faixa grande na tela, com nome, HP discreto e barra, sem duplicata sobre sua cabeça. Também atende os bosses da Fenda pelo mesmo papel de ator.

O posicionamento procura uma faixa e um intervalo livres contra todos os retângulos visíveis dos controles e do HUD, incluindo botões reposicionados. Os botões individuais do PC também entram como obstáculos, mesmo quando ultrapassam o grupo flex. Um reteste final cobriu 18 combinações de personagem/tela e 90 verificações dos cinco botões, mais três deslocamentos fora do grupo. Um teste independente encontrou sobreposição em 640 × 360 na primeira abordagem; a correção passou em cinco viewports e 78 layouts válidos reposicionados. Nome longo e HP de seis dígitos também foram conferidos. A barra desaparece em pausa, diálogo, morte ou mudança de área e lê exclusivamente a vida real do boss.

O builder escreve o HTML em arquivo temporário e faz rename somente após a escrita completa. Um erro de espaço não substitui mais uma build íntegra por conteúdo truncado.

## Evidências

- `qa/beta-1.17.0/masked-runs-v10/`: 77 verificações integradas e quatro aquisições reais HTTP; GIFs de corrida e equipamento, comparativos e sequências de pose.
- `RUN_STRIDE_V10_TEST.txt`: 80 combinações de teclado/gamepad, direção, variante e jogador, com contrato de oito poses mascaradas e 16 poses V8 nas demais rotas.
- `enemy-variants-v2/`: 40 sequências/320 desenhos validados e dez cenários de navegador, incluindo AI do Médio, escudos, cancelamentos, acertos e imutabilidade da simulação durante desenho.
- `COMBAT_READABILITY_ASSET.json` / `COMBAT_READABILITY_BROWSER.json`: 20 sequências de efeito e 13 cenários reais, com geometria, dano, resolução/cancelamento e mídia HTTP lossless.
- `ENEMY_HEALTH_BROWSER.json`: barras de boss e comuns em PC, retrato e paisagem, dano, pausa, morte, coexistência e mudança de mapa.
- `REVISAO_MASCARAS_INIMIGOS_BOSS_V10.md`: revisão técnica independente; `design/animation_v10/DIRECAO_E_ACEITE.md`: direção artística.

As evidências são de Chromium, cenários controlados e inspeção das sequências. Não representam uma campanha humana completa nem teste em aparelhos físicos. A oscilação dos espinhos da máscara faz parte das poses canônicas; o objetivo foi corrigir a marcha e as transições sem alterar a identidade dos personagens.
