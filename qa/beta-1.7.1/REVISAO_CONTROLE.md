# Proposta liberada para integração e QA real

Módulo: musician_art_v2.proposta.js → game/source/chapter-03/musician_art_v1.js. Patch incremental: musician_art_v2.patch. Teste portátil: apresentacao_unit.cjs → qa/musician_presentation_unit.cjs (ou nome equivalente). No repo, o teste resolve ../game/source/chapter-03/musician_art_v1.js; nesta pasta usa a proposta. MUSICIAN_MODULE é override opcional. O relatório APRESENTACAO_UNIT.json inclui hash da fonte realmente exercitada.

## Semântica

Somente attack_1/2/3 ganham cursor de apresentação. Primeira pose vista é0; cada novo art.clock permite no máximo um avanço; consulta de pose, preview/draw duplicado, fallback idle e drawImage que lançou erro não consomem frames. Confirmação acontece depois de ctx.drawImage do atlas de ataque retornar com sucesso e só se o record ainda for o mesmo. ctx.restore ocorre em finally.

O alvo continua vindo do tempo original do golpe; o cursor apenas limita saltos. Se houver dívida ao terminar o prazo, permite concluir um ataque que já foi mostrado por até100ms adicionais de art.clock. Isso é uma cauda visual, não cooldown/dano estendido. Em30Hz, o ataque synth0,22s completou frame7 em0,2667s (46,7ms de cauda). Não há fila. Se o atlas só chegar após o prazo original e nenhum frame tiver sido mostrado, não inicia a ação atrasada. Em RAF extremo, expira com dívida descartada em vez de reproduzir um ataque longo.

Nova ação aceita/hurt/defeat substitui o record; roll aceito o cancela; área/save/ocupante liberam o anterior. Movimento durante o prazo original não encurta a ação. Movimento depois dele cancela a cauda PERMANENTEMENTE no record; parar antes dos100ms não a ressuscita. Máscara mantém o cursor. Clock e cursor congelam na pausa; o snapshot de ataques vem do desenho efetivo, não de consultas da próxima pose. Se foi desenhado idle enquanto o PNG estava pendente, pausa mantém esse idle mesmo se a imagem carregar depois.

Prewarm passa a chamar Image.decode() assincronamente para as mesmas duas folhas; rejeições são tratadas. Não espera input, não carrega a coleção completa, não aumenta LRU8 e não carrega no título. Esta chamada antecipa decode; não se afirma que garante upload GPU ou FPS.

## Testes

111 casos focados passaram para synth/percussion, com/sem máscara e P1/P2. Incluem60Hz,30Hz, o caso relatado0,0668s +0,060s (alvo4 apresenta3, depois4/5/6/7), RAF extremo, decode0,150s, decode após prazo, queries, draws duplicados/falhos, substituição durante renderer, ação rejeitada/aceita, hurt/roll, mover→parar, pausa antes do próximo draw, máscara, pending/broken/absent, título/cache e derrota/skill sem cursor.

Nenhum browser foi iniciado e BUILD/REPO não foram alterados. Root integra sobre main atual (incluindo GroundFX1.7) e mede o caso real antes de liberar1.7.1. Os testes determinísticos208+48 precisam ser repetidos na build integrada. O antigo unit que atribuía elapsed diretamente deve avançar art.clock entre amostras de ataques: ele não pode esperar oito apresentações no mesmo clock.

Limite:100ms é orçamento do relógio ativo da simulação, congelado em pausa; não é garantia de tempo de parede/FPS sob travamento do renderer. Não há como prometer oito desenhos com arbitrariamente poucos draws mantendo uma cauda curta. Os demais estados continuam com suas regras anteriores.

SHA-256 da proposta: dd1698118e4eddd09e980f26f3d9587a4f1438a78aae5b7dd409c7d6d335e77f
