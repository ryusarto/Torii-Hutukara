# Capítulo 3 — deserto pós-apocalíptico cyberpunk

Direção comum v1 · 17/11/2026 · responsável pela consolidação: direção do jogo.

**Estado:** conceito solicitado pelo autor; direção e contratos definidos nesta revisão; produção das variantes iniciada na frente de cenários. Este documento não declara que o novo visual já está integrado ou publicado no jogo.

Base visual inspecionada pela equipe: main `46bc42b2696848d7adcaa748923c4be7695c4ddd`, cenários V2 com 12 atlas e 126 recortes/estados em 25 mapas. A revisão usa esses assets e a geometria corrigida como ponto de partida. Não voltar a uma build anterior ao PR #8/#9 ou aos cenários V2.

## Decisão do autor e interpretação da equipe

O autor definiu uma mudança geral de coloração e direção artística **do Capítulo 3**: deserto pós-apocalíptico, cyberpunk num mundo reconstruído, areia, ferrugem e tons terrosos. Mad Max é a referência de atmosfera, exposição ao clima e improvisação material. A identidade própria permanece musical.

A interpretação de produção da equipe é uma comunidade de sucata tecnológica em ruínas industriais elevadas, entre mesetas/cânions e um mar de areia e poeira. Cabos, alto-falantes, instrumentos reconstruídos, lonas, aço soldado e eletrônica recuperada contam a história do lugar. A verticalidade e as condensações específicas preservam o Elevador, a Flauta e as travessias existentes.

A nova direção substitui a dominância grafite/violeta ornamental do C3. Capítulos 1/2 mantêm sua direção. O deserto precisa aparecer em materiais, formas, desgaste e composição; uma transformação global de cor não realiza a mudança.

A comunidade continua acolhedora. Belga abriga e guarda sons; Mazza reconstrói instrumentos; Colli lê rotas e vento; Dney valoriza as imperfeições. O final continua sobre começar a criar apesar do medo. Veículos dirigíveis, combustível, fome, guerra de facções e sistemas de sobrevivência não integram este passe artístico.

## Paleta e materiais

Rampas orientadoras, com variações coerentes para sombra e volume. A paleta estruturada está em [PALETA_DESERTO_V1.json](PALETA_DESERTO_V1.json).

| Função | Cor |
|---|---|
| Areia compactada / chão principal | `#C3A06C` |
| Poeira iluminada / lona clara | `#DFC49A` |
| Ferrugem | `#9A5537` |
| Ferrugem em sombra | `#6E3F2A` |
| Aço gasto | `#53524A` |
| Carvão, óleo e contorno profundo | `#282724` |
| Osso / reboco / pontos de leitura | `#F0E0BD` |
| Verde oxidado discreto | `#626B53` |
| Sombra fria de metal | `#3F5155` |
| Tecnologia funcional, localizada | `#6CC1BC` |
| Acolhimento / luz interna | `#E7B26B` |
| Criação / palco, acento residual | `#C27C85` |

- Predomínio terroso com diferenças de valor; sombras discretamente frias dão separação ao volume.
- Aço reparado, soldas, concreto erodido, borracha, cabos remendados e lona substituem o excesso de ornamento dourado/violeta.
- Areia acumula em cantos, bases e sotavento. O caminho usado permanece compacto e reconhecível.
- Eletrônica reaproveitada mantém o cyberpunk. Estruturas precisam mostrar função, manutenção e uso.
- Vegetação rara e cuidada pode mostrar vida e afeto. O Contratempo continua sendo um refúgio.
- Ciano e rosa se concentram em mecanismos e respostas musicais; luz âmbar marca espaços habitados.
- Placas recebem molduras e símbolos; os nomes continuam como texto da engine.

## Matriz das onze áreas

Os nomes públicos conhecidos permanecem inicialmente. IDs, flags e conexões são preservados. Renomeações futuras exigem um passe editorial conjunto de labels, objetivos, diário e falas.

