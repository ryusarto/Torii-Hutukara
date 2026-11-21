# Quadros corporais dos ataques

As dez pranchas em `source/` contêm 240 desenhos de corpo inteiro feitos com ImageGen a partir dos personagens do jogo. Cada coluna representa um dos três estágios de ataque, especial, avançado ou super. As quatro linhas mostram frente, esquerda, costas e direita. Franco, Ryuchi, sintetizador e percussionista possuem pranchas com e sem máscara. Katana e arqueiro usam o figurino próprio de cada classe.

A sequência corporal mostra as poses originais 0, 1, 2 e 3, o novo contato e as poses originais 4, 5, 6 e 7. As variantes, a direção e a posição seguem o personagem que disparou o golpe. A resposta ao aparo de Katana aproveita a estocada de finalização. O ataque automático do aliado utiliza a primeira sequência e aponta para o alvo. Os projéteis e as liberações posteriores do golpe seguem os eventos de combate e os atlas de efeitos.

Para registrar as poses, execute `python3 assets/hero-body/v1/pack.py` com Pillow e NumPy instalados. O registro usa os pés e a altura visível dos dois quadros adjacentes. As lâminas que ultrapassam a margem original recebem um deslocamento em `placement.json`, aplicado na tela ao desenhar a célula. O manifesto contém a origem de cada célula, altura relativa, pivô medido e hashes. A build usa os PNGs já empacotados em `atlas/`.

Execute `python3 assets/hero-body/v1/preview.py caminho/previa.gif` para visualizar as nove fases dos 36 movimentos. A suíte `node qa/hero_attack_body_browser.cjs URL` verifica as imagens que o Canvas realmente recebe em 480 combinações de golpe, direção, figurino e jogador.
