## [Beta 1.12.0] — 2026-11-21

- Fenda das Ressonâncias com curva gradual para a meta de15–20min, cinco perfis, novas famílias progressivas e ressonante a cada cinco ondas. Limites de6/7inimigos vivos e crescimento moderado de HP; tempos dos golpes preservados.
- Surgimentos avisados por0,95s, dentro da câmera e afastados de ambos os jogadores, com revalidação antes de nascer.
- Pontos por família, ritmo por sequência sem KO e bônus por onda sem dano real; nenhum bônus de velocidade. Placar solo/coop separado, histórico antigo preservado e classificação coop irreversível após participação do P2.
- Recursos temporários, descanso4/8s e recuperação por marco. Save retoma HP, fitas, energia, ritmo, tempo e pontuação juntos; mochila da campanha volta na saída.
- HUD mobile com onda/pontos/ritmo nas duas orientações e botão de próxima onda44px. Desconexão ajusta fila futura sem remover inimigos vivos. Saída reposicionada para impedir encerramento acidental ao confirmar entrada nos dois controles.
- Preserva os três destinos de capítulos, combate após import/reload, recuperação de saves, arte e colisões da1.11. Não introduz iluminação. [Regras e limites](design/chapter-03/POS_JOGO_E_FENDA.md); evidências em `qa/dungeon-v2/`.

## [Beta 1.10.0] — 2026-11-20

- Oito fachadas C1/C2 em perspectiva com telhado e lateral visíveis, soleiras alinhadas às entradas e sombras de contato; C3 preserva as fachadas de sucata aprovadas. Ordenação pela base e transparência diante dos jogadores.
- Treze interiores com materiais, zoneamento e paredes próprios, preservando texturas autorais, móveis, interações e rotas.
- Luz ambiente por sala e fontes locais, sem escurecer HUD; atmosfera sépia e partículas de areia no exterior do C3. Copas se movem ao vento com raízes/troncos firmes e opção de efeitos suaves.
- Elevador do Céu como portal para as nuvens acima do mesmo mundo desértico. Novo fundo cinematográfico e narrativa; nuvens marfim/rosa com sombra lavanda restauradas no Mar de Nuvens.
- Passagens com oito sprites de reconstrução e apoio físico gradual. Ação musical persistida sem duplicar recompensa; saves parciais restauram o caminho seguro.
- Sair da nuvem caminhando ou rolando inicia queda com redução/descida do personagem e derrota pelo checkpoint. P2 participa da regra; sincronização não o resgata na borda. Pausa, retry, export e transições tratados.
- Fontes, prompts do ImageGen integrado, atlas e exportadores preservados. [Contrato e evidências](docs/AMBIENTES_MUNDO_VIVO_V1.md).

## [Beta 1.9.0] — 2026-11-20

- Último Torii escolhe até dois aliados desbloqueados fora da formação atual e do P2. Sprites e falas acompanham a seleção; trocar a equipe também atualiza a sala.
- Cenas finais permanecem em Hutukara, sem retorno automático ao estúdio. M, MAPA e menu liberam viagens entre os cenários depois de zerar.
- Fenda das Ressonâncias: composição e posição dos inimigos por semente, ondas progressivas, até oito inimigos vivos, pontuação por eliminação/onda, recuperação entre ondas e recorde local ao save.
- Derrota e saída registram o resultado e retornam ao Torii; nova tentativa inicia outra expedição. Save/exportação retomam o início da onda sem duplicar pontos parciais. Não conceder XP ou fragmentos permanentes no calabouço.
- Preserva schema13, campanha, coop e todas as melhorias da Beta1.8. [Especificação e limites](design/chapter-03/POS_JOGO_E_FENDA.md); evidências em `qa/postgame/`.

## [Beta1.8.0] — 2026-11-20

- Planta do estúdio com vaso próprio; sofá vertical junto ao tapete, com colisão e contato com o chão ajustados. Carregamento recupera saves antigos que estavam no novo espaço ocupado.
- 64 quadros novos de corrida para Franco/Ryuchi:12poses por direção e máscara, fase contínua e ciclo520ms; cópiasV5 preservadas.
- Fundos dos diálogos recuperados das fontes originais, novo panorama da floresta e remoção do escurecimento duplicado; deserto preservado.
- NPCs com estados de atenção/trabalho/gesto e pequenos percursos seguros quando há arte de marcha.24gestos novos para seis moradoresC1; Belga fora da bancada, sem alterar suas interações.
- Testes de geometria, ciclo30/60/120Hz, pausa/load/coop, fontes de cinema e callbacks tardios. Evidências finais e limites em `qa/beta-1.8.0/` e [documentação](docs/REVISAO_MUNDO_VIVO_1_8.md).

## [Beta 1.7.1] — 2026-11-20

- Corrige quadros pulados em attack_1/2/3 de Franco Sintetizador e Ryuchi Percussionista, nas duas máscaras e em P1/P2. Cursor avança somente após desenho real e preserva poses intermediárias em picos de frame time.
- Decodificação antecipada dos atlas essenciais; conclusão visual de ataque já exibido limitada a100ms de simulação ativa, interrompida por novas ações, dano, esquiva ou movimento. Nenhuma espera para input e nenhum novo golpe após término do prazo.
- 72 cenários de ataque aprovados (antes50/72);111 verificações focadas;208 sequências/48 transições preservadas. RAF nativo com carregamento150ms e travada180ms mostra as oito poses em4/4 combinações de personagem/máscara.
- Preserva os efeitos de chão dos chefes da1.7, a arte e os tempos de combate. Evidências em qa/beta-1.7.1/.

