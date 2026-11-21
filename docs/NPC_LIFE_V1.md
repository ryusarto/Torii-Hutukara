# Vida local dos NPCs — V1

Implementação para a revisão do mundo vivo, sobre a fonte Beta 1.7.1. Mantém HTML/Canvas/JavaScript, IDs e callbacks narrativos existentes. O módulo não cria pessoas, novas missões, horários de sobrevivência ou alterações de recompensa.

## Arquivos e ordem de integração

- `game/source/chapter-03/npc_life_v1.js`: atuação, rotas locais, seleção de quadros e recuperação da âncora de Belga.
- `qa/npc_life_v1.cjs`: 16 grupos de testes Node/VM do módulo real.
- Injetar depois das camadas atuais de NPCs, músicos, cenário e postgame que já existirem, antes de `init()`.
- Uma camada de novos sprites pode ser injetada depois e registrar aparências pela API abaixo. O gerador e os PNGs pertencem à integração principal, não a esta frente.

O módulo estende `update`, `setArea`, `buildMaps`, `drawDetailedNPC` e `c3NpcPose`. Não substitui mapas, quests, controles, `drawActor` ou o schema/chave de save. NPCs marcados com `postReserve` são ignorados no registro, movimento, pose e desenho; esses atores continuam sob responsabilidade do pós-jogo.

## Comportamento

O estado cosmético fica num `Map` externo a `G`, limitado aos NPCs do mapa atual. Cada NPC tem uma sequência determinística e escalonada de:

| Estado | Atuação |
|---|---|
| `idle` | Repouso neutro na âncora ou no ponto local atual |
| `look` | Atenção ao interlocutor próximo ou breve observação do lugar |
| `gesture` | Pose breve; usa um desenho de gesto registrado ou partes procedurais existentes |
| `work` | Orientação para o objeto de trabalho; músicos podem usar o estado autoral `performance` existente |
| `wander` | Passeio curto somente quando há desenhos de deslocamento disponíveis |
| `return` | Retorno ao ponto de origem por passos verificados, sem teleporte durante o passeio |

Distância máxima de passeio: `.65` tile; velocidade: `.48` tile/s. São parâmetros de ambientação, não velocidade do jogador. As escolhas são determinísticas por área/ID; não usam aleatoriedade da lógica de combate.

Diálogo, menu, combate, desafio musical, título, perda de foco e aba oculta congelam deslocamento e relógios. Aproximação de P1 ou P2 interrompe o passeio e orienta para o mais próximo. Movimento reduzido suprime passeios e mantém poses estáticas. Cor, distância de interação e autoridade narrativa dos jogadores permanecem como antes.

Só há alternância dos quadros de passo quando houve deslocamento real. Um quadro já apresentado pode permanecer congelado em pausa; o relógio de caminhada não continua girando no lugar. Trabalho/gestos sem sprites específicos não são apresentados como novas animações de mãos produzidas.

## Circulação e permanência

- Corpo de NPC de `.26` tile verificado em nove amostras; subpassos de até `.08` tile.
- Rotas respeitam `tileWalkable`, bases de mesas/bancadas/estantes/assentos, portas, eventos, outros NPCs e jogadores.
- A altura inteira de um sprite não vira parede: a verificação adicional usa sua base física.
- Guardas de posto, Belga na oficina e aparições de recrutamento/finais permanecem ancorados. Outros NPCs só passeiam quando sua família de arte possui passos reais.
- O módulo nunca remove NPCs, muda `say`, renomeia IDs, desativa eventos ou realiza uma missão pelo jogador.
- Mudança de mapa, reconstrução ou troca do objeto de save restaura posições ainda pertencentes a esta camada. Se um callback narrativo reposicionou o objeto, a nova posição é respeitada como nova âncora; o módulo não a desfaz.

As bases adicionais de mobiliário são conservadoras e precisam de conferência no renderer real. O teste Node comprova os predicados e exemplos, não a circulação percebida em todos os mapas.

## Belga na bancada

O caso concreto está em `bento_shop` (Capítulo 2): `bento`/Belga nasce em `(18,8)`, na borda da bancada `life091/tools` em `(18,7)`, junto do evento das ferramentas. Ao inicializar esse mapa, a camada procura a primeira âncora válida dentre `(18,9.2)`, `(17.5,9.2)`, `(18.5,9.2)` e `(17,9.2)`. O callback e o evento original não mudam.

A correção da âncora verifica chão, mobiliário e NPCs; P1/P2 temporariamente na frente não a impedem. Jogadores não são sólidos persistentes do mapa e não são reposicionados. Isso evita conservar Belga dentro da bancada ao carregar um save em coop. O passeio ordinário continua evitando os jogadores.

