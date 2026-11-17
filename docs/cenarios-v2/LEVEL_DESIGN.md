# Cenários V2 — contrato de circulação e regressão

Revisão de game design de `th_game_designer`, reconstruída a partir do registro da tarefa após os arquivos locais ficarem indisponíveis. A matriz detalhada original de componentes por mapa não foi recuperada byte a byte; os critérios e resultados abaixo são os efetivamente registrados. Repositório base: `dab09c8b3679cd9a7a3c6c6e0ae6acd89b74e47d`.

## Escopo e pilares preservados

Revisar os 25 mapas, priorizando o Capítulo 3. A arte deve explicar o que já é caminhável, interativo ou bloqueado. Preservar música como ação, progresso visível, afeto antes de exposição, duas ordens possíveis entre Usina e Canal e o retorno seguro dos espaços. Não mudar dano, progressão, recrutamento, chaves de save, engine ou roteiro como parte desta revisão de cenário.

Personagens canônicos: Belga (`c3_maia`), Mazza (`c3_ciro`), Colli (`c3_nara`, `c3_nara_canal`) e Dney (`c3_vega`). Os IDs legados são preservados. Hutukara é um universo único; Torii são as máscaras. A decoração não cria outras máscaras sem explicação.

## Contrato de espaço

- Tile de 24 pixels; raio do corpo `.29` tile; interação a distância estritamente menor que `1.9` tiles.
- Colisão provém do footprint autoral, nunca de toda a altura ou do alpha da imagem. Copa, cobertura e fuste podem ocluir; a base deve explicar o sólido.
- Pisos ficam sob os personagens. Nenhum tapete, círculo ou soleira desenhado depois pode cobrir os pés por engano.
- Preservar o espaço de esquiva e o centro quieto de arenas. Objetos periféricos não devem parecer alertas de dano.
- Letreiros pertencem às fachadas; as entradas devem responder nas portas visíveis. Não resolver uma porta distante apenas deslocando seu nome.
- O alvo de largura para rua principal é seis tiles, e para beco opcional três a quatro. São metas de leitura, não medições confirmadas de todos os mapas.

## Capítulo 3 — circulação e função

| Área | Contrato de circulação e leitura |
|---|---|
| `sky_terminal` | Chegada, checkpoint e saída ao Distrito claros; linguagem de embarque, sem letreiro de clube |
| `distortion_district` | Ruas, calçadas, quarteirões e soleiras identificáveis; três acessos ajustados às fachadas; preservar colisões e acesso ao Canal/Elevador |
| `contratempo` | Separar palco, plateia, bar e projeção com piso/props; corredor entre entrada, Belga, Dney e frase musical livre |
| `power_plant` | Máquina e barreira legíveis; estado fechado barra travessia; Baixo abre a rota real; sequenciador alcançável depois; retorno livre |
| `sky_canal` | Água continua não caminhável antes do Violino; ponte conecta margens depois; resgate concluído deve ter feedback visual e retorno |
| `ciro_workshop` | Oficina de Mazza visitável; bancada e ferramentas integradas ao piso; não restaurar ida obrigatória cortada pelo pacing |
| `sky_lift` | Passarela sul → controle → embarque norte livre; receptor e encaixes explicam estado, sem cobrir saída |
| `cloud_sea` | Entrada sudoeste → A → plataforma → B → saída nordeste; topo quieto, bordas volumosas e vazio distinto; retorno em todos os estados |
| `cloud_terrace` | Terraço reconhecível; perímetro seguro; centro do Metrônomo livre, sem medalhão repetido a cada tile |
| `last_torii` | Entrada oeste, checkpoint central e Núcleo a leste; círculo único; pedestal não inventa máscaras decorativas |
| `silence_core` | Arena caminhável distinta do vazio; olhos periféricos, altar superior, passarela contínua; início/retry livres e alertas de combate legíveis |

A progressão implementada prevalece sobre roteiros antigos: `pacing.js` entrega a Flauta por Mazza e Colli no Contratempo. A oficina permanece opcional. Preservar as duas ordens de recrutamento.

