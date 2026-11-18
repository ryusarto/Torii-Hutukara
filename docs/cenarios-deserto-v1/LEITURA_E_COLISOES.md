# Cenários desérticos V1 — leitura e colisões

Escopo do game designer: requisitos de leitura e correspondência física para os **106 recortes/estados A01–A10** do Capítulo 3, preservando os **20 A11–A12** de legado. A direção confirmada pelo autor é deserto pós-apocalíptico cyberpunk, com chão terroso, sucata e ferrugem. O contrato mestre é coordenado em outro chat; este documento não estabelece uma paleta concorrente, nomes novos, lore, roteiro ou alterações de missões. As famílias abaixo são funções a conservar durante a nova arte, não aprovação visual de PNGs ainda não entregues.

Referências consultadas: `assets/cenarios/v2/manifest.json`, `game/source/chapter-03/cenarios_v2.js`, `docs/CENARIOS_V2.md`, `docs/COMBATE_PADROES.md` e o contrato geométrico recuperado em `qa/cenarios_v2_routes.cjs`. A revisão foi documental e de código. Não foi realizada nesta etapa uma nova campanha, inspeção de assets desérticos gerados nem teste de aparelho/controle físico.

## Limites de integração

- Permanecem os **25 mapas**, a mesma malha, sólidos, eventos, missões, regras de combate e esquema de save. Não acrescentar obstáculos físicos para justificar um desenho de sucata.
- Permanecem os seis alinhamentos de entradas/retornos já implementados e a remoção dos 172 centros excedentes do anel de `cloud_sea`. Não reinserir a moldura caminhável por meio de um novo desenho de meseta.
- O reparo de saves antigos sobre esse anel continua ligado à posição e à componente conectada à entrada. Trocar nuvem por poeira não autoriza desligar a recuperação nem abrir flags automaticamente.
- IDs como `cloud_top_a`, `ceu_nuvens_fundo`, `c3_cloud`, `sky_canal` e `c3_nara` são contratos técnicos legados. A direção visual pode mudar sem renomeá-los e sem introduzir novos lugares/personagens no texto.
- Os atlas atuais possuem funções, recortes e pivôs definidos no manifesto. Reutilizar essas funções e pares de estado, respeitando o contrato técnico de exportação do principal. Este documento não exige novo tamanho de célula, contagem ou orçamento de desempenho.
- A11–A12 continuam legíveis na identidade dos capítulos anteriores. Complementos de fachadas legadas, se produzidos pelo principal, seguem portas, bases, pivôs e colisões existentes; não propagam automaticamente o deserto cyberpunk ao Capítulo 1.

## Quatro categorias que não podem se confundir

| Categoria física existente | Leitura exigida na nova arte | Reprovar quando |
|---|---|---|
| Chão caminhável | Plano superior contínuo e relativamente quieto: terra compactada, laje ou chapa assentada. Pequenos detritos aparecem aderidos ao solo, sem silhueta de barreira | Toda junta vira vala escura; uma placa sobreposta parece degrau impeditivo; o chão contém grandes objetos falsos |
| Vazio / céu sólido | Abaixo da borda da meseta, com queda e camada de poeira distante. Não repetir exatamente a textura ou os marcos do topo caminhável | Poeira opaca apaga a borda; um fundo claro parece continuação da trilha; retângulos de textura parecem ilhas acessíveis |
| Obstáculo já sólido | Base visível de parede, sucata compacta, grade ou talude. A base coincide com o bloqueio; altura e sombra explicam que o personagem passa atrás ou contorna | A sucata invade caminho livre, a barreira real é pintada como chão ou o personagem é bloqueado antes de chegar à base |
| Água / canal não caminhável | Superfície rebaixada, margem e desenho de fluxo distintos da terra. Cor é apoio, não a única diferença | Água turva é indistinguível de chão de barro; reflexo ou crosta parecem ponte; margem esconde a entrada da ponte real |