## [Beta 1.7.0] — 2026-11-18

- Quatro sequências de oito sprites animados para os golpes no chão: onda âmbar do Viajante, interferência elétrica do Arauto, poeira/sucata do Metrônomo e vórtice oxidado do Silêncio.
- Preparação, impacto disparado pelo evento real e dissipação de textura por até 0,45 s. Recorte nas áreas reais, incluindo centros seguros; atores sobre o FX e contornos legíveis.
- Estado cosmético separado, pausa e cancelamentos, movimento reduzido, carregamento inicial sem bloqueio e limite de 128 carimbos por passagem.
- Fontes PNG, atlas RGBA, prompts completos do ImageGen integrado, manifesto e exportação por células inteiras versionados.
- Composição 1.6.1 + FX publicada e verificada: 138 verificações estáticas, 14 testes unitários de FX, seis verificações de FX no navegador e regressões de coreografia, personagens, cenários, controles, gameplay e site aprovadas. [Evidências e limites](qa/boss-ground-fx-v1/PLAYTEST.md).

## [Beta 1.6.1] — 2026-11-18

- Revisão das 208 sequências dos músicos com/sem máscara: máscaras abertas atrás restauradas em 143 quadros, com corpos e pixels fora da cabeça preservados. Nove poses de rolamento com a cabeça oculta mantidas após revisão.
- Dano recebido aparece sem atraso durante a esquiva; ações interrompidas não reaparecem depois dela.
- Pausa mantém estado, quadro e direção; caminhada/corrida preservam fase e cadência.
- Entrada e troca de máscara antecipam somente os atlas essenciais, com cache limitado a oito imagens e sem alterar input, dano, cooldowns ou saves.
- QA percorre os oito quadros pelo controlador e renderer reais a 60 Hz em todas as 208 sequências, mais 48 transições. Auditoria encadeada mantém o histórico da paleta e comprova zero alterações fora das regiões corrigidas.


## [Beta 1.6] — 2026-11-17

- Onze áreas do C3 com cenários desérticos pós-apocalípticos cyberpunk: 13 atlas, 131 recortes/estados e dois fundos de diálogo.
- Fachadas, mobiliário, palco, elevador, máquinas, comportas, condensação, âncoras e olhos/altar com variantes contextuais e pares de escala/base comuns.
- Preservados os mapas, 43 gates, missões, saves, músicas, combate, controles e seis personagens. Incorpora os músicos1.3 e todos os novos inimigos/chefes1.5.
- Cache de cinema contextual e callbacks tardios protegidos. Exportador valida o roundtrip por SHA-256 sequencial; gerador libera cópias redundantes de URIs para reduzir memória.
- Evidências e limites em `qa/cenarios-deserto-v1/`; sem nova campanha manual ou teste em controles/celulares físicos.


## Beta 1.5 · ataques animados dos chefes

- Cinco sequências de oito quadros desenhados para os quatro chefes, preservando as identidades aprovadas.
- Sprites próprios de todos os inimigos: 11 identidades, 13 atlas e 52 poses estáticas; Viajante com o rosto inteiramente coberto pela máscara autoral.
- Preparação, disparo real e recuperação sincronizados; investida instantânea mantém seu percurso e dano originais.
- Áreas completas com contagem musical, limites corretos, bandas das duas ondas e guias de projéteis.
- Estado cosmético separado, pausa/load/retry/final e movimento reduzido; regressões geométricas e no navegador.
- Integra os músicos e a paleta canônica da main, além dos sprites próprios dos inimigos.

## [Beta 1.3] — 2026-11-17

- Ryuchi Percussionista e Franco Sintetizador com 52 atlas de animação no padrão chibi aprovado, variantes com e sem máscara em folhas separadas, 208 sequências em quatro direções, 1.664 poses e 32 retratos de expressão.
- Sprites conectados ao render dos integrantes jogáveis, aos encontros de recrutamento, ao menu de equipe e aos diálogos. Ações aceitas determinam as poses; os registros de P1 e P2 permanecem independentes.
- Oito poses de rolamento acompanhando a esquiva existente; escala uniforme, transparência e pivô comum. Gameplay, colisões, cooldowns, dano e saves permanecem preservados.
- Variante sem máscara mantém a apresentação padrão dos músicos; ambas as versões ficam disponíveis na prévia e no seletor interno de arte.
- Folhas-fonte, manifesto e ferramentas preservados no GitHub. Resultados de validação desta entrega em `qa/beta-1.3.0/`.

- Paleta de vestuário e instrumentos adaptada a terra/sucata e promovida como identidade canônica dos dois músicos, substituindo a anterior por autorização do autor. Frames, geometria, alpha, pele e máscara preservados por auditoria; sem filtro global, novos frames ou mudança de gameplay.
- Integração mantém Protagonistas V5, Ninja/Arqueiro, Cenários V2 e verificações de publicação atuais; receita de cores e auditoria acompanham a entrega.

