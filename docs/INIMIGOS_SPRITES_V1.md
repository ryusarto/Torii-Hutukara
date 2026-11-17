# Inimigos — inventário e contrato de sprites V1

Registro de 17/11/2026. Base de integração indicada pela coordenação: main `c2a01c7`, Beta 1.2, sincronizada nas fontes locais. Na redação deste documento, o HEAD do checkout local ainda era `dab09c8`, com alterações de sincronização em arquivos de fonte; `game/VERSION.json` local já declara `beta-1.2.0`. Não confundir a versão dos arquivos com um commit local concluído.

**Estado: fontes produzidas e integração em fonte realizada pela coordenação; build e QA em andamento.** Escopo: sete tipos comuns e quatro chefes, mais duas variantes visuais de C3 (`compasso_c3` e `abafador_c3`): **11 identidades, 13 pranchas e 52 poses frontais discretas**. Cada prancha contém repouso, preparação, execução e reação. Não são ciclos de caminhada, múltiplas direções ou animações de morte. Nenhum inimigo, ataque ou regra de combate novo faz parte deste lote. A produção das fontes e a integração foram informadas pela coordenação; não equivalem a validação de build ou aprovação de QA. O registro final das verificações será preenchido pela coordenação.

## Fontes verificadas

- `game/source/base/TORII_HUTUKARA_1_1_2_TRILHAS.html`: mapas, `enemyInfo`, `hydrateEnemy`, `updateEnemy`, `hitEnemy`, `drawEnv`, `drawCreature`, cenas/revelação e camadas posteriores do capítulo 2. Base imutável; blob conferido no inventário anterior: `7126897f5425bf19aa11dd24ac716bd4ffc7134b`.
- `game/source/chapter-03/chapter3_runtime.js`: `C3.buildMaps`, render de criaturas, chefes, padrões, progressão e frase final.
- `game/source/chapter-03/pacing.js`: `ENCOUNTERS`, `PATROLS`, instâncias fracas, condições de presença e busca de chão livre.
- `game/source/chapter-03/combat_patterns.js`: `BOSS_PATTERNS`, `NEW_TYPES`, padrões e auras.
- `game/source/chapter-03/input_mobile_combat.js`: recuperação dos chefes de C3 e alternância do alvo no coop.
- `game/source/chapter-03/build_alpha.rb`: composição aditiva e substituição do ramo de desenho dos chefes; não editar somente a build gerada.
- `game/source/chapter-03/ninja_archer_art_v1.js`: integração do Arqueiro jogável, retratos e ponto de conflito com o desenho legado do primeiro chefe.
- `design/dialogo/EDICOES_DIALOGO.json`: cortes de diálogo, incluindo a sequência de revelação; frases originais da base podem ser substituídas na build.

Levantamento por inspeção estática. Não representa gameplay, aceite visual ou inspeção de todos os pixels dos assets. Preserve também as alterações da frente NPCs e a integração dos protagonistas em andamento.

## Elenco único

| Chave efetiva | Nome no jogo | Capítulo/mapas ativos | Função e estados relevantes |
|---|---|---|---|
| `hush` | Nó do Silêncio | C1: corredor, floresta, ruínas; C2: cidade/telhados | Aproximação, preparo `swipe`, golpe próximo, atordoamento e impacto. |
| `whisper` | Sombra Disforme | C1: floresta/ruínas; C2: cidade/telhados | Aproximação até distância própria, preparo `orb`, lançamento de projétil, impacto. |
| `compasso` | Metrônomo Menor | C1: ruínas; C3: mar de nuvens | Pulso fixo: aproximação lenta e preparo antes da batida. |
| `espelho` | Eco Espelho | C2: cidade | Aproximação, golpe próximo, reação após dois impactos e onda de retaliação. |
| `abafador` | Abafador | C2: cidade; C3: Distrito | Aura que abafa técnicas, aproximação lenta, preparo/golpe próximo. |
| `c3_echo` | Eco de Distorção | C3: Usina, Canal, Mar, Distrito | Usa atualmente a lógica comum de golpe próximo `swipe`. |
| `c3_drone` | Drone de Retorno | C3: Usina, Canal, Mar | Também herda atualmente `swipe`. O nome Drone não autoriza convertê-lo em atirador. |
| ID `boss` | O Viajante Mascarado | C1: `ruins` | Duas fases; onda `ring`, leque `fan`, investida `charge`. Figura corpórea próxima ao Arqueiro renovado, jaqueta vermelha/ouro, calça clara/tan e grande máscara marfim cobrindo o rosto até a revelação. |
| ID `voice_boss` | Arauto da Estática | C2: `voice_tower` | Duas fases; faixas `lanes`, círculo `feedback`, rajadas e duas ondas de contratempo. |
| ID `c3_metronome` | O Metrônomo | C3: `cloud_terrace` | Três fases; padrões de onda/cruz/leque/pulso; prevê repetição de técnicas e abre recuperação. |
| ID `c3_silence` | O Silêncio | C3: `silence_core` | Três fases; repertório de sete padrões, cinco por tentativa; transição à frase final. |

