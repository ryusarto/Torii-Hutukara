# Cenários V2 — revisão independente da integração

Revisor: `th_coordenador`. Data: 17/11/2026. Versão em preparação: Beta 1.2.0. A revisão abrange `game/source/chapter-03/cenarios_v2.js`, sua posição no gerador, o manifesto normalizado em `assets/cenarios/v2/manifest.json`, o snapshot anterior dos mapas e os helpers já existentes. O revisor não modificou runtime, build ou imagens.

**Estado dos achados:** nenhum P0 ou P1 permanece aberto nesta revisão. O P1 de compatibilidade de posição de saves foi identificado, corrigido pelo agente principal e **encerrado após o teste real `normalizeSave → buildMaps → setArea` no Chrome**, com as três passagens ainda fechadas e corpo recuperado na rota ligada à entrada. O P1 visual das portas recebeu as seis correções pontuais descritas abaixo. O principal informou aceite artístico sem P0/P1; as suítes estão sendo repetidas após incorporar os protagonistas V5. Esta revisão não declara campanha manual, desempenho em aparelho real ou controle físico testados.

Build combinada em validação: `TORII_HUTUKARA_BETA_1_2_0.html`, 232.838.480 bytes, SHA-256 `8b440916c92218e393ab0242c69572af3ae21653a73248284914a0ea1a750361`. O manifesto portátil foi relido com esse hash. Ela incorpora a base publicada `524e68f4d1c7cb97bc3e81274db409c27ca86f0e`, preservando os protagonistas V5, e o passe de cenários. O commit `dab09c8b3679cd9a7a3c6c6e0ae6acd89b74e47d` continua como recuperação e origem do levantamento. As suítes de navegador estão sendo repetidas sobre a combinação final; os resultados anteriores não serão silenciosamente atribuídos a esse hash novo.

## P1 identificado: save antigo dentro do anel removido das nuvens

**Problema original.** `installMaps()` converte as células caminháveis da borda interna do Mar de Nuvens em céu sólido. A alteração física é coerente com o novo level design, mas um save da Beta 1.1 podia estar em uma dessas posições. O carregamento anterior executava `G=data; buildMaps(); setArea(G.area,G.x,G.y,false)` sem reparar a posição do jogador 1. `safeSpawn121` era usado para o jogador 2; o limite de quatro tiles dessa busca também não alcança necessariamente a rota a partir de um canto.

**Reprodução independente.** Com o snapshot real anterior e as funções reais `tileWalkable` e `moveBody10` extraídas da base, `(1.5,1.5)` era caminhável antes e sólido depois. Após 120 tentativas de movimento de 0,1 tile para direita, para baixo ou em diagonal, o personagem continuava em `(1.5,1.5)`. O corpo de raio 0,29 e os subpassos não permitem sair de dentro de um sólido apenas avançando os eixos. Isso poderia deixar um jogador sem movimento ao continuar ou importar um save antigo.

**Correção implementada pelo principal.** O código agora registra `env2RemovedCloudCells` no mapa e acrescenta um wrapper final de `setArea`. A reparação só ocorre no Mar de Nuvens, quando o corpo está inválido e toca uma célula efetivamente removida deste anel. A escolha de destino percorre a componente caminhável ligada à entrada `(5.5,26.5)`, em vez de escolher uma ilha ainda inacessível apenas por proximidade. Limpa trilha e movimento, corrige a câmera, sincroniza P2 somente nessa fronteira real de área/carregamento e salva a posição corrigida. Não acrescenta flag ou schema de save.

**Verificação isolada da correção:** aprovada em VM Node com snapshot real e helpers reais `canBody121`/`safeSpawn121`:

- `(1.5,1.5)` foi recuperado para `(3.5,25.5)`, com corpo válido;
- flags, progresso C3, HP e fragmentos permaneceram idênticos;
- trilha foi limpa e o reset de movimento executado;
- houve um único salvamento corretivo;
- a segunda chamada não alterou nada nem salvou novamente;
- uma posição inválida fora do anel não foi migrada por essa regra específica.

**Fechamento do P1:** `qa/cenarios-v2/RUNTIME_RESULTS.json`, última verificação da suíte, registra aprovação no fluxo real de normalização/carregamento. O teste constrói a cópia serializada do save em `(1.5,1.5)`, mantém `cloudPathA`, `cloudPlatform` e `cloudPathB` falsos, executa `normalizeSave → buildMaps → setArea` e confirma corpo válido, posição reparada e proximidade da componente de entrada. As três flags continuam falsas. Assim, a recuperação não depende de abrir as passagens nem coloca o jogador numa ilha final desconectada.

