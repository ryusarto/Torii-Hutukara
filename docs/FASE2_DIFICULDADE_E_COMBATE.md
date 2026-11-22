# Fase 2 · Dificuldade e combate

**Ponto de partida:** os testes mostraram zero derrotas na campanha, chefes vencidos em menos de 1 minuto e poucos inimigos no jogo inteiro. No nível História, o bot simples ainda vence o Viajante em 18 s e o Arauto em 15 s, sem nenhuma derrota.

## Níveis

O nível é escolhido ao começar: em Nova jornada e nos inícios diretos dos Capítulos 2 e 3. Depois, dá para trocar em **Menu → Sistema → Dificuldade**, fora de combate.

| | História | Normal | Difícil |
|---|---|---|---|
| Chefes | como hoje | 2,5× de vida, três fases, dano ajustado por chefe | como o Normal, mais eco do chefe a partir da fase II e +20% de dano |
| Inimigos comuns | como hoje | como hoje | padrões novos, +15% de vida e de dano |
| Inimigos a mais e tipos novos | — | 24 a mais, 6 tipos novos | igual ao Normal |
| Emboscadas, arenas e ondas de Silêncio | — | 9 encontros | igual ao Normal |
| Impacto no golpe | — | hit-stop, faísca, tremor leve | igual ao Normal |
| Números de dano | opcional | opcional | opcional |

- **História é o jogo de antes.** Saves antigos, que não têm o campo, entram como História. O teste `qa/dificuldade_unit.cjs` confere a vida dos quatro chefes (340, 560, 360 e 690), os inimigos e o mapa.
- **O calabouço (Fenda) não muda com o nível.** Lá a dificuldade sobe com as ondas, pelas regras próprias do pós-jogo. Todas as mudanças da Fase 2 se desligam enquanto `PostGame.active()` é verdadeiro. O mesmo teste roda a Fenda nos três níveis com a mesma sorte e exige inimigos e lutas idênticos.
- O nível fica em `G.difficulty`, um campo novo que não muda o schema do save. Voltar ao checkpoint mantém o nível escolhido.

## Chefes em três fases (Normal e Difícil)

O Viajante e o Arauto tinham duas fases. A fase III começa com 25% de vida. O Metrônomo e o Silêncio já tinham três, que agora são anunciadas.

A cada troca de fase:
- o chefe para por 1,25 s, fica imune por 1,55 s e empurra quem estiver perto;
- os ataques pendentes somem;
- aparece um anel de choque com clarão, e o nome da fase surge na tela.

Na fase III, o chefe ganha brilho pulsante e rachaduras, desenhados em código por cima do sprite atual. A recarga entre ataques encurta, e cada ataque termina com um golpe novo:

| Chefe | Golpe da fase III |
|---|---|
| O Viajante | **eco da máscara**: um círculo no lugar de cada jogador |
| Arauto | **cruz de estática**: duas faixas que se cruzam no jogador |
| O Metrônomo | **compasso quebrado**: dois círculos em seguida, no tempo |
| O Silêncio | **vazio**: um anel em volta do jogador; o centro fica seguro |

## Inimigos novos (Normal e Difícil)

Cada capítulo ganha dois tipos novos, com papéis diferentes:

| Cap. | Tipo | Papel | Como vencer |
|---|---|---|---|
| 1 | Tambor-Escudo | escudo | o escudo de frente segura 85% do dano; ataque pelas costas ou logo depois do golpe dele |
| 1 | Flautim Atirador | atirador | mira com uma linha antes de atirar; saia da linha e chegue perto |
| 2 | Coro de Reparo | curador | canta e cura os aliados por perto; bater nele interrompe o canto |
| 2 | Maestro Oco | invocador | chama Nós menores (até 3 vivos); derrubando o Maestro, eles se desfazem |
| 3 | Muralha de Estática | escudo | escudo e investida em linha; depois de correr fica tonta e aberta |
| 3 | Antena de Feedback | atirador | feixe longo com 1 s de aviso; saia da faixa |

