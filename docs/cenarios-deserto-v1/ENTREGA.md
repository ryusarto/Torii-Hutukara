# Entrega de cenários C3 — Beta 1.6

Data: 17/11/2026. Responsabilidade desta revisão: coordenação documental e conferência estática dos artefatos recuperados. **Candidata reconstruída e revalidada: 137/137 verificações estáticas e 14/14 suítes automatizadas aprovadas. Publicação confirmada: commit `bf1c2dc45c19216463983bd92f8bcb39216fe4d7`, execução44227852940 concluída com sucesso e SHA-256 conferido no site público.**

## Ponto de recuperação e posse

A cópia foi recuperada do GitHub no commit `8ad20909efd72b9f0143da1b9d3163c474dc8f6d`, branch `art/cenarios-deserto-v1`. Esse checkpoint já reconcilia os músicos de `main`/Beta 1.3 e preserva a integração desértica opt-in. Na conferência inicial da recuperação, `game/VERSION.json` ainda indicava Beta 1.3 e o manifesto desértico tinha `stage: complete_assets_pending_final_qa`; isso descreve o checkpoint, não uma publicação da Beta 1.4.

A reserva inicial previa Beta 1.4 para cenários e Beta 1.5 para inimigos/bosses. A frente 1.5 foi publicada primeiro e depois integrada por Git à recuperação; a candidata consolidada passou a **Beta 1.6.0**. O merge local registrado é `184c6b8` (`Merge published Beta 1.5 bosses and enemies into Beta 1.6 desert candidate`). Esse histórico não autoriza rebaixar main nem publicar novamente o número 1.4. Publicações continuam serializadas.

| Responsável | Posse nesta recuperação |
|---|---|
| Integrador principal | Código, gerador/exportador, PNGs de cenário, compilação, testes e publicação |
| Coordenação desta revisão | Somente `docs/CENARIOS_DESERTO_V1.md` e este `ENTREGA.md` |
| Direção artística | Aceite artístico anterior comunicado pelo integrador; não substituído por esta conferência |

Não foi operado editor, iniciado navegador/build, alterado código/arte ou publicado conteúdo por esta revisão.

## Conferido nesta cópia

O manifesto recuperado contém **13 atlas, 131 recortes, 25 extras `c3_desert_*` e dois fundos separados**. A biblioteca V2 conserva 20 recortes A11/A12, compondo o total de runtime de **15 atlas e 151 recortes, além dos dois fundos**.

Os 13 arquivos de atlas existem e seus cabeçalhos PNG indicam RGBA e dimensões compatíveis com `grid × cell`. Essa leitura estática não substitui a inspeção de alpha de cada recorte nem a execução do renderer. Foram consultados o contrato de direção, o brief de produção, manifesto, versão e documentação de QA recuperada.

## Evidência atual da candidata 1.6

Executável: **401.631.199 bytes**, SHA-256 **`517715fe2e742bf3e19b2e238f0286378e5c63335002a1e116cf62fe3b10b845`**. `game/VERSION.json` confirma `beta-1.6.0`; o gerador usa `deserto-v1` por padrão e o manifesto registra `complete_assets`.

Conferência documental dos arquivos produzidos pelo integrador/tester, sem reexecução pela coordenação:

| Fonte atual | Resultado observado |
|---|---|
| `game/builds/beta-1.6.0/VALIDACAO_BETA_1_6_0.txt` | 137/137 verificações estáticas aprovadas |
| `qa/cenarios-deserto-v1/RUNTIME_RESULTS.json` | 13/13, `passed: true`, SHA servido correspondente à candidata |
| `qa/cenarios-deserto-v1/estados/ESTADOS.json` | 19 frames; posições válidas de P1/P2; retry com `canMove: true`, modo `action` e boss `c3_silence` |
| Mesmo relatório de estados | Sete tipos reais solicitados e assertados em modo `padrao`; não são sete geometrias visualmente únicas aprovadas |
| `production/playtest-dist/build-info.json` | HTML 888.756 bytes, 307 mídias, `gameContentRoundTrip: true`, `portableBuildUnchanged: true` |

