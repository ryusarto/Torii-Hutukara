# Revisão independente — ambientes, atmosfera e nuvens

Base inicial dos ambientes consultada: main `7553828a669d33921940f5b8d1a99923636485a2`, Beta 1.7.1. A composição 1.9 incorporou a frente de NPCs/estúdio/corrida/cinema (`62fdce53`) e a frente de ambientes/nuvens (`93c990`). A composição final **1.10** concilia essas entregas, o pós-jogo (`067b66bc`) e as correções de saves da main. Preserva a arquitetura HTML Canvas e as identidades aprovadas de protagonistas/NPCs.

**Conclusão: aprovado para o escopo automatizado e visual registrado.** Os quatro achados foram corrigidos e retestados. Não há achado de produção aberto nesta revisão; os dois erros de isolamento do fixture identificados no reteste também foram corrigidos sem alterar produção.

Composição final executada em 20/11/2026: **Beta 1.10.0**, SHA-256 do executável `77c6334bb5d84c62539954376bf44e68db8ffc63e10884b3384c6c11a3689fc8`. HTML web: `95e8d5a794dbbf0a93735bb217e18c33a22b1813373d172ef78321b2524800ce`. Chrome `158.0.8127.37`, canvas lógico 768×432, contexto temporário isolado. **38/38 checks aprovados em três suítes sequenciais**, zero erros de navegador. Ambientes: 15 checks/44 capturas; estúdio/cinema: 11; pós-jogo: 12. Resumo identificado por hash em [COMPOSICAO_1_10_RESULTADOS.json](COMPOSICAO_1_10_RESULTADOS.json). As correções de fixture são descritas abaixo; nenhuma fonte de produção foi alterada pela revisão.

O hash servido em `build-info.json` foi verificado pelo runner de ambientes, registrado pelo runner de estúdio e reconferido após os três runners. O teste de pós-jogo não grava hash internamente; sua vinculação a esta composição é documentada pela execução sequencial no mesmo servidor local exclusivo e por essa reconferência. Nenhum Chrome ou build concorrente foi executado pela revisão.

Comando reproduzível (o servidor é iniciado e mantido pela coordenação):

```sh
PLAYWRIGHT_CORE=/private/tmp/torii-env18-browser/node_modules/playwright-core \
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
TORII_EXPECTED_SHA=77c6334bb5d84c62539954376bf44e68db8ffc63e10884b3384c6c11a3689fc8 \
node qa/environment_world_browser.cjs http://127.0.0.1:8787/
```

Depois, com os mesmos `PLAYWRIGHT_CORE` e `CHROME_PATH`, foram executados separadamente e nesta ordem:

```sh
node qa/world_polish_v1.cjs http://127.0.0.1:8787/
node qa/postgame_browser.cjs http://127.0.0.1:8787/
```

## Resultado final observado

- Oito fachadas desenhadas decodificaram com alpha real; cada variante foi consumida pelo `drawProp` real. O pivô da porta renderizada permanece a até um pixel da âncora física. Comparações focadas das três cidades mostram perspectiva, base e sombra conectadas; a transparência de oclusão mantém os personagens visíveis atrás das casas.
- Treze câmeras de cidades/salas e três fachadas focadas foram comparadas antes/depois com as camadas visuais desligadas/ligadas no mesmo executável. Mapas, props, gates, eventos e save permaneceram iguais durante o render. Cozinha/casa, reparos, mercado de fitas, rádio, estúdio, clube, oficina, usina e santuário mantêm seus objetos e passam a ter zonas e luz distintas.
- Os pisos conservam a textura da arte existente. Iluminação baixa continua legível. Vento alterou pixels da copa sem mover a base; efeitos suaves congelaram o movimento da árvore. Pausa congelou o relógio de atmosfera.
- Portal visível quando aberto, gate ainda dependente do progresso, fundo cinematográfico das nuvens e falas do mesmo mundo desértico conferidos. Oito quadros não vazios e distintos de reconstrução decodificaram no navegador.
- Apoio das três construções A/P/B surge progressivamente, não recua e termina completo; interações repetidas não reiniciam a obra. Salvar/carregar no meio restaura a passagem conquistada com posição segura.
- Caminhada, rolada e P2 atravessam a borda real e iniciam a queda. Pausa congela a animação. Somente o HP da vítima é zerado, a tentativa entra no menu real de derrota e o retry retorna a piso válido. Paredes fora das nuvens continuam sólidas; mudar área cancela a queda pendente.
- A oclusão do corpo em queda foi verificada por pixels, comparando o canvas com/sem somente esse ator: aos 0,05 s havia 1.531 pixels do corpo no céu e zero sobre apoio; aos 0,60 s o corpo estava escondido atrás da nuvem, com zero pixels sobre o piso. A miniatura sobre a ilha não reaparece.
- No pós-jogo, P1 e P2 iniciam quedas por movimento real. `canTravel`, viagem direta e início do calabouço ficam bloqueados, inclusive com os FX desligados. A tecla M real abre o mapa com destinos/calabouço desabilitados; a pausa conserva a mesma queda. VOLTAR retoma a fatalidade: vítima com HP zero, parceiro preservado, menu real de derrota e retry com campanha completa, posição válida e viagem novamente disponível.
- Os contatos da composição 1.10 foram novamente inspecionados: sofá vertical e vaso preservados no estúdio, NPCs visíveis nos interiores, fachadas e portas alinhadas, materiais/zoneamento e luz coerentes. Cinema do estúdio e canvas da Fenda também foram inspecionados nas capturas dos outros runners. Esta observação de integração não substitui a suíte dedicada de IA/corrida nem uma campanha humana.

