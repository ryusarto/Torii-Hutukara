# Revisão visual de combate

A [galeria](index.html) mostra o mesmo comando, com o mesmo personagem e inimigo, na 1.14 e na 1.15. Cada clipe inclui a pose anterior ao ataque, o golpe e a recuperação. O quadro superior corresponde à 1.14. O [super de Franco em grupo](FRANCO-GRUPO.webp) está em escala nativa, a 24 quadros por segundo.

Foram gravadas 34 ações pelo renderizador do jogo. Cinco personagens encadeiam três ataques básicos. O arqueiro usa o disparo simples. As outras três ações de cada personagem são a técnica, a técnica avançada e o super. Os contra-ataques da katana e da percussão incluem um golpe recebido durante a guarda. A câmera permanece fixa. O alvo tem vida suficiente para sobreviver à sequência e recebe o dano e o recuo normais.

## Como ler as medidas

Em cada instante, o navegador renderiza a mesma cena com e sem a passagem de efeitos de ataque. As diferenças de cor acima do limiar indicam quantos pixels da arte ficaram visíveis depois de desenhar o chão, os atores e o inimigo. Outra comparação troca o atlas novo pelo efeito anterior. Um valor alto nessa segunda comparação pode significar que o efeito anterior era maior. A primeira comparação e o clipe mostram o que realmente aparece no jogo.

Em uma segunda cena, o grupo está junto e o inimigo começa a 3,25 tiles de distância. A medição acompanha o recuo do inimigo e conta mudanças perto do rosto e do tronco de cada aliado. Essas regiões são retângulos de 13 × 13 e 17 × 19 pixels em torno da pose de cada ator. Os rostos também foram conferidos nos quadros do jogo.

O [comparativo da flecha](FLECHA.png) isola o projétil renderizado no mesmo ponto da trajetória e no mesmo instante de animação. Os pixels foram comparados em RGBA, independentemente de diferenças na compactação do PNG. Os hashes das exportações, os resultados por golpe e as amostras no grupo estão no [relatório de medições](LEITURA.json).

## O que se vê no jogo

| Personagem | Leitura da arma |
| --- | --- |
| Franco | A corda tem uma ponta clara e uma borda escura. No super, a vibração sai junto ao braço, atravessa a relva e alcança a borda do inimigo durante o recuo. |
| Ryuchi | Os ataques básicos deixam um fio de lâmina azul. A técnica abre três lâminas em leque e o avanço desenha um rastro sobre o deslocamento real. |
| Arqueiro | A seta dourada mantém a silhueta, o brilho e a trajetória da 1.14. A técnica e o disparo múltiplo se distinguem pela disposição das flechas em voo. |
| Katana | O saque projeta uma linha comprida na direção da investida. Os golpes seguintes têm um acento curto na borda do inimigo. O super prolonga o corte para além dele. |
| Sintetizador | A onda quadrada e o zigue-zague dão formas diferentes aos ataques curtos. Na técnica, o circuito forma uma área no chão que deixa visível quem está de pé sobre ela. |
| Percussionista | A membrana do tambor e a marca de contato identificam os golpes curtos. Na guarda, o golpe recebido dispara a resposta. Os pulsos mais largos se leem no chão. |

No super de Franco, a vibração fica visível por 12 quadros consecutivos. Nos cinco quadros finais, a frente chega a quatro pixels ou menos da silhueta real do inimigo. Para verificar essa distância, o teste renderiza novamente o quadro sem o inimigo, localiza os pixels do sprite que de fato aparecem e mede a vizinhança da marca. A região do rosto e a do tronco dos três aliados tiveram zero pixels alterados nessa cena.

A gravação usa Chrome em computador, com uma única direção de ataque e um alvo em campo aberto. Os retratos de grupo e os recortes de impacto representam essas condições.

Em combate colado ao alvo, o segundo e o terceiro golpes da katana deixam marcas menores que o terceiro da percussão. As marcas ficaram visíveis por quatro, quatro e cinco quadros, respectivamente. O terceiro golpe do sintetizador também ficou visível por quatro. Quando um aliado passa em frente, a pose do atacante e a pequena marca na borda do alvo carregam a leitura desses combos.