O teste de navegador cobre a cadeia de funções usada pelo carregamento. Ele não aciona o seletor de arquivos do sistema nem representa uma sessão manual nos botões Continuar/Importar. A VM independente também confirmou preservação de HP/fragmentos/flags, ausência de reparação repetida e ausência de alteração em uma posição inválida que não pertence ao anel. O fechamento técnico do P1 se apoia nessas evidências complementares, sem ampliar o que foi efetivamente executado.

## Observações de estado corrigidas durante a revisão

Foram comunicados dois problemas de leitura de estado, sem bloqueio de progressão comprovado:

1. A máquina do Canal dependia da abertura/conclusão da Usina. O código relido agora usa `canalPath || canalDone` nesse contexto, mantendo a fachada externa do Distrito separada das máquinas internas. As caixas de som também passaram a escolher seu estado conforme a área. A máquina da Usina acorda quando sua trava abre (`usinaGate`), sem alterar a condição real de conclusão da missão (`usinaDone`). Essa distinção deve permanecer clara no feedback visual.
2. A placa do Terminal, sem `theme`, caía na moldura do clube. O código relido agora escolhe o tema `lift` para Terminal/Elevador, preservando o texto dinâmico da placa.

Essas alterações não modificam callbacks de missão, recompensas ou condições de passagem. Sua qualidade visual fica com a direção artística e as capturas da build.

## P1 visual identificado e correção pontual dos portais

A direção artística constatou que o apron acrescentado não resolvia a distância entre a porta visível do Contratempo e seu trigger. O principal decidiu ancorar as passagens às fachadas por seis mudanças explícitas, preservando colisões e condições. O runtime relido altera somente:

| Passagem | Campos | Antes | Depois |
|---|---|---|---|
| Distrito → Contratempo | `x,y` | `15,20` | `13.5,16.5` |
| Distrito → Oficina | `x,y` | `28,16` | `25.5,12.5` |
| Distrito → Usina | `x,y` | `56,14` | `55.5,12.5` |
| Contratempo → Distrito | `tx,ty` | `15.5,21.5` | `13.5,17.5` |
| Oficina → Distrito | `tx,ty` | `28.5,17.5` | `25.5,13.5` |
| Usina → Distrito | `tx,ty` | `55.5,15.5` | `55.5,13.5` |

As três entradas preservam os destinos internos; os retornos preservam o ponto de saída dentro de seus ambientes. As demais passagens não mudam. Não há migração de schema nem invalidação de posições antigas salvas na rua, pois as colisões desse trecho permanecem iguais. A suíte de runtime foi ampliada para **13 verificações**, incluindo a escolha da interação junto à porta visível, coordenadas e corpo dos retornos dos três lugares. Ela passou antes da combinação final com V5 e está sendo repetida sobre a build combinada. A suíte de geometria atualizada usa essas seis alterações como exceções explícitas, sem aceitar outros deslocamentos.

## Ordem de carregamento e preservação dos sistemas

O gerador injeta `cenarios_v2.js` depois do runtime C3, controles, edições de diálogo, pacing, cura, padrões de combate, correções de fluxo, acessibilidade, telemetria, `ninja_archer_art_v1.js` e do runtime dos protagonistas V5, antes do único `init()` final. Portanto, os wrappers capturam as versões finais das funções que pretendem estender.

- `buildMaps` chama a cadeia anterior antes de instalar os complementos do cenário. A instalação é idempotente por objeto de mapa (`env2Installed`). Mapas recriados recebem seus complementos novamente; a mesma instância não duplica props.
- A instalação não escreve o objeto persistente `G`. O novo tratamento de save altera somente a posição inválida que acabou de ser identificada; não muda chave, schema, formação, atributos ou flags de missão.
- `drawTile` limita os materiais novos às áreas C3 e delega as outras áreas ao desenho anterior. A aparência geral já aprovada de C1/C2 não é substituída indiscriminadamente.
- `itemFor` deriva os estados atuais de flags já existentes. `rootGate` usa `fogCleared11` em `voice_roofs` e `roots` no Capítulo 1. O sino respeita `bell || bellReward`. O pedestal vazio depende de `masks`.
- A base continua filtrando `rootInstrument` depois de `bass`; o novo módulo não reintroduz a relíquia pega.
- A aquisição e entrega da Flauta continuam submetidas ao pacing atual. Não foi restaurada uma ida obrigatória à oficina.
- A única modificação de tiles/colisão encontrada na instalação é o anel interno de nuvem. Seis coordenadas de passagem são ajustadas conforme a tabela acima; não se afirma preservação de todos os portais. Hitboxes das fachadas, condições de passagem, recompensas, dano e duração do rolamento são preservados. A reparação de saves inválidos no anel é uma recuperação pontual adicional, já descrita.

