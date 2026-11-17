# Revisão de cenário V2 — coordenação

Levantamento inicial: Beta 1.1, commit `dab09c8b3679cd9a7a3c6c6e0ae6acd89b74e47d`, em 17/11/2026. A base atual de integração incorpora também `524e68f4d1c7cb97bc3e81274db409c27ca86f0e`, com os protagonistas V5 preservados. O commit inicial permanece como ponto de recuperação e referência das capturas anteriores. A revisão cobre os três capítulos; a produção prioriza o Capítulo 3. O projeto permanece em HTML Canvas2D, com tile lógico de 24 px, interfaces desktop/mobile e co-op local. Nenhuma migração de engine, novo personagem ou ampliação do roteiro faz parte deste incremento.

## Responsabilidades e posse de escrita

| Responsável | Entrega | Escrita autorizada |
|---|---|---|
| Agente principal | PNGs, recortes, integração, mapas, testes e publicação | Runtime/build/arte binária; único escritor |
| th_diretor_artistico | Identidade, briefs e revisão no enquadramento real | `DIRECAO_ARTISTICA.md`, `REVISAO_ARTE.json` |
| th_game_designer | Caminhos, interação, colisão e leitura de combate | `LEVEL_DESIGN.md`, `REVISAO_LEVEL.json` |
| th_coordenador | Cobertura, dependências e critérios de conclusão | Este documento e `INVENTARIO_TECNICO.json` |

O coordenador não altera o runtime nem publica a build. Mudanças dependentes de arte e colisão são integradas em sequência pelo agente principal. O ponto de recuperação é o commit acima, sem sobrescrever a base histórica 1.1.2.

## Evidência de cobertura

`qa/cenarios-v2/antes/MAPAS.json`, capturado pelo agente principal no motor, contém **25 áreas, 81 tipos de prop e 1.031 instâncias** no estado desse snapshot. São contagens desse estado, não totais imutáveis da campanha: progressão pode remover NPCs, mudar passagens e alterar props. O inventário técnico relaciona cada tipo real, as áreas, o caminho de render e a decisão de reuso ou produção. A revisão desta coordenação é documental e de código; capturas e gameplay são avaliados pelos outros responsáveis e pela integração.

Não cabe substituir tudo que tem uma forma simples. Árvores e casas já aprovadas, o mobiliário bem recortado, os postes/pilares pré-beta e os sprites de trem, antena, fonte e relé do Capítulo 2 devem ser preservados. As 565 árvores e 125 cogumelos do snapshot exemplificam por que quantidade de instâncias não equivale a quantidade de assets novos.

## Problemas que arte sozinha não resolve

1. **Precedência de nuvens.** `chapter3_runtime.js:350–351`: `PB.materialV2` devolve sucesso para `c3_cloud`/`c3_platform` antes de `PB.cloudTile`. Os contornos contextuais ficam sem uso. Corrigir a seleção de renderer é parte necessária da integração dos novos recortes.
2. **Recorte de conceito como material.** `c3MaterialTile` calcula `cell=naturalWidth/4` para ambos os eixos. `PB.materialV2` divide cada painel em 8×8 trechos; objetos e círculos desenhados no painel viram repetição do piso. O manifesto novo precisa de retângulos explícitos, proporção preservada e variantes que sejam materiais reais.
3. **Limite físico sem limite visível.** `C3.boundary` marca somente as células sólidas. Interiores, usina, terminal e arenas precisam de moldura, parede ou borda visível compatível com esse limite, preservando as aberturas.
4. **Entradas afastadas das fachadas.** Clube e oficina têm pontos de interação aproximadamente 4,35 tiles abaixo da base de seus sprites atuais. Placa mais bonita não corrige isso. Usar soleira/caminho contínuo até o trigger ou alinhar âncoras com teste de rota. O game designer define a solução final.
5. **Estado mecânico sem estado visual.** `c3_interference`, `c3_canal_gate` e `c3_rescue_barrier` usam a mesma célula antes e depois de `canalPath`/`canalDone`. A trava da usina é a linha sólida x=17, mas não tem representação contínua equivalente. O elevador é a exceção atual: já seleciona aberto/fechado por `liftOpen`.
6. **Um tipo, escalas incompatíveis.** `c3_machine` representa fachada da usina no Distrito e seis instalações/máquinas nos mapas. O asset externo precisa ser selecionado por contexto ou usar tipo distinto sem mudar o save.
7. **Móveis ainda geométricos.** Palco, caixas de som, balcão e mesas do Contratempo são `rect`/círculos. Também seguem procedurais `lamp` do Capítulo 1, gravadores, raízes, sino, poço, poça, totem, cristal e partes de janelas/quadros. Em `life091`, oito janelas e três quadros ainda usam `furniture091`; os móveis de sete outras categorias já têm imagem.
8. **Piso decorativo confundido com prop.** `c3_resonance_circle`, olhos e altar são extraídos de painéis de materiais. O círculo precisa ser decalque transparente; os olhos e o altar precisam de recortes próprios que não transportem um quadrado de chão opaco.