# Beta 1.2 · Protagonistas V5

- Franco e Ryuchi principais: 192 sequências V5, quatro direções e versões com/sem máscara.
- Retratos V5 nos diálogos e equipe; aquisição das máscaras respeita o save existente.
- Estados de ação independentes por jogador, sem mudar dano, cooldown, invulnerabilidade ou colisão.
- Build incorpora os 24 atlas e 32 retratos; exportação web preserva os mesmos pixels.
- QA automatizado de integração, máscaras, dano, controles e coop; evidências em `qa/beta-1.2.0/`.

# Histórico de versões

## Direção do Capítulo 3 — 2026-11-17

- Autor redefine o C3 para deserto pós-apocalíptico cyberpunk, areia/ferrugem/tons terrosos e tecnologia reaproveitada.
- Coordenação, direção artística, arte, arquitetura e game design consolidam matriz das onze áreas, paleta e contrato de produção.
- Frentes de cenários, NPCs e músicos alinhadas; preservados capítulos 1/2, personagens, geometria, saves e progressão.
- Atualizados visão do jogo e avisos nos guias históricos. As variantes do novo visual permanecem em produção; este registro não declara integração de arte ou mudança de runtime.


Todas as alterações relevantes do projeto são registradas aqui.

## [Beta 1.2] — 2026-11-17

- Revisão dos 25 mapas com direção artística, game design e coordenação. Inventário de baseline: 81 tipos e 1.031 instâncias de props; preservados os bons sprites de casas, árvores e mobiliário.
- Cenários V2: 12 folhas e 126 recortes/estados PNG RGBA. Materiais de chão sem arquitetura embutida, guias e travessias, três moradias complementares, móveis do Contratempo, mecanismos de Usina/Canal/Nuvens, placas, núcleo final e objetivos/interiores dos capítulos anteriores.
- Nuvens construídas com topo contínuo e bordas contextuais. Terminal/Elevador usam piso metálico; retirados os painéis de conceito e elipses gigantes usados como chão/volume. Núcleo com basalto discreto, olhos e altar separados por alpha; círculo de ressonância desenhado antes dos atores.
- Placas junto às fachadas com nomes renderizados pelo jogo, entradas do Clube/Oficina/Usina alinhadas às portas e seis coordenadas de entrada/retorno ajustadas e barreira da Usina representada enquanto os tiles estão bloqueados. Máquinas, válvulas, comportas e beacons reagem às flags de suas áreas.
- Fechado o anel caminhável excedente do Mar de Nuvens. Saves anteriores sobre essa faixa são recuperados no ponto válido mais próximo conectado à entrada, sem mudar suas relíquias ou progresso.
- Gravadores, lâmpadas, raízes, cristais, sino, poço, janelas e quadros recebem sprites detalhados; pedestal das máscaras permanece vazio após a aquisição. `rootGate` dos Telhados usa `fogCleared11`, sem herdar a flag do Capítulo 1.
- Código, atlas, manifestos, exportadores e evidências selecionadas no GitHub; fontes, PNGs individuais, capturas completas e ZIP no Dropbox/T&H. Testes de input podem usar a exportação hospedada via `TORII_BUILD_URL`, preservando a checagem de hash do HTML portátil.

## Correções do PR #8 integradas na Beta 1.2 — 2026-11-17

- Integra as correções do prólogo, Distrito, XP, recrutamento, saves, colisões, patrulhas, coop e diálogo mobile com Ninja/Arqueiro e os protagonistas V5 da Beta 1.2.
- Preserva as animações e retratos publicados e o schema 13 de save.
- Regressão de integração de arte adicionada à validação dos PRs e da publicação.
- Resultados da build integrada em `qa/beta-1.2.0/PLAYTEST.md`.

## [Beta 1.1] — 2026-11-17

- Ryuchi Ninja e Franco Arqueiro com 24 atlas de alta resolução e 96 sequências em quatro direções: espera, caminhada, corrida, rolamento, três ataques, técnicas, especial, dano e derrota. São 864 PNGs de animação e 16 retratos no pacote de backup.
- Ninja sem máscara; Arqueiro com a máscara canônica presa ao lado direito do cinto, acompanhando o corpo nas ações.
- Sprites integrados ao jogo, aos retratos de diálogo e ao menu de equipe. Animações de combate pertencem a P1 ou P2 e são descartadas ao trocar personagem, área ou save. Ações recusadas não reiniciam o sprite.
- Escala uniforme e pivô no chão; oito poses para o rolamento, sincronizadas à duração já existente, sem girar a imagem por código. Cache limitado a oito atlas decodificados.
- Combate, colisões e schema de save preservados. Os quatro outros personagens mantêm o render anterior; seus pacotes de arte são trabalhos separados.
- GitHub armazena atlas, retratos, ferramentas, documentação e testes. Dropbox/T&H guarda originais, quadros individuais, ZIP e prévias. O Drive foi excluído do escopo pelo autor.

## [Não lançado · Beta 1.3 · inimigos] — 2026-11-17