## Capítulos 1 e 2 — completar sem descaracterizar

| Área | Contrato |
|---|---|
| `studio` | Mesa, teclado, sofá, janela e iluminação doméstica; console e saída acessíveis; não transformar em cyberpunk |
| `corridor` | Colunas com base rasa; corredor central livre para primeiro encontro |
| `chamber` | Pedestal único, vazio após aquisição; nenhuma máscara nova inventada |
| `city` | Poste, gravador, fonte/poço e calçadas coerentes com a cidade orgânica; pontes e acessos preservados |
| `forest` | Margens, ponte musical, sino e raízes com estados claros; copas não ampliam bases sobre o caminho |
| `ruins` | Pilares, pedras Pulso/Timbre e fenda detalhados; eixo entrada → arena e acessos laterais preservados |
| `rain_station` | Piso de plataforma e estação distinto do elevador cyberpunk; checkpoint legível |
| `voices` | Soleiras, pontes e relés; manter identidade quente do capítulo e estados de cabos/ponte |
| `tape_market` | Estantes, cabine da fita e balcão com silhuetas distintas; eventos acessíveis |
| `bento_shop` | Oficina de Belga; bancada/acoplador distinguíveis; ID interno preservado e saída sul limpa |
| `celina_home` | Sala doméstica; ponto de gravação e circulação integrados ao sofá |
| `radio9` | Zona de operação clara; bancada, Iris e gravador alcançáveis; preservar revelação do Técnico |
| `voice_roofs` | Parapeito e névoa respeitam barreira funcional; raízes seguem `fogCleared11`, não a flag de raízes do Capítulo 1 |
| `voice_tower` | Perímetro e relé central legíveis; chão quieto sob sinais do Arauto; saída e spawn livres |

## Mudanças físicas declaradas

A única alteração de colisão nesta revisão é retirar o anel caminhável excedente de `cloud_sea` nas células `x=1`, `x=w-2`, `y=1`, `y=h-2`, trocando o chão excedente por céu sólido. As demais áreas mantêm seus footprints. No baseline, a moldura permitia aproximação física à saída em 90 passos antes de formar as três passagens; o predicado do gate continuava exigindo flags, portanto isso não prova salto de capítulo. Na integração, a saída só fica fisicamente alcançável após A+plataforma+B.

Saves antigos sobre o anel removido exigem reparação de posição para o componente conectado à entrada, sem abrir flags. Essa reparação foi integrada pelo principal e tem sua evidência na suíte de runtime; não é executada pelo checker geométrico.

### Seis alinhamentos explícitos de portais

| Origem → destino | Campos | Antes | Depois |
|---|---|---|---|
| Distrito → Contratempo | `x,y` | `(15,20)` | `(13.5,16.5)` |
| Distrito → Oficina de Mazza | `x,y` | `(28,16)` | `(25.5,12.5)` |
| Distrito → Usina | `x,y` | `(56,14)` | `(55.5,12.5)` |
| Contratempo → Distrito | `tx,ty` | `(15.5,21.5)` | `(13.5,17.5)` |
| Oficina de Mazza → Distrito | `tx,ty` | `(28.5,17.5)` | `(25.5,13.5)` |
| Usina → Distrito | `tx,ty` | `(55.5,15.5)` | `(55.5,13.5)` |

Os hitboxes dos edifícios são conservados. A decisão final de aproximar portas e retornos substitui a intenção inicial de manter todas as coordenadas dos gates. As posições antigas na rua continuam caminháveis.

## Checker de regressão

```sh
node qa/cenarios_v2_routes.cjs qa/cenarios-v2/antes/MAPAS.json qa/cenarios-v2/depois/MAPAS.json
```

Os snapshots devem ser exportados da execução real de `C3.start(true)`, antes da conclusão das rotas. O relatório JSON vai para stdout; falhas retornam status 1. São 88 verificações: presença única das 25 áreas; dimensões; footprint caminhável; contrato exato dos gates; todos os pontos de chegada; anel removido; duas fases da Usina, duas do Canal e quatro das nuvens; preservação da conectividade das duas frentes.

