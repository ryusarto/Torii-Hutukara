# Revisão de cenários V2 — direção e aceite artístico

> **Adendo de direção — 17/11/2026:** o autor redefiniu a aparência do Capítulo 3 para deserto pós-apocalíptico cyberpunk. A paleta e os materiais do C3 passam a seguir o [contrato do deserto](../../design/chapter-03/DIRECAO_DESERTO_POS_APOCALIPTICO.md). Este registro V2 conserva o histórico e os contratos técnicos/geométricos; seus tons grafite/violeta não orientam a próxima variante C3. Capítulos 1/2 e assets compartilhados permanecem preservados. O novo visual está em produção e ainda precisa de integração e aceite.

Documento reconstruído a partir do conteúdo e dos resultados já escritos pelo agente `th_diretor_artistico` nesta tarefa. Não é uma recuperação byte a byte do arquivo anterior. Não foram relidos os arquivos locais dataless, repetidos testes ou reabertos cenários durante esta recuperação. IDs, ordem, grades e os 126 recortes do contrato foram preservados em `design/cenarios-v2/REVISAO_ARTE.json`; a redação dos prompts foi reconstruída e não substitui o registro exato das gerações.

Base da revisão: Beta1.1, commit `dab09c8`. Aceite final: integração visual da Beta1.2, capturas atualizadas de17/11/2026. O principal informou que os PNGs estão preservados no branch `art/cenarios-v2`, commit `a16e275`.

## Direção confirmada

O Capítulo3 já continha fachadas e muitos objetos detalhados aprovados. O principal problema estava na composição: superfícies com paredes/canos embutidos, panoramas recortados como tiles, motivos grandes repetidos, ausência de bordas coerentes e objetos importantes ainda desenhados como retângulos. Regenerar todos os bons assets apagaria o estilo sem resolver a integração.

A referência `design/chapter-03/RUA_DISTRITO_PROPOSTA.png` permanece a régua: asfalto e calçada distinguíveis, guia contínua, portas junto ao passeio, entradas claras, vida doméstica nas fachadas e luzes localizadas. Preservar clube, oficina e elevador icônicos; adicionar somente famílias complementares.

O jogo mantém HTML Canvas2D, tile lógico24×24 e perspectiva frontal em três quartos. Não foi aprovada migração de engine, introdução de3D ou perspectiva isométrica. A densidade e escala aparentes precisam concordar com os atores e com a câmera existentes.

### Regras visuais

- Grafite/violeta e metal envelhecido sustentam o mundo. Ciano identifica mecanismo/vento; magenta criação/palco/interferência; âmbar lugares habitados. Forma e posição também comunicam função.
- Pisos ficam mais quietos que personagens, projéteis e avisos de ataque. Não espalhar reflexo neon, olhos ou símbolos grandes por toda a superfície de combate.
- Materiais contêm somente material. Círculo, olho, altar, canos, plantas e móveis são peças separadas.
- Todos os arquivos são PNG RGBA. O interior dos swatches de material é opaco, e os gutters são transparentes. Props têm alpha real, sem fundo branco/cinza, cenário retangular ou halo.
- Pixels deliberados, contornos limpos, vizinho mais próximo e escala uniforme. Evitar blur, fototextura, deformação de eixos e rotação interpolada.
- Nomes de lojas continuam como texto do jogo. As imagens de placa são molduras vazias e suportes, sem letras geradas.
- Pés, base, sombra de contato, soleira e chão concordam. Não usar uma sombra retangular opaca para esconder encaixe ruim.
- Estados off/on mantêm tamanho e pivô. Portão aberto tem vão físico; válvula e âncora mostram alteração mecânica além de cor.
- Os capítulos anteriores preservam sua paleta rústica/acolhedora. Uma revisão total não transforma todos os mundos em cyberpunk.

## Contrato de exportação e integração

Cada recorte registra folha, retângulo real, tamanho de exibição, pivô, contexto, estado/flag e camada. Uma grade solicitada ao gerador não comprova limites exatos: recortar a partir do conteúdo real, eliminar vazamentos e preservar fontes.

Materiais usam repetição compatível com tile24; superpatch96×96 equivale a4×4tiles. Não desenhar o painel completo em cada tile. Os primeiros centros de nuvem foram recortados em18% para retirar o contorno da peça; as bordas recebem volume por vizinhança, e o centro não pode produzir uma rede preta.

O manifesto integrado usou props normalizados com pivô128,240 e conteúdo terminando em240, em vez do exemplo128,224 do briefing. Isso foi aceito: o requisito é o renderer respeitar o pivô real, não impor um número arbitrário. Arquitetura no atlas384 possui contrato próprio. Usar o fundo do canvas como contato físico criaria flutuação por causa do padding.

A imagem não altera collider, ponto de missão ou condição de passagem silenciosamente. Cogumelos permanecem pequenos e os mecanismos não se tornam edifícios. As seis alterações explícitas de portal abaixo foram acordadas com a revisão de game design.

## Lote fechado

| ID | Folha | Grade | Recortes |
|---|---|---:|---:|
| A01 | C3_SUPERFICIES_URBANAS.png |4×2|8|
| A02 | C3_SUPERFICIES_INTERIORES.png |4×2|8|
| A03 | C3_BORDAS_RUAS.png |4×4|16|
| A04 | C3_NUVENS_ENCAIXES.png |4×4|16|
| A05 | C3_FACHADAS_COMPLEMENTARES.png |3×2|6|
| A06 | C3_CONTRATEMPO_PROPS.png |4×3|12|
| A07 | C3_INDUSTRIA_ESTADOS.png |4×2|8|
| A08 | C3_LETREIROS_SOLEIRAS.png |4×3|12|
| A09 | C3_NUVENS_MECANISMOS.png |4×2|8|
| A10 | C3_SANTUARIO_NUCLEO.png |4×3|12|
| A11 | LEGADO_OBJETIVOS_C1.png |4×3|12|
| A12 | LEGADO_TRANSICOES_INTERIORES.png |4×2|8|