Na primeira vez que cada tipo aparece, uma dica explica a mecânica. Por enquanto, os seis usam as poses de `enemies/v1`, com cor, aura e símbolo próprios. Os atlas dedicados estão na lista de assets abaixo.

**Difícil, nos inimigos de sempre:**
- a Sombra atira em leque de três;
- o Nó e os ecos do Capítulo 3 às vezes avançam em linha depois do golpe;
- o Metrônomo Menor deixa um contratempo no lugar de quem luta;
- o Eco Espelho solta seis notas;
- o Abafador abre um anel depois do golpe.

Os tipos novos também ficam mais agressivos no Difícil: o escudo gira mais rápido e bate duas vezes, os atiradores disparam três tiros ou três feixes e o curador cura mais.

O Mar de Nuvens não recebe tipos novos. Feixe e investida em passarelas estreitas, com queda fatal, seriam injustos.

## Encontros (Normal e Difícil)

Cada encontro acontece uma vez por jornada (`G.fase2.feitos`). Perder volta ao checkpoint, e o encontro pode recomeçar.

| Capítulo | Encontro | Onde |
|---|---|---|
| 1 | Emboscada | Floresta, depois da ponte |
| 1 | **Onda de Silêncio** (3 ondas) | Floresta, a caminho das ruínas |
| 1 | Arena trancada (2 ondas) | Ruínas, longe da arena do Viajante |
| 2 | Emboscada | Cidade das Vozes, depois do primeiro retransmissor |
| 2 | **Onda de Silêncio** (3 ondas) | Cidade das Vozes, mesma condição |
| 2 | Arena trancada | Telhados, depois da névoa |
| 3 | **Onda de Silêncio** (3 ondas) | Distrito, depois da primeira frente (Usina ou Canal) |
| 3 | Emboscada | Usina, depois da comporta |
| 3 | Arena trancada | Canal, antes do resgate |

- Arena e onda fecham uma barreira em volta. Os inimigos sempre nascem dentro dela, em chão alcançável a partir do centro.
- Se uma onda ficar parada por 40 s, os inimigos que restam são trazidos para perto.
- A onda de Silêncio escurece a tela e, ao terminar, dá 12 fragmentos e uma fita de cura.
- Encontros e inimigos chamados por invocadores não entram no save: saem do mapa ao cair.
- Durante a luta contra um chefe, os tipos novos esperam. A luta é só do chefe.

## Impacto no golpe

Vale no Normal e no Difícil; no História, o combate fica como era.

- **Hit-stop:** a simulação para por 2 quadros por golpe e por 3 no golpe que derruba ou acerta a abertura de um escudo. O desenho continua.
- **Faísca de acerto** desenhada em código:
  - clara no golpe comum;
  - dourada na abertura de um escudo;
  - cinza quando o escudo bloqueia;
  - grande, com anel, quando o golpe derruba.
- **Tremor leve** nos golpes fortes. Com "Efeitos suaves", o tremor continua zerado, como já era.
- **Som no mesmo quadro do impacto**, com uma batida grave quando o golpe derruba e um tom no acerto da abertura.
- **Números de dano**, opcionais em qualquer nível, em Menu → Sistema. Vêm desligados. Com "Efeitos suaves", eles somem no lugar em vez de subir.

### Avisos de ataque no chão

Quatro marcadores em código: círculo, faixa, cruz e cone, mais um anel com centro seguro. Cada aviso enche do centro para fora. Quatro marcas em volta acendem uma a uma até o golpe, para dar para contar o tempo.

## Meta medida pelo bot

`qa/dificuldade_bot.cjs` usa o mesmo jogador simples da jogada automática:
- vai até o inimigo mais perto e bate;
- esquiva quando vê um preparo de perto;
- usa fita de cura abaixo de 35%.

Cada luta começa do estado real da campanha. A jogada automática no Normal grava a equipe, os níveis e as fitas na primeira vez que cada chefe aparece, em `qa/dificuldade/ESTADOS_CHEFES.json`. Para gravar de novo:

```bash
DIFICULDADE=normal CAPTURAR_CHEFES=qa/dificuldade/ESTADOS_CHEFES.json node qa/pace_bot.cjs newGame
```

**Meta:** no Normal, o bot perde de 20% a 40% das lutas contra chefes. O CI roda 20 lutas por chefe. Fora da faixa, o passo escreve um `::warning` e o PR continua verde; `META_ESTRITA=1` transforma o aviso em falha. O ajuste fino é o `dano` de cada chefe em `AJUSTE_CHEFE` (`game/source/chapter-03/dificuldade_v1.js`). Para testar um valor sem gerar a build de novo:

```bash
AJUSTE='{"boss":0.9}' node qa/dificuldade_bot.cjs 12 normal
```

**Resultado (22/11/2026, 40 lutas por chefe):**

| Chefe | História: derrotas · vitória em | Normal: derrotas · vitória em | Dano no Normal |
|---|---|---|---|
| O Viajante | 2/40 · 16 s | 13/40 (33%) · 47 s | 0,8 |
| Arauto | 0/40 · 15 s | 9/40 (23%) · 40 s | 0,78 |
| O Metrônomo | 0/40 · 31 s | 16/40 (40%) · 84 s | 0,9 |
| O Silêncio | 0/40 · 27 s | 12/40 (30%) · 70 s | 1,15 |
| **Total** | **1%** | **31%: dentro da meta** | |

Com 20 lutas por chefe (o que o CI roda), o Normal dá 30%.

- O dano por golpe é arredondado por sorteio: a média é o valor exato, sem degraus de 1 ponto que fariam a taxa pular de 0% para 75% entre dois ajustes vizinhos.
- O bot simula sem desenhar, cerca de 20 vezes mais rápido; o resultado no História é o mesmo do laço completo, e `DESENHAR=1` volta ao laço completo.
- O Viajante e o Arauto começam do estado gravado pela jogada automática no Normal.
- O Metrônomo e o Silêncio começam de um save real de campanha completa (rota Usina), com o chefe ainda por vencer: a jogada automática que começa direto no Capítulo 3 fica presa no Elevador do Céu, também no História, um problema antigo do bot.
- Na rota Usina, o Silêncio começa com 12% a menos de vida (Fase 4). A vida 2,5× mantém essa proporção.

Resultado mais recente: `qa/dificuldade/META.txt`.

## Assets pedidos (Prioridade 1)

O código já funciona sem eles. Cada atlas novo entra trocando o desenho provisório.

| Asset | Quantidade | Hoje no jogo |
|---|---|---|
| Atlas dos 6 tipos novos: parado, andar, preparar golpe, atacar, levar dano e morrer, em 4 direções, ~8 quadros, como `enemies/v1` | 6 (mais 2 a 6 se cada capítulo ganhar variantes) | poses de `enemies/v1` com matiz, aura e símbolo do papel |
| Pose de transição e variação "fase III" (rachado, brilhando) dos 4 chefes | 4 × 2 | anel de choque, clarão, brilho e rachaduras desenhados em código |
| Efeitos de golpe: faísca normal e de abertura, anel da batida, onda de ressonância | ~6 × 6–8 quadros | faíscas e anéis desenhados em código |
| Golpes de combo por instrumento | 4 × 2–3 | fora desta fase (Fase 1, combate no ritmo) |
| Avisos de ataque no chão | 4 | feitos em código, como previsto |

## Arquivos

- `game/source/chapter-03/dificuldade_v1.js`: níveis, escolha, chefes em fases, avisos no chão e padrões do Difícil.
- `game/source/chapter-03/encontros_v1.js`: tipos novos, inimigos a mais e encontros.
- `game/source/chapter-03/impacto_v1.js`: hit-stop, faíscas, números de dano e som.
- `qa/dificuldade_unit.cjs`: 13 verificações no navegador, inclusive História igual ao de antes e Fenda igual em todos os níveis.
- `qa/dificuldade_bot.cjs`: a meta medida pelo bot.