Chefes têm `type:'boss'` compartilhado. **Roteie os quatro por ID**, antes de consultar o tipo. Inimigos comuns são roteados por tipo; IDs de instância continuam servindo à progressão e à lista `G.defeated`. “boss1” é um nome informal/histórico de QA para o primeiro chefe: não criar ID `boss1` nem renomear `boss`.

## Instâncias e presença por mapa

As instâncias de `pacing.js` usam coordenadas aproximadas e busca de chão livre; não fixar a imagem numa coordenada de tela ou tratar a âncora de encontro como posição final garantida.

| Capítulo/mapa | Instâncias efetivas e tipos |
|---|---|
| C1 `corridor` | `p4_corridor_hush` → `hush`. |
| C1 `forest` | `forest_hush_a`, `forest_hush_b` → `hush`; `forest_hush_c` → `whisper`; `p4_forest_path_a`, `p4_forest_east` → `hush`; `p4_forest_path_b` → `whisper`. |
| C1 `ruins` | `ruin_hush_a`, `ruin_hush_c` → `hush`; `ruin_hush_b` → `whisper`; `p4_ruins_entry`, `p4_ruins_gate` → `hush`; `p4_ruins_mid` → `compasso`; chefe ID `boss`. |
| C2 `voices` | `relayPlaza_guard_0`, `relayMarket_guard_0` → `hush`; respectivos `_1` → `whisper`; `p4_voices_west` → `hush`; `p4_voices_center` → `espelho`; `p4_voices_market` → `abafador`. |
| C2 `voice_roofs` | `relayRoof_guard_0` → `hush`; `relayRoof_guard_1` → `whisper`; `p4_roofs_end` → `whisper`. |
| C2 `voice_tower` | Chefe ID `voice_boss`. |
| C3 `power_plant` | `c3_plant_echo_1`, `c3_plant_echo_3` → `c3_echo`; `c3_plant_echo_2` → `c3_drone`; `p4_plant_entry` → `c3_echo`. |
| C3 `sky_canal` | `c3_canal_echo_1` → `c3_echo`; `c3_canal_echo_2` → `c3_drone`; `p4_canal_entry` → `c3_echo`. |
| C3 `cloud_sea` | `c3_cloud_echo_1` → `c3_echo`; `c3_cloud_echo_2` → `c3_drone`; `p4_cloud_mid` → `compasso`. |
| C3 `distortion_district` | `p4_patrol_center` → `c3_echo`; `p4_patrol_east` → `abafador`. |
| C3 `cloud_terrace` | Chefe ID `c3_metronome`. |
| C3 `silence_core` | Chefe ID `c3_silence`. |

Definições antigas `voice_roof_hush` e `voice_roof_hush2` são removidas por `build091`, que filtra `voices`/`voice_roofs` para manter inimigos com `guardFlag`. Os encontros de pacing entram depois. Não contar essas definições removidas como encontros ativos extras.

Guardas de relés dependem de `voicesTech`, proximidade do retransmissor e `relay…Awake`; sua seleção deixa de incluí-los após o relé correspondente ser ativado. A emergência usa `emerge091`. As patrulhas do Distrito só aparecem após uma rota concluída; podem ser restauradas no retorno com intervalo e exceção após derrota. `WEAK_IDS`/`WEAK` reduzem atributos de algumas instâncias de C3, sem criar espécies novas.

O Viajante é iniciado pelo evento `boss` após `ruinA && ruinB`; sua conclusão usa `flags.boss`, seguida da cena/recrutamento `flags.reveal`. Arauto usa os relés/torre e conclui `voicesBoss/voicesDone`. Metrônomo conclui `metronomeDone`. Silêncio usa `bossAttempts`, `finalPending`, frase, `silenceDone` e retomada do epílogo. Sprites não modificam essas condições.