- Sprites próprios para sete inimigos comuns e quatro chefes, com poses discretas de repouso, preparação, execução e reação. Não são ciclos de caminhada ou animação de morte.
- Viajante Mascarado corpóreo renovado a partir da captura do autor: máscara integral e figurino próximo ao Arqueiro, sem reaproveitar o ator jogável ampliado. Arte do Arqueiro recrutado preservada.
- Direção do Capítulo 3: ferrugem, sucata cibernética e materiais empoeirados; silhuetas originais dos chefes preservadas. Variantes de Metrônomo Menor/Abafador selecionadas por capítulo.
- Aura, telegráficos, dano, colisões, recompensas e schema 13 de save preservados. Poses cosméticas não controlam eventos de dano.
- Inventário, fontes, prompts e evidências em `docs/INIMIGOS_SPRITES_V1.md`, `design/enemies-v1/`, `assets/enemies/v1/` e `qa/enemies-v1/`.


## [Não lançado]

### NPCs · recorrência direcional · 17/11/2026

- Belga (`bento`) e Colli (`nilo`) usam as quatro direções do atlas canônico nas aparições anteriores ao Capítulo 3, com pose neutra e atenção ao jogador próximo. Sem novos PNGs ou mudança de coordenadas, IDs e saves. Mantido o corpo frontal como fallback durante carregamento.
- Inventário de NPCs e proposta por contexto em `docs/NPCS_INVENTARIO.md`; regressão do seletor em `qa/npc_recurrence.cjs`.

### Arte dos protagonistas V5 · 17/11/2026

- 24 atlas, 32 retratos e 192 sequências de Franco e Ryuchi principais, com e sem máscara, nas quatro direções. Inclui locomoção, rolamento, combo, técnicas, especial, dano e derrota.
- Dimensões, transparência, margens, correspondência entre atlas e frames e fechamento verificados. Prévia offline com pausa e avanço de quadros.
- GitHub mantém os atlas e as ferramentas; Dropbox guarda originais, 1.728 PNGs individuais, ZIP e prévias. Exportador reconstrói os frames a partir dos atlas, evitando duplicação no Git.
- A integração desses sprites à build jogável é uma etapa separada.

## [Beta 1.0.1] — 2026-11-17

Correções preparadas no PR #8 e integradas junto às novas artes na Beta 1.2.

- Removido o encontro prematuro do corredor. Ameaças e ações de combate dependem da obtenção do Baixo de Raiz; a chegada à floresta permanece segura até a entrega.
- Distrito da Distorção cadastrado em todos os caminhos de combate, permitindo responder às patrulhas com os seis integrantes e em coop.
- XP ativo e de reserva unificado nos três capítulos. Saves preservam a experiência de todos os integrantes; compensação de aliados ocorre no recrutamento/migração, uma vez.
- Colocação de pads e atração do sintetizador respeitam obstáculos e o corpo dos inimigos.
- Cooldown das patrulhas salvo na partida, sem herdar o relógio de outra jornada nem reiniciar a cada load.
- Ataques dos três inimigos musicais resolvidos para P1/P2; aura do Abafador bloqueia as técnicas de quem está dentro dela.
- Share/Create cura o integrante do controle que acionou a fita; consumo simultâneo usa o inventário compartilhado com cooldown por integrante.
- Diálogo, menus e desafio musical mobile saem do contexto de empilhamento do frame e ficam acima do deck. Alvo de cura com altura mínima de 44 px.
- Regressões de jogabilidade adicionadas aos PRs e à publicação. Esperas de rotação usam polling temporal porque o simulador desliga requestAnimationFrame.
- Lista oficial de arte restante e proposta de inimigos em docs/DIRECAO_ARTE_E_INIMIGOS.md. Biblioteca V5 preservada; integração e novos inimigos continuam no ciclo de produção de arte.

## [Beta 1.0] — 2026-11-14

- Primeira Beta. Versão definida em `game/VERSION.json` (o número deixa de ficar espalhado pelos scripts); a chave de save não muda.
- Corrigido: salvar e recarregar no Capítulo 1 congelava a formação em Franco e Ryuchi; quem entrava depois ficava de fora e o Arauto virava uma parede com 2 integrantes. Agora quem entra no grupo ocupa uma vaga livre, e saves já afetados são consertados ao carregar.
- Corrigido: se o integrante ativo não fazia parte da formação, os golpes não causavam dano e a luta nunca terminava.
- Acessibilidade: opção "Texto maior" no menu Sistema (lembrada no aparelho), ao lado de "Efeitos suaves".
- Auditoria de Beta: jornada completa nas duas ordens do Capítulo 3 e com recargas da página no meio, sem travamentos, perdas de save ou derrotas.
- Teste de controles estabilizado: a verificação de mira do Silêncio em coop fixa o modo sem variação.


### Correções do playtest do autor

- Site mais leve no celular, sem mudar nenhum pixel: HTML de 5,0 → 0,5 MB e jogo pronto para começar em 0,7 s (antes 4,4 s) num 4G simulado; artes do início carregadas em 15 s (antes 28 s). As artes exclusivas do Capítulo 3 carregam em segundo plano depois do resto (ou na hora, se o Capítulo 3 for iniciado direto).
- Corrigido: a faixa "Walk Talk Twin" (luta contra o Arauto) nunca tocava. O gerador trocava "NILO" por "COLLI" também dentro dos dados da música e a corrompia; agora os nomes só são trocados no texto. A faixa toca e sai do HTML do site (4,5 MB a menos).
- Viajante (Cap. 1) levemente mais difícil: +33% de vida e +20% de dano nos ataques.

