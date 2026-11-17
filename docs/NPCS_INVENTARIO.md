# Inventário de NPCs e aparições narrativas

Levantamento de 17/11/2026 sobre `dab09c8b3679cd9a7a3c6c6e0ae6acd89b74e47d` (Beta 1.1). Esta frente preserva HTML/Canvas/JavaScript, o gerador Ruby, os IDs e a base imutável. Propostas abaixo não constituem assets produzidos nem comportamento integrado.

## Evidência e abrangência

- Base: `game/source/base/TORII_HUTUKARA_1_1_2_TRILHAS.html`. A cópia local consultada foi conferida por `git hash-object`: `7126897f5425bf19aa11dd24ac716bd4ffc7134b`, igual ao blob da base no HEAD. A fonte deve continuar imutável.
- Capítulo 3: `game/source/chapter-03/chapter3_runtime.js`, especialmente `C3.buildMaps`, `C3.applyWorld`, `PB.repairMaps`, `c3NpcPose` e `drawDetailedNPC`.
- Camadas efetivas: `game/source/chapter-03/pacing.js` (`relocateFluteKeepers`) e `healing.js` (lojas/eventos).
- Cânone: `docs/COLABORADORES_CANON.md`; visão: `docs/GAME_DESIGN.md`; arte vigente: `docs/PREBETA_VISUAL_PASS.md`; substituições de texto: `game/source/chapter-03/build_alpha.rb`.
- Coordenadas das tabelas são coordenadas do mundo usadas nas chamadas de criação, não pixels de tela. Posições ajustadas por busca de chão livre são explicitadas.
- Foram inventariadas as chamadas `npc`/`voiceNPC`, remoções posteriores, aparições dos jogáveis e eventos narrativos relacionados. Uma definição antiga removida não é uma aparição ativa. Um arquivo de arte disponível não é prova de NPC integrado.
- Não houve inspeção visual exaustiva dos sprites nem playtest durante este inventário. A referência externa local `CAPITULO_03_ROTEIRO_E_ARTE` não estava disponível no caminho informado; o material versionado foi a referência verificável.

## Contratos de renderização encontrados

| Código | Uso atual e lacuna |
|---|---|
| C1 | `npcCity1_10`: atlas embutido, seis colunas, recorte 56×70, um quadro frontal por NPC. Não há sequência direcional ou de gesto nesse contrato. Fallback em `drawDetailedNPC` legado usa formas e oscilação vertical. |
| C2 | `NPC092`: colunas `celina,nilo,iris,bento,lumi,katana`, quatro linhas direcionais, recortes 56×70. `character092` recebe `n.dir || 'down'`; NPC parado não ganha uma animação de trabalho. Vendedor/guarda não estão nesse índice e usam fallback legado. |
| COL | `assets/prebeta/runtime/collaborators/BELGA_COLLI_MAZZA_3X2.png`: fallback canônico frontal empregado nos IDs legados `bento`/`nilo` no HEAD inspecionado. `BELGA_COLLI_MAZZA_MOVEMENT_8X3.png`: atlas já existente, quatro direções com dois quadros cada, linhas Belga/Colli/Mazza, desenho 56×70 no runtime. Esses quadros não equivalem a novos gestos de trabalho aprovados. |
| DNEY | `assets/prebeta/runtime/collaborators/DNEY_MOVEMENT_PORTRAITS_4X3.png`: desenho no mundo usa direção na coluna e `pose.frame` na linha, 56×70; demais usos da prancha devem respeitar o contrato existente. |
| C3-AMBIENTE | `assets/chapter-03/runtime/personagens/`: `MORADORA_DISTRITO_A_MOVIMENTO_8_FRAMES.png`, `MORADOR_DISTRITO_B_MOVIMENTO_8_FRAMES.png`, `OPERADOR_USINA_MOVIMENTO_8_FRAMES.png`, `TRABALHADORA_CANAL_MOVIMENTO_8_FRAMES.png`. Seleção direcional e dois quadros pelo runtime, desenho 68×82. |
| JOGÁVEL | Sprites próprios de cada variante. `c3_synth_npc`/`c3_percussion_npc` usam `SYNTH_PERCUSSION_RUN_V2_12X2.png` no HEAD; aparições finais Arqueiro/Katana passam por `drawActor`. Não converter todas as variantes num NPC genérico. |