### Compatibilidade de estúdio e cinema — 11/11

`qa/world_polish_v1.cjs` executado nesta revisão: sofá vertical/vaso, colisão e acesso ao tapete/mesa/saída, correção de saves antigos dentro do sofá, rebuild idempotente, painéis legados 724×362, floresta própria 1672×941, fundos de deserto/nuvens 1672×941 com a fonte correta, filtros/shade, callbacks tardios, 24 gestos registrados e enquadramento de telefone. Resultado em [WORLD_POLISH_RESULTS.json](../beta-1.10.0/WORLD_POLISH_RESULTS.json). A asserção conciliada de nuvens identifica o asset de `CloudWorldV1` quando `CloudStoryV1.enabled`; não foi modificada por esta revisão.

### Compatibilidade de pós-jogo — 12/12

`qa/postgame_browser.cjs` executado em seguida, sem alterar suas asserções: reservas conforme formação/P2, recompensa final idempotente no Torii, viagens e recarga em destinos válidos, inimigos e pontuação sem XP/shards indevidos, 25 ondas com limite de inimigos e pausa de timers, recarga do início da onda com pontuação consolidada, derrota/retry/saída preservando campanha e recorde, inimigos causando dano real, exportação da expedição ativa, coop, HUD/cenário e menus touch em paisagem/retrato. Resultado copiado para [POSTGAME_1_10_RESULTADOS.json](POSTGAME_1_10_RESULTADOS.json), preservando no GitHub o relatório histórico do pós-jogo 1.9 que já é referenciado pela documentação dele. As emulações touch não equivalem a aparelho físico.

Contatos finais: `CONTATO_FACHADAS.png`, `CONTATO_0..3.png`. Capturas específicas: `portal-aberto.png`, `nuvens-00-ausente.png`, `nuvens-01-reconstruindo.png`, `nuvens-02-restaurada.png`, `queda-p1-00-inicio.png`, `queda-p1-02-distante.png`, `queda-oclusao-nuvem.png`, `queda-p1-03-checkpoint.png`, `queda-p2.png` e `efeitos-suaves-nuvens.png`. Os arquivos individuais e seus hashes constam no JSON.

## Escopo e propriedade

Esta revisão mantém módulos e assets de produção intactos. Os arquivos de responsabilidade da revisão são `qa/environment_world_browser.cjs` e este relatório; resultados e capturas da suíte ficam nesta pasta. As implementações de arquitetura, atmosfera e nuvens pertencem às outras frentes.

## Critérios

- Fachadas das três cidades conectadas ao piso por volume lateral, fundação e sombra, sem esconder portas ou personagens.
- Interiores com materiais, zoneamento e estrutura visual específicos, mantendo móveis, objetos interativos e rotas existentes.
- Luz reduzida e fontes locais legíveis; atmosfera quente/poeira no C3 e vento com base das árvores fixa; efeitos suaves respeitados.
- Reconstrução de nuvens com oito quadros de sprite distintos, colisão progressiva, repetição idempotente e carregamento seguro de saves parciais.
- Queda por caminhada/rolada/P2, animação antes de morte, pausa, derrota real, retry em ponto válido e ausência de efeitos tardios após mudar de área.

