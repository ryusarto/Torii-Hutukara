# Ataques animados dos chefes · Beta 1.5

**Integrado pelo PR #13 na main e publicado no GitHub Pages.** A versão servida foi conferida por `build-info.json`: 1.5.0, reconstrução íntegra e o mesmo SHA-256 da build executada nos testes.

- Executável: `TORII_HUTUKARA_BETA_1_5_0.html`, 388.905.324 bytes.
- SHA-256: `0e5ff738479164854b1ed625464f0704af9bfde833f2221cf67623525bfe8e21`.
- Fonte testada: `1ccb634`; merge: `47039cdd`.
- [Jogar](https://ryusarto.github.io/Torii-Hutukara/) · [CI de gameplay](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44206242216) · [CI de arte](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44206242248) · [Publicação](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44213832833).

## Produzido

Cinco sequências de oito quadros desenhados, totalizando 40: emissão e investida do Viajante, transmissão do Arauto, impacto do Metrônomo e expansão do Silêncio. Permanecem integradas as 11 identidades hostis, 13 atlas e 52 poses estáticas. PNGs, prompts do ImageGen integrado, exportador, manifesto e hashes acompanham o repositório.

O Viajante mantém o rosto coberto pela máscara radial da referência do autor. Metrônomo e Silêncio conservam sucata, ferrugem, lona e suas silhuetas. A direção artística revisou as 40 células e as capturas: sem corte no atlas ou troca de identidade. O retorno ao repouso estático conserva tamanho e apoio. Os corpos continuam legíveis sobre o pulso depois que as áreas foram movidas para o chão.

## Executado e verificado

| Verificação | Resultado |
| --- | --- |
| Estrutura, assets, integridade e base imutável | 132/132 |
| Geometria, sincronização e paridade de estado/dano | 18/18 |
| Animações no jogo compilado, em Chromium isolado | 8/8 |
| Integração dos sprites de inimigos | 8/8 |
| Controles, mobile e co-op | 22/22 |
| Jogabilidade, progressão e saves | 20/20 |
| Recorrência dos NPCs / estado dos protagonistas | 32/32 e 24/24 |
| Arte V5 / Ninja e Arqueiro | 11/11 e 8/8 |
| Site e áudio em PC, celular e tablet emulados | 4/4 |

O quadro 4 acompanha o disparo real. C3 libera a animação quando o hazard dispara, antes de `wind` terminar; chuva não reinicia a sequência a cada gota. Rajada e segunda onda do Arauto também acionam a liberação. A investida conserva os 11 passos instantâneos e desenha somente o percurso conferido na simulação.

Foram exercitados os onze pares de chefe/padrão do C3, os três ataques do Viajante, o objeto real `tele09` e as bandas móveis das ondas. Pausa, novo jogo, troca de área, retry e etapa final não deixam ataques antigos ativos. Movimento reduzido conserva os pips estacionários. A comparação de dano/estado com e sem apresentação não mostrou mudanças.

As áreas são desenhadas uma única vez, antes dos atores (`ground → zone → body`). HP, projéteis, efeitos dos protagonistas e avisos dos inimigos comuns seguem nas camadas existentes.

## Evidências e limites

- `BROWSER_RESULTADOS.json`: resultados, proveniência e 24 amostras temporais por sequência.
- `CONTATO_40_QUADROS.png`: cinco sequências exportadas.
- `CONTATO_COMBATE.png`: preparação, liberação e recuperação no canvas real.
- `PREVIA_JOGO.gif`: redução e empacotamento das capturas; não pinta nem reconstrói a arte.
- `PREVIA_ARTE.gif`: demonstração do atlas, separada da simulação.
- `PAGES_VERIFICACAO.json`: versão e hash observados no site publicado.
- `PAGES_ASSETS_VERIFICACAO.json`: HTML e cinco atlas de chefes baixados do Pages e comparados byte a byte por SHA-256.

As capturas são cenários controlados, não uma campanha humana ou um teste em aparelhos físicos. Na expansão máxima do Silêncio, parte do sprite ultrapassa a borda superior em um dos enquadramentos de teste. É um limite de enquadramento da evidência, não um corte no atlas; a câmera do produto não foi alterada por este trabalho. O aceite visual tem essa ressalva e não comprova o enquadramento de todas as situações da campanha.

A direção artística dos cenários desérticos continua em outra frente, agora reservada para Beta 1.6 conforme `docs/COORDENACAO_RELEASES.md`. A Beta 1.5 preserva os músicos, cenários e correções já integrados; os novos chefes usam os materiais de sucata aprovados.