`c3NpcPose` olha para P1 quando a distância é menor que 5.5 unidades e alterna dois quadros por `tick`; isso é orientação/animação cosmética, sem deslocamento físico. O cálculo não é, por si só, prova de que todo fallback C1/C2 utiliza essa direção. Respeitar as opções de movimento reduzido quando ampliar animações.

## Capítulo 1 — Cidade do Eco

Fonte: base, `villageNPCs` (linha 252), montagem de `city` (278), `npcCity1Index10`/render (1044–1045). Os seis são NPCs não recrutáveis, atualmente no mapa `city`.

| ID | Nome canônico | Posição | Função e presença atuais | Sprite/lacuna | Variações propostas, ainda não produzidas |
|---|---|---|---|---|---|
| `ema` | Anciã Ema | 31,24 | Apresenta o viajante; `flags.ema` libera a saída para floresta; reação após `boss`. Objetivo inicial aponta coordenada fixa. | C1 coluna 0; frontal | Escuta, gesto indicando floresta, acolhimento após vitória; manter âncora enquanto for objetivo. |
| `child` | Nina | 16,20 | Sino perdido; `bell` permite entrega, vira `bellReward` e concede fita. | C1 coluna 1; frontal | Procurar ao redor antes; segurar sino/alegria depois. Uma posição alternativa na praça só após concluir missão e validar caminhos. |
| `merchant` | Mercadora | 41,26 | Loja de fitas; `healing.js` substitui `openShop`. | C1 coluna 2; frontal | Organizar caixa, oferecer fita, escutar cliente; manter junto ao comércio. |
| `archivist` | Guardião das Raízes | 12,11 | Pistas de raízes, memória e frequências. | C1 coluna 3; frontal | Consultar registro e apontar raízes; não precisa mudar de lugar para ganhar vida. |
| `street` | Violinista | 26,29 | Continua movendo arco mesmo sem som, por descrição narrativa. | C1 coluna 4; sem gesto animado próprio | Trabalho de arco, breve pausa de escuta; retomada mais confiante após `boss`. |
| `brdg` | Barqueira | 47,32 | Ambientação do canal e pista musical. | C1 coluna 5; frontal | Observar corrente, apoiar remo e virar durante conversa; permanecer em margem acessível. |

## Capítulo 2 — Cidade das Vozes

Fonte: base, `buildVoiceMaps` (645–658), patch `build09` (762), patch `buildPrev092` (841). Os nomes Belga/Colli resultam do remapeamento canônico do gerador/runtime; Bento/Nilo não são novas identidades.

