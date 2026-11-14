# Combate: padrões de chefe e inimigos musicais

Testado em 14/11/2026 com o laboratório `qa/combat_lab.cjs` (8 lutas por caso; resultados brutos em `qa/combate/RESULTADOS.json`).

## A pergunta
Ataques de chefe **sorteados** ou **padrões que dá para aprender**? E onde entra o RNG?

## Como foi testado
Dois tipos de jogador simulado:
- **Reativo** (primeira vez): só desvia depois de ver o aviso, com 0,35 s de reação (tempo humano típico).
- **Aprendiz** (já conhece o chefe): reage na hora quando acerta a previsão do próximo ataque; quando erra, reage como o reativo.

Três modos de ataque:
- **Sorteio**: como era no Viajante (Cap. 1).
- **Padrão**: sequência fixa por fase.
- **Misto (escolhido)**: sequência por fase + 20% de chance de cada ataque trocar (RNG), nunca 3 iguais seguidos.

## Resultado

| Chefe · jogador | Sorteio | Padrão | **Misto** |
|---|---|---|---|
| Arauto (Cap. 2) · primeira vez | 2/8 vitórias | 8/8 | **5/8** (luta apertada, 91% de dano) |
| Arauto (Cap. 2) · já aprendeu | 3/8 | 8/8 (9% de dano) | **8/8** (32% de dano) |
| Viajante (Cap. 1) · mesmo ataque seguido | até **6 vezes** | até 2 | **até 3** |
| Metrônomo (Cap. 3) · dano, primeira vez | 28% (pico 40) | 11% (pico 14) | **19%** (pico 28) |

**Conclusão:**
- **Sorteio puro** cria sequências injustas (o mesmo ataque 6 vezes) e **não recompensa quem aprende**: no Arauto, quem conhecia o chefe ganhou só 3 de 8.
- **Padrão fixo** recompensa quem aprende, mas depois de aprendido fica mecânico (9% de dano).
- **Padrão + RNG** é o equilíbrio: quem joga pela primeira vez tem uma luta tensa e vencível, quem aprendeu vence com folga mas ainda precisa prestar atenção.

## O que mudou nos chefes
- **Viajante (Cap. 1)**: sorteio → padrão por fase + 20% de variação. Cada ataque mostra o nome (◆ ONDA AO REDOR, ◆ LEQUE À FRENTE, ◆ INVESTIDA).
- **Arauto (Cap. 2)**: já alternava "faixas" e "círculo" em ordem fixa; agora 20% de chance de trocar. **Aviso 0,14–0,17 s mais longo**: com o aviso original, quem jogava pela primeira vez perdia 8 de 8.
- **Metrônomo (Cap. 3)**: continua rígido nas fases 1 e 2 (ele *é* um metrônomo); na fase 3, quando está quase derrotado, "perde o compasso" com 25% de variação.
- **O Silêncio (Cap. 3)**: já mudava a ordem a cada tentativa; agora 15% de variação dentro da tentativa.

## Inimigos novos
Arte existente com aura e marcador de cor próprios; na primeira vez, um aviso explica a mecânica.

| Inimigo | Mecânica | Onde | Teste |
|---|---|---|---|
| **Metrônomo Menor** | ataca sempre no mesmo tempo (a cada 1,6 s); bata entre as batidas | Ruínas (Cap. 1), Mar de Nuvens (Cap. 3) | intervalo medido: 1,6 s exatos; 4/4 vitórias, 14% de dano |
| **Eco Espelho** | depois de 2 golpes seguidos devolve uma onda (aviso 0,8 s); bata e saia | Cidade das Vozes (Cap. 2) | 2 ondas por luta; 4/4, 31% de dano (antes do ajuste: 0/3) |
| **Abafador** | dentro da aura, técnicas Z, X e K ficam abafadas; só o ataque básico funciona | Mercado (Cap. 2), patrulha do Distrito (Cap. 3) | 13 técnicas bloqueadas por luta; 4/4, 6% de dano |

Para ajustar: `game/source/chapter-03/combat_patterns.js` (`BOSS_PATTERNS`, `MODE.variation`, `NEW_TYPES`) e `game/source/chapter-03/pacing.js` (onde cada inimigo aparece).

## Limitações do teste
- O jogador simulado ataca sem parar e não usa todas as técnicas; pessoas reais tendem a causar menos dano por segundo.
- O Viajante ficou fácil para o simulador em todos os modos (luta de ~10 s); vale observar nos playtests se ele precisa de mais vida.