Uma sucata meramente decorativa sobre célula caminhável deve parecer baixa e transponível. Uma pilha alta ou uma carcaça de porte não pode ser adicionada ali como se fosse um novo sólido. Em caso de conflito, ajustar a arte ao footprint preservado, sem aumentar a hitbox do mapa.

Sombras de contato ficam junto das bases; não podem ser interpretadas como buracos. Rachaduras decorativas não atravessam a largura inteira de uma passagem como uma fenda real. A diferença entre topo e vazio precisa sobreviver a uma captura em tons de cinza e à redução para o tamanho de jogo.

## Matriz A01–A10

| Folha | Quantidade | Adaptação funcional ao deserto | Critério de leitura |
|---|---:|---|---|
| A01 — superfícies urbanas | 8 | Terra compactada seca/úmida, vias assentadas, chão de serviço, canal, metal, poeira distante e abismo | Piso não contém fachada, móvel ou poste embutido. Água e vazio têm margens inequívocas. A variante úmida continua chão, sem parecer poça impeditiva |
| A02 — interiores e travessias | 8 | Madeira gasta, oficina de sucata, plataformas e pontes reparadas, pedra/metal final | Juntas de chapa e tábuas não criam falsos vãos. Tapete/palco são superfícies no passe de chão. Parede não se confunde com piso metálico |
| A03 — bordas e soleiras | 16 | Guias desgastadas, contenções, travessias e drenos | Direções e cantos montam a borda da célula real. Não formar calçada fechada em volta de uma passagem aberta. Dreno decorativo não vira uma fenda no percurso |
| A04 — topologia suspensa | 16 | Quatro topos de meseta/plataforma compacta com bordas de erosão, faces inferiores e poeira distante | O topo é firme; poeira é fundo, nunca apoio. Cantos externos e internos seguem vizinhança, sem dentes ou linhas escuras no interior de uma ilha contínua |
| A05 — fachadas complementares | 6 | Moradias remendadas, entrada industrial, marquise e arco funcional reaproveitado | Habitação reconhecível por porta, janela, sombra e infraestrutura; não um monte indistinto de sucata. Pé da fachada, soleira e nome se referem ao mesmo acesso |
| A06 — Contratempo | 12 | Palco montado, caixas, bar, assentos, projeção e instrumentos reparados | Palco/plateia/bar são zonas compreensíveis. Equipamento não vira grande cobertura sobre evento ou NPC. Estado ativo tem sinal local, sem competir com alertas de combate |
| A07 — indústria e estados | 8 | Máquina, pressão, válvula e comporta com aparência reparável, não apenas destroços | Cada par conserva base/pivô. Fechado e aberto diferem por forma/abertura, não só brilho. Comporta aberta tem vão real no alpha; o PNG não promete passagem antes da flag |
| A08 — sinalização | 12 | Placas reaproveitadas, setas, soleiras e embarque/píer | Placas sem nomes rasterizados: texto correto continua no jogo. Setas têm direção inequívoca. Soleira fechada mantém o alvo de interação legível, sem simular nova parede |
| A09 — mecanismos de percurso | 8 | Baliza, condensação/estabilização, âncora e marcador de corrente retrabalhados como tecnologia de sucata | O mecanismo seguinte se reconhece parado. Ativado muda uma peça/sinal identificável, além da cor. Estados futuros não desenham chão firme antes de abrir a rota |
| A10 — limiar e arena final | 12 | Olhos, altar, círculo, arco, passarela e colunas no mesmo vocabulário material do capítulo | Topo da arena quieto; volume e vigilância nas margens. Olhos decorativos não imitam mira de dano. Círculo é chão; altar e colunas não reduzem a área existente de esquiva |

As 106 células incluem estados e peças de encaixe; não são 106 novas colisões. Os 20 recortes de legado também permanecem uma biblioteca de funções existentes. Complementar uma fachada não cria um novo estabelecimento acessível.

## Norte, fachadas, soleiras e nomes

