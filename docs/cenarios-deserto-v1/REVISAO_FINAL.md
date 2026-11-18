# Revisão artística final — deserto-v1

**Estado atual — candidata Beta 1.6.0:** aceite visual integrado concluído para as onze áreas C3 e os 19 estados registrados na build SHA-256 `517715fe2e742bf3e19b2e238f0286378e5c63335002a1e116cf62fe3b10b845`. Não foi identificado P0/P1 artístico nas imagens examinadas. A observação P2 de repetição das dunas permanece opcional. Publicação, regressões e testes de hardware pertencem aos seus relatórios próprios.

A Etapa 1 abaixo preserva o parecer histórico de assets isolados recuperado do checkpoint. Suas pendências de câmera/hash foram encerradas pela Etapa 2; não descrevem o estado atual da candidata. A revisão da build anterior `222eaeb6…` é histórica e não substitui esta conferência da composição com inimigos e chefes da Beta 1.5.

## Etapa 1 — novos atlas e fundos isolados

**Aceite estático: A09, A10, D12, D13 e os dois fundos aprovados para integração. Nenhuma regeneração bloqueante foi identificada nas imagens examinadas.** O aceite das onze áreas na câmera real permanece pendente da nova build e de seu hash. O integrador informou que a tentativa de rebuild encontrou ENOSPC; as capturas anteriores em `/final` não são evidência da produção completa.

Direção aplicada: `design/chapter-03/DIRECAO_DESERTO_POS_APOCALIPTICO.md`. A01–A08 e D11 conservam os aceites anteriores; não foram reabertos sem um defeito concreto. A04 possui seu parecer próprio de altura, com refinamento P2 de ondulação do miolo.

### Evidência inspecionada

Foram abertos os PNGs normalizados consumidos pelo pacote:

- `assets/cenarios/deserto-v1/atlas/D09_NUVENS_MECANISMOS.png`
- `assets/cenarios/deserto-v1/atlas/D10_SANTUARIO_NUCLEO.png`
- `assets/cenarios/deserto-v1/atlas/D12_COMPLEMENTOS.png`
- `assets/cenarios/deserto-v1/atlas/D13_COMPLEMENTOS.png`
- `assets/cenarios/deserto-v1/backgrounds/c3_desert_cinema_cloud.png`
- `assets/cenarios/deserto-v1/backgrounds/c3_desert_cinema_distortion.png`

O relatório `VALIDACAO.json` registra 13 atlas, 131 células, dois fundos e 131 entradas sem falha de gutter transparente, conteúdo vazio ou vermelho anômalo. A leitura estruturada do relatório confirmou essa contagem; esta revisão não reexecutou o empacotador. O campo `runtimeIntegrated: false` refere-se ao pacote e não serve como prova de integração da build. Fundos cinematográficos são cenas opacas intencionais; não se lhes aplica o requisito de recorte transparente dos props.

### Parecer por conjunto

| Conjunto | Constatação visual | Aceite e condição de aplicação |
|---|---|---|
| A09 — mecanismos da travessia | Metal reparado, corda, lona e latão/ferrugem mantêm a linguagem industrial. Baliza e condensador ganham sinal ciano localizado; vapor distingue o condensador ligado. A âncora muda a tensão da corda e o sinal sem perder sua base. | Aceito. Os pares devem conservar pivô e escala no runtime. O estado futuro/formado da passagem precisa ser demonstrado em câmera; o atlas isolado não comprova liberação da rota. |
| A10 — santuário e núcleo | O olho possui três estados realmente distintos. Raízes/cabos, pedra e metal prendem-no à estrutura, sem parecer um rosto solto. Altar apagado/aceso, círculo de seis pontos, arco e colunas pertencem à mesma família. A ponte deixa sua superfície de apoio explícita. | Aceito. Olhos ficam periféricos; o centro da arena precisa continuar silencioso. O círculo contém uma superfície de pedra intencional: usar a aplicação de chão/prepass pertinente e conferir assentamento, sem transformá-lo num quadrado de cenário sobre os atores. |
| D12 — mobiliário urbano/oficina | Banco, floreira, caixas, máquina de venda, grade, dreno, gravador, bancada e instrumentos mostram desgaste físico e reparo. A floreira mantém plantas cuidadas. O ciano fica nos pequenos aparelhos, sem recolocar a antiga dominância violeta. | Aceito. O pacote atende à lacuna visual D12 registrada na amostra; seu fechamento na cidade depende de verificar a substituição nas câmeras. Não aplicar essas variantes aos usos compartilhados de C1/C2. |
| D13 — aparelhos e estados de rota | Console de vento, diapasão, interferência, tubulação rompida, comando de elevador, receptor e trava de baixo compartilham metal corroído, mostradores e reparos. Interferência ativa/estável muda a geometria da onda e não apenas sua cor. Água no tubo permanece identificável. | Aceito. Confirmar a ligação entre flags e sprite, e a leitura junto a personagens e alvos. O atlas não prova alteração de collider nem desbloqueio. |
| Fundo de altura | Mesetas, poeira distante, ponte suspensa, marcos musicais de tubos, lona e Torii situam a travessia na nova direção. Profundidade atmosférica e piso firme se distinguem. | Aceito como fundo de diálogo, não como tile caminhável. Enquadrar retratos e texto sem esconder o destino visual nem simular uma passagem disponível que não exista no mapa. |
| Fundo do Distrito | Clube, oficina e elevador continuam reconhecíveis por função e silhueta. Lonas, sucata tecnológica, desgaste, vegetação cuidada e luz âmbar dão unidade à comunidade musical. | Aceito como fundo de diálogo. O centro aberto oferece espaço de composição; a definição maior da ilustração não substitui a escala pixelada dos sprites do mapa. |