| ID/aparição | Nome canônico | Mapa/posição efetiva | Função e presença atuais | Sprite/lacuna | Variações propostas |
|---|---|---|---|---|---|
| `iris` — praça | Íris · Locutora da Rádio 9 | `voices`, 39,25 | Missão principal: fita, acoplador, relés; reação à vitória. | C2 coluna 2; direção depende de `n.dir` | Conferir transmissão, ouvir, anunciar. Transferência futura para rádio deve preservar o objetivo inicial da praça. |
| `iris` — rádio | Mesma Íris | `radio9`, 7,12 | Mesma função; as duas aparições coexistem no código atual. | C2 coluna 2 | Operar rádio, ouvir retorno; revisar presença contextual antes de propor exclusividade entre mapas. |
| `nilo` | Colli · Colecionador de Fitas | `voices`, 17,17 | Duas fitas opcionais `nilo1/2`; recompensa idempotente `niloReward`. | COL frontal no HEAD; quatro direções já disponíveis no atlas de movimento | Examinar e organizar gravações, agradecer entrega. Primeira entrega usa direção neutra existente; sem novo gesto. |
| `bento` — oficina | Belga · Reparador de Sons | `bento_shop`, 18,8 | Montagem do acoplador; reage a `voicesTape/voicesCoupler`. | COL frontal no HEAD; quatro direções existentes | Trabalho de bancada, mostrar peça pronta, escuta. Primeira entrega usa direção neutra existente. |
| `bento` — rua, removido | Mesmo Belga | Definição antiga `voices`, 17,34 | **Removido** por `buildPrev092`; não criar uma segunda cópia. | Definição histórica C2/COL | Nenhuma aparição nova nesta entrega. |
| `celina` | Dona Celina | `voices`, **6.5,25.5** | `celinaSong` restaura canção. A posição original 10,26 foi substituída por patch. | C2 coluna 0 | Antes: pausa e memória; depois: cantarolar e relaxar. Casa é destino futuro plausível com pista de localização. |
| `lumi` | Lumi · Violinista | `voices`, 32,29 | Minijogo de notas; conclusão `lumiSong`. | C2 coluna 4 | Antes: procurar notas com arco em repouso; depois: tocar com confiança. |
| `voice_vendor` | Vendedor de Discos | `voices`, 31,36 | Ambientação: continua abrindo loja apesar das antenas mudas. | Fora do índice C2; fallback legado | Folhear discos, limpar capa, escutar cliente; manter banca. |
| `voice_guard` | Guarda da Torre | `voices`, 57,10 | Sinaliza bloqueio/abertura por três relés. | Fora do índice C2; fallback legado | Vigília e gesto de passagem após três sinais; não obstruir entrada. |
| `katana` — definição removida | Técnico / Ryuchi Katana | Definição antiga `radio9`, 17,10 | **Removido** por `build09`. Eventos e cenas preservam apresentação/recrutamento. | C2 coluna 5 existe também para jogável | Não restaurar NPC permanente nem antecipar identidade antes da revelação. |

`healing.js` acrescenta `tape_shop_colli` em `tape_market`: é evento de banca, com posição encontrada por `freeSpot` a partir de 8,8, não uma segunda instância humana do Colli. `shopCounter`, `techBench`, `radioReceiver` e a gravação na casa de Celina também são eventos/objetos, não pessoas adicionais.

## Capítulo 3 — Colaboradores e moradores

Fonte: `chapter3_runtime.js`, `C3.buildMaps` (173–238), presença em `C3.applyWorld` (240), funções de conversa (273–300), desenho (378–380). Os colaboradores abaixo são narrativos, não combatentes recrutáveis.

| ID | Nome canônico | Mapa/posição de origem | Função e presença atuais | Sprite/lacuna | Variações propostas |
|---|---|---|---|---|---|
| `c3_maia` | Belga · Contratempo | `contratempo`, 8,9 | Acolhe, abre escolha de rotas, comenta retornos e frase. | COL movimento, linha Belga; dois quadros/direção | Acolher, escutar cidade, indicar palco; manter acesso à escolha. |
| `c3_vega` | Dney · Imagem e Ressonância | `contratempo`, 18,8 | Imagem, missão da fita, escolha de trecho e frase. | DNEY direcional; não há gesto de trabalho próprio confirmado | Ajustar projeção, enquadrar banda, mostrar trecho escolhido; sem impor caminhada. |
| `c3_ciro` | Mazza · Oficina de Frequências | `ciro_workshop`, 7,13 | Construção da Flauta; traslado temporário ao clube por `pacing.js`. | COL movimento, linha Mazza | Trabalho de bancada, testar/entregar instrumento, escutar. Aproveitar traslado existente. |
| `c3_nara_canal` | Colli · Cartógrafo Sonoro | `sky_canal`, 30,17 | Presente antes de `canalDone`; depois removido. | COL movimento, linha Colli | Marcar corrente e apontar passagem; manter posição durante combate. |
| `c3_nara` | Mesmo Colli | `ciro_workshop`, 18,12 | Presente após `canalDone`; traslado temporário ao clube por `pacing.js`. | COL movimento, mesma identidade de `c3_nara_canal` | Conferir mapa com Mazza e mostrar borda segura. Não criar outro personagem por ID legado. |
| `c3_resident` | Moradora do Distrito | `distortion_district`, 42,18 | Missão `smallLight`, recompensa e mudança de fachada. | C3-AMBIENTE moradora | Antes: observar janela/luz; depois: alívio e atenção à rua. |
| `c3_resident_b` | Morador do Distrito | `distortion_district`, 47,31 | Fala sobre Contratempo e elevador. | C3-AMBIENTE morador | Escutar clube, observar rua; posição futura junto ao elevador após `liftOpen` exige colisão e acesso verificados. |
| `c3_plant_operator` | Operador da Usina | `power_plant`, 8,18 | Pistas da trava, pressão e ciclo; reage a `usinaGate/usinaDone`. | C3-AMBIENTE operador | Atento ao equipamento antes; verificar mecanismo parado e relaxar depois. |
| `c3_canal_worker` | Trabalhadora do Canal | `sky_canal`, 38,17 | Pistas da ponte/combate, comporta e resgate; pode concluir Canal. | C3-AMBIENTE trabalhadora | Sinalizar passagem, conferir comporta, acenar após resgate. |