## Prepass dos objetos no chão

O ramo existente `life091/rug` da base desenha o objeto antes de criar a lista ordenada de atores. O novo wrapper usa esse ponto para decalques e tapetes sem pintar por cima dos pés:

1. Guarda `type` e `kind` dos props `flat` e marca o tipo de origem;
2. a chamada de `drawProp` restaura temporariamente o tipo real para selecionar seu asset;
3. o wrapper interno usa `try/finally` para voltar ao tipo temporário;
4. o wrapper externo usa outro `try/finally` para restaurar os tipos originais e remover as marcas temporárias.

Com o snapshot real, foram verificadas em VM a conclusão normal e uma exceção deliberada dentro do renderer anterior. Nos dois casos os props recuperaram seus tipos e `kind` originais e não restaram `env2Ground`/`env2GroundType`. Esses objetos pertencem aos mapas, não ao formato persistente de save. Não foi encontrada mutação persistente acidental nesse prepass.

## Helpers e atlas

O caminho de interferência calma chama o helper com a ordem correta: imagem, coluna, linha, número de colunas, número de linhas, x, y, largura, altura. O spread de `C3_PROP_ATLAS.c3_interference_calm` resultou em `2,2,3,3,x,y,92,96`, como o helper espera. A representação numérica de y contém a variação normal de ponto flutuante antes do arredondamento do helper; isso não é um defeito de posição.

Foram validados documentalmente:

- **12 folhas normalizadas** com dimensões compatíveis com `grid × cell`;
- **126 retângulos de conteúdo** positivos e inteiramente dentro de suas folhas;
- presença das famílias dinâmicas `cloud_top_*`, `cloud_edge_*`, `cloud_outer_*`, `cloud_inner_*` e `sign_*`;
- pivô de apoio calculado pelo recorte e escala uniforme no helper, sem esticar eixos separadamente;
- imagens de superfície e props mantidos em funções distintas; nuvem contextual é selecionada antes de voltar ao renderer legado.

O helper `sprite()` usa o limite de conteúdo para apoiar os PNGs no chão, preservando a proporção. O pivô publicado no manifesto continua sendo informação de produção; a equivalência visual entre esse pivô e o ponto de apoio efetivo precisa ser conferida nas capturas. Esta revisão não substitui a inspeção de halos, costuras ou da qualidade dos recortes A07/A08.

## Carregamento e cache

`ensure(area)` começa pelas famílias pertinentes à área. `available()` solicita uma folha ainda não carregada quando aparece um prop de outra família; isso evita depender exclusivamente da lista inicial. Não há carregamento automático das doze folhas no título. `ready()` carrega todas explicitamente e deve permanecer um mecanismo de QA, não ser chamado inadvertidamente no início do jogo.

O número máximo de imagens referenciadas é finito: doze folhas. Pelas dimensões normalizadas, o conjunto inteiro corresponde a **24.489.984 bytes de RGBA teórico** (aproximadamente 23,36 MiB), antes de cópias do navegador/GPU e caches adicionais. Esse valor não representa a memória total do jogo. As texturas espelhadas são canvases pequenos de 192×192 por material usado, não canvases do tamanho do mapa.

Quando um recurso ainda não está pronto, o renderer anterior é usado onde disponível. Um `env2_prop` adicional pode ficar temporariamente ausente até o carregamento terminar; a geometria não depende dessa presença visual. Falhas de rede devem continuar fazendo o teste hospedado falhar, em vez de serem consideradas confirmação de asset integrado.

## Verificações independentes executadas sem Chrome

| Verificação | Resultado | Alcance |
|---|---|---|
| Instalação preserva o `G` serializado | Aprovada | VM + snapshot real |
| Repetir instalação não duplica props | Aprovada | VM + snapshot real |
| Colisões alteradas somente no anel de nuvem | Aprovada | 172 células do snapshot |
| Flag correta de `rootGate` por capítulo | Aprovada | Seleção do estado |
| Ordem de argumentos do helper do Canal | Aprovada | Chamada real ao stub do helper |
| Prepass restaura props no retorno normal | Aprovada | VM com renderer simulado |
| Prepass restaura props quando há exceção | Aprovada | VM com exceção deliberada |
| Recuperação pontual do save antigo no anel | Aprovada em VM e no Chrome | Helpers reais, mapa e cadeia real de carregamento |
| Folhas, retângulos e nomes dinâmicos | Aprovada | Manifesto e cabeçalhos PNG |

