# Parecer de direção artística — Ryuchi e continuidade da máscara

## Cobertura examinada
Revisão visual das 13 folhas geradas pelo renderer real drawActor: idle, walk, run, roll, attack_1, attack_2, attack_3, skill, advanced, signature, hurt, defeat e performance. Cada folha contém duas variantes, quatro direções e oito frames: 832 poses de Ryuchi examinadas. O material é contato estático do renderer; a cadência em tempo real e as transições de lógica de estado permanecem na verificação de runtime do root.

## Defeito concreto e correção dirigida
No masked/up, a máscara facial aberta atrás vira uma calota marfim nos estados roll, attack_1, attack_2, attack_3, skill e advanced. O idle canônico mostra um volume arredondado de tecido escuro e amarração expostos atrás. A mudança de material e anatomia fica evidente na transição idle→estado→idle.
Nos perfis left/right, a mesma perda do volume de tecido foi confirmada em roll e advanced. Os perfis de attack_1/2/3 e skill já mostram tecido e devem permanecer intactos. Walk/run têm projeção inclinada compatível com o movimento; não foram incluídos por hipótese.

São 80 poses alvo:48 em up e32 em perfis. Destas,71 recebem alterações localizadas;9 permanecem idênticas: roll frames4,5,6 nas direções left/up/right. Nessas nove, o dorso da cabeça está oculto pelo corpo/instrumento ou rotação, de modo que não há razão para inventar abertura visível ou impor cabeça de idle. O roll mantém a cabeça inclinada/invertida de cada pose.

## Corpo, enquadramento e sequência
Não vi corte evidente de membros/instrumento nem salto grave de alinhamento nos contatos de Ryuchi. Defeat termina horizontal nas quatro direções e nas duas máscaras. Signature mantém a identidade de Ryuchi em todas as linhas. A recuperação do roll6→7 é rápida mas legível.
VALIDACAO contém104 sequências de Ryuchi, todas em coordenadas globais da fonte e fitFactor1.0. Há uma escala por sequência, fixa nos oito frames; não há reajuste de escala frame a frame. A composição candidata usa crops/placements congelados e parte do atlas canônico, alterando apenas as diferenças da área de cabeça. Não é necessário recalibrar corpo/pivô para corrigir a máscara.

## Evidência e estado da aprovação
Os seis resultados imagegen e os prompts estão preservados em ryuchi_candidatos/GERACOES.json e respectivas pastas de estado. As fontes e atlas canônicos não foram escritos por este agente durante esta revisão.
A auditoria candidata final contém12 entradas (seis fontes e seis atlas),71 regiões editadas, outsideRegionsChangedPixels0 e hashes RGBA fora das regiões iguais em todas as entradas. Os nove no-ops constam explicitamente em unchangedPoses das entradas roll (fonte e atlas).
Verificação independente final por sharp, após a última correção do root: buffers RGBA base/candidato foram comparados em cada uma das12 imagens, excluindo somente os retângulos declarados; resultado0 pixels diferentes fora dessas regiões em todas as imagens e9 poses únicas de roll preservadas. Esta verificação foi executada antes da promoção e independe dos hashes calculados pelo compositor.
REVISAO_UP_QUATRO.png é uma prévia antiga: revelou resíduo vertical dourado da costura antiga atravessando o beanie, porque a proteção por cor quente preservou esses pixels. O root corrigiu a proteção na faixa central, inclusive a pose inclinada roll/up/frame3. Os seis atlases candidatos ATUAIS foram reinspecionados diretamente depois dos ajustes: a costura não atravessa mais o tecido. Os dois pixels quentes que restam na borda superior de roll/up/frame3 pertencem à transição marfim/tecido da própria geração; não formam uma linha sobre a abertura. Aprovação visual final concedida para os seis estados Ryuchi, sem necessidade de novas gerações ou expansão de escopo.

## Segundo olhar independente — Franco
COMPARACAO_UP.png do root, attack_2/attack_3/skill, mostra os cachos restaurados atrás dos fones sem a calota fechada. A solução visual está aprovada quanto à construção da máscara facial e à continuidade da identidade. O volume de abertura varia com o ângulo das poses; não vi necessidade de ampliar o escopo.