1. O norte do mapa continua no alto da câmera. Portas voltadas para a rua devem ter abertura, moldura e sombra de contato no mesmo ponto, sem uma segunda falsa porta numa parede desenhada ao lado.
2. Cobertura e parede norte podem subir visualmente; sua base não cresce para sul. A rua junto à casa permanece rua, inclusive no noroeste do Distrito, onde já houve relato de aprisionamento junto a casas.
3. O letreiro é anexado à fachada ou a seu suporte. Não deslocá-lo para uma região livre distante apenas para caber texto. O nome não deve cobrir o personagem que usa a porta.
4. Não embutir nomes de NPCs, missão, comércio ou instruções na textura. Preservar texto vivo e nomes canônicos renderizados pelo jogo; a nova arte precisa oferecer uma área vazia suficiente para ele.
5. O marcador funcional deve apontar ao gate real. Ferrugem, símbolos ambientais e luzes de decoração não podem repetir a mesma forma do marcador como falsos objetivos.

### Coordenadas a conservar

| Relação | Entrada no Distrito `x,y` | Retorno ao Distrito `tx,ty` |
|---|---|---|
| Contratempo | `(13.5,16.5)` | `(13.5,17.5)` |
| Oficina de Mazza | `(25.5,12.5)` | `(25.5,13.5)` |
| Usina | `(55.5,12.5)` | `(55.5,13.5)` |

Essas seis posições substituíram acessos afastados das portas; não são sugestões de novo layout. Todos os demais gates, destinos e condições continuam os atuais.

## Antigo Mar de Nuvens como poeira e mesetas

A substituição é uma leitura material da topologia existente. O que sustenta o personagem é o **topo firme da meseta/plataforma**. Uma nuvem de poeira sozinha não explica apoio e não pode substituir a silhueta do chão. O vazio recebe poeira distante sob as bordas; erosão e face inferior aparecem apenas onde há vizinho não caminhável.

- O render por vizinhança continua distinguindo topo, quatro bordas, quatro cantos externos e quatro internos. Uma ilha retangular não deve exibir uma moldura em cada tile.
- Chapas/passarelas entre mesetas têm contato explícito com as duas extremidades. Não deixar um pequeno vão visual se a passagem física é contínua; não desenhar união sólida onde o motor continua bloqueado.
- Nas etapas futuras, sinais de corrente, poeira ou mecanismo podem indicar o destino, mas **não uma laje completa**. A confirmação de rota formada precisa mostrar apoio contínuo no mesmo momento em que as flags o tornam caminhável.
- A faixa retirada do perímetro continua vazio. Ornamento periférico não deve desenhar um contorno firme convidando o jogador a dar a volta pelas bordas.
- Pouso, checkpoint e retorno preservam pivôs e corpo válido. O trecho seguro de chegada precisa ser visível mesmo com P2 ao lado.

| Estado existente | Alvos fisicamente alcançáveis a conservar a partir da entrada |
|---|---|
| Nenhuma passagem formada | Mecanismo A e retorno; plataforma, B e saída ainda não |
| A | Plataforma e retorno; B e saída ainda não |
| A + plataforma | B e retorno; saída ainda não |
| A + plataforma + B | Saída e retorno |

Essa tabela descreve alcance físico. Condições de missão, entrega de Flauta, falas e predicado do gate não são substituídos por ela.

## Estados locais e feedback

- Máquina do Canal reage a `canalPath`/`canalDone`; máquina da Usina a `usinaGate`/`usinaDone`. Enferrujar os dois desenhos não autoriza fazê-los compartilhar a flag.
- A barreira industrial bloqueada deve ser visível exatamente onde o motor bloqueia; liberada, seu segmento de obstrução desaparece da passagem. Não transformar a grade antiga em simples padrão de chão.
- A comporta/resgate concluído deixa de comunicar bloqueio. Válvula liberada, palco ativo, âncora e baliza ativadas mantêm a mesma posição e escala de suas versões inativas.
- Não usar animação de perigo constante para indicar apenas que uma máquina está ligada. Confirmações curtas/localizadas e mudança estrutural legível preservam a leitura do combate.
- A nova direção não altera as duas ordens Usina→Canal e Canal→Usina, recrutamentos, recompensas ou resposta da frase musical.