## Arte atual e lacunas encontradas

| Grupo | Implementação inspecionada antes deste lote |
|---|---|
| `hush` / `whisper` | Compartilham `sprite091('echo')` em floresta/ruínas/C2, variando tamanho/espelhamento. Fonte embutida `atlas091`, célula 384×512. Desenho comum aproximadamente 68–76 px de altura; fallback procedural. |
| `compasso` / `espelho` / `abafador` | Reaproveitam `hush`/`whisper` com aura, cor e marcador. A silhueta precisa distinguir função sem depender somente da cor. |
| `c3_echo` / `c3_drone` | Mesma célula `(0,1)` de `C3.images.cast`, grade 3×2; desenhos 58×58 e 70×66. Identidades visuais hoje pouco separadas. |
| Arauto | `sprite091('herald')`, desenho de altura 138; fallback próprio de formas/efeitos. |
| Metrônomo | Célula `(1,1)` do atlas cast, desenho 118×134. |
| Silêncio | Célula `(2,1)` do atlas cast, desenho 156×166. |
| Viajante | Ramo legado de `drawEnv` desenha o ator `alt` em escala 1,5 e sobrepõe uma máscara pequena; integração do Arqueiro atual pode revelar o rosto. Precisa render próprio totalmente mascarado. |

O contrato novo substitui/reorganiza a apresentação dessas identidades. A coordenação produziu as 13 fontes e integrou a seleção nas fontes do jogo; a existência dos PNGs e do código ainda não comprova recortes aprovados, build validada ou teste visual concluído.

## Direção visual do Capítulo 3

Direção mais recente do autor: **cyberpunk pós-apocalíptico empoeirado, com ferrugem, sucata e metal desgastado**, tendo Mad Max como referência de materiais, desgaste e atmosfera, sem copiar personagens ou figurinos. A aplicação é restrita às aparições de C3; as aparências de C1/C2 permanecem preservadas, incluindo suas versões de Metrônomo Menor e Abafador.

Os quatro nativos de C3 — `c3_echo`, `c3_drone`, `c3_metronome` e `c3_silence` — recebem esse tratamento mantendo suas identidades, proporções funcionais e silhuetas distintas. Ferragens reaproveitadas, chapa oxidada, juntas e poeira devem ser lidas nos volumes; não substituir tudo por uma massa indistinta de sucata. Preservar também a diferença entre o chefe Metrônomo e o inimigo comum Metrônomo Menor.

| Chave visual | Entidade preservada | Seleção e aparência |
|---|---|---|
| `c3_echo` | Tipo `c3_echo` | Eco de Distorção com materiais de C3 e leitura de ameaça próxima. |
| `c3_drone` | Tipo `c3_drone` | Drone de Retorno com corpo/silhueta próprios e metal desgastado; continua com o ataque próximo existente. |
| `c3_metronome` | ID `c3_metronome` | Metrônomo com estrutura mecânica legível, ferrugem e desgaste, preservando leitura das fases. |
| `c3_silence` | ID `c3_silence` | Silêncio com identidade própria do chefe e acabamento de C3; materiais não devem apagar sua presença distinta. |
| `compasso_c3` | Tipo continua `compasso` | Variante visual somente quando essa entidade aparece em área C3. C1 continua usando `compasso`. |
| `abafador_c3` | Tipo continua `abafador` | Variante visual somente em área C3. C2 continua usando `abafador`. |

`compasso_c3` e `abafador_c3` são chaves de asset, não espécies, IDs de instância ou tipos novos de combate. A seleção depende da área de C3, preservando atributos, lógica, nomes, auras e persistência dos tipos originais. São duas pranchas adicionais às 11 identidades do inventário.

Usar energia luminosa com parcimônia: pequenos indicadores funcionais e pontos focais, sem cobrir materiais com neon. **A redução de brilho decorativo não reduz os avisos de ataque**, contraste dos telegráficos, projéteis, aura do Abafador ou sinais de fase. Não alterar mecânicas ou impedir que P1/P2 e áreas de perigo sejam lidos sobre poeira e sucata.

## Contrato V1 — fontes e integração em validação