| ID | Contexto artístico | Função e leitura preservadas |
|---|---|---|
| `sky_terminal` | Terminal de carga reaproveitado, lona desbotada e horizonte desértico | Chegada, checkpoint e saída seguros e reconhecíveis |
| `distortion_district` | Assentamento de sucata musical, concreto erodido, passagens compactadas, antenas e casas remendadas | Hub, serviços, entradas e marcos distintos; seis alinhamentos de portal V2 preservados |
| `contratempo` | Abrigo comunitário com madeira recuperada, caixas consertadas, tecido acústico e palco improvisado | Belga/Dney, frase livre e entrega da Flauta; centro livre e estados de palco legíveis |
| `power_plant` | Usina corroída, bobinas, geradores e painéis substituídos ao longo do tempo | Baixo, barreira, sequenciador, combate e `usinaGate/usinaDone`; mudança mecânica visível |
| `sky_canal` | Aqueduto industrial elevado entre estruturas áridas | **Água/condensação preservada**, Violino, travessia e resgate; `canalPath/canalDone` |
| `ciro_workshop` | Oficina de Mazza sob lona, peças catalogadas e instrumentos reconstruídos | Visita opcional e circulação livre; sem restaurar a ida obrigatória removida pelo pacing |
| `sky_lift` | Torre industrial recuperada, roldanas, contrapesos e chapas | Requisitos e `liftOpen`; embarque, travas e plataforma inequívocos |
| `cloud_sea` | Ilhas e passagens elevadas sobre cânions, condensações e mar de poeira distante | Passagem A → plataforma → passagem B; chão formado, passagem futura e vazio separados |
| `cloud_terrace` | Terraço exposto, rocha/ferro e depósitos de areia nas margens | Arena do Metrônomo e perímetro; centro quieto para ler preparações e ataques |
| `last_torii` | Limiar antigo parcialmente tomado pela areia e preservado pela comunidade | Checkpoint, círculo único de ressonância e encontro das seis frequências |
| `silence_core` | Câmara industrial/santuário despojado, metal escuro, basalto e sedimentos | Entrada/retry, altar, arena, olhos periféricos, chefe e conclusão musical |

**Regras de continuidade:** Usina e Canal continuam em qualquer ordem. Recrutamento vem após apresentação. Mazza e Colli entregam a Flauta no Contratempo depois das duas frentes; a oficina permanece opcional. A Flauta forma passagens nas condensações específicas. O Canal conserva água/condensação e não vira vala seca caminhável. A frase final aceita qualquer combinação de quatro notas.

## Personagens, inimigos, efeitos e interface

Preservar rostos, pele, figurinos reconhecíveis, instrumentos, pivôs e animações aprovadas. Protagonistas V5 e variantes mantêm suas paletas próprias. Desgaste localizado ou acessórios futuros são variantes deliberadas, não uma alteração global do elenco.

A máscara Torii continua canônica. Não substituí-la por máscara de gás. Ninja permanece sem máscara; Arqueiro mantém a máscara no lado direito do cinto.

Inimigos presentes em vários capítulos precisam de contexto C3 para qualquer variante ambiental. Suas funções musicais, silhuetas de ataque e estatísticas permanecem. Este passe não acrescenta inimigos nem muda HP, dano, recompensas ou quantidade de encontros.

Poeiras e efeitos decorativos ficam principalmente atrás dos atores. Ferrugem decorativa não pode competir com um ataque. Telegráficos conservam preparação, geometria, contorno e contraste; cura, proteção, interação e ameaça continuam distinguíveis sem depender somente da cor. Preservar identificação de P1/P2 e as seis frequências.

O HUD e o texto não recebem um filtro ambiental global. A opção de efeitos suaves reduz movimento e partículas sem apagar sinais úteis. Conferir mobile em retrato/paisagem com controles e texto normal/maior visíveis.

## Inventário de adaptação

106 células C3 em A01–A10 são candidatas a reuso/adaptação. Não são 106 gerações obrigatórias. As 20 células A11/A12 têm uso compartilhado.

