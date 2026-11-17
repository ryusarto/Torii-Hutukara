# Empacotamento dos sprites musicais

`empacotar.py` lê `PLANO_E_PROMPTS.json` e as imagens em `originais/`. Ele recorta e posiciona as poses já desenhadas; não cria poses nem interpola frames. As fontes nunca são sobrescritas.

Com Python, Pillow e NumPy disponíveis:

```sh
python empacotar.py
```

O comando exporta atlas de 2048 × 1024, quadros individuais locais em células de 256 × 256, retratos e os dois nomes de manifesto (`MANIFESTO.json` e `manifest.json`). Use `--no-frames` para dispensar os PNGs individuais. A publicação pode conter apenas atlas, retratos e fontes; a prévia e suas miniaturas leem diretamente o atlas e não requisitam arquivos em `frames/`.

As linhas do atlas são frente, esquerda, costas e direita. Cada linha contém oito poses autorais. O pivô é `(128,224)`. A escala usa vizinho mais próximo, é constante dentro de cada sequência e parte da altura da pose inicial: alvo de 180 pixels sem máscara e 198 com máscara. Quando uma ação larga ou alta exige redução para caber na célula, o fator é registrado em `VALIDACAO.json`. A diferença entre a altura inicial e as demais poses é preservada; saltos e rolamentos não são artificialmente fixados pelos pés a cada frame.

Os separadores são detectados por vales de ocupação alpha, admitindo pequenas irregularidades na grade. Quando um limite horizontal global atravessa uma figura em determinada coluna, busca-se um corredor alpha vazio nessa coluna e registra-se o deslocamento do limite. O cálculo vertical usa a origem de cada recorte mais o bounding box, em coordenadas globais da folha: o deslocamento do separador não se transforma em movimento falso nem apaga o bounce. A escala continua constante nas oito poses. A grade verifica que cada pixel visível da fonte pertence exatamente a um recorte; perdas ou duplicações interrompem seu processamento. As caixas de recorte, ajustes e hashes das fontes ficam no relatório.

O relatório distingue contato de borda e corte real. Um contorno na linha imediatamente anterior ao limite não é perda se a primeira linha do recorte seguinte estiver vazia. Só pixels visíveis conectados através da linha de corte geram avisos de corte; se não existir corredor vazio próximo, a fonte exige revisão e `complete` permanece falso. Esse teste não prova que a anatomia ou a forma de um instrumento estejam corretas.

`complete: true` exige 52 folhas de animação, quatro folhas de expressões, 208 sequências, 1.664 frames e 32 retratos, além da ausência de fontes faltantes/rejeitadas, frames vazios, falhas de transparência ou contato visível com a borda da célula exportada. Isso registra conclusão estrutural, não substitui a revisão artística. Rejeições em `qa/REJEICOES_ARTE.json` bloqueiam a fonte enquanto seu hash coincidir com o original rejeitado; uma nova fonte autoral com hash diferente pode substituí-la sem apagar o registro histórico.

`PREVIA.html` é uma página offline gerada a partir de `previa.template.html`, com o manifesto embutido. Mostra os dois personagens com/sem máscara, controles de ação/direção/velocidade e seleção de frame.

Com Node e Playwright disponíveis:

```sh
node verificar_previa.cjs --preview
node verificar_previa.cjs
```

O modo completo percorre 208 combinações e confere os frames 0, 3 e 7, os oito canvases de miniatura por personagem e a ausência de requisições a quadros individuais. Salva relatório e captura em `qa/`. A execução usa Chrome instalado no macOS, quando disponível; `CHROME_PATH` permite indicar outro executável. Se o sandbox impedir a abertura do navegador, a execução precisa ser feita com a permissão correspondente; não é necessário gerar novas imagens.