As primeiras sete verificações foram executadas antes da correção de posição; o teste específico da migração foi executado depois de reler a correção. Nenhuma delas é apresentada como prova de gameplay real ou avaliação visual.

## QA adicional da build final

Os arquivos abaixo foram relidos por esta revisão; os testes de navegador foram executados pelo principal em contexto isolado, não pelo coordenador.

| Evidência | Resultado | Cobertura comprovada |
|---|---|---|
| `qa/cenarios-v2/RUNTIME_RESULTS.json` | **13/13** na execução anterior à combinação com V5; repetição final em andamento | Recortes RGBA, materiais espelhados, precedência real das nuvens, flags por contexto, callbacks reais de Baixo/Violino, chegadas, prepass normal e com exceção, save serializado, flag de Telhados, instalação idempotente, reparação do save antigo e as três portas/seis coordenadas |
| `qa/beta-1.2.0/INPUT_TEST_RESULTS.json` | **22/22** na execução anterior; repetição final em andamento | Teclado, Gamepad API simulada, dash em 30/60/120 Hz, colisões, co-op, movimentação/interação P2, toque simultâneo, paisagem, diálogo e desafios de música; o hash do arquivo deve corresponder à execução relatada |
| Validador estático da build combinada | **115/115**, informado pelo principal | Integridade estrutural, cenários e três verificações adicionais dos protagonistas V5; não equivale a gameplay |
| Suíte de geometria com seis portais permitidos | **88/88** no snapshot real atualizado, informado pelo principal | Rotas/chegadas e estados físicos, sem aceitar outros deslocamentos de portal |
| Exportação hospedada | Round trip aprovado na versão anterior; conferência do hash combinado pendente | Confirmar `portableBuildUnchanged` e `gameContentRoundTrip` no `build-info.json` que corresponda ao hash combinado |

O relatório de input usa perfis de dispositivo e controles simulados. Mesmo quando o nome de uma verificação contém “physical controller”, isso descreve a troca do modo de entrada simulada pela suíte; não confirma um controle conectado fisicamente ou um teste em telefone real.

## Pendências de release e critérios preservados

1. Preservar o aceite artístico informado pelo principal e registrar as capturas finais, especialmente estados abertos/fechados, textos das placas e decalques antes dos pés dos atores. A direção apontou P2 não bloqueadores: regularidade do padrão das nuvens, gravador rústico no Último Torii e lâmpada do estúdio.
2. Repetir `qa/cenarios_v2_routes.cjs` sobre o último snapshot real antes/depois. O resultado anterior já foi 88/88; a repetição final deve acompanhar as últimas capturas, sem recorrer a uma fixture corrigida em memória.
3. Manter os resultados de runtime/input associados ao hash auditado. Se o runtime mudar depois desta revisão, avaliar o impacto e repetir as verificações afetadas.
4. Após o commit/deploy, conferir o hash e o carregamento das mídias no link público. A exportação local já passou no round trip; isso não prova por si só a disponibilidade do site externo.

Não há objeção estrutural identificada nesta revisão à publicação do incremento após as pendências acima. A aceitação artística e a validação em dispositivos físicos permanecem avaliações separadas; não foi declarada uma campanha manual completa.

## Recuperação do registro — 17/11/2026

Este documento foi recuperado dos patches literais do próprio agente, sem ler os arquivos originais marcados como dataless. As tabelas e conclusões anteriores foram preservadas; esta seção atualiza o estado operacional posterior.

A coleta da build combinada de hash `8b440916c92218e393ab0242c69572af3ae21653a73248284914a0ea1a750361` passou **13 verificações de cenário/runtime, 11 dos protagonistas V5, 8 de Ninja/Arqueiro e 22 de input**, sem erros JavaScript informados. O principal confirmou **115 verificações estáticas** e **88 de geometria**, com as seis coordenadas de portal autorizadas. Nenhum P0/P1 permanece aberto nos achados da revisão; os P1 de posição antiga nas nuvens e das portas foram corrigidos e tiveram verificação automatizada antes da indisponibilidade dos arquivos.

A validação final completa do site e do viewer não terminou depois que o macOS tornou arquivos recém-criados dataless; uma rodada anterior de PC havia passado. Os relatos anteriores de suite hospedada ou preview não devem ser atribuídos a uma nova execução concluída após essa falha. A recuperação não reexecutou testes nem comprovou disponibilidade do site público. Publicação/deploy final e conferência externa permanecem com o principal. Não houve teste de hardware físico ou campanha manual completa nesta revisão.
