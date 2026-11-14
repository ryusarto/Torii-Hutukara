# Proposta de cortes de diálogo (resumida)

> **Status: aprovada e aplicada** (14/11/2026). As edições estão em `design/dialogo/EDICOES_DIALOGO.json` e são aplicadas por `game/source/chapter-03/dialogue_edits.js`. Para desfazer uma edição, basta tirá-la do JSON. As 3 falas novas do final foram aprovadas pelo autor com ajuste (um só Hutukara, mundos dentro dele; sessão na DAW em vez de fita).
>
> Resultado medido: 225 → 139 falas; jornada típica 27,5 → 20,3 min; Capítulo 3 13,3 → 10,1 min.

Base: as 225 falas obrigatórias lidas pela jogada automática (`qa/ritmo/antes/falas-newGame-rapido-1.2.4.json`, numeradas na ordem do jogo).

## Regras
- **Intocáveis** (só ajuste fino): estúdio e chegada ao Hutukara, descoberta das máscaras, revelação do mascarado, encontro das versões (impacto e plot twist), final.
- **Belga, Colli, Mazza e Dney** viram NPCs principais: não perdem falas, e Dney e Mazza ganham presença.
- Avisos de sistema ("ITEM OBTIDO", "RETRANSMISSOR 1/3", "NOVO ALIADO") saem da caixa de diálogo e viram **aviso rápido na tela**, sem travar o jogo.
- Instrução de "para onde ir" sai da fala e fica no objetivo e na seta do mapa.
- Narrador só fala o que a tela não mostra.

## Resultado esperado
| | Hoje | Proposta | Corte |
|---|---|---|---|
| Capítulo 1 | 75 | ~45 | −40% |
| Capítulo 2 | 41 | ~21 | −49% |
| Capítulo 3 | 109 | ~62 | −43% |
| **Total** | **225** | **~128** | **−43%** |

Com os avisos virando notificações rápidas, o tempo de leitura cai cerca de 50%.

---

## Capítulo 1 (75 → ~45)

| Trecho | Falas | Proposta |
|---|---|---|
| 🔒 Estúdio (1–10) | 10 → 6 | Manter 1–3. Fundir 4–6 numa fala do Franco ("isolei os canais, desliguei os monitores… e a melodia continua"). Fundir 7–10 em uma fala sobre a porta e a escada. |
| 🔒 Máscaras e chegada (11–24) | 14 → 10 | Manter descrição da máscara (13), "Finalmente." (16), a máscara se prendendo (17–19) e a explicação do Hutukara (23). Fundir 20–22 e cortar 24. |
| Anciã Ema (25–31) | 7 → 4 | Fundir 29+30. Cortar 31 (repete 26). |
| Floresta e mascarado (32–40) | 9 → 5 | 32+33 numa fala. Cortar 38. Item (40) vira aviso. |
| Ponte e silêncio (41–47) | 7 → 2 | Uma reação à ponte e uma fala sobre o silêncio. "Ressonância +30" vira aviso. |
| Pedras (48–53) | 6 → 2 | Uma fala diferente por pedra (hoje a mesma fala aparece duas vezes). |
| Confronto (54–57) | 4 → 3 | Cortar 55 (o jogador já está vendo a máscara). |
| 🔒 Revelação do Arqueiro (58–72) | 15 → 11 | Corrigir as duas aberturas que se contradizem (58 e 62): fica uma só. "Novo aliado" vira aviso. |
| Travessia (73–75) | 3 → 2 | Fundir 73+74. |

## Capítulo 2 (41 → ~21)

