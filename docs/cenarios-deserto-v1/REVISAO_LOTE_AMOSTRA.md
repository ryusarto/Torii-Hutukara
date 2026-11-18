# Revisão artística do lote amostra — deserto-v1

**Parecer: lote aceito como conjunto estático para avaliação na câmera real. Nenhuma nova geração ou correção artística bloqueante foi identificada nos oito atlas revistos.** Este parecer não declara o novo C3 integrado, jogado ou publicado.

Regra aplicada: `design/chapter-03/DIRECAO_DESERTO_POS_APOCALIPTICO.md`, direção comumv1 já consolidada pelo chat responsável. Este arquivo é somente uma revisão subordinada àquela direção; não cria outro contrato mestre.

## Escopo e evidência

Foram abertos e inspecionados os PNGs normalizados em `assets/cenarios/deserto-v1/atlas/`: D01, D02, D03, D05, D06, D07, D08 e D11. O manifesto registra oito atlas e78células. Também foi consultado `assets/cenarios/deserto-v1/VALIDACAO.json`, cujas entradas registram gutter transparente, conteúdo não vazio e zero pixels vermelhos anômalos nos recortes.

O parecer visual foi feito sobre os atlas consumidos pela engine, não sobre a cor RGB oculta sob alpha0 dos previews de geração. A franja vermelha da fonte A01 não está sendo aprovada como decoração ou borda; não aparece como arte final nos patches normalizados revistos. As verificações numéricas de alpha e limpeza são atribuídas ao relatório do empacotador, sem alegar que esta revisão reexecutou sua suíte.

## Avaliação por família

| Família | Resultado estático | Condição para a câmera real |
|---|---|---|
| A01 — materiais urbanos | Aceito. Terra/pavimento fissurado, pedra arenosa, água escura e chapa corroída criam materiais distintos dentro da família ocre/ferrugem. Os acentos ciano são pontuais. Não há móveis ou fachadas impressos no chão. | Confirmar diferença entre chão seco, chão úmido, canal e vazio na escala24, inclusive com personagem e projéteis. O canal deve continuar sendo água, não uma vala seca caminhável. |
| A02 — interiores | Aceito. Madeira recuperada, ferrugem, pedra clara, basalto escuro e tecido remendado preservam variedade de função e valor. O tecido mostra reparo físico, sem repetir um grande emblema central. | Conferir o centro de combate e as áreas de circulação; detalhes de chapa/tábua não podem competir com telegráficos. |
| A03 — bordas | Aceito como matéria-prima de recorte. Guias, drenagem e travessias pertencem à nova paleta e dialogam com a calçada arenosa. | A folha ainda contém material preenchido em torno das guias. Manter a extração de tiras/cantos usada pelo renderer; não aplicar cada painel cheio como overlay de chão inteiro. Conferir continuidade nas quinas. |
| A05 — arquitetura complementar | Aceito. Lonas gastas, reboco erodido, chapas remendadas e ductos substituem a ornamentação violeta dominante. As moradias continuam acolhedoras e distintas dos acessos industriais. Vegetação aparece em vasos/locais cuidados, coerente com o refúgio comunitário. | Manter porta, soleira e collider nos pontos já corrigidos. Não ampliar jardim ou adereço para preencher corredores livres. |
| A06 — Contratempo | Aceito. Palco e caixas idle/active conservam a identidade musical; tecido acústico remendado, assentos gastos, madeira e equipamento recuperado realizam a mudança de matéria. Console e projetor continuam identificáveis como eletrônica funcional. | Conferir escala junto a Belga/Dney e aos atores; centro livre e palco reconhecível. A iluminação ativa deve ficar localizada. |
| A07 — indústria e estados | Aceito. Corrosão, soldas/reparos e faixas de serviço distinguem o conjunto das fachadas. Os pares conservam desenho/base; válvula, pressão e máquina têm respostas legíveis. A porta aberta possui vão visual real, consistente com a checagem de alpha informada pelo integrador. | Exibir a abertura com o chão atrás e conferir bloqueio/liberação no estado correspondente. Não confundir a pequena miniatura escura com uma porta fechada. |
| A08 — sinalização e soleiras | Aceito. Molduras finas, correntes, remendos, setas e painéis sem escrita são adequados para receber os nomes da engine. Não são fachadas reduzidas, nem trazem um fundo de cena opaco visível. | Conferir os nomes completos, comprimento de texto e posição junto à entrada. As soleiras são acabamento/feedback, não substituem a leitura física da barreira quando houver bloqueio. |
| D11 — complementos icônicos | Aceito. Clube e oficina continuam reconhecíveis, agora com lona, madeira reparada e metal gasto. Elevador fechado/aberto mostra estrutura de roldana e acesso; postes, utilidade elétrica, marco do terraço e gravador seguem a mesma família. As mudanças físicas vão além de um filtro castanho sobre a arte anterior. | Aplicar o manifesto e os footprints existentes: clube220×176, oficina190×132, elevador142×132 e demais tamanhos pertinentes. Não forçar toda a célula384 a ter a mesma proporção aparente no jogo. |

## Coerência com a direção comum

O conjunto mantém predomínio de terra, ferrugem e aço gasto, sombra mais fria e ciano/rosa residuais concentrados em função. Âmbar ainda comunica abrigo. Cabos, instrumentos, caixas, reparos e materiais recuperados mantêm o cyberpunk musical; a cidade não vira um cenário de sobrevivência genérico.

O acabamento apresenta contorno raster e agrupamentos de pixels compatíveis com a biblioteca existente. Nos materiais, a avaliação útil é o patch lógico96 em tile24, não o painel da fonte ampliado como se fosse um único tile. Nos props, respeitar pivôs e escala uniforme evita repetir a compressão e flutuação de passes antigos.

