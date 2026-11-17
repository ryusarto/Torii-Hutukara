# Revisão artística final — deserto-v1

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
