# V7 · caminhada e corrida

32 sequências direcionais de Franco/Ryuchi principais, com/sem máscara. Cada ciclo passa a16 desenhos: oito poses V5 aprovadas, sem modificação, intercaladas com oito poses novas desenhadas pelo ImageGen integrado. São256 desenhos novos; não se trata de repetir quadros, crossfade, girar o corpo ou criar poses por deformação de código.

Quatro atlas RGBA4096×2048, células256×256, pivô128,224; linhas down/left/up/right e versões sem/com máscara. Filtro nearest. Colunas0–15 são reproduzidas; fechamento virtual volta a0, sem17ªcoluna duplicada. `manifest.json` sobrescreve somente walk/run na integração V5. Ações, dano, roll e quatro variantes adicionais permanecem com suas artes anteriores.

Corrida:16×32,5ms,520ms por ciclo nominal, distância3,172tiles. Caminhada:16×37,5375ms,600,6006ms nominal, distância8/3,6tiles. As distâncias de ciclo são exatamente as usadas pelo runtime anterior; as velocidades de jogo e o avanço por deslocamento real continuam iguais. O manifesto antigo declarava880ms de caminhada, mas o runtime já utilizava um ciclo espacial de2,222tiles; este pacote torna essa distinção explícita. A fase sobrevive às trocas andar/correr e de direção/máscara; o relógio não depende de quantos frames cabem no atlas.

As fontes `source/*.png` são saídas originais da ferramenta. `tools/pack_v7.py` faz apenas recorte/escala uniforme por linha/registro e empacotamento técnico, mantendo PNGs RGBA; não pinta poses. O export reserva um gutter transparente de2px por célula, descartando apenas ruído de matte com alpha1–2/255 nessa borda; o empacotador aborta se encontrar alpha maior que2, preservando a silhueta. `PROMPTS.json` registra pedidos e hashes. `PREVIA.html` permite ver os ciclos no tempo nominal; GIFs são prévias com arredondamento dos tempos para a resolução de10ms do formato. `PREVIA_CONTATO.png` compara os16 desenhos.

`VALIDACAO.json` confirma32 sequências de16frames diferentes,256 desenhos novos, limites4k/pivô/alpha e faixa de contato dos pés dentro da referência. O empacotamento técnico e a inspeção do contato não comprovam fluidez percebida ou performance mobile. `qa/review111_animation.cjs` testa contratos e hooks reais em Node/VM. A revisão na build e os testes de navegador pertencem à coordenação.

Referências: identidades e sprites do próprio projeto, usados a pedido do autor. Nenhum asset de terceiros foi baixado. A proteção de identidades e condições de uso continua em `LICENSE-ASSETS.md`.

Correção de integração: o QA Canvas encontrou alpha1/255 no canto superior esquerdo de `ryuchi/run/row1/col11`. `VALIDACAO_ALPHA_CORRECAO.json` registra a causa e compara os PNGs antes/depois:512 células e2048 cantos transparentes, borda inteira de2px zerada, todos os pixels internos e todas as256 células V5 preservados byte a byte. O controle negativo alpha3 na borda confirma que a guarda não apaga conteúdo visível. Nenhum pivô, pose ou timing mudou.