## Evidência disponível

Leitura estática dos módulos e do pipeline existente. `node --check qa/environment_world_browser.cjs` aprovado. A suíte exercita simulação e canvas reais em um Chrome isolado, sem saves pessoais.

Primeira candidata executada: Beta 1.8.0, SHA-256 `e1d2fc4bd7293a945e3dd691f21ca050dfe393e9af034c13eed9f9ab8d78e71b`. Oito checks passaram antes do bloqueio de P2, e uma rodada focada confirmou as três fachadas. Capturas antes/depois revisadas nos contatos `CONTATO_0..3.png` e `CONTATO_FACHADAS.png`; nuvem em reconstrução, portal e queda P1 também inspecionados. A queda por caminhada/rolada P1, pausa, derrota e checkpoint funcionaram na simulação real.

Segunda candidata executada: SHA-256 `4b65c60c9fd13815cb6fb7640d759b69e669a35cca081e275b3fd437a835ac0e`, HTML web `90ee59fc65660f28a935c9f0a60393905e1c307ceb8eb41fb3e80100be868899`. **13/13 checks de navegador aprovados**, 43 capturas, nenhum erro no navegador. Oito sprites de fachadas decodificados com alpha; pivôs do `drawImage` real a até um pixel da âncora de entrada. Vento alterou 3.448 pixels de copa, zero pixels da base; efeitos suaves mantiveram zero pixels de movimento da árvore.

ENV-01 e ENV-02 foram corrigidos e retestados nesta segunda candidata. ENV-03 foi encontrado nela e corrigido na candidata de ambientes 1.8 `c7e65193…`, que teve 14/14 checks, 44 capturas e zero erros. Seu resultado foi preservado em `HISTORICO_BETA_1_8_0_c7e65193.json`. A composição 1.9 `f8cae65a…` também teve 14/14 checks sem erros e contatos revisados; seu resultado está em `HISTORICO_BETA_1_9_0_f8cae65a.json`. A candidata 1.10 `644784ec…` teve 37 checks aprovados antes do novo caso ENV-04; seus registros foram preservados em `HISTORICO_BETA_1_10_0_644784ec.json` e `HISTORICO_COMPOSICAO_1_10_644784ec.json`. Caminhos de imagens nos históricos pertenciam às respectivas rodadas; a pasta ativa contém capturas da composição final 1.10. Nenhum resultado de outro autor foi tratado como execução desta revisão. A conclusão e os 38 checks atuais correspondem ao executável identificado no topo.

## Achados da primeira candidata

### ENV-01 — Alto — P2 permanece preso na borda em vez de cair

Ambiente: Chrome isolado, build `e1d2fc4…`. Reproduzir em `cloud_sea`: P1 em (9.5, 26.5), P2 em (9.5, 25.5), eixo vertical de P2 = -1 por 20 ticks de 1/60 s. P2 avança até y=25.195; o canto do corpo toca o céu, mas o centro continua sobre a nuvem. `C3.syncCoop` recupera `lastGood` antes do próximo passo e o personagem volta a y=25.195 indefinidamente. `CloudWorldV1.fall` permanece null. Esperado: ultrapassar a borda inicia a mesma animação/morte que P1. A equipe de nuvens recebeu a reprodução e a causa. **Corrigido e retestado em `4b65c60c…`:** movimento real de P2 avançou por 25.195 → 25.093 → 24.992 e iniciou a queda; somente HP de Ryuchi zerou, P1 permaneceu em (9.5, 26.5) com HP 40 e houve menu real de derrota/retry.

### ENV-02 — Médio — Pisos novos perdem detalhe da arte publicada

Capturas de studio, chamber e interiores C2 mostraram grandes regiões planas/gradeadas, em contraste com os props detalhados. Esperado: diferenciar materiais e zonas mantendo acabamento pixel art e textura. **Corrigido e revisado em `4b65c60c…`:** texturas autorais de madeira, tapetes e pedra preservadas; zoneamento de cozinha/casa, oficina de reparos, mercado de fitas, rádio, clube e usina permanece distinto. Comparação histórica em `HISTORICO_ENV02_CONTATO_1..3.png`; comparação corrigida em `CONTATO_1..3.png`.

### ENV-03 — Médio — Sprite em queda passa visualmente sobre o piso