| Família | Células | Entrega |
|---|---:|---|
| A01 — superfícies urbanas | 8 | Pavimento erodido, areia em fendas, pedra/concreto, água mineral, chapa; fundos de céu/abismo separados do piso |
| A02 — interiores | 8 | Madeira recuperada, metal gasto, tecido e materiais silenciosos de santuário/núcleo |
| A03 — bordas urbanas | 16 | Direções, quinas, travessias, dreno e soleira compatíveis com A01 |
| A04 — encaixes de nuvem | 16 | Centros, bordas e quinas; topo sustentado legível sobre o vazio |
| A05 — arquitetura | 6 | Moradias, entrada da Usina, cobertura do Terminal e arco de chegada; portas e silhuetas preservadas |
| A06 — Contratempo | 12 | Palco/caixas idle-active, balcão, mesa, cadeira, banco, console, projetor, rack e painel |
| A07 — indústria | 8 | Quatro pares mecânicos: máquina, interruptor, válvula e portão |
| A08 — sinalização | 12 | Molduras sem texto gerado, setas, soleiras, embarque e cais |
| A09 — travessia | 8 | Baliza, condensação, âncora do Tambor e sinais de vento; estados off/on |
| A10 — clímax | 12 | Olhos, altar, círculo, arco, ponte, borda e colunas; arena limpa |
| A11/A12 — compartilhados | 20 | Manter originais. Criar variantes individuais C3 somente para usos incompatíveis |

Clube, oficina, elevador, postes, gravadores e alguns props ainda podem usar atlas antigos. Incluí-los no inventário para evitar fachadas que contradizem os materiais novos. `prebeta_cinema`, materiais e colaboradores possuem usos compartilhados; alterar somente os contextos/painéis pertinentes ao C3.

[Brief de produção e prompts](BRIEF_ASSETS_DESERTO_V1.md).

## Contrato técnico

Continuar com HTML/Canvas2D, perspectiva frontal em três quartos, tile lógico 24×24 e nearest-neighbor.

- A01–A04: células 104×104, conteúdo 96×96 e gutter de quatro pixels.
- A05: células 384×384; pivô atual (192,368).
- A06–A12: células 256×256; pivô atual (128,240).
- O manifesto real define cada retângulo, pivô e tamanho de exibição. Novas fontes exigem medição dos recortes; preservar ordem e IDs lógicos não significa copiar caixas de uma geração diferente.
- Off/on e aberto/fechado mantêm escala e âncora; o portão aberto tem vão transparente real.
- Materiais têm miolo opaco e repetição sem motivo central. Props têm alpha real e não trazem chão retangular embutido.
- Entregar PNG fonte, atlas RGBA, manifesto, hashes, prompts/referências e script de empacotamento. Fontes editáveis só são declaradas quando realmente produzidas.

Pacote de trabalho combinado com a frente de cenários: `assets/cenarios/deserto-v1/`, exclusivo do C3, com substituições por ID/contexto. O caminho é de produção, não evidência de integração nesta revisão.

O renderer final atual é `game/source/chapter-03/cenarios_v2.js`, injetado depois de `protagonist_art_v5.js`. Seus pontos `CenariosV2.tile/material/cloud/itemFor/sprite/drawProp` têm precedência. Alterar somente `PB.materialV2` não cobre o capítulo.

Aplicar variantes apenas em `C3.AREAS`. Preservar A11/A12 e todos os usos C1/C2. A integração final deve preferir um conjunto C3 por build; se duas bibliotecas coexistirem para comparação, chaves de cache distinguem biblioteca e item.

Manter a base 1.1.2, schema 13, chave de save, IDs, flags, callbacks, dimensões, máscaras de caminhada, footprints e coordenadas do baseline V2 atual. Preservar `repairLegacyCloudPosition()`. A antiga allowlist de seis portas/anel serviu à entrega V2 e **não autoriza novos deslocamentos** neste passe.