`c3_belga_counter` em `healing.js` é evento de balcão encontrado por `freeSpot` a partir de 21,11, não outro Belga. `sprite_dimas`/`DIMAS_MOVIMENTO_8_FRAMES.png` existem no pacote, mas não há criação de NPC Dimas em `C3.buildMaps`; não tratá-lo como integrante ativo do elenco.

## Aparições dos personagens jogáveis e vozes narrativas

| ID/tipo | Identidade | Mapa/posição | Presença e classificação |
|---|---|---|---|
| `maskedHelp` — evento | Músico Mascarado / Franco Arqueiro | `forest`, 17,22 | Apresentação e Baixo de Raiz; interação é ignorada após `flags.bass`. Não é uma nova identidade; `rootInstrument` é prop. |
| cena/chefe `boss` | Mesmo Franco Arqueiro sob influência do Silêncio | `ruins`, arena/cena | Revelação e recrutamento por `revealAlt`; não é NPC de aldeia. Preservar máscara no cinto e identidade atual de arte nas aparições posteriores. |
| `techBench`/cenas | Técnico / Ryuchi Katana | `radio9`, evento 13,10; narrativa posterior na torre | Apresentação e recrutamento, separados da antiga definição NPC removida. Não criar outro técnico nem pôr máscara no rosto do Ninja atual por regra genérica. |
| `c3_synth_npc` | Franco Sintetizador | `power_plant`, 32,9 | Aparição pré-recrutamento; removido após `synthUnlocked`. Usa JOGÁVEL. Proposta: atento ao sequenciador, escuta e alívio após interrupção, sem antecipar recrutamento. |
| `c3_percussion_npc` | Ryuchi Percussionista | `sky_canal`, 34,14 | Aparição pré-recrutamento; removido após `percussionUnlocked`. Usa JOGÁVEL. Proposta: segurar pulso, respirar e escutar após resgate. |
| `c3_alt_final` | Franco Arqueiro | `last_torii`, 7,11 | Conversa final `C3_021`; usa `drawActor(style:'alt')`. Proposta: contemplação/escuta, sem ocultar passagem. |
| `c3_katana_final` | Ryuchi Katana | `last_torii`, 19,11 | Conversa final `C3_022`; usa `drawActor(style:'katana')`. Proposta: atenção/acolhimento, sem novo recrutamento. |
| `franco` / `ryuchi` e formação | Protagonistas principais e variantes | Equipe/cenas ao longo dos três capítulos | Seis jogáveis no total; seguidores e falas não são NPCs extras a cadastrar por ocorrência. |
| `echo`, `voice`, narrador | Eco/voz desconhecida/narração | Árvore, memórias e cenas | Presenças narrativas sem corpo humano independente confirmado. Não atribuir silhueta humana nova. |
| O Silêncio, Arauto da Estática, O Metrônomo | Antagonistas/chefes | Arenas e cenas próprias | Sistemas de combate e narrativa, fora do lote de NPCs humanos; não transformar em moradores ou recrutas. |

Hutukara é um único universo e também um ser; Torii são as máscaras. Nenhuma voz de evento ou nome de mapa autoriza multiplicar Hutukara ou inventar pessoas adicionais.