Ambiente de reprodução: Chrome isolado, build `4b65c60c…`. Sair pela borda norte, aguardar 0,6 s e renderizar a queda. O personagem já encolhido aparecia sobre o piso da ilha ao descer no eixo de tela; a nuvem não o ocluía. Esperado: corpo em queda aparece no vazio e desaparece atrás/abaixo das superfícies de apoio. **Corrigido e retestado em `c7e65193…`, reconfirmado nas composições 1.9 `f8cae65a…` e 1.10 `644784ec…`:** máscara de céu aplicada antes da transformação, zero pixels do corpo sobre tiles de apoio no início e na fase distante. Capturas finais `queda-p1-02-distante.png` e `queda-oclusao-nuvem.png` mostram o corpo corretamente oculto. A revisão não alterou produção.

### ENV-04 — Alto — Viagem de pós-jogo pode cancelar a queda fatal

Achado adicional da coordenação após a rodada `644784ec…`, confirmado por leitura causal: `PostGame.canTravel()` excluía diálogo/ritmo/título, mas aceitava `cloud_fall`; `travel()` e `startDungeon()` podiam então chamar `setArea()` e limpar a queda. A rodada anterior não cobria essa interação entre sistemas. A correção de produção foi encaminhada ao agente responsável pelas nuvens.

**Corrigido e retestado em `77c6334b…`.** O 15º check cobre P1 e P2, com campanha completa em chão válido e viagem inicialmente permitida, sem substituir `canTravel()` ou usar boss/battle artificiais. As ações diretas ficam falsas com a camada cosmética ligada/desligada, mantendo área, posição e objeto da queda. A tecla M real abre destinos/calabouço desabilitados; fechar o mapa retoma a queda. P1 termina com Franco HP 0/Ryuchi 38, P2 termina com Ryuchi 0/Franco 40. Os dois retries restauram HP 40/38, campanha completa, P1/P2 válidos e `canTravel=true`.

### Correções do fixture de integração — sem alteração de produção

1. O helper de borda usava indevidamente `checkpoint.id='c3_clouds'`, reservado ao chefe do terraço, embora sua área fosse `cloud_sea`. O retry real desse ID agenda `C3.startMetronome(true)` após 100 ms. Na fixture seguinte já concluída, esse callback produziu a fala exclusiva «COMPASSO REGISTRADO. PASSAGEM LIBERADA.», que interceptou o clique VOLTAR. O caso isolado P1/P2 passava. O ID foi substituído pelo genérico existente `post_travel`, conservando área/posição; o helper agora rejeita `c3_clouds` e `c3_final`. Diagnóstico arquivado em `DIAGNOSTICO_FIXTURE_C3_CLOUDS.json`. O rastreador temporário de `talk` foi removido; nenhuma fala, timer ou regra do jogo foi suprimida.
2. Forçar `metronomeDone=true` para montar uma campanha completa deixava um marco ainda não observado pelo poll real de `pacing.js`. A queda suspendia esse poll, que depois da derrota concedia o revive legítimo de 30% (12 HP) referente ao marco artificialmente pendente. A fixture passou a executar 0,6 s de `update` real sobre chão seguro, com o herói ainda em HP cheio, antes do checkpoint/queda. Isso registra o estado concluído como ocorreria no percurso real. `healOnMilestones`, o HP após a queda e o fluxo de derrota não foram alterados.

As 44 capturas foram produzidas novamente. Destas, 41 são byte a byte idênticas às da rodada `644784ec…`, incluindo os 32 PNGs que compõem os cinco contatos; os três PNGs de nuvens diferentes foram inspecionados novamente. A aprovação visual anterior permanece coerente com os contatos, e a leitura das nuvens/queda atuais foi reconfirmada.

## Riscos priorizados

1. Queda não interceptar os caminhos reais de caminhada/rolada/P2, ou recuperação automática impedir a queda.
2. Superfície de apoio aparecer em momento diferente do sprite, ou save durante a formação gerar bloqueio/queda ao recarregar.
3. Camadas de luz/volume esconderem interação, personagem ou aviso de combate.
4. Alterações cosméticas mutarem mapas, gates, flags, saves ou se acumularem durante pausa/transição.

Não houve campanha humana completa nem teste em celular ou controle físico nesta revisão. A aprovação cobre os casos de simulação, canvas e leitura visual registrados, sem prometer uma taxa de quadros universal ou conforto de controles físicos.