### Transparência, estado e preservação

Não foi observado retângulo de cenário opaco nos espaços externos aos objetos dos quatro atlas. O preto de composição do visualizador não foi interpretado como pixel opaco do arquivo, e nenhuma cor RGB oculta sob alpha zero foi reprovada como franja visível. A garantia numérica dos gutters está atribuída ao relatório do pacote.

Os novos conjuntos não contêm substituições dos protagonistas nem uma máscara alternativa. Isso não comprova a preservação de seus sprites, pele, HUD ou C1/C2 na execução; essa verificação exige as câmeras e a regressão da build integrada.

### Pendência antes do aceite final integrado

Aguardar hash e imagens da produção completa. Conferir as onze áreas, os pares de estados pertinentes e as vistas P1/P2, com atenção a: mobiliário D12 efetivamente substituído; condensação futura versus passagem formada; água e limites do Canal; portais/soleiras junto às entradas; círculo e olhos periféricos no núcleo; contraste de ator e ataque; ausência de bloqueio visual indevido nas rotas.

Não houve controle do jogo, combate, colisão, transição de estado, save/retry ou avaliação em dispositivos físicos nesta etapa. O aceite está limitado aos assets isolados listados.

## Etapa 2 — integração visual da candidata Beta 1.6.0

**Parecer: apta à integração/publicação artística, sem regeneração bloqueante dos cenários.** Esta etapa é inspeção visual de PNGs produzidos pelo renderer real em navegador isolado; não é uma campanha jogada pelo diretor artístico.

### Identificação da evidência

- Build: `1.6.0`, SHA-256 `517715fe2e742bf3e19b2e238f0286378e5c63335002a1e116cf62fe3b10b845`.
- `qa/cenarios-deserto-v1/final/CAPTURAS.json`: onze áreas, 26 arquivos, hashes das imagens e ausência de erros de navegador registrada pelo capturador.
- `qa/cenarios-deserto-v1/estados/ESTADOS.json`: 19 quadros, versão/hash correspondentes, posições de P1/P2 válidas segundo o motor e callbacks reais de passagem. Esses dados mecânicos são evidência do capturador, não uma execução manual desta revisão.
- Foram abertos os mosaicos das onze câmeras e dos 19 estados. Entradas do Distrito, oficina, altura ausente, Canal sem ponte e avisos do Núcleo também foram examinados ampliados. Os mosaicos temporários só organizaram as capturas para comparação; não alteraram assets ou o jogo.
- A rodada definitiva de estados foi refeita após decodificar os 13 recursos de inimigos e os cinco clips de chefe. A primeira imagem `ring` anteriormente capturava um fallback violeta ainda não carregado; na imagem regravada, o chefe terroso aparece desde o primeiro quadro. Isso foi uma correção do fixture de captura, sem modificar o carregamento em produção.

### Onze áreas na câmera