## Combate, co-op e mobile

O chão terroso e o metal enferrujado podem aproximar a cor dos projéteis, armas e avisos existentes. Não resolver isso alterando o kit, o dano ou o timing. Reservar variação baixa e detalhes pequenos no plano de luta; concentrar cabos, carcaças e texturas fortes nas margens já ocupadas.

Critérios para as sete famílias de aviso `ring`, `cross`, `fan`, `rain`, `chase`, `pulse`, `orbit`:

- Contorno, centro e direção são discerníveis sobre terra, chapa, palco e piso do Núcleo na câmera real. Uma rachadura, olho ou círculo decorativo não repete um aviso funcional de maneira ambígua.
- Nenhum prop novo cobre a borda do aviso ou os pés de P1/P2 durante a área de esquiva. Pisos e decais permanecem antes dos atores; volumes altos respeitam a oclusão atual.
- Poeira decorativa não encobre projéteis, alvos, HP ou caminho de fuga. Poeira local da borda não ocupa o centro da arena como neblina opaca.
- Dois personagens junto à mesma porta, ponte ou mecanismo continuam identificáveis. O novo desenho não sugere um corredor mais estreito que o footprint já existente nem esconde o segundo jogador atrás de sucata caminhável.
- O alvo de interação continua reconhecível sob os botões touch translúcidos em retrato/paisagem. Pequenas luzes ou letras rasterizadas não podem ser a única indicação de entrada ou mecanismo.

Não são pedidos de câmera nova, split-screen, mudança de controles, física de puxão ou HUD. Esses sistemas permanecem sob seus próprios responsáveis.

## Aceite verificável antes da publicação

| Verificação | Resultado exigido | Evidência adequada |
|---|---|---|
| Cobertura e arquivos | A01–A10 mantêm 106 funções/estados; A11–A12, 20; PNGs com alpha real nos props/gutters, sem fragmentos de outro recorte | Manifesto, recortes e contato; não apenas imagem do conceito |
| Materiais repetíveis | Nenhuma emenda abre fenda ou vira grade de bordas internas; teste 3×3 sem móveis ou placas embutidos no piso | Prévia dos materiais e câmeras reais |
| Chão/vazio/água/sólido | Categorias distinguíveis por base, relevo, margem e continuidade, inclusive sem cor | Capturas coloridas e em cinza do mesmo enquadramento |
| Geometria | 25 mapas, footprint preservado exceto os 172 centros já removidos; somente os seis gates alinhados | Snapshot real e checker existente; nenhuma fixture substitui o snapshot |
| Estados de rota | Usina, Canal e quatro etapas das mesetas coincidem com os bloqueios reais; retorno conservado | Capturas por flag e execução dos callbacks reais existentes |
| Portas | Os três acessos do Distrito respondem na soleira visível; volta não coloca personagem dentro de base/parede | Aproximação no motor e comparação dos seis pontos |
| Telegraphs | As sete famílias de aviso continuam legíveis com P1/P2 sobre os novos pisos | Capturas durante combate na câmera real; imagem vazia não basta |
| Compatibilidade | Save sobre anel antigo é reparado sem abrir flags; save normal conserva posição/progresso | Teste de carregamento real existente e comparação de estado |
| Legado | A11–A12 e fachadas complementares preservam identidade, portas e sólidos dos capítulos anteriores | Câmeras dos três capítulos; não só o Distrito |

A execução anterior ao redesenho registrou 88/88 verificações geométricas, 43 chegadas válidas e os 172 centros removidos. Esses números são **baseline**, não prova de que a nova arte já foi integrada e testada. Repetir apenas os checks pertinentes após a integração e registrar o hash final. Nenhum requisito deste documento depende de refazer história, mapa, missão, paleta mestre ou mecânica de combate.