## Decisão revista: seis coordenadas de passagem do Distrito

A revisão artística no motor demonstrou que só acrescentar um apron/soleira ainda deixava a interação do clube distante da porta. O principal autorizou uma correção pontual de **três entradas e três retornos**, em unidades de tile, sem mudar condições, recompensas, callbacks de missão ou colisões das fachadas. Não se deve afirmar que todas as coordenadas dos portais permaneceram iguais.

| Passagem | Campos alterados | Antes | Depois |
|---|---|---|---|
| Distrito → Contratempo | `gate.x`, `gate.y` | `(15,20)` | `(13.5,16.5)` |
| Distrito → Oficina | `gate.x`, `gate.y` | `(28,16)` | `(25.5,12.5)` |
| Distrito → Usina | `gate.x`, `gate.y` | `(56,14)` | `(55.5,12.5)` |
| Contratempo → Distrito | `gate.tx`, `gate.ty` | `(15.5,21.5)` | `(13.5,17.5)` |
| Oficina → Distrito | `gate.tx`, `gate.ty` | `(28.5,17.5)` | `(25.5,13.5)` |
| Usina → Distrito | `gate.tx`, `gate.ty` | `(55.5,15.5)` | `(55.5,13.5)` |

As coordenadas internas de chegada aos três ambientes e as posições de saída dentro deles não foram alteradas. As outras passagens também permanecem como antes. Saves antigos na rua continuam em posições válidas: a correção muda o ponto de interação, não transforma essas posições em paredes. O schema e a chave de save não mudam.

O teste de runtime passou a conferir proximidade das três portas, escolha real da interação, corpo no retorno e coordenadas esperadas. A suíte de geometria precisa usar essa mesma tabela de seis mudanças permitidas; qualquer outro delta de portal deve falhar. A correção do anel de nuvem e a recuperação pontual de saves antigos continuam sendo as únicas mudanças físicas/posicionais adicionais deste incremento.

## Produção finita acordada com a direção artística

