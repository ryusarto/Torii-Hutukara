# Ataques dos chefes · animação V2

A Beta 1.5 acrescenta cinco sequências de oito quadros desenhados: emissão e investida do Viajante, transmissão do Arauto, impacto do Metrônomo e expansão do Silêncio. Os sprites estáticos aprovados continuam no repouso e como fallback de carregamento. O rosto do Viajante permanece coberto, com a máscara radial da referência do autor. O capítulo 3 conserva ferrugem, sucata, lona gasta e as duas silhuetas aprovadas.

## Contrato da arte

`assets/boss-animations/v2/manifest.json` define atlas RGBA de 1280×640, quatro colunas, duas linhas, células de 320 e pivô 160,280. A margem extra acomoda braços e faixas sem reduzir cada quadro independentemente. Uma escala única por sequência aproxima o repouso da altura do sprite estático aprovado. Exportação por vizinho mais próximo, sem filtros de cor no renderer.

Os quadros 0–3 acompanham o preparo real. O quadro 3 pode esperar o disparo; o quadro 4 começa no evento da simulação. Os quadros 5–7 fazem o retorno. O Metrônomo e o Silêncio aguardam a janela de vulnerabilidade sem trocar indevidamente para a pose estática de ferimento. Pausa congela o relógio cosmético; carregar, trocar de área ou reiniciar elimina estados antigos. A etapa final de diálogo do Silêncio cancela as ameaças.

As fontes foram criadas com o **ImageGen integrado**, a partir dos sprites aprovados. Prompts e proveniência ficam em `design/boss-animations-v2/`. O exportador `production/export_boss_animations_v2.py` apenas recorta, redimensiona e empacota os quadros gerados; não pinta poses nem remove fundo por código. Hashes e limites estão em `VALIDACAO_EXPORTACAO.json`.

## Leitura das áreas

O contorno mostra a extensão completa desde o início, e a contagem musical indica quando o ataque dispara. O chão usa a mesma coordenada da colisão, sem deslocamento vertical decorativo. As áreas são desenhadas uma única vez antes dos personagens: o brilho do impacto não cobre o corpo nem a máscara. Os avisos antigos são suprimidos apenas nos ramos substituídos: barras de vida, projéteis, efeitos dos protagonistas e avisos de inimigos comuns continuam ativos.

| Chefe/padrão | Área representada |
| --- | --- |
| Viajante · pulso | Disco de raio 3,5 |
| Viajante · leque | Setor de raio 4,6, semiângulo 0,85 rad |
| Viajante · investida | União dos 11 centros de passo, raio 1,15; limitada pelas paredes |
| Arauto · faixas | Três faixas verticais de meia largura 0,8, travadas na criação |
| Arauto · retorno | Disco de raio 2,5, travado no alvo |
| Arauto · duas ondas | Banda móvel de meia largura 0,55; segunda emissão após 0,72 s |
| C3 · anel/chuva | Discos com os raios reais dos hazards: 3,7 ou 1,02 |
| C3 · cruz | Faixas com meia largura 0,68 + fase × 0,06 |
| C3 · leque | Raio 5,8, semiângulo 0,72 rad |
| C3 · pulso | Coroa entre raios 2,45 e 6,2; centro seguro |
| C3 · perseguição/órbita | Guias tracejadas de emissão, sem falso disco de dano |

A investida continua instantânea na simulação. O corpo não desliza lentamente por uma trajetória já resolvida: a preparação antecede o deslocamento real, e o rastro mostra o percurso conferido no disparo. Perseguição usa a mira atual até a emissão; as guias não prometem uma área travada. O co-op conserva os alvos e regras existentes. Nenhum callback de quadro aplica dano.

Movimento reduzido mantém os contornos e a informação temporal, reduzindo a troca de poses e retirando chevrons e ornamentos em movimento. Não há flashes de tela ou estrobo novo.

## Validação

`qa/boss_choreography_unit.cjs` compara geometrias com os predicados reais de dano, além de sincronização e preservação do estado. `qa/boss_choreography_browser.cjs` executa os padrões no jogo compilado, verifica os quadros e gera capturas do canvas e sequências temporais. Evidências e limites estão em `qa/boss-animations-v2/REVISAO.md`. Testes controlados não equivalem a uma campanha humana nem a teste em aparelhos físicos.