| Trecho | Falas | Proposta |
|---|---|---|
| Chegada (76–78) | 3 → 2 | Manter a lista de bairros (77). |
| Íris (79–83 + 90–92) | 8 → 4 | Íris já explica tudo de uma vez: fita, Belga, técnico sequestrado e três relés. **A ida à Rádio 9 só para ouvir isso deixa de existir.** |
| Fita (84–86) | 3 → 1 | Manter 85 (a melodia do estúdio). Item vira aviso. |
| Belga na oficina (87–89) | 3 → 3 | Mantém (NPC principal). Corrigir o nome "BENTO" para BELGA. Acoplador vira aviso. |
| Relés (93–96, 104–105) | 6 → 1 | Avisos de 1/3, 2/3 e 3/3 viram notificação. Íris fala só no fim, pelo rádio. |
| Lumi (97–103) | 7 → 4 | Mantém a dica "grave, aguda, grave". Violino vira aviso. |
| Torre (106–110) | 5 → 3 | Fundir as duas narrações (106–107). |
| 🔒 Ryuchi Katana (111–116) | 6 → 5 | Encontro das versões: manter 113–114 e o anúncio do Lado B (116). Fundir 111+115. |

## Capítulo 3 (109 → ~62)

| Trecho | Falas | Proposta |
|---|---|---|
| Chegada e Belga (117–126) | 10 → 6 | Belga apresenta as duas frentes numa fala só (121–124). Manter "duas partes da mesma chave" (123). |
| 🔒 Franco Sintetizador (127–138) | 12 → 7 | Manter o medo de errar (127–130) e o impacto/humor do encontro (133–135, 138). Cortar 131, 136–137. |
| 🐞 Cena do Canal repetida (148–156) | 9 → 0 | **Bug:** a mesma cena roda duas vezes. Remover a repetição. |
| 🔒 Ryuchi Percussionista e Colli (139–147, 157–169) | 22 → 10 | Manter a entrada pelo som (141, 143), "pisa no três" (161) e o medo de parar (167–169). Fundir as explicações da Colli (144–145). Corrigir "NARA" para COLLI. |
| Oficina — Mazza e Colli (170–175) | 6 → 5 | Mazza ganha uma fala própria sobre a flauta (hoje só pergunta). |
| Contratempo — Dney (176–180) | 5 → 4 | **Dney conduz a cena** (hoje tem 1 fala). Cortar a recapitulação das relíquias (179). |
| Elevador e nuvens (181–191) | 11 → 5 | Manter "não quero tocar só pra não cair" (183–184) e uma fala da vista do clube. Tutorial da Colli (189–191) vira uma fala + marcas visuais. |
| Metrônomo (192–194) | 3 → 3 | Mantém. |
| Antes do Torii (195–201) | 7 → 3 | Belga pelo rádio numa fala só. Cortar a explicação do narrador (199): Arqueiro e Katana aparecem e uma fala basta. |
| 🔒 O Silêncio e o plot twist (202–209) | 8 → 8 | Intocável. |
| 🔒 Final (210–225) | 16 → 11 + 3 novas | Manter o diálogo do medo (210–215) e o retorno às três da manhã (221–225). Fundir 216–220. **Acrescentar 3 falas**: Ryuchi e Franco sabem que existem outros mundos e outras versões e decidem visitá-los, um gênero por vez (gancho das mixtapes). |

---

## Bugs de texto encontrados (corrigir junto)
1. Cena do Canal com Colli e Ryuchi Percussionista roda **duas vezes** (9 falas repetidas).
2. Belga aparece como **"BENTO"** na oficina do Capítulo 2.
3. Colli aparece como **"NARA"** no Canal (nome antigo da personagem).
4. A revelação do mascarado tem **duas narrações de abertura** ("O mascarado cai de joelhos" e "Quando a criatura se desfaz").
5. A mesma fala "Essa nota... respondeu ao nosso baixo" aparece nas duas pedras.

## Depois da aprovação
1. Aplicar os cortes e as correções.
2. Rodar a jogada automática e comparar com a Fase 1 (meta: leitura ≤ 35% do tempo).
3. Revisar no jogo as cenas intocáveis, para garantir que nada importante sumiu.
