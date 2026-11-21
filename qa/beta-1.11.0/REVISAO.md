# Beta 1.11 — volume, espaço e animação

Build validada em 21/11/2026 (São Paulo):
`73568a9c76ec3ec029393947753367c0af25843d6c1125fa1baad845d76b6392`.

## Resultado incorporado

- **Iluminação retirada por orientação do autor:**  sem máscara escura, fontes, spots, cones, luminárias adicionadas ou brilho de tela. Cores originais preservadas. Permanecem poeira/vento e contatos curtos no chão para sustentar o volume.
- **Distrito com mais espaço:**  residências decorativas 6→4, retiradas as duas que se sobrepunham ao Clube/Oficina. Oito edifícios mantêm envelopes sem sobreposição; intervalo mínimo calculado 53,62 px. Foram liberadas 62 células de colisão. Portas, NPCs, objetivos, coordenadas de retorno e os seis portais permanecem alcançáveis com raio corporal real.
- **Volume 2.5D:**  laterais e coberturas C3 usam texturas aprovadas de metal/ferrugem, com base, oclusão e transparência contextual. Objetos dos capítulos recebem contato/base conforme sua família; tapetes e elementos planos permanecem no chão.
- **Colli único:**  reaplicar progresso deixava recriar o NPC na Oficina e acrescentá-lo novamente ao Clube. A mudança de local é idempotente e mantém uma referência por identidade; retorno e recarga preservam a atuação.
- **NPCs C3:** 24 desenhos novos de respiração, piscada e gestos para os moradores/operadores. A IA local mantém olhar, atividade, passeio curto e retorno, congelando em diálogo/menu/perda de foco. Corrigida a proporção dos atlas direcionais, anteriormente achatados.
- **Fenda com combate funcional:**  seis verificações legadas usavam uma lista compilada que excluía a arena dinâmica. Agora usam o registro comum de áreas. Franco/Ryuchi podem usar J/Z/X; seis líderes foram exercitados com entradas reais.
- **Seleção pós-jogo:**  apenas Capítulo 1, Capítulo 2, Capítulo 3 e Calabouço; os capítulos levam aos seus hubs sem apagar equipe, inventário, desbloqueios ou recorde.
- **Franco/Ryuchi:** 16 poses por ciclo de caminhada/corrida, quatro direções e variantes de máscara. 256 desenhos intermediários novos, sem mudar velocidade, distância do ciclo, input ou timers de dano. Atlas limitados a 4096 px; fechamento virtual no quadro 0 evita coluna extra e pausas artificiais.
- **Chefes:** 32 desenhos de passos do Viajante, ligados ao deslocamento real; oito quadros de projétil orientados pela velocidade e oito de mira. As sete famílias de ataque finais usam sprites de mira, com contornos/áreas de dano preservados. O corpo do chefe mantém a mesma pose ao pausar.

Total: **328 desenhos novos selecionados** (256 locomoção + 32 caminhada do chefe + 16 FX + 24 NPCs). Fontes, prompts, manifestos e preparação estão em `assets/protagonistas/v7-locomocao`, `assets/boss-animations/v3`, `assets/boss-ground-fx/v2` e `assets/npcs/vida-v2`. Geração por ImageGen integrado; scripts de imagem apenas recortam, registram e empacotam. A base histórica e a chave de save foram preservadas.

## Bugs adicionais evitados pela validação

O teste original de transparência detectou ruído alpha 1/255 no canto de uma célula de Ryuchi. O export agora exige borda 2 px alpha 0 e aborta se houver conteúdo alpha>2 nessa margem. 512 células e 2.048 cantos verificados; 256 quadros V5 e todos os pixels internos foram preservados byte a byte. Nenhum assert foi relaxado. Também foram corrigidos o reset visual no primeiro passo do chefe e o contato fantasma de P2 desconectado durante uma queda.

## Executado

- **148/148 verificações estáticas Ruby** e prova de exportação/roundtrip.
- **18 suítes Node/VM aprovadas**, incluindo 57 grupos novos: 10 pós-jogo, 17 mundo sem iluminação, 17 NPCs, 7 animação e 6 espaçamento. A adaptação de locomoção verifica caminhada/corrida a 30/60/120 Hz, parede, pausa, ação e independência P1/P2.
- **13 suítes de navegador/campanha aprovadas**, registradas em `BROWSER_SUITE_RESULTS.json`.
- **54 combates reais** da Fenda: 6 líderes × teclado/touch/controle emulado × entrada/recarga/FileReader. Sem chamada direta de dano para vencer; golpes, mortes e pontos vêm das ações do jogo.
- **64 combinações de locomoção**: caminhar/correr, P1/P2, dois heróis, máscaras e quatro direções. O teste completo também decodifica as 192 sequências e verifica alpha, unicidade e fechamento de ciclo.
- Chefes: preparo/liberação/recuperação, caminhada real, pausa e sprites de mira dos sete padrões; rajadas de 5 e 12 projéteis desenham um bitmap por projétil, sem mudar seu estado.
- Mundo: um Colli após 12 reaplicações/visitas; ausência de filtro de luz; volume visível; quatro residências e seis saídas alcançáveis;24 gestos distintos e atuação local sem alterar quests.
- Regressões de input 22/22, gameplay 20/20, ambientes 15/15 e pós-jogo 12/12; site em PC/telefone/tablet emulados. Os 8 testes de seleção do artefato Pages passaram.
- **Duas jornadas contínuas desde Novo Jogo até o epílogo:**  desktop/Usina primeiro e mobile emulado/Canal primeiro, com seis recargas sem diferença de progresso e quatro rotações na jornada mobile. Movimento, notas, combate e interações reais; sem preview, teleporte, HP ou flags forçados para avançar. Leitura e simulação aceleradas; duração simulada não mede ritmo humano.
- Revisão independente de código/Node e inspeção das capturas renderizadas. Exemplos finais em `selecionadas/`.

As jornadas comparam área, líder, posição, inventário/ressonância, derrotas/descobertas, escolhas, localização do checkpoint, HP/formação, flags/C3, XP e níveis. Relatórios trazem hash da build. Capturas completas ficam nos artefatos CI ou em `qa/screenshots-local/review-111`.

## Reprodução e limites

```sh
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
ruby production/build_playtest.rb
python3 -m http.server 8771 --directory production/playtest-dist
node qa/review111_postgame_browser.cjs http://127.0.0.1:8771/
node qa/review111_world_browser.cjs http://127.0.0.1:8771/
node qa/locomotion_browser_v6.cjs http://127.0.0.1:8771/
ROTA=usina RECARREGAR=120 node qa/campaign_review.cjs http://127.0.0.1:8771/
DEVICE=mobile ROTA=canal RECARREGAR=120 node qa/campaign_review.cjs http://127.0.0.1:8771/
```

Configurar `PLAYWRIGHT_CORE` e `CHROME_PATH` se necessário. São testes automatizados em Chrome isolado com emulação e frames controlados; não houve campanha humana, aparelho físico, Safari real ou controle físico. Eles comprovam seleção de quadros e continuidade, sem garantir FPS/fluidez percebida em hardware de baixo desempenho. A integração e publicação são rastreadas no PR e no workflow do GitHub.