- Fim do Capítulo 2 → Capítulo 3 contínuo: o cartão "Capítulo 02 concluído" segue sozinho para o Capítulo 3 em 5 segundos (ou na hora, pelo botão). Sai a opção "explorar antes de partir", que deixava o jogador procurando o ponto de passagem na torre. Saves antigos parados nesse ponto seguem direto ao continuar.
- Corrigido diálogo preso na tela (ex.: fala do Belga depois do Metrônomo): apertar J, M ou I durante uma fala abria o menu por cima e, ao fechar, a caixa não respondia mais. Agora esses atalhos não abrem menus durante falas, e qualquer menu aberto por cima devolve o controle à fala ao fechar.

### Fase 3 (parte 2) — padrões de chefe e inimigos musicais

- Chefes com padrão por fase + 20% de variação (RNG), nunca 3 ataques iguais seguidos e nome de cada ataque na tela. Viajante deixa de ser sorteio puro; Arauto ganha variação e aviso um pouco mais longo; Metrônomo varia só na fase 3; O Silêncio ganha 15% de variação.
- Três inimigos novos: Metrônomo Menor (ataca no compasso fixo), Eco Espelho (devolve onda após 2 golpes) e Abafador (aura que bloqueia técnicas). Um aviso explica cada um na primeira vez.
- Laboratório de combate (`qa/combat_lab.cjs`) e relatório em `docs/COMBATE_PADROES.md`.

### Fases 3 e 4 (parte 1) — mais ação, menos idas e voltas, cura

- 14 encontros novos no caminho principal; o primeiro combate acontece no corredor do estúdio (190 s → 40 s no perfil típico).
- Duas patrulhas de ecos menores no Distrito da Distorção, ativas depois da primeira frente concluída; voltam a cada nova passagem, mas não depois de uma derrota.
- Capítulo 3: Mazza e Colli levam a Flauta dos Ventos ao Contratempo; a ida à oficina deixa de ser obrigatória.
- Fitas de cura passam a funcionar (antes eram compradas e ganhas, mas não havia como usar): R, Share/Create ou botão ♥ FITA; recuperam 40% da vida do integrante ativo.
- Mercadores com fitas nos três capítulos: Mercadora (Cap. 1), banca do Colli no Mercado das Fitas (Cap. 2) e balcão do Belga no Contratempo (Cap. 3).
- Três gravadores novos no Capítulo 3 (Distrito e Mar de Nuvens) que curam a equipe e salvam o ponto.
- Ao concluir cada etapa grande do Capítulo 3, quem caiu volta com 30% da vida. Cada capítulo novo começa com a equipe recuperada.
- Corrigido (bug antigo da 1.0): o jogo podia travar quando um projétil derrotava o último inimigo da luta.
- Jogada automática: 0 derrotas e nenhum travamento nos dois perfis; maior trecho sem lutar 4,3 → 2,1 min.

### Fase 5 — cortes de diálogo

- 225 → 139 falas obrigatórias, preservando estúdio e chegada ao Hutukara, máscaras, revelação do mascarado, encontro das versões, plot twist e final. Edições em `design/dialogo/EDICOES_DIALOGO.json`, aplicadas por `dialogue_edits.js`.
- Avisos de sistema (itens, retransmissores, novo aliado, ressonância) viram notificação rápida, sem travar o jogo.
- Capítulo 2: a Íris explica tudo de uma vez e o Belga entrega o acoplador; a parada obrigatória na Rádio 9 deixa de existir (saves antigos são ajustados).
- Belga, Colli, Mazza e Dney com mais presença: Dney conduz a cena do Contratempo e Mazza ganha falas próprias.
- Final: 3 falas novas com o gancho dos mundos dentro do Hutukara e das próximas sessões (aprovadas pelo autor).
- Corrigido: cena do Canal repetia inteira ao falar de novo com Colli ou com o Percussionista; cenas automáticas se repetiam depois de uma derrota; nomes "BENTO" e "NARA" no lugar de BELGA e COLLI; duas aberturas contraditórias na revelação do mascarado; mesma fala nas duas pedras; fala do Mazza respondendo a uma fala cortada.
- Corrigido no medidor de ritmo: o início do teste do Capítulo 3 não era registrado.
- Jornada típica medida: 27,5 → 20,3 min.

### Fase 1 — medição de ritmo

- Medidor de ritmo (`game/source/telemetry/pace_meter.js`): tempo andando, lendo, lutando e em menus por área e por etapa, guardado só no aparelho. Com `?ritmo` no endereço aparece o botão RITMO para baixar o relatório.
- Jogada automática (`qa/pace_bot.cjs`) que zera o jogo seguindo os objetivos, com perfis rápido e típico.
- Resultado em `docs/RITMO_FASE1.md`: 73% do tempo lendo, 9% em combate, 225 falas obrigatórias, Capítulo 3 com metade do tempo e 109 falas.
- Corrigido: falas do Franco Sintetizador, do Ryuchi Percussionista e do Metrônomo apareciam como SYNTH, PERCUSSION e METRONOME e com retrato errado.

### Fase 0 — licença e identificação