O checker exige os valores anteriores exatos e um destino único para cada ajuste de portal, aplica somente os campos da allowlist e compara todos os campos serializados de todos os gates, inclusive `blocked` e ordem. Não aceita genericamente deslocamentos na cidade. Predicados em função não são serializados e pertencem à suíte de runtime.

Execução registrada antes da falha do filesystem: **88/88 nos snapshots reais**, 43 transições com chegadas válidas para `.29`; única remoção de 172 centros caminháveis no anel excedente das nuvens. Saída das nuvens indisponível nos estados nenhum, A e A+plataforma; alcançável em A+plataforma+B, a 66 passos de centros até o raio de interação. Usina e Canal conservam a conectividade nas respectivas fases.

Quatro mutações em memória foram rejeitadas: omitir um ajuste aprovado, mover outro gate, alterar `blocked` e remover um gate. Os JSONs reais não foram alterados por esses testes. O detector também foi validado inicialmente contra fixture sintética do anel; essa fixture não substituiu os snapshots reais da execução final.

O relatório detalhado `GEOMETRY_RESULTS.json` deve ser regenerado após recuperação dos snapshots. Os números acima são evidência histórica registrada, não uma nova execução sobre arquivos recuperados.

## Aceite e limites

1. Portas/soleiras e bases devem ser conferidas nas câmeras reais, vindo de sul/oeste/leste, com P1/P2; nenhum personagem deve entrar visualmente numa parede.
2. Testar estados fechado/aberto de Usina/Canal, as duas ordens de rota e retorno; a arte deve reagir às flags locais corretas.
3. Nuvens precisam distinguir rota formada, rota futura e vazio; topo caminhável e mecanismo seguinte legíveis sob touch.
4. Arenas devem preservar leitura de `ring`, `cross`, `fan`, `rain`, `chase`, `pulse`, `orbit`; centro sem novos sólidos.
5. Save/recarga, morte/retry, coop e movimento contínuo entre móveis exigem suas próprias provas de runtime/gameplay.
6. A comparação geométrica não testa controle físico, campanha manual, desempenho em aparelho real nem colisão percebida sob sprites altos. A direção artística responde pela aceitação visual das capturas.

Este revisor alterou somente checker/documentos e relatório. Nenhum runtime, asset ou build foi modificado por ele.

## Validação final da entrega

Build SHA-256 `41a7abfe9dac6a8059e488ea1e28ef9f9cd8a43dc796ab2ffbf6c22dcd222528`, 232.842.945 bytes, sobre a base publicada `54b8fff1992a58f59ca897e12b066d5b8afc9abe`. Preserva as correções de progressão, co-op, mobile e NPCs dos PRs #8/#9, os protagonistas V5 e Ninja/Arqueiro.

A execução final em Chrome isolado aprovou: **115 estáticas; 13 cenários; 88 geometria; 11 protagonistas; 8 variantes; 22 input; 20 jogabilidade; 4 site**. Unidades: 24 estados e 32 casos de NPC. A prévia passou nas 126 seleções, repetição 3×3 e largura mobile. Nenhum erro JavaScript foi registrado nessas suítes.

Os snapshots finais foram regenerados a partir da mesma build, desabilitando somente o módulo de cenários na referência anterior. A suíte confirma 43 chegadas válidas e apenas a remoção do anel excedente de 172 centros caminháveis, com os seis alinhamentos de portas explicitamente permitidos. Capturas com câmera congelada não representam campanha manual. Não houve validação de aparelho físico nem dois controles físicos nesta entrega.

A indisponibilidade dos arquivos locais foi contornada com uma cópia temporária recuperada do GitHub e reaplicação dos patches registrados nesta tarefa. Antes de incorporar os PRs novos, a reconstrução reproduziu byte a byte o hash `8b440916…`; a documentação reconstruída pelas especialidades está identificada como tal. Os testes listados acima foram executados novamente sobre o hash final. Os registros anteriores de interrupção são históricos e não representam pendências da suíte final.
