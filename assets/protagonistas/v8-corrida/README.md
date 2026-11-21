# Corrida dos seis integrantes

Os seis atlas contêm 640 quadros de corrida, com 16 poses desenhadas para cada direção e variante. O ciclo inclui contato, compressão, impulso e voo dos dois lados. Os PNGs usam células de 256 × 256 e pivô (128, 224). Os atlas do arqueiro e do ninja têm quatro linhas. Os demais têm quatro linhas sem máscara e quatro com máscara, na ordem frente, esquerda, costas e direita.

As folhas RGBA em `source/*_generated.png` foram geradas com ImageGen a partir de folhas de referência montadas com os sprites canônicos. Cada par de linhas da fonte contém as 16 poses de uma direção. A montagem usa registro no centro da parte superior do corpo para preservar a abertura lateral das pernas, escala compartilhada por sequência, filtro nearest e deslocamento vertical de até cinco pixels durante o voo.

`tools/reference.py` extrai as referências. `tools/pack.py` separa os personagens por componentes de alfa, registra as poses e monta os atlas e contatos. `tools/check.py` verifica dimensões, quadros distintos, margens, apoio e variação da silhueta inferior em relação à corrida anterior. Execute os três com Python, Pillow e NumPy. O alcance medido inclui acessórios no mesmo quarto inferior da silhueta. A comparação anatômica visual usa as folhas `preview_*.png`.