- Projeto licenciado como código aberto: código em MIT (`LICENSE`), materiais abertos em CC BY 4.0 e materiais protegidos em CC BY-NC-ND 4.0 (`LICENSE-ASSETS.md`). Protegidos: Ryuchi e Franco, The Sir em todas as versões, máscaras Torii, músicas e participantes do álbum.
- README e `docs/ASSET_PROVENANCE.md` atualizados com as licenças, as autorizações e o crédito ao Suno.
- Repositório limpo: builds Alpha 1.0 a 1.2.3 (~700 MB) saíram da árvore e ficam no histórico do git, nas tags `alpha-*` e no branch `claude/arquivo-builds-ate-1.2.4`. Removidos também dois HTMLs de outros projetos em `design/chapter-03/` (*Assim que as Flores Crescem* e o painel IKIRU) e `docs/SHA256SUMS.txt`, que duplicava o hash da base com caminho errado.
- Builds deixam de ser versionadas: `game/builds/` está no `.gitignore` e o workflow de publicação gera a build com `build_alpha.rb`, valida com `validate_alpha.rb` e só então publica. Verificado que o gerador reproduz a Alpha 1.2.4 publicada byte a byte (SHA-256 `0af38b67…aad2`). O HTML portátil fica como artefato do workflow por 90 dias.
- Preparado `production/limpar_historico.sh` e o guia `docs/LIMPEZA_HISTORICO.md` para remover as builds do histórico do git (clone de 204 MB → 134 MB). Precisa ser executado pelo administrador depois do merge; testado num remoto local com conteúdo final idêntico.
- Os três scripts de regressão de controles por versão viraram um só, `qa/input_regression.cjs`, que lê a build atual de `web/playtest/build.json`. 22/22 verificações aprovadas na Alpha 1.2.4.
- Corrigido o rótulo de versão no topo da tela: camadas antigas reescreviam "1.0 · PRÉ-ALPHA" a cada atualização do HUD. Agora um único `BUILD_LABEL` é reaplicado por último. Entra na próxima build gerada.

### Planejado

- Playtest completo da Alpha 1.2.0 em desktop e celular.
- Ajustes finos de escala, colisão e ordenação dos novos objetos.
- Animação visível da saída de Colli da oficina e chegada ao canal.
- Mais reações de grupo ao encontro das versões de Franco e Ryuchi.
- Balanceamento dos dois chefes finais a partir de tentativas reais.

## [Alpha 1.2.4 · Nome de Colli] — 2026-11-13

- Corrigido o cabeçalho dos diálogos de Colli no capítulo 2: o ID legado `nilo` agora é resolvido como COLLI pelo próprio renderizador de diálogo, em vez de usar o ID em maiúsculas.
- IDs de NPC, sprites e flags das fitas permanecem compatíveis com saves existentes.
- Verificadas no navegador as falas com zero, uma e duas fitas: todas mostram COLLI e a recompensa continua funcionando. Validação estática: 103/103.

## [Alpha 1.2.3 · Coop e identidade] — 2026-11-13

- Estado de ataque, combinação, passada e rolamento do P2 vinculado ao personagem. Trocas cancelam a animação anterior, inclusive quando P1 muda de líder.
- Ataques básicos distintos no P2: arco com projétil, oscilador, batidas de percussão, estocada, corte de katana e golpe amplo de baixo. Os estados de ação do P1 ficam isolados.
- Rolamento renderizado somente para a identidade que iniciou a ação; passada do P2 independente da movimentação do líder.
- Puxão passa de 6 para 9,5 blocos; limite de afastamento do líder passa de 7,6 para 11. Câmera busca o ponto médio dos jogadores.
- P2 usa ✕ para conversar, acionar eventos e atravessar passagens a partir da própria posição, mantendo requisitos e transições da história.
- Franco principal: rolada de 0,36 s e 2,76 blocos, recarga de 0,76 s e recuperação do ataque reduzida. Velocidade normal de caminhada já é compartilhada entre personagens.
- 103 verificações estáticas e 22 funcionais aprovadas com controles simulados; playtest com dois controles físicos permanece necessário.

## [Alpha 1.2.2 · Mobile horizontal] — 2026-11-13

- Controles na horizontal com elementos posicionados e captura de toques simultâneos; removido o uso de `display:contents` nessa orientação.
- Jogo ocupa a área horizontal completa, com controles semitransparentes sobrepostos e respeito às áreas seguras.
- Diálogos cancelam movimento, rolamento e comandos mantidos; analógico não acumula movimento durante falas.
- Trilha pausada durante desafios musicais, inclusive impedindo que uma decodificação atrasada reinicie a música durante a prova.
- Rolamento dos seis personagens com aproximadamente 15% mais distância, mantendo duração, invulnerabilidade e colisão.
- 103 verificações estáticas e 19 testes funcionais aprovados no Chrome, incluindo multitouch horizontal, bloqueio em diálogo e pausa musical. Testes em aparelhos físicos continuam pendentes.

## [Site provisório de testes] — 2026-11-13