## Localização contextual já integrada

Pose/orientação muda desenho no mesmo ponto. Localização muda a posição física ou o mapa e exige validação adicional. O HEAD já contém:

1. Colli sai do Canal para a oficina quando `canalDone`; `C3.applyWorld` remove `c3_nara_canal` e cria `c3_nara` na oficina.
2. Com `usinaDone && canalDone && !windFlute`, `pacing.js` leva Mazza e Colli da oficina ao Contratempo. Âncoras nominais: Mazza 18,12 e Colli 10,11. `freeSpot` pode ajustar o ponto; não apresentar as âncoras como resultado final garantido.
3. No clube, ambos acionam `C3.getFlute`; o objetivo aponta para eles no Contratempo.
4. Obtida a Flauta, voltam à oficina quando o jogador sai do clube. A posição/função anterior é guardada em `homes` na camada de pacing.
5. Sintetizador/Percussionista deixam sua aparição de mapa após os respectivos recrutamentos.

Essas regras são implementação observada, sem playtest novo. A relação entre reconstrução de `c3_nara` por `C3.applyWorld` e os objetos/`homes` conservados por `relocateFluteKeepers` precisa ser testada em recarga e retomada de checkpoint antes de ampliar deslocamentos. A duplicação atual de Íris entre praça e rádio também deve constar da decisão futura de presença, sem correção silenciosa neste lote.

## Primeira entrega delimitada

Escopo decidido pela coordenação: Belga (`spriteKey:'bento'`) e Colli (`spriteKey:'nilo'`) nos capítulos anteriores passam a usar o **quadro neutro direcional já existente** do atlas canônico de movimento, com quadro 0. A direção vem do `c3NpcPose` já existente. Preservar fallback frontal se o atlas de movimento estiver indisponível.

- Não requer geração de frames inéditos, alteração de IDs, saves, mapas ou localizações.
- Não muda as aparições/seleção de quadros do Capítulo 3.
- A decisão de mirar interlocutor acompanha a autoridade atual de P1; não introduzir alvo concorrente P2 neste ajuste.
- Pausa, diálogo e alternativas de movimento reduzido devem continuar legíveis; quadro neutro evita inserir uma marcha no lugar.
- Implementação fica em fonte aditiva, com gerador responsável pela inclusão; nunca editar só a build ou a base.

## Aceite e estado de entrega

| Nível | Situação deste inventário |
|---|---|
| Inventariado | Elenco, aparições removidas, variantes, eventos relacionados, sprites selecionados e localizações existentes descritos por inspeção estática no SHA acima. |
| Planejado | Variações por personalidade e primeira entrega direcional delimitadas. Gestos e destinos futuros são propostas. |
| Produzido | Este documento. Nenhum sprite novo produzido neste levantamento. |
| Integrado | Piloto direcional de Belga/Colli integrado na fonte. Build e evidências da revisão em `qa/npcs/REVISAO_2026_11_17.md`. Demais propostas seguem planejadas. |
| Testado visualmente | Piloto observado em oito capturas dos mapas reais, com limites descritos no relatório QA. Não houve nova campanha ou playtest humano. O restante do elenco não recebeu teste visual nesta entrega. |

Para a primeira entrega: conferir Belga na oficina e Colli na praça dos quatro lados, perto e longe; validar fallback com atlas ausente; comparar Belga/Colli/Mazza no C3 para garantir preservação; registrar build e capturas em escala de jogo. Teste automático de seleção de recorte é evidência funcional, não substitui a revisão visual.

Antes de qualquer nova localização: validar chão e corpo, raio de interação, caminhos de chegada/saída, eventos vizinhos, câmera, P1/P2, objetivo/mapa, exclusividade da presença e acessibilidade. Estado deriva de flags concluídas; nunca de número de cliques ou posição aleatória. Salvar/recarregar, reconstruir mapas, pausar, morrer e retomar checkpoint devem manter a mesma situação narrativa. Ambas as ordens Usina→Canal e Canal→Usina preservam introduções, recompensas e conteúdo. Não persistir relógio cosmético nem fazer NPC necessário desaparecer.