## Responsáveis e passagem de trabalho

| Frente | Responsável | Posse |
|---|---|---|
| Consolidação, decisões e aceite do conjunto | Este chat de direção; th_coordenador | Contrato comum, dependências e critérios; coordenação de revisão |
| Linguagem visual | th_diretor_artistico | Paleta, materiais, luz, contraste, identidade e revisão de capturas |
| Especificação de arte | th_artista | Inventário, prompts, fontes/exports e cumprimento do manifesto |
| Produção e integração de cenários | Chat de cenários Analisar build HTML TORII Hutukara | A01–A10, variantes C3, fachadas e renderer de cenário; esta frente confirmou a posse |
| NPCs | Frente de NPCs já notificada | Poses, contexto local, continuidade e recorrências; preservar identidade e capítulos anteriores |
| Músicos | Chat Criar sprites de Ryuchi e Franco | Pacotes Sintetizador/Percussionista e integração combinada; preservar figurinos, máscaras, pivôs e ações |
| Contrato técnico | th_arquiteto | Roteamento por capítulo, manifestos, carregamento, caches e integração; revisão sem sobrepor o escritor do renderer |
| Continuidade e leitura jogável | th_game_designer | Onze áreas, estados, relíquias, revisão editorial e critérios de exploração/combate |

Um escritor por PNG/atlas. Cada frente preserva a branch e o trabalho das outras. Mudanças no mesmo runtime são combinadas antes da integração; o arquiteto deste chat não edita paralelamente o renderer reservado à frente de cenários.

## Lotes e aceite

1. **Amostra:** Distrito → Contratempo → entrada da Usina, com um combate, estados de barreira/máquina e referências de personagem na câmera real.
2. **Leitura de altura:** amostra de travessia com topo, borda, condensação futura e vazio, antes de expandir A04/A09.
3. **Expansão:** completar as onze áreas, fachadas antigas pertinentes, estados das duas rotas e clímax.
4. **Conferência editorial:** descrições coerentes com o visível, nomes preservados inicialmente, oficina opcional e Flauta no local correto.
5. **Integração e entrega:** revisão artística, validação técnica, regressão e evidências da mesma build. Escolhas rotineiras seguem a autorização do autor; o fluxo de PR/merge não exige aceite manual repetido.

Critérios observáveis:
- Deserto reconhecível por matéria e composição, com eletrônica e reconstrução musical.
- Atores, projéteis, interação e preparações de ataque acima da textura; chão/vazio distintos também em escala de cinza.
- Entradas, soleiras, portas, pivôs e estados concordam com colisões.
- Estados e recompensas recompõem corretamente após save/load, morte/retry e retorno.
- C1/C2, protagonistas e HUD preservados; sem paleta ambiental aplicada por acidente.
- Conferir repetição 3×3, costuras, alpha, halos e escala uniforme.
- Repetir suites pertinentes de estrutura, cenários, geometria, NPCs, gameplay, controles, arte e site; ambas as ordens das frentes, travessias, dois chefes e P1/P2.
- Medir tamanho da build, imagens decodificadas e tempo de quadro em cenas comparáveis; não declarar desempenho em aparelhos físicos com base somente em emulação.
- Capturas das onze áreas e estados, desktop e mobile, com hash e limites da revisão.

## Registro desta revisão

Participaram th_coordenador, th_diretor_artistico, th_artista, th_arquiteto e th_game_designer, conforme pedido explícito do autor. As cinco especialidades entregaram revisão/contratos; direção artística e artista inspecionaram referências visuais existentes. Nenhum novo PNG, renderer ou diálogo foi produzido por esses cinco pareceres.

Os chats de cenários, NPCs e músicos receberam a nova direção. A frente de cenários confirmou o pacote deserto-v1 e a responsabilidade pela implementação. Produção, integração, execução e testes do novo visual devem ser registrados separadamente; os testes históricos da base V2 não validam a nova arte.
