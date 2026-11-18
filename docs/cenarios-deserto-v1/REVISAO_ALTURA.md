# Revisão artística — leitura de altura, deserto-v1

**Parecer: amostra de A04 aprovada para prosseguir a A09. Não foi identificado P0/P1 artístico de separação entre apoio e vazio nas duas câmeras.** Há um refinamento P2 recomendado para o miolo do piso, sem exigir nova geração do conjunto.

Base: direção comum em `design/chapter-03/DIRECAO_DESERTO_POS_APOCALIPTICO.md`. Evidência observada: `qa/cenarios-deserto-v1/altura/nuvens-percurso.png` e `cloud_sea-camera.png`; build identificada pelo integrador como `bd6c7b…` (identificador abreviado informado, não hash completo verificado por este revisor).

## Topo, borda, vazio e apoio

- **Topo:** o arenito/areia clara forma uma superfície sustentada contínua. A família de material permanece coerente ao longo das passagens e plataformas; não há alternância de quatro materiais distintos a cada tile. Nas imagens, o personagem se destaca do piso, inclusive com a máscara marfim. As pequenas pedras e os depósitos de areia pertencem à mesma matéria.
- **Borda:** o contorno erodido castanho delimita os degraus do perímetro, enquanto a faixa de sombra diferencia a extremidade do topo. O recorte serrilhado acompanha a geometria da passagem e deixa inequívoco onde termina o apoio. A espessura visível é discreta; não é necessário aumentar paredes verticais para aceitar esta amostra.
- **Vazio:** a poeira distante tem valor e saturação diferentes do topo claro. Ela permanece visualmente atrás do recorte, sem ser confundida com outro piso caminhável. Os intervalos entre as ilhas são reconhecíveis nas duas vistas. A repetição do fundo é perceptível, mas não se assemelha a placas ou degraus de apoio.
- **Apoio:** pés, sombra do ator e gravador repousam visualmente no topo. Não foi observado retângulo opaco sob o personagem nem halo de recorte que deslocasse sua base. Esta observação de contato aparente não comprova colisão, alcance de travessia ou segurança de spawn.

A amostra realiza a nova leitura de ilhas/passagens elevadas sobre um mar de poeira. A avaliação não pede o retorno ao piso integral de nuvens violeta, nem considera a cor antiga dos mecanismos uma falha de A04.

## Refinamento P2 do topo

As ondulações largas formam losangos/chevrons simétricos que se repetem e chamam atenção nos trechos retos. Isso ainda não apaga a borda nem confunde chão com vazio; portanto, **não é P1 e não bloqueia A09**.

Para o acabamento, recomenda-se reduzir aproximadamente pela metade a amplitude de valor dessas ondulações **somente no material de centro**, conservando o ocre médio, as pedras pequenas e as bordas atuais. O miolo deve sugerir areia compactada sobre arenito, com depósitos mais pronunciados reservados às margens. Evitar repetir um losango central como desenho de cada módulo. É um ajuste localizado de material/recorte; não há justificativa visual nestas capturas para regenerar bordas, quinas e props já aprovados.

## Pendências externas ao aceite de A04

Os mecanismos violeta/ciano e alguns props antigos ainda aparecem sobre as ilhas. Pertencem aos lotes A09/A10/D13 pendentes informados pelo integrador. Sua adaptação deve manter eletrônica localizada, bases assentadas e funções reconhecíveis; não bloqueia a leitura do novo topo.

A09 deverá distinguir condensação futura, passagem formada e vazio sem depender apenas de recoloração. As duas capturas atuais não mostram um par de estados de condensação suficiente para aceitar essa distinção. Preservar a função narrativa da Flauta e os estados existentes.

## Limites

Revisão visual estática de duas câmeras, não campanha jogada, teste de movimento, combate, P1/P2, controles, desempenho ou transição de estado. Não foram alterados código, atlas, geometria nem contrato mestre. O parecer não declara as onze áreas concluídas.