| Áreas examinadas | Resultado observado |
|---|---|
| `sky_terminal`, `distortion_district`, `sky_lift` | Metal reparado, chapas, lonas, postes e pequenas luzes pertencem à mesma família. Pedra clara organiza a circulação no Distrito e se diferencia do pavimento escuro. Entradas, placas e mobiliário D12 aparecem vinculados aos estabelecimentos. O gravador, a floreira e a máquina de venda não recolocam a dominância violeta da amostra antiga. |
| `contratempo`, `ciro_workshop` | Madeira recuperada, instrumentos e bancada têm continuidade material; o centro de circulação permanece reconhecível. Palco ativo/inativo e pequenos aparelhos usam sinais locais. Os atores conservam paletas próprias e a máscara permanece junto à cabeça nas vistas examinadas. |
| `power_plant`, `sky_canal` | O conjunto industrial é coerente com os objetos e o piso. O Canal mantém uma faixa de água escura distinta de terra/pedra; a ponte resolve a continuidade física visual. Os dois lados da Usina e os aparelhos diferenciam os estados sem deslocar suas bases. |
| `cloud_sea`, `cloud_terrace` | O topo arenoso claro tem apoio visual firme; bordas erodidas e poeira distante indicam profundidade e vazio. A plataforma metálica se distingue das mesetas. O terraço dispõe de uma superfície clara contínua, sem objetos altos no centro da câmera. |
| `last_torii`, `silence_core` | Pedra, cobre e metal fazem a transição ao clímax. No Núcleo, olhos e colunas pertencem à arquitetura periférica; o plano de combate central continua livre. O piso escuro separa os atores e os sinais luminosos observados. A nova aparência do chefe é compatível com o ambiente sem exigir recoloração dos heróis. |

### Estados e sinais observados

1. **Altura 00 → A → plataforma → B:** o trecho ausente é vazio, o trecho formado é uma superfície contínua e o piso metálico da plataforma é distinto. Na rodada definitiva, ambos os jogadores estão apoiados sobre terreno visível; não foi reproduzido o posicionamento artificial sobre o vazio da captura inicial.
2. **Canal interferência/resolvido:** a ausência da ponte não é desenhada como terreno firme; na imagem anterior ao desbloqueio, a dupla permanece no cais. No estado resolvido, o apoio é contínuo e a interferência muda de forma/sinal. Água e margem são separadas por valor e material.
3. **Usina fechado/aberto e palco inativo/ativo:** mudanças locais são perceptíveis; aparelhos conservam posição, escala aparente e base. O estado não depende só de aplicar uma cor a todo o ambiente.
4. **Patrulha real do Distrito:** o aviso localizado contrasta com o caminho claro e os personagens se distinguem do pavimento. A imagem não comprova uma luta completa nem o equilíbrio do encontro.
5. **Núcleo:** foram examinados os quadros dos sete nomes de padrão. `cross` e `fan` agora mostram faixa e leque claros, em vez dos anéis semelhantes da fixture histórica; `ring`, `rain` e `pulse` têm contornos e áreas visíveis. Os tracejados direcionais/radiais observados em `chase`/`orbit` se separam do piso na imagem ampliada. Não se declara aqui uma aprovação completa de sete geometrias distintas nem da sequência de esquiva em tempo real. O relatório registra nomes reais e o capturador usa modo determinístico; uma campanha real continua fora do escopo.
6. **Após Tentar novamente:** a captura final mostra a arena e a formação desenhadas novamente. `ESTADOS.json` registra corpo válido, movimento e reinício do chefe; não foram exercitados pessoalmente pelo diretor artístico.

### Pendências não bloqueantes e limites

- **P2 — ondulação do topo A04:** o espelhamento das dunas cria losangos/chevrons amplos. Reduzir o contraste do miolo em um futuro refinamento pode tornar a areia mais compactada; não alterar as bordas aprovadas nem tratar essa preferência como um novo collider. Apoio e vazio já são legíveis.
- Os tracejados finos dos avisos merecem conferência em telefone físico; a inspeção em 768×432 não comprova legibilidade em toda densidade de tela, brilho ambiente ou qualidade de painel.
- A inspeção visual não mede FPS, memória, fluidez temporal de animação, sincronização sonora, colisões reais, dano, recompensas, ambas as ordens da campanha, vitória, saves pessoais, multitouch ou dois controles físicos. As suítes do revisor documentam as verificações que efetivamente executaram.
- A preservação de C1/C2 e dos seis personagens é atribuída às verificações comparativas de integração. Nesta etapa, o diretor reviu o conjunto C3 capturado; não afirmou jogar novamente os capítulos anteriores.

Nenhum PNG, código de produção ou arquivo de outro responsável foi alterado por esta revisão. O único arquivo editado foi este parecer.