Não foram vistos personagens, máscaras de gás ou substituições da máscara Torii nos atlas deste lote. Isso não comprova preservação de elenco, HUD ou capítulos anteriores no runtime: o roteamento exclusivo por `C3.AREAS` ainda precisa ser conferido na integração.

## Limites do aceite

- Esta é a amostra de oito atlas/78células, não o aceite de todas as onze áreas redesenhadas. A04/A09/A10 e as demais composições fora do lote não foram avaliadas aqui.
- Não foram revisadas neste parecer câmeras reais do novo lote, repetição3×3 em movimento, combate, controles, saves ou morte/retry. O principal está preparando essas evidências separadamente.
- Não há alegação de desempenho ou gameplay em aparelhos físicos. As dimensões declaradas de D11 são contrato de aplicação, não prova de footprint executado.

**Encaminhamento:** prosseguir à amostra Distrito → Contratempo → entrada da Usina, com referência de personagem e um estado de combate/barreira. O próximo aceite verifica a composição e a leitura no renderer, usando os mesmos assets aprovados estaticamente; não exige outra geração de conceito neste momento.

## Complemento — revisão da amostra na câmera real

Build informada pelo integrador: SHA-256 `91ebc8aecb1f27f26cf29a8e72dafdaf66f0b0ff1f66cbdfb62730ba2d0fd3bd`.

Foram abertas as cinco capturas em `qa/cenarios-deserto-v1/amostra/`: `distrito-entradas.png`, `distrito-noroeste.png`, `contratempo-camera.png`, `power_plant-camera.png` e `sky_terminal-camera.png`. A amostra combina os oito atlas novos/78itens com os fallbacks V2 ainda pertinentes; não representa onze áreas concluídas.

**Aceite da direção na câmera: aprovado para esta amostra. Não é necessário regenerar os oito atlas nem refazer piso, casas ou interiores para prosseguir.** O fechamento da unidade visual dos espaços urbanos depende de completar o mobiliário D12 já identificado pelo integrador.

### Constatações visuais

- **Distrito:** o solo fissurado, a pedra arenosa dos passeios, o metal corroído e as lonas reparadas pertencem à mesma família. A diferença de valor entre passeio e chão separa circulação sem recolocar paredes/canos dentro da textura. As bases das casas não apresentam flutuação evidente nas duas vistas. A porta do Clube e a soleira permanecem vinculadas; a placa da oficina continua junto à fachada. No setor noroeste, a composição mantém os prédios reconhecíveis, sem retornar à versão violeta para preencher lacunas.
- **Contratempo:** madeira, tecido reparado, palco, caixas, mesa, assentos, balcão e projeção conversam entre si. Os pés dos móveis assentam no mesmo plano, sem retângulos de fundo nem fragmentos de células vizinhas visíveis. O centro da sala segue aberto na imagem. A luz âmbar preserva o acolhimento, e a criação musical continua identificável apesar do desgaste do abrigo.
- **Usina:** o metal gasto sustenta as máquinas e mantém o contraste com atores e aparelhos. A barreira central fechada é reconhecível como separação física e não como uma textura de piso aleatória. O console e a válvula continuam distintos. A imagem vista é um estado fechado/inativo; não comprova a liberação da barreira ou a alternância de estado em execução.
- **Terminal:** elevador, postes, marquise e material de chão pertencem à nova direção industrial. O metal e o ciano localizado preservam função tecnológica; o amarelo/âmbar não se tornou uma camada uniforme aplicada a toda a cena.
- **Elenco:** nas imagens, a máscara canônica continua marfim/neutra, e os músicos/NPCs conservam cores próprias de pele, roupas e instrumentos. A diferenciação dos atores em relação ao ambiente terroso demonstra visualmente que não foi aplicado um filtro ambiental global à imagem inteira. Isso é uma constatação das capturas, não uma comparação automatizada de todos os pixels dos personagens ou do HUD.

### Complemento necessário para fechar a amostra urbana: D12

A máquina de venda e a floreira do Distrito ainda exibem a família V2, com carcaças violeta e acentos rosa/ciano muito mais saturados e conservados que as novas fachadas. São diferenças localizadas e já conhecidas, não um motivo para redesenhar o lote aprovado.

Recomendo concluir D12 para os usos C3 do mobiliário urbano que ainda recorrem à família antiga: pelo menos máquina de venda e floreira visíveis nestas capturas, com banco, quiosque, grades e caixas pertinentes seguindo o inventário do integrador. Preservar silhueta, tamanho, pivô, texto/interação e footprint. Aplicar metal reparado, ferrugem e poeira física; manter plantas cuidadas e pequenos sinais funcionais em vez de apenas tingir toda a imagem. Não alterar as bibliotecas compartilhadas de C1/C2 para realizar esse complemento.

Não surgiu outro P0/P1 artístico concreto nas cinco vistas. D12 é a pendência de unidade visual para considerar a **amostra urbana acabada**; a amostra já pode comunicar a direção de deserto ao autor, com essa pendência explicitada.

### Limites desta etapa

A revisão mostra enquadramento, materiais, contato aparente, leitura de entrada e um estado visível da Usina. Não houve controle do personagem por este revisor, campanha jogada, combate observado em movimento, teste de transição aberta/fechada, medição de colisão ou ensaio em dispositivo físico. As regiões de nuvens/clímax e a preservação executada dos capítulos anteriores continuam fora destas cinco capturas. O aceite está restrito à direção e composição da amostra observada.
