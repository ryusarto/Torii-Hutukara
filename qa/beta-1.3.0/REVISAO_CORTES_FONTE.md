# Revisão dos limites de recorte

Data: 17/11/2026. Responsável: th_diretor_artistico.

Os dez avisos originais foram auditados por alpha, coordenadas nativas e conectividade dos pixels nos dois lados do limite. O registro completo está em `REVISAO_CORTES_FONTE.json`.

Nove avisos eram contatos seguros: havia contorno visível na linha y−1, integralmente incluída no recorte de cima, e nenhum pixel visível na linha y, início do recorte seguinte. O alpha máximo desses contornos varia entre 123 e 206; não eram apenas resíduos quase transparentes, mas também não havia perda.

Um aviso era corte real: em `franco_sintetizador_unmasked_defeat`, o limite global y450 atravessava o topo do cabelo das poses de costas 0 e 1. Os limites locais foram movidos para y445 e y444. Isso colocou 68 e 116 pixels visíveis, respectivamente, na pose correta. Nenhum pixel foi redesenhado.

A verificação por conectividade também encontrou dois contatos pequenos que ficavam abaixo do limiar quantitativo antigo: `ryuchi_percussionista_masked_run`, direção direita, frame 7 (y664→662, três pixels realocados) e `ryuchi_percussionista_masked_defeat`, direção direita, frame 1 (y667→664, oito pixels realocados). Ambos foram separados por corredores alpha vazios.

O empacotador mantém a escala constante em cada sequência e calcula posições verticais por coordenadas globais da folha (`origem do recorte + bounding box`). Assim, mudar um separador não cria deslocamento artificial nem apaga a oscilação vertical do personagem. As coordenadas e offsets ficam em `VALIDACAO.json`.

Resultado após nova exportação: 52 atlas, 208 sequências, 1.664 PNGs individuais locais e 32 retratos; zero fontes faltantes/rejeitadas, erros, frames vazios, clipping na saída ou sequências duplicadas. Quatro limites locais corrigidos, 195 pixels visíveis recolocados na pose correta, zero pixels visíveis da fonte perdidos ou duplicados e zero cortes de fonte não resolvidos. Os originais foram preservados.

## Conferência das novas amostras

- `ryuchi_percussionista_unmasked_signature` substituído: Ryuchi, baquetas e tambor corretos nas quatro direções, sem Franco nas linhas iniciais.
- Derrotas de Ryuchi com e sem máscara: as quatro direções terminam em pose deitada/horizontal e mantêm instrumento e máscara correspondentes.
- Quatro folhas de retratos: oito expressões por variante, personagem/instrumento correto; faces simplificadas chibi e máscara preservadas.
- A grande região clara visível no visualizador da fonte `ryuchi_percussionista_masked_defeat` foi medida em posições fora dos personagens: alpha máximo 3/255 na faixa superior examinada, sem pixels acima de 48. Os brancos opacos restantes pertencem à máscara. O efeito não é uma mancha opaca do fundo.

A conclusão acima verifica recortes e as amostras indicadas; fluidez perceptiva final também depende da reprodução na prévia e no runtime.