- GitHub Pages com HTTPS no mesmo repositório, tornado público pelo autor.
- Publicação da Alpha 1.2.1 no endereço fixo `https://ryusarto.github.io/Torii-Hutukara/`.
- Identificação PC/MOBILE na entrada por quatro segundos, seguida de remoção completa do aviso.
- Exportação web com imagens em cache e MP3 sob demanda; HTML portátil preservado e conteúdo reconstruído byte a byte durante a verificação.
- Publicação automática da versão selecionada em `web/playtest/build.json`, com hashes e relatório públicos.
- Verificação de PC, celular e tablet por emulação, incluindo rotação, músicas e entrada do capítulo 3.

## [Alpha 1.2.1 · Mobile & Co-op] — 2026-11-13

### Corrigido

- Leitura de gamepad apagando movimento e ataque de toque quando não havia controle físico conectado.
- Círculo abrindo a pausa em áreas sem combate; agora sempre esquiva durante exploração e luta.
- Teleporte por distância do segundo jogador e projeção de posição para dentro de casas.
- Colisão pontual do P2: agora usa o corpo inteiro e passos curtos, com recuperação de posição inválida.
- Simulação e recargas do P2 continuando durante menus.
- Rolada com direção, duração e integração inconsistentes entre controle, personagem e ciclo de simulação.

### Adicionado

- Layout mobile automático em retrato e paisagem, com enquadramento próprio, zonas seguras e painéis de toque dedicados.
- Analógico com intensidade, corrida na borda, captura de cada dedo e cancelamento seguro ao girar ou trocar de aplicativo.
- Convivência de toque e controle físico no celular; teclado como apresentação inicial do desktop.
- Puxão gradual do coop por rota caminhável e espera do líder ao alcançar o limite de afastamento.
- Perfis autorais de rolada e recuperação de ataques para os seis personagens.
- Abertura de contra-ataque sinalizada após padrões dos chefes finais, prevenção de repetição imediata e alternância de mira entre jogadores.
- Estudo do Delta e aprofundamento do Moonlighter com REA: 36 tipos e 1.019 métodos selecionados, sem alterar a instalação ou incorporar seu conteúdo.
- Proposta para discutir as habilidades dos seis personagens e reduzir o deslocamento vazio das quests.

### Verificação

- 16 testes funcionais no Chrome, incluindo multitouch real simulado, orientação e dois controles simulados.
- Roladas verificadas a 30, 60 e 120 quadros por segundo, inclusive contra paredes e no ciclo real de atualização.
- Testes físicos em Safari iOS/Android e com dois controles reais continuam pendentes.
- Sprites cyberpunk e cortes narrativos ficam no ciclo seguinte, após a prioridade de controles e discussão dos kits.

## [Alpha 1.2.0 · Pré-beta] — 2026-11-12

### Adicionado

- Retratos autorais consistentes para Franco, Ryuchi e suas variações, incluindo expressões dramáticas.
- Máscara Torii canônica baseada na peça física: tecido marfim, costura central, treze pontas, lentes circulares e abertura inferior transparente.
- Rolamento em seis etapas para os seis personagens jogáveis.
- Corrida própria para Franco Sintetizador e Ryuchi Percussionista.
- Atlas de nuvens volumétricas em 16 bits, pilares, placa, postes e mobiliário cyberpunk.
- Seis fundos cinematográficos próprios para estúdio, câmara, cidades, ruínas e nuvens.
- Retratos naturais de conversa para os seis personagens jogáveis, sem deformação no enquadramento.
- Sprites autorais de Belga, Colli, Mazza e Dney como colaboradores centrais do mundo.
- Movimento multidirecional transparente para os quatro colaboradores, com quadros alternados de passo e retratos próprios.
- Materiais integrados para as ruas, o Mar de Nuvens, o Último Torii e o Núcleo do Silêncio.
- Olhos observadores e altar do Silêncio para a arena do confronto final.
- Suporte à Gamepad API com mapeamento para DualShock 4, DualSense e controles padronizados.
- Navegação de menus, diálogos, exploração, combate, técnicas, especial e pausa pelo controle.
- Coop local automático com dois controles e dois integrantes jogáveis simultaneamente.
- Movimento, direção, recargas, esquiva, invulnerabilidade e HP independentes para o Jogador 2.
- Troca do integrante controlado pelo Jogador 2, vibração quando disponível e ajuda dentro do jogo.

### Alterado

- Franco foi redesenhado a partir das referências faciais do artista para manter cabelo, sobrancelhas, rosto, boca e barba curta entre cenas.
- A máscara cobre testa e linha frontal do cabelo, mas revela boca, parte inferior das bochechas, barba e queixo.
- Placas do Distrito foram aproximadas das fachadas e as colisões passaram a acompanhar o volume visível dos prédios.
- A aquisição das máscaras foi dividida em antes e depois de equipá-las, sincronizando retrato e narrativa.
- Franco Sintetizador e Ryuchi Percussionista passaram a usar a mesma escala, âncora e fluidez dos protagonistas.
- O rolamento foi desacelerado, manteve a distância tática e perdeu a rotação artificial da tela inteira.
- O Último Torii deixou de exibir máscaras duplicadas: o círculo de ressonância agora explica a reunião das seis versões.
- Os papéis antes ocupados por Maia, Ciro, Nara e Vega passaram respectivamente a Belga, Mazza, Colli e Dney.
- A lore dos quatro colaboradores agora evolui entre Contratempo, Oficina, Canal, Nuvens e limiar final.
- A assistência automática do primeiro seguidor é suspensa no coop para que suas ações pertençam ao segundo jogador.
- A câmera compartilhada ganhou limite de distância e reposicionamento seguro nas transições.