- Onze identidades e duas variantes visuais de C3; **13 pranchas × quatro poses frontais: repouso, preparação, execução, reação**, total de 52 poses discretas. Sem ciclos ou direções adicionais neste lote.
- Prancha 2×2. Atlas de runtime: célula 256×256, dimensões 512×512, pivô por célula `(128,224)`. O manifesto da produção deve registrar explicitamente qual célula corresponde a cada estado; não inferir a ordem pela aparência.
- Transparência real, recortes sem halos, identidade consistente e pés/ponto de apoio estáveis entre poses. Reação não pode descobrir rosto do Viajante.
- Desenho mantém o ponto de chão da entidade e a escala escolhida para legibilidade junto aos protagonistas. O canvas 256×256 não autoriza um corpo de 256 pixels na tela nem muda colisão.
- Nomes canônicos, IDs de entidades e tipos persistem. A nova camada usa ID para chefes e tipo para comuns; para `compasso` e `abafador`, a área C3 seleciona a variante visual adicional. Não requer migração de save para o estado cosmético.
- Preparação acompanha sinais existentes (`wind`, `windKind`, `tele09`, `echoWarning092`, `retaliate`, etc.). Execução é um sinal cosmético breve ligado à resolução já existente; não executar dano pelo frame da imagem. Reação acompanha impacto/`flash` e deve preservar leitura de preparo e fase.
- Manter telegráficos no chão, projéteis, auras e marcadores funcionais. A aura do Abafador comunica área de bloqueio; a imagem nova não a substitui nem amplia o raio. O ritmo do Metrônomo Menor continua vindo do relógio de combate.
- Respeitar pausa, movimento reduzido e personagens P1/P2. Recuperação `recovery121` dos chefes de C3 e alternância do alvo no coop continuam independentes da pose.
- Morte atualmente remove a entidade e concede recompensa imediatamente em `hitEnemy`. Este lote não cria animação de morte nem adia remoção/recompensa; qualquer efeito futuro de dissolução deve ser cosmético e separado.
- A integração de C3 deve conferir o ramo de `drawEnv` no gerador e o redesenho adicional de chefes no wrapper do runtime, para evitar dois corpos sobrepostos ou sobreposição incorreta ao cenário.

## Ocultação do primeiro chefe e revelação

**Problema confirmado:** base `drawEnv`, linha 504, chama `drawActor({style:'alt',dir:'down'},…,true)` e depois `drawMaskSprite`. `ninja_archer_art_v1.js` intercepta `alt` e desenha o Arqueiro jogável com rosto descoberto/máscara no cinto. A pequena sobreposição não garante ocultação. O gerador já roteia Arauto/Metrônomo/Silêncio para `drawCreature`, mas o primeiro chefe permaneceu no ramo do ator.

Direção final confirmada pela referência visual do autor, inicialmente fornecida em `/Users/henriqueryusartorelliuchiyama/Downloads/image.png` e preservada no caminho indicado no apêndice: **figura corpórea próxima ao Franco Arqueiro renovado**, com jaqueta/figurino vermelho e ouro, calça clara/tan e grande máscara marfim cobrindo integralmente o rosto. A aproximação ao figurino não autoriza revelar feições. Os estudos de mago encapuzado e sombra/massa espectral foram descartados. O acabamento deve renovar a figura da referência, preservando o segredo; a direção de ferrugem/sucata de C3 não substitui esse figurino do primeiro chefe de C1.

Requisitos deste lote:

1. Renderizar ID `boss` como figura corpórea própria baseada na referência do autor: jaqueta/figurino vermelho/ouro, calça clara/tan, grande máscara marfim e rosto totalmente encoberto nas quatro poses e em fallback. Não integrar mago encapuzado ou sombra espectral. Não alterar globalmente `alt`: o Arqueiro recrutado conserva rosto e máscara no cinto.
2. Não mostrar cabelo/rosto identificável ao preparar, executar ou receber impacto; conferir recorte, transparência e todos os limites da célula na escala da arena.
3. Preservar nome **O VIAJANTE MASCARADO**, checkpoint **ANTE-SALA DO VIAJANTE** e falas de `musician` mascaradas. “boss1” não aparece como nova identidade pública ou ID de save.
4. `maskedHelp` em `forest` (17,22) é aparição/evento do mesmo viajante, não inimigo extra. Seu retrato e eventual ilustração permanecem mascarados. `rootInstrument` é prop; a revisão visual deve conferir se imagem/cinema também preservam o segredo, sem presumir que houve vazamento comprovado nesses pixels.
5. `finishBoss` define `flags.boss`, remove o chefe e chama `revealAlt` após as falas. `revealAlt` define `flags.reveal` antes de enfileirar toda a cena de retirada de máscara. Portanto **`flags.reveal` sozinho não é uma indicação segura de qual fala já revelou o rosto**. Preservar retratos de `musician` mascarados; os retratos normais de `alt` pertencem à identificação posterior.
6. O wrapper de retrato Ninja/Arqueiro trata `alt`, não `musician`. Não substituir esse último por retrato descoberto. Verificar também a camada de retratos dos protagonistas integrada à Beta 1.2 para não sobrescrever o mascarado por equivalência de identidade.
7. A versão final de `openParty` inspecionada filtra `alt` por `flags.reveal`; não restaurar cartões antigos com identidade antecipada. Testar Equipe, Jornada, pausa e derrota antes e durante a arena; verificar nomes/retratos, não apenas o corpo do chefe.
8. A troca de arte não modifica HP, fases, tempos, dano, invulnerabilidade, checkpoints, recompensas, save ou o momento narrativo da revelação.

## Verificação e níveis de entrega

| Nível | Estado no momento da redação |
|---|---|
| Inventariado | Sete tipos comuns, quatro chefes, instâncias efetivas, exclusões e sinais de combate levantados estaticamente. |
| Planejado | Onze identidades mais variantes visuais `compasso_c3`/`abafador_c3`: 13 pranchas e 52 poses frontais; seleção, materiais de C3 e ocultação delimitados. |
| Produção | A coordenação informou 13 fontes produzidas. Esse nível não comprova recortes e poses aprovados visualmente. |
| Integrado | A coordenação informou integração nas fontes; build e QA estão em andamento. Render descrito na tabela de arte anterior refere-se à inspeção antes deste lote. |
| Validado estaticamente | Manifesto, dimensões, alfa, pivôs e seleção de estados ainda precisam do registro final específico. |
| Executado | Builds e testes deste lote serão registrados pela coordenação. |
| Testado visualmente/jogando | Não comprovado por este documento. Exige evidências em escala de jogo e revisão das quatro poses por identidade. |

Aceite mínimo: conferir as 11 identidades e as duas variantes visuais, sem colapsar chefes pelo tipo `boss`; observar as quatro poses das 13 pranchas e seu alinhamento; conferir fallback; garantir que telegráfico/aura não sumam; verificar golpe e recuperação sem mudar tempo; testar derrota/recarga e as duas ordens de C3; confirmar que a frase final continua interrompendo o combate corretamente. Verificar Metrônomo Menor em C1 e C3, e Abafador em C2 e C3, demonstrando que só C3 recebe as variantes de ferrugem/sucata. Para o Viajante, registrar corpo corpóreo mascarado, retrato e menus antes da revelação, durante a preparação/ataque/impacto e após o recrutamento, demonstrando que o Arqueiro normal permanece correto. Teste headless de seleção de recorte não equivale a esse aceite visual.

## Referência final do autor para o Viajante

O autor forneceu `design/enemies-v1/referencias-originais/VIAJANTE_REFERENCIA_AUTOR.png`. Essa referência substitui os estudos de mago encapuzado e de massa espectral: a figura é **corpórea**, com figurino vermelho/laranja e dourado próximo ao Arqueiro, calça clara e máscara grande marfim que cobre integralmente o rosto. Renovar o acabamento dessa figura; não substituir por sombra nem inventar grafismos culturais. O rosto não pode aparecer em nenhuma pose anterior à revelação; a arte jogável do Arqueiro continua separada. Os outros três chefes preservam suas identidades dos atlas originais.

## Entrega e evidência

As 13 pranchas e 52 poses foram produzidas, empacotadas e integradas na Beta 1.3. O autor aprovou o estilo sucateado dos chefes; diretor artístico aprovou fontes e capturas integradas, com limites. Validador 122/122, inimigos 8/8, controles 22/22 e jogabilidade 20/20. Fontes, atlas, manifesto e hashes em `assets/enemies/v1/`; capturas e condições dos testes em `qa/enemies-v1/REVISAO.md`. Nenhuma campanha humana ou publicação no Pages é declarada aqui.
