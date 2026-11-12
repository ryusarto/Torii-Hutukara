# Distrito da Distorção — proposta para fechar a arte

A referência geral da cidade cyberpunk acima das nuvens foi aprovada pelo autor. Sprites de personagens, postes, mobiliário e objetos interativos foram integrados à Alpha 1.1.0. As imagens de rua e superfícies permanecem como fontes de direção: ainda não constituem um tileset totalmente recortado e validado.

## Rua principal

`RUA_DISTRITO_PROPOSTA.png` representa o centro de orientação: clube à esquerda, oficina/banca ao centro e elevador ao fundo à direita. A abertura da rua permite enxergar simultaneamente lugares de acolhimento, trabalho e destino. O canal aparece na margem direita como pista do segundo caminho.

- Rua de asfalto grafite-violeta, calçadas em pedra regular e guias contínuas. Reflexos localizados, sem acender o piso inteiro.
- Faixa de travessia, grelhas e calçada ajudam a indicar circulação. O trajeto principal deve ter pelo menos 6 tiles livres; becos opcionais 3–4 tiles. Com tile 24, representam 144px e 72–96px respectivamente. São dimensões de projeto, ainda não medidas em playtest.
- Entradas ao nível da rua, sob fachadas de frente. Sacadas e tubulações nas margens; nada pendurado sobre o centro da rota que esconda o jogador ou projéteis.
- Janelas quentes mostram vida. Interior do clube visível pela porta, cortinas, plantas cuidadas, roupa no varal, bancada usada e caixas junto da banca. Cada lugar tem função, sem repetir o mesmo objeto como decoração universal.
- Ciano concentra mecanismos e elevador. Magenta identifica palco e comércio musical. Âmbar aponta hospitalidade e janelas. A leitura também vem de forma e posição; cor não é a única pista.
- Anúncios usam símbolos gráficos simples. Nomes de lojas são renderizados como texto do jogo, legível, em vez de letras deformadas dentro das imagens.
- O clube e a banca ganham pequenos estados depois da missão: luzes acesas, instrumentos no palco e moradores presentes. Não depender de uma fala para comunicar que a cidade mudou.

## Famílias de edifícios

**Contratempo.** Concreto e aço escuros, porta larga, letreiro com símbolo de alto-falante, luz magenta. Dentro: palco baixo, mesa de som, bastidores e mesas afastadas da passagem.

**Oficina de Ciro.** Janela de bancada âmbar, aparelhos abertos, peças e uma saída de ventilação para a demonstração da flauta. O fundo mostra uso e moradia, não um galpão vazio. Nara tem um ponto de trabalho identificável.

**Moradias.** Variação de altura, sacadas, exaustores, varais e plantas. Reutilizam módulos da mesma família, com distribuições que expressem habitantes diferentes. Fachadas de fundo não implicam portas acessíveis; as entradas exploráveis têm indicação consistente.

**Usina.** Mesma linguagem de metal/cobre, mas maior escala, grelhas e faixas de serviço. O caminho do baixo é uma estrutura física que se move, não apenas um cadeado que desaparece.

**Elevador do Céu.** Visível antes de ser aberto. Trilhos verticais ciano e plataforma de embarque larga. Sua posição é o marco principal do hub. A subida tem duração curta e pode ser repetida sem rever a cena inteira.

## Material de produção

`MATERIAIS_CIDADE_NUVENS_FONTE.png` contém 16 estudos de superfície: asfalto seco/molhado, calçada, placas metálicas, grelhas, beco, água, madeira do clube, nuvem clara/sombreada, céu, pedra do santuário, guia, plataforma, arena e tapete.

O arquivo é fonte visual. A grade gerada não deve ser presumida perfeitamente uniforme ou pronta para recorte automático. Produção posterior deve acertar limites, remover separadores que vazem, fixar paleta, normalizar materiais para o tamanho correto e testar repetição 3×3. Símbolos grandes e padrões circulares pertencem a peças decorativas ou conjuntos maiores, não a cada tile 24×24.

Nuvens: volume nos planos de fundo e nas bordas, topo de caminho quieto e legível. Não reduzir uma nuvem inteira a um tile pequeno. Sombras lavender/azul, luz marfim/rosa e camadas com movimento lento; colisão permanece separada. A opção de efeitos suaves retira movimentos extras e mantém os sinais de interação e ataque.

## Critério para considerar a arte pronta para a build

1. Escala e câmera compatíveis com atores 44×70/64×80 e tile 24.
2. Fachadas, porta, pivô e ocupação física concordam; bancos, postes e caixas não estrangulam corredores.
3. Materiais testados repetidos sem costuras chamativas e sem padrões grandes duplicados.
4. Personagens e alertas dos chefes permanecem legíveis em todas as superfícies.
5. Dia/noite e revisão de save não deixam uma imagem antiga misturada à nova família.
6. Captura da build real e inspeção visual após integração. As imagens desta entrega são arte de produção, não capturas desse teste.
