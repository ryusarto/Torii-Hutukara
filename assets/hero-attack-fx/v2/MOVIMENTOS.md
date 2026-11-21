# Efeitos dos golpes

O jogo lê os três estágios do combo, o especial, o avançado e o super de cada personagem no momento em que o combate aceita a ação. Em cooperação, a posição e a direção vêm do jogador que atacou.

| Personagem | Combo | Especial e avançado | Super |
| --- | --- | --- | --- |
| Franco | Uma corda vibra na direção da mão. O segundo estágio usa duas cordas e o terceiro marca um acorde. | A pulsação e o acorde com amplificador aparecem projetados no chão. | Uma corda desenha um pulso estreito da mão para cada inimigo que perdeu vida. No fim, há um contato no alvo. Sem acerto, a emissão termina perto do instrumento. |
| Ryuchi | Corte de ida, retorno em arco e estocada de cristal têm silhuetas e trajetórias diferentes. | No especial, os três projéteis levam um recorte de lâmina na sua trajetória real. O avançado acompanha o trecho efetivamente atravessado. | A ressonância percorre os elos definidos pelo combate entre o músico e os inimigos. |
| Ryuchi Katana | Tinta ascendente, retorno em curva e golpe de papel se abrem na direção da espada. | O iai acompanha a posição do corpo e deixa um eco atrasado. A guarda dura até expirar ou ser consumida pelo contracorte. | O corte de tinta segue a direção da execução. |
| Synth | A onda quadrada, triangular e escalonada sai das teclas. | O pad pulsa na posição em que foi colocado. O filtro converge naquela posição quando é acionado. | Da mão sai um cabo curto. Até três conexões visíveis se estendem para os alvos definidos no combate. |
| Percussão | Ataques das duas mãos e o acento duplo usam desenhos da pele e das baquetas. | O contratempo acompanha a guarda. Na quebra, cada uma das três batidas emite um pulso na posição do músico naquele instante. | O pulso da pele do tambor se projeta junto aos pés quando a batida resolve. |

Os sinais do campo, as posições de impacto e os projéteis respondem aos eventos de combate já existentes. A lista de ações do segundo jogador usa as regras cooperativas da campanha. As fases exclusivas do primeiro jogador, como a colocação do pad e os três disparos do Ryuchi, surgem quando esse sistema realmente as executa.

A faixa dedicada do baixo tem oito quadros. As demais sequências selecionam seis quadros por linha. O gesto e o voo de Franco Arqueiro conservam sua arte anterior. A opção de movimento reduzido mantém poses fixas e, no super do baixo, faz uma transição de opacidade entre a emissão na mão e o contato no alvo.

O comando `python3 assets/hero-attack-fx/v2/pack.py` registra as cinco pranchas de seis linhas e atualiza o manifesto dos 180 desenhos. Ele usa Pillow e NumPy. O manifesto registra as dimensões, os pivôs e as assinaturas de cada quadro, inclusive a linha de referência original do baixo. A execução do super usa a faixa separada e só aproveita um pequeno recorte das notas dessa referência. As suítes `qa/hero_attack_fx_browser.cjs` e `qa/hero_attack_v2_browser.cjs` exercitam as entradas reais, os bitmaps desenhados, a emissão sem acerto, os contatos, a pausa e as variantes cooperativas.