Não foi acrescentado um Belga extra ao mapa `city`, cujo elenco canônico continua sendo Ema, Nina, Mercadora, Guardião das Raízes, Violinista e Barqueira.

## Aparências e lacunas verificadas

| Elenco | Recurso existente e uso desta camada | Lacuna |
|---|---|---|
| C1: `ema`, `child`, `merchant`, `archivist`, `street`, `brdg` | `npcCity1_10` embutido na base, 6 colunas de 56×70, frente neutra. Permanecem ancorados; aceitam novos gestos por registro. | O pacote original não tem marcha, quatro direções, piscar ou mãos em trabalho. A arte nova de gestos é uma entrega separada. |
| Belga/Colli/Mazza | `prebeta_collabs_move`: 8 colunas × 3 linhas; dois passos por direção, linhas 0/1/2. | Não há gesto de oficina específico confirmado; repouso usa quadro 0. |
| Dney, `c3_vega` | `prebeta_dney`: 4 colunas × 3 linhas. Direção na coluna; os dois passos ocupam linhas 0/1. | A linha de expressões não é usada como marcha; novos gestos de projetor não foram inventados. |
| Moradores/operador/trabalhadora C3 | `sprite_resident_a/b`, `sprite_plant_operator`, `sprite_canal_worker`: oito células direcionais. | Mais atividades específicas continuam dependendo de arte autoral. |
| C2: `iris`, `celina`, `lumi`, `katana` quando presente | `NPC092`: quatro direções, uma pose por direção. | Sem ciclo de passos; não recebem passeio fingido com bob. Aparições removidas pela história não são restauradas. |
| C2: `voice_guard`, `voice_vendor`; futuros `style:'guard'` | Peças/paleta do cidadão procedural legado; direção, olhos, piscar e braços em gesto. Guarda de posto fica ancorado. | Não há atlas dedicado do guarda/vendedor no pacote atual. O desenho procedural não equivale a um novo sprite PNG aprovado. |
| Sintetizador/Percussionista antes do recrutamento | Atlas atuais de `MusicianArtV1`, `idle` e `performance` quando o asset existe, com relógio local congelável. | Não altera variante/pose/estado dos jogadores nem antecipa o recrutamento. |
| Arqueiro/Ninja na chegada final | Atlas `idle` atuais de `NinjaArcherArtV1`, sem alterar registros de ação de P1/P2. | Nenhum novo gesto de conversa foi produzido por esta frente. |

Não existe NPC Dney permanente no C2 nem NPC humano `Dimas` ativo no C3 só porque um arquivo de sprite está disponível. Não se criam essas aparições por inferência.

## API para a camada de gestos

```js
NpcLifeV1.registerAppearance('city/ema', {
  ready: n => image.complete && image.naturalWidth > 0,
  walk: false,
  directional: false,
  render(n, x, y, pose) {
    // Desenhar o recorte autoral em x/y usando o seu pivô e escala.
    // Retornar true somente se o desenho foi apresentado.
    return true;
  }
});
```

Seletores aceitam `area/id`, `id` ou `spriteKey`, nessa prioridade. `ready` é opcional; uma aparência indisponível mantém o fallback atual. Não marcar `walk:true` quando só existem poses frontais.

`pose` contém `state`, `dir`, `moving`, `frame`, `clock`, `age`, `duration`, `gesturePhase` (0..1), `blink` e `paused`. Estados usam os identificadores ingleses da tabela. O estado de atenção próxima é `look`; `blink` é escalonado por NPC. `frame` pertence aos passos existentes; uma camada de quatro poses pode usar sua própria seleção neutro/olhar/piscar/gesto. `clock`, `age` e `blink` ficam congelados nas pausas; callbacks de arte não devem atualizar quests, posição ou tempo.

## Evidências e integração restante

Executado: `node qa/npc_life_v1.cjs` — **16/16 grupos aprovados**. Cobertura: ciclos independentes, limite/velocidade/retorno, pausas, movimento reduzido, corpo/parede/mobiliário, portas/eventos/ocupação, atenção P1/P2, recuperação de Belga com candidatos ocupados em coop, reset e realocação narrativa, `postReserve`, API de arte, seleção de quadros reais e fallback sem desenho duplicado.

Os testes usam o módulo real num contexto Node/VM. Não provam animação percebida, acabamento visual, circulação em todos os mapas, desempenho em aparelho real ou diversão. A integração principal deve conferir Belga na oficina, Belga/Dney no clube, guarda da torre, estados de quest, ambas as ordens de rota, diálogo/menu/combate, entrada/saída/save e as novas poses C1 no navegador. Nenhuma build ou sessão de navegador foi iniciada por esta frente.
