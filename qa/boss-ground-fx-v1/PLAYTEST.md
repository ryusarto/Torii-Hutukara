# FX dos golpes no chão — Beta 1.7.0

Publicação pelo PR [#15](https://github.com/ryusarto/Torii-Hutukara/pull/15), merge `3e7ad3f5c9ba484e9e257e016102c19d8389c235`. Build validada no head `e4f515873881812c73d829ff1a8816e3a29b7dd0` e recompilada pelo publicador. SHA-256 do executável: `5af9381eddcafa26fd671adbca39cc27bb879549f8e4a85500db962ac151a6d7`.

## Entrega

Quatro atlas RGBA 1024×512, oito quadros distintos por atlas: onda âmbar, interferência elétrica, impacto de sucata e vórtice oxidado. Acúmulo de energia, impacto sincronizado ao evento real e dissipação até desaparecer. As fontes, prompts e manifesto estão descritos no [contrato de produção](../../docs/BOSS_GROUND_FX_V1.md).

FX sob os atores e recortados pela geometria de dano existente. Centros seguros preservados; faixas e cruzes alinhadas aos eixos reais. Impactos com sombra escura de um pixel e intensidade ajustada à leitura do cenário. Movimento reduzido, pausa e cancelamentos respeitados. A camada não altera dano, colisões, cooldowns ou estado salvo.

## Evidência executada

- [Gameplay regression 44230980691](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44230980691): aprovado; 138 verificações estáticas, 14 testes unitários de FX e seis verificações de FX no navegador. Regressões de coreografia, inimigos, entrada e gameplay aprovadas.
- [Art integration QA 44230980623](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44230980623): aprovado para a mesma composição final.
- [Publish playtest 44232084397](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44232084397): aprovado; recompilação, controles, progressão, saves, coop, músicos, cenários, protagonistas, coreografia, FX e site passaram antes do deploy.
- Navegador decodificou os quatro atlas com oito quadros distintos e alpha; percorreu os quatro chefes no pipeline real de pintura/disparo, confirmou resíduo após remover o hazard e paridade dos resultados de dano.
- 36 capturas por caso, 144 capturas no total, cobrindo preparação, impacto e dissipação. Todos os casos terminam com zero registros e zero sprites do novo FX. Pausa, substituição de jogo/área/ator e etapa final também verificados. Sem erros de navegador.

Resumo em [BROWSER_RESUMO.json](BROWSER_RESUMO.json). Capturas e resultados completos no artefato de QA do workflow de gameplay, ID `14394694008`, ZIP SHA-256 `d55c23c71052d87a62da987b780a93666be28600484426c131b6ccdccf8ca5f2`. A [prévia GIF](PREVIA_FX.gif) demonstra os atlas, sem substituir a evidência de integração.

## Pages conferido

[Jogo online](https://ryusarto.github.io/Torii-Hutukara/) conferido em 20/11/2026: versão 1.7.0 e SHA-256 do executável acima. HTML servido: 906.466 bytes, SHA-256 `8cbf950e2e450d9f81f75036676ffc4180abc7b5cb968e5e7b845aa8594906db`. Os quatro PNGs servidos correspondem por hash aos atlas exportados, têm 1024×512 e estão referenciados no HTML. O manifesto confirma `gameContentRoundTrip: true` e `portableBuildUnchanged: true`. Registro em [PAGES_VERIFICACAO.json](PAGES_VERIFICACAO.json).

## Limites

Chrome isolado e casos controlados usando a simulação e o canvas reais. As capturas avançam o inimigo e a camada de FX de forma controlada; efeitos genéricos antigos podem permanecer congelados na fixture, apesar de os novos FX chegarem a zero. Nenhuma campanha humana completa ou nova validação em celulares/controles físicos foi executada nesta entrega. O commit documental final não muda o executável validado.
