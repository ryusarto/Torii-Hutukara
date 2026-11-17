# Integração final do PR #8 na Beta 1.2

Verificado em 17/11/2026. As correções foram reconciliadas com os protagonistas V5 e com Ninja/Arqueiro. O runtime e os assets de arte da main foram preservados. Schema 13 e a chave de save continuam os mesmos.

Build portátil: 223.152.797 bytes; SHA-256 `4b3a719ed88a21bc0a28bad40f0734264b87c2d7072b777789b2ead6af8b5ed3`.

## Verificações

- 110/110 verificações estruturais e 24/24 verificações da camada de estado V5.
- Protagonistas V5: 11/11; Ninja/Arqueiro: 8/8; PC/celular/tablet e áudio web: 4/4; nenhum erro de runtime.
- 22/22 testes de controles e 20/20 de progressão, save, combate, colisão e diálogo mobile.
- Jornada Canal primeiro, perfil típico: concluída; duas recargas reais sem divergência de progresso, formação, XP ou níveis.
- Jornada Usina primeiro, perfil rápido: concluída; 22 encontros, zero derrotas, primeira luta aos 2min05s simulados, após o baixo.
- NPCs: 32 casos de direção/tempo, fallback, ausência de mutação e roteamento de elenco aprovados.
- Exportação: 188 arquivos de mídia reconstruídos para comprovar igualdade byte a byte com o HTML portátil.

Resultados de navegador e de arte são gravados nesta pasta. Capturas da execução ficam nos artefatos dos workflows. Evidência das jornadas em `JOURNEY_GAMEPLAY_RESULTS.json` e nos relatórios `qa/ritmo/*integracao12*`.

## Reprodução

Gerar com `ruby game/source/chapter-03/build_alpha.rb`, validar com `ruby game/source/chapter-03/validate_alpha.rb` e exportar com `ruby production/build_playtest.rb`. Executar `qa/input_regression.cjs`, `qa/gameplay_regression.cjs`, `qa/protagonist_state.cjs`, `qa/protagonist_art_v5.cjs`, `qa/ninja_archer_art.cjs` e `qa/playtest_site.cjs`. Os três últimos aceitam a URL da exportação servida por HTTP. `PLAYWRIGHT_CORE` seleciona a instalação do Playwright; os testes de arte iniciam um navegador isolado ou conectam a `CDP_URL`.

A comparação de pixels usa um canvas configurado para leitura frequente, aguarda os atlas e inicializa caches antes de comparar dois frames. Isso evita a troca de rasterização GPU/CPU após a primeira leitura no Chrome local. A igualdade exigida continua exata; o runtime publicado mantém o contexto original.

## Limites

Chrome com perfis mobile e controles emulados. Safari/iPhone, Android e dois controles físicos continuam pendentes. O tempo do robô é simulado; o resumo do medidor após recarga cobre somente o último segmento. O log de objetivos cobre o percurso inteiro. Novos inimigos e pacotes dos músicos em produção continuam no plano de arte; estes arquivos em produção não são importados por este PR.

As duas jornadas foram executadas na build `56b036639c95b9c8665c8a8ff870cd3ce2558005bf89966571cefb213db9dab7`, antes da atualização visual de recorrências dos NPCs. A build final acima acrescenta somente esse ajuste de desenho, validado pelos 32 casos e pelas regressões de navegador; as regras de gameplay das jornadas permanecem iguais.