Total:12folhas e126recortes, incluindo variantes e estados. Não são126objetos novos a distribuir arbitrariamente pelos mapas. Os nomes e a ordem de cada célula estão no JSON recuperado.

Reutilização mantida: casas, árvores, móveis e pilares detalhados dos primeiros capítulos; conjunto C2 de estação/trem/antena/fonte/relé; prédios icônicos C3; bons objetos de oficina, canal, elevador e mobiliário urbano.

## Achados iniciais e correções observadas

1. `PB.materialV2` retornava para nuvens/plataformas antes da seleção de bordas de `PB.cloudTile`. O piso recebia panoramas e fotos repetidos. O novo renderer passou a apresentar céu separado, topo contínuo e borda externa legível.
2. O material de calçada V2 continha parede, tubulação e vegetação. As capturas antigas mostravam esses fragmentos espalhados pelo chão. Materiais limpos e guias recortadas eliminaram essa repetição na integração revista.
3. O Contratempo repetia o painel inteiro de tapete e usava palco, caixa, balcão e mesa geométricos. A versão integrada apresenta madeira contínua, palco e mobiliário PNG coerentes.
4. `c3_machine` servia simultaneamente de fachada da Usina e máquina interna. Os complementos distinguem acesso do prédio e dispositivos em escala menor.
5. O círculo de ressonância recortava um quadrado opaco de material do santuário; olhos também traziam painéis de fundo. Na integração revista, o círculo aparece uma vez no chão, atrás dos atores, e os olhos ficam nas margens sem quadrados opacos.
6. A tentativa inicial de A08 foi reprovada: fachadas completas no lugar de placas e alpha106..253, sem pixel alpha0. A folha regenerada foi revista e aceita como placas finas, setas e soleiras isoladas.
7. Fragmentos vizinhos apareciam em A06, especialmente `speaker_idle`, `club_table` e `projector_rig`. Foram removidos no contato final e nas capturas do clube.
8. A07 `canal_gate_open` já possuía abertura transparente real. A miniatura do contato escondia a diferença; não foi exigida regeneração por essa impressão.
9. O último P1 visual era a passagem do clube marcada cerca de4tiles abaixo da porta. A correção aproximou Clube/Oficina/Usina das suas soleiras e foi aceita na captura atualizada.

### Ajustes de portal explicitamente revistos

| Ligação | Ponto de entrada no Distrito | Retorno ao Distrito |
|---|---:|---:|
| Clube |13.5,16.5|13.5,17.5|
| Oficina |25.5,12.5|25.5,13.5|
| Usina |55.5,12.5|55.5,13.5|

Condições de missão, colisões e demais portais foram preservados pelo acordo da implementação. A direção artística confirmou a relação visual entre porta, placa, marcador e soleira; não executou novamente os testes mecânicos.

## Evidências e aceite final

**Aprovado para a entrega visual da Beta1.2, sem P0/P1 artístico concreto remanescente nas capturas inspecionadas.** Este é um aceite interno da aparência integrada, não uma declaração de acabamento definitivo nem aprovação autoral presumida.

Foram revistas imagens dos11mapas C3, além de exemplos dos capítulos anteriores, o contato dos126recortes e as fontes relevantes. A revisão final usou `qa/cenarios-v2/depois/`: `distrito-entradas.png`, `distrito-noroeste.png`, `contratempo-camera.png`, `ciro_workshop-camera.png`, `power_plant-camera.png`, `sky_canal-camera.png`, `sky_terminal-camera.png`, `sky_lift-camera.png`, `cloud_terrace-camera.png`, `nuvens-percurso.png`, `silence_core-camera.png`, `last_torii-camera.png`, `ruinas-pilares.png`, `studio-camera.png` e `radio9-camera.png`.

Capturas DOM iniciais possuíam HUD herdado do Terminal; alguns frames estavam claros por uma transição congelada. Esses artefatos não foram tratados como bugs reais de objetivo ou paleta. As imagens finais usadas no aceite foram capturas do renderer com transições assentadas.

O relatório `assets/cenarios/v2/VALIDACAO.json` foi consultado e registrava12folhas/126células, alpha PNG, escala uniforme e integridade de fontes. Resultados automatizados de renderer, estados e geometria pertencem ao integrador e ao game designer. Este diretor não repetiu essas suítes e não as apresenta como campanha jogada.

### Observações P2 sem bloqueio da entrega

- A franja da nuvem ainda é regular e o volume inferior é contido. Variação futura de contorno/profundidade pode melhorar naturalidade sem perder a leitura do caminho.
- A captura do Último Torii e o `itemFor(checkpointStone)` revistos ainda apresentavam o gravador rústico. Isso não confirmava a descrição verbal de quiosque metálico no C3. É uma diferença de ambientação sem erro funcional ou visual bloqueante; uma família metálica pode ser aplicada em revisão posterior.
- A lâmpada rústica C1 é coerente na vila/floresta. Perto dos sintetizadores no Estúdio, uma luminária de interior seria mais natural. Pode ser refinada por contexto reutilizando assets, sem ampliar o lote.

Limitações: revisão visual por capturas estáticas e contato, sem campanha manual completa por este agente, sem validação de movimento de câmera em aparelho físico e sem sessão com dois controles físicos. Não foram executados novos testes durante a recuperação deste documento.
