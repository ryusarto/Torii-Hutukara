# Cenários V2 · Beta 1.2

A revisão cobre os **25 mapas**, com prioridade nas **11 áreas do Capítulo 3**. A direção artística, o game designer e o coordenador inspecionaram código, referências e capturas do motor. O baseline contém 81 tipos e 1.031 instâncias de props; isso não significa que todos precisavam ser substituídos.

## Entrega

| Folha | Células | Uso |
|---|---:|---|
| A01 | 8 | Asfalto, calçada, beco, água, metal, céu e abismo |
| A02 | 8 | Madeira, metal de plataforma, pedra, basalto, ponte, tecido e parede |
| A03 | 16 | Guias, cantos, travessias, dreno e soleira |
| A04 | 16 | Quatro topos e bordas/cantos de nuvens por vizinhança |
| A05 | 6 | Três moradias, entrada da Usina, marquise e arco de chegada |
| A06 | 12 | Palco, caixas, bar, mesas, assentos, projeção e instrumentos |
| A07 | 8 | Estados de máquinas, pressão, válvula e comporta |
| A08 | 12 | Placas vazias, setas, soleiras e embarque/píer |
| A09 | 8 | Estados de flauta, condensação, tambor e fundações |
| A10 | 12 | Olhos, altar, círculo, torii, ponte e colunas finais |
| A11 | 12 | Objetivos rústicos do Capítulo 1 |
| A12 | 8 | Janelas, porta, quadros, acesso interior e margens do Capítulo 2 |

**126 células/estados**, não 126 objetos novos com colisões adicionais. A biblioteca inclui variantes e peças reutilizáveis; sua existência não cria uma nova missão ou obstáculo. As casas icônicas do Clube/Oficina/Elevador, árvores, mobiliário bom dos capítulos anteriores e props detalhados de oficina/canal/elevador continuam sendo usados.

## Como o mapa mudou

O chão deixa de ser uma fotografia de cenário cortada em tiles: materiais, mobiliário e sinais são recursos separados. As superfícies usam recortes limpos de 96×96 e amostragem espelhada em 192×192 para repetir bordas idênticas. A rua continua num mundo de tile24; guias extraem uma faixa do PNG autoral, sem colar a fotografia completa da calçada no chão.

O Mar de Nuvens usa um topo quieto e peças de borda selecionadas pelos vizinhos. O volume fica na borda, com céu visível do lado de fora. A precedência antiga impedia esse desenho e foi substituída na cadeia final de `drawTile`. Terminal e Elevador usam plataforma metálica; elipses procedurais gigantes deixam de cobrir o caminho.

No Distrito, os pontos de entrada do Clube, Oficina e Usina passam a ficar junto das portas visíveis, com soleira e placas anexadas às fachadas. Somente essas três entradas e seus três pontos de retorno foram ajustados; as condições de acesso continuam as mesmas. O texto continua sendo renderizado pelo jogo para manter nomes corretos e legíveis. A coluna bloqueada da Usina é representada por metal e segmentos de grade; sua abertura acompanha os tiles liberados pelo Baixo. No Canal, interferência e comportas reagem ao progresso. Não foram alteradas recompensas ou ordens de recrutamento.

O Núcleo recebe basalto discreto, olhos e altar com alpha real, em vez de painéis retangulares e vórtices repetidos no piso. Círculo e outras peças de chão entram no passe anterior aos atores. A iluminação e os desenhos de chão não dependem de alterar as hitboxes do boss ou os avisos de ataque.

## Geometria e saves

A única alteração de colisões desta revisão é retirar o anel caminhável excedente deixado por `mk('cloud_sea', …, 'c3_cloud')` na moldura interna do mapa. Era possível contornar as trilhas por ele, embora o portal final ainda exigisse flags. As demais áreas preservam colisões. Seis coordenadas de entrada/retorno foram aproximadas das fachadas, conforme descrito acima; suas posições antigas na rua continuam caminháveis e não invalidam saves.

Saves anteriores podem conter P1 sobre essa faixa. `repairLegacyCloudPosition()` corrige somente posições inválidas que tocam células removidas. Uma busca percorre o componente caminhável conectado à entrada e escolhe o centro válido mais próximo. Isso evita colocar um save antigo numa ilha final ainda isolada. HP, itens, relíquias e progresso permanecem iguais; não há campo ou schema de save novo.

## Contrato dos arquivos

- `assets/cenarios/v2/`: 12 atlas, manifesto com retângulos/pivôs, validação e `PREVIA.html`.
- `production/pack_cenarios_v2.py`: normaliza as folhas autorais preservadas no backup. Recortes de conceito não são presumidos perfeitamente uniformes; gutters e componentes são verificados.
- `production/export_cenarios_v2.py /destino`: reconstrói os 126 PNGs individuais a partir dos atlas publicados.
- `game/source/chapter-03/cenarios_v2.js`: integração aditiva, carregamento por área e seleção dos estados.
- `docs/cenarios-v2/`: direção artística, level design, coordenação e revisão independente da integração.
- `design/cenarios-v2/`: inventários e contratos detalhados. Prompts e hashes finais também estão no manifesto de assets.

Props usam escala uniforme, recorte pelo conteúdo e contato na base; atlas mantêm gutters alpha zero. Materiais são opacos dentro do seu recorte, com transparência nas margens da folha. PNGs individuais e fontes de geração ficam no Dropbox/T&H → Assets → Torii & Hutukara → Cenarios → cenarios-v2. A primeira A08, reprovada por conter fachadas e fundo sem alpha zero, foi preservada no backup e substituída na integração.

## Verificação e limites

Resultados e comparativos ficam em `qa/cenarios-v2/`. As capturas de mapa completo usam os renderers reais de tiles/props; câmeras usam `drawEnv` na resolução de produção. São imagens de uma sessão de QA congelada, sem HUD, não uma campanha manual jogada. Capturas completas ficam no backup; o Git mantém snapshots de geometria e comparativos selecionados.

As verificações cobrem integridade/alpha dos 126 recortes, encaixes dos materiais, precedência das nuvens, estados visuais, callbacks reais de Baixo/Violino, carregamento de save anterior e restauração das camadas de desenho. As regressões existentes cobrem controles, co-op, touch e rotação. Não foi realizada uma nova campanha manual completa nem validação com dois controles ou celulares físicos nesta entrega.