| ID | Folha | Grade | Recortes/estados | Uso principal |
|---|---|---|---:|---|
| A01 | Superfícies urbanas | 4×2 | 8 | Asfalto seco/molhado, calçada, laje, água, metal, céu e abismo |
| A02 | Superfícies interiores/arena | 4×2 | 8 | Madeira clube/oficina, plataforma, pedra/basalto, ponte, tapete e parede |
| A03 | Bordas e guias urbanas | 4×4 | 16 | Calçadas, quinas, encontros, travessias e transições |
| A04 | Nuvem contextual | 4×4 | 16 | Centros quietos, bordas, cantos e encaixes caminháveis |
| A05 | Fachadas complementares | 3×2 | 6 | Três moradias, fachada usina, terminal/arco e módulo complementar |
| A06 | Props do Contratempo | 4×3 | 12 | Palco, caixas de som, balcão, mesas e complementos funcionais |
| A07 | Estados industriais | 4×2 | 8 | Trava grave, sequenciador, equipamento inativo/ativo |
| A08 | Molduras e soleiras | 4×3 | 12 | Placas sem letras, símbolos e conexão física das entradas |
| A09 | Mecanismos nas nuvens | 4×2 | 8 | Flauta, Tambor, ancoragem e condensação em estados legíveis |
| A10 | Santuário e Núcleo | 4×3 | 12 | Olhos, altar, ressonância e bordas próprias do fim do jogo |
| A11 | Objetivos e props C1 | 4×3 | 12 | Objetos procedurais recorrentes, gravador e estados de relíquia |
| A12 | Transições e interiores compartilhados | 4×2 | 8 | Janelas, portas, quadros e acabamentos C1/C2 |
| | **Total** | | **126** | **Recortes e estados; não 126 objetos únicos** |

O diretor artístico mantém a ordem final de cada célula. A lista é um limite de produção, não autorização para gerar objetos sem uso: cada recorte precisa apontar para um tipo, estado ou superfície existente. Se dois grupos usarem o mesmo recurso, integre-o uma vez. Preserve clube, oficina e elevador aprovados; A05 complementa a família, não obriga a substituição dessas fachadas.

## Incrementos verificáveis

1. **E1 — leitura do chão e dos limites.** A01–A04, mais bordas de A10 onde necessário. Corrigir precedência, cortes e estados do piso. Comparar capturas antes/depois das 25 áreas, com prioridade nas 11 áreas C3. Aceite: passagem caminhável distinguível de céu/água/vazio e nenhuma costura de painel ou símbolo grande repetido por tile.
2. **E2 — cidade e entradas.** A05, A08 e reuso dos atlas urbanos/oficina/elevador. Ligar as fachadas às portas reais, dar variedade às moradias e tornar o perímetro físico legível. Aceite: cada gate do Distrito alcançável com corpo completo, com caminho visual contínuo, sem entrar na parede ou esconder um jogador.
3. **E3 — espaços de ação e estados.** A06, A07 e A09; reuso dos props do Canal. Aceite: travas e interferências reagem às flags atuais, palco reconhecível e áreas centrais livres para mira, esquiva e dois jogadores. Não adicionar colisão a um grande retângulo só porque o PNG o ocupa.
4. **E4 — clímax e continuidade.** A10–A12 e estados de objetivos de C1. Aceite: Núcleo não parece o Mar de Nuvens, altar não duplica o santuário por acidente, círculo tem alpha, objetos pegos não reaparecem visualmente, e C1/C2 preservam sua identidade.
5. **E5 — regressão e publicação.** Gerador portátil, validação estática, inspeção visual real no motor, rotas nas duas ordens de recrutamento, saves relevantes e controles/coop. Só publicar como integrado após essas evidências; guardar fontes e exports no backup e o código/manifestos no GitHub.

## Contratos e critérios de integração