O agregado final `REGRESSOES.json` registra **14/14 suítes aprovadas**, todas com saída zero e SHA esperado correspondente ao executável acima. O tester encerrou os navegadores após a rodada.

| Suíte da rodada 1.6 | Verificações/casos aprovados |
|---|---|
| Integração desértica | 13 |
| Estados/capturas por callbacks reais | 19 frames; P1/P2 válidos e retry funcional |
| Recorrência de NPCs | 32 |
| Estado dos protagonistas | 24 |
| Unidade dos músicos | 17 |
| Controles e co-op/mobile simulados | 22 |
| Progressão, saves e jogabilidade automatizada | 20 |
| Arte dos músicos / principais / Ninja-Arqueiro | 8 / 11 / 8 |
| Arte de inimigos | 8 |
| Bosses: unidade / browser | 18 / 8 |
| Site exportado | 4 |

A primeira tentativa da suíte de browser dos bosses completou seus oito checks funcionais e falhou pela presença de um único console 404 de `/favicon.ico`. O integrador adicionou um ícone canônico ao exportador e o tester repetiu somente as três suítes afetadas. A rodada final não tem erros; a ocorrência de infraestrutura permanece registrada no agregado, sem ser confundida com falha de gameplay.

A candidata preserva os assets dos seis heróis e a frente publicada de inimigos/bosses. A contagem de cenários permanece 13/131 + dois fundos, compondo 15/151 com A11/A12. A direção artística também reviu as onze áreas e 19 estados da composição 1.6 e registrou o aceite em `REVISAO_FINAL.md`; o histórico 1.4 permanece separado.

## Histórico anterior à interrupção

Resultados transmitidos pelo integrador para o executável de **393.520.875 bytes**, SHA-256 **`222eaeb6bcbc8f21dbee04dc614d3f366009979a3eb03f59a8aedd236d5a2e58`**. Não foram reexecutados pela coordenação nesta cópia.

| Evidência histórica | Resultado informado |
|---|---|
| Validação estática da build | 126/126 |
| Integração desértica em navegador isolado | 13/13; zero erros JavaScript |
| Geometria | 88/88; 25 mapas e 43 gates preservados |
| Compatibilidade de cenários | 13 verificações |
| Controles, mobile simulado e co-op | 22 verificações |
| Progressão, saves e jogabilidade automatizada | 20 verificações |
| Estado dos protagonistas | 24 casos |
| Recorrência de NPCs | 32 casos |
| Unidade dos músicos | 8 verificações |
| Arte integrada | Suítes de protagonistas, Ninja/Arqueiro e músicos aprovadas |
| Site exportado | 4 verificações |
| Câmeras e estados | Onze áreas/26 capturas e 19 estados; aceite artístico informado |

A retomada pelo botão real de Tentar novamente foi informada como válida: equipe moveu-se e o combate final pôde ser reiniciado. Isso não constitui uma luta vencida ou uma campanha manual nova.

## Aceite, riscos e fechamento

No escopo artístico anterior, não ficou P0/P1 aberto. Permanece um P2 opcional de repetição simétrica das dunas no topo. Os sete padrões foram solicitados à fixture, mas **sete geometrias distintas de aviso não foram afirmadas pela direção artística**; cross/fan/chase/orbit mostravam sobretudo anéis semelhantes nas capturas avaliadas.

A entrega foi integrada e publicada. O integrador abriu o site em navegador isolado e conferiu versão1.6.0, SHA517715fe…, módulos de músicos/inimigos/chefes presentes e cenário desértico decodificado, sem erros JavaScript. Conferiu ainda quatro PNGs públicos por SHA-256. O backup final no Dropbox inclui originais, 131 PNGs individuais, atlas, dois fundos, documentação e provas; o ZIP foi conferido por CRC e SHA-256. Metadados em `qa/cenarios-deserto-v1/PUBLICACAO.json`, `ASSETS_PUBLICADOS.json` e `BACKUP.json`.

Os limites continuam explícitos: contexto descartável/headless, controles simulados, nenhuma nova campanha manual completa, telefone físico ou dois controles físicos. A coordenação não identificou um novo defeito de produção pela leitura estática e conferiu os relatórios executados da candidata. Publicação e backup final confirmados pelas evidências acima.