### Corrigido

- Máscaras flutuando acima dos personagens durante a exploração.
- NPCs genéricos ou deformados no Último Torii.
- Congelamento ao escolher tentar novamente depois de morrer para o chefe final.
- Resíduos de projéteis, padrões e estados de batalha que contaminavam uma nova tentativa.

### Verificação

- 103 de 103 verificações estáticas aprovadas.
- Build final com 97.872.821 bytes.
- SHA-256: `c3ac6d011bdae931d7d0e59f851bee57930f2191deb2d1389f3dddd7ed1e7dca`.

## [Alpha 1.1.2] — 2026-11-12

### Adicionado

- Encontros diferentes para a segunda rota, com reações cruzadas entre as versões de Franco e Ryuchi.
- Kit autoral do Franco Sintetizador: combo Oscilador, Pads Harmônicos persistentes e Filtro de Corte.
- Estudo técnico das estruturas de combate de Moonlighter e registro dos limites de adaptação autoral.

### Corrigido

- Entrada lateral do Núcleo do Silêncio nascendo sobre vazio bloqueado.
- Franco Sintetizador e Ryuchi Percussionista entrando na formação antes da própria apresentação.
- Golpes do Franco Sintetizador reutilizando o comportamento do Franco Arqueiro.

### Verificação

- 65 de 65 verificações estáticas aprovadas.
- Build final com 86.333.596 bytes.
- SHA-256: `4e283861ec3caf460aa35dcb79f35aee7c9bdcdcfcb73e9428d96ea31993ae40`.

## [Alpha 1.1.1] — 2026-11-12

### Adicionado

- Materiais detalhados do Distrito derivados da arte-fonte aprovada.
- Placas e marcos visuais para Clube Contratempo, Oficina de Ciro, Usina de Retorno, Canal Suspenso e Elevador do Céu.
- Animação ambiente dos NPCs, com alternância de pose e reação à proximidade.
- Corrida, rolamento e poses de ataque em tempo real para Ryuchi percussionista.
- Golpes exclusivos de percussão: combo de três batidas, Contratempo, Quebra-pulso e Pulso Comum.
- Estudo documentado dos sistemas da ROM de Chrono Trigger e do projeto ChronoRET.
- Função, nível e experiência individual para os seis personagens na tela de equipe.
- Experiência de reserva em 75% e recuperação de nível para aliados recrutados mais tarde.

### Corrigido

- Dependência circular que exigia o elevador aberto para entrar na própria sala que o abria.
- Seta de missão que desaparecia após a apresentação no Clube Contratempo.
- Passagem para o Elevador do Céu permanecendo bloqueada apesar da frase musical concluída.

### Verificação

- 62 de 62 verificações estáticas aprovadas.
- Build final com 86.329.154 bytes.
- SHA-256: `93f291f4d68778968e14f48f7ded71e93f9a62937da5529f9e0ec4e94a96b268`.

## [Alpha 1.1.0] — 2026-11-12

### Adicionado

- Nove folhas de movimentação, totalizando 72 quadros.
- Sprites próprios de Maia, Nara, Ciro, Vega, Dimas, moradores, trabalhadora do canal e operador da usina.
- Cinco atlas de ambiente com 42 objetos.
- Mobiliário urbano, iluminação, máquinas da oficina, componentes do canal e estados do elevador.
- Catálogo visual e manifesto dos sprites.
- Estrutura completa de produção no GitHub.

### Alterado

- Nara é apresentada no Canal Suspenso antes de ajudar o grupo.
- Ciro reconhece corretamente que Nara foi ao canal.
- Objetivos da Usina e do Canal agora reagem à etapa concluída.
- Trabalhadora do canal e operador da usina fornecem orientação contextual.
- Transição do Capítulo 2 para o 3 reescrita como passagem aberta pelas máscaras.
- Identidade visual da build atualizada para Alpha 1.1.0.

### Corrigido

- NPCs do Capítulo 3 sem sprite próprio.
- Postes e objetos representados apenas por formas simples.
- Marcador do canal permanecendo na interferência já resolvida.
- Falas que tratavam Nara como ausente quando ela estava presente.
- Necessidade de voltar ao menu para iniciar o Capítulo 3 após o segundo boss.

### Verificação

- 57 de 57 verificações estáticas aprovadas.
- Build final com 82.349.689 bytes.
- SHA-256: `22e0637c4c95d2389a731b6a2038be5eff86bf415eb87f2a9a60340fc536c94f`.

## [Alpha 1.0] — 2026-11-11

- Primeira build jogável completa com três capítulos.
- Distrito, Usina, Canal, Oficina, Elevador, Mar de Nuvens e Último Torii.
- Franco sintetista e Ryuchi percussionista recrutáveis.
- O Metrônomo e O Silêncio como confrontos finais.
- Frase livre de quatro notas e epílogo no estúdio.
- Seis músicas incorporadas ao Capítulo 3.

## [1.1.2 Trilhas] — 2026-11-11

- Última base preservada antes da integração do Capítulo 3 completo.
- Arquivo original mantido em `game/source/base/` com hash de verificação.