- PNG RGBA para todas as exportações. Props, placas, decalques, bordas de nuvem e transparências realmente recortados. Pisos de superfície podem preencher seu quadro: alpha opaco de um material não é falha de recorte; é diferente de um fundo indevido atrás de um objeto.
- Manifesto por asset: arquivo e hash, grade/retângulo, tipo de recorte, dimensões lógicas, pivô, escala, filtragem nearest, uso/área, ordem de camada, flags e ocupação física separada. Não inferir a grade apenas dividindo uma folha irregular.
- Pivô no ponto de apoio do objeto. Para decorações altas, corpo e projétil precisam continuar legíveis; colisão usa a base/solo, não a caixa completa da imagem.
- Repetir materiais pelo menos 3×3 na escala real; revisar quinas externas e internas de nuvem, junção com plataforma e margens de água. A textura deve continuar baixa em contraste no centro das arenas.
- Moldura de placa em PNG; nomes continuam no texto do jogo. Manter grafia pública Belga/Colli/Mazza/Dney e IDs históricos compatíveis com saves. Não gerar nomes como letras dentro da imagem.
- Estado visual derivado das flags e mapas atuais. A Flauta é entregue no clube quando `pacing.js` move Mazza e Colli; não restaurar a obrigação de voltar à oficina a partir de documentos antigos.
- Carregar atlas por família/área e manter cache explícito. Registrar dimensões decodificadas e bytes. O histórico de carregamento em duas ondas do Capítulo 3 não pode regredir por carregar todas as fontes de alta resolução no título.
- Build offline incorpora os arquivos; exportador hospedado precisa continuar reconstruindo os mesmos bytes/mesmo conteúdo. Nenhum asset final depende do caminho pessoal de Dropbox ou `.codex/generated_images`.
- Código, manifestos, PNGs integrados e testes ficam no GitHub. Dropbox/T&H guarda originais, recortes individuais, ZIPs e evidências de backup. Drive excluído pelo autor.

## Evidência mínima para fechar

1. Inventário final cobre todos os 81 tipos do snapshot, com reuso explícito onde não houve troca, e todos os novos tipos adicionados no incremento.
2. As 126 células planejadas têm identificação, resultado de produção e decisão de integração; descartes documentados, sem fingir que um conceito é um asset pronto.
3. Os 13 tipos de piso C3 têm caminho de render definido. Bordas contextuais das nuvens são chamadas e testadas, não somente presentes no código.
4. Estados antes/depois da usina, Canal, clube, elevador, caminhos de nuvem, gravadores e relíquias são capturados sem contradizer a progressão atual.
5. Verificações de porta/colisão/rolamento percorrem as rotas do Distrito, inclusive noroeste; entradas do Núcleo e retries permanecem válidos. Mobile/coop são verificados na build final; teste automatizado e teste físico são relatados separadamente.
6. Capturas de enquadramento real e hashes dos PNGs/build acompanham a entrega. Nenhum editor ou arquivo binário fica com dois escritores simultâneos.

## Limitações desta coordenação

Este documento registra revisão estática do código final e inventário de um snapshot do motor. Não comprova fluidez, desempenho em aparelho real ou campanha manual completa. As quantidades de produção e a ordem de integração são propostas acordadas entre as especialidades e o principal; os responsáveis devem registrar o resultado real de cada etapa.

## Recuperação do registro — 17/11/2026

Este documento foi recuperado dos patches literais do próprio agente, sem ler os arquivos originais marcados como dataless. As tabelas e conclusões anteriores foram preservadas; esta seção atualiza o estado operacional posterior.

A coleta da build combinada de hash `8b440916c92218e393ab0242c69572af3ae21653a73248284914a0ea1a750361` passou **13 verificações de cenário/runtime, 11 dos protagonistas V5, 8 de Ninja/Arqueiro e 22 de input**, sem erros JavaScript informados. O principal confirmou **115 verificações estáticas** e **88 de geometria**, com as seis coordenadas de portal autorizadas. Nenhum P0/P1 permanece aberto nos achados da revisão; os P1 de posição antiga nas nuvens e das portas foram corrigidos e tiveram verificação automatizada antes da indisponibilidade dos arquivos.

A validação final completa do site e do viewer não terminou depois que o macOS tornou arquivos recém-criados dataless; uma rodada anterior de PC havia passado. Os relatos anteriores de suite hospedada ou preview não devem ser atribuídos a uma nova execução concluída após essa falha. A recuperação não reexecutou testes nem comprovou disponibilidade do site público. Publicação/deploy final e conferência externa permanecem com o principal. Não houve teste de hardware físico ou campanha manual completa nesta revisão.
