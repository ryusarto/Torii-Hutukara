# Coordenação de releases — Torii & Hutukara

Atualizado em 17/11/2026 pela coordenação do jogo. Reservas são candidatas de produção, não versões já publicadas.

## Base consultada

Main `fa399a2d98297b759444b243b7b2cbeacaddd1e3`: músicos chibi e paleta canônica publicados como Beta 1.3. As frentes devem reler a main antes do merge e preservar os avanços das demais.

## Reservas e sequência

| Versão candidata | Frente responsável | Escopo | Situação |
|---|---|---|---|
| Beta 1.4.0 | Cenários / Analisar build HTML TORII Hutukara | Direção desértica do C3, biblioteca de cenário, integração e exportação | Exportação e QA integrados em fechamento; publicar após a validação final |
| Beta 1.5.0 | NPCs/inimigos e bosses | Artes de inimigos e estados de bosses; conciliação do PR #13 e das poses novas | Produção/QA em paralelo; incorporar a main com os cenários antes da publicação |

O PR #13 ainda se apresentava como Beta 1.3 na consulta. A frente responsável atualiza título, descrição, versão e evidências para a entrega real; não deve republicar conteúdo diferente sobre a pasta Beta 1.3.0 já usada pelos músicos.

## Regras de integração

1. Produzir código, arte e documentação em paralelo, com posse explícita dos arquivos e saídas locais separadas.
2. Serializar merge e publicação. A sequência planejada é cenários 1.4 e inimigos/bosses 1.5, incorporando os avanços anteriores.
3. Se a ordem precisar mudar, redistribuir o próximo número livre entre as frentes antes de publicar. Nunca baixar a versão da main nem reutilizar uma pasta pública com conteúdo diferente.
4. Antes de integrar, reler main, reconciliar gerador/exportador e preservar personagens, cenários, NPCs, saves e correções já publicados.
5. O relatório final identifica versão e SHA-256 da build efetivamente executada. Mudança de fonte/versão gera um hash novo; a evidência anterior permanece histórica.
6. A prova de roundtrip do exportador continua comparando exatamente o conteúdo reconstruído por SHA-256, inclusive após otimizações de memória.
7. Aceite e testes aprovados autorizam integração automática conforme orientação do autor; não solicitar repetidamente que ele aceite o PR manualmente.

## Computação local

Para evitar falta de espaço e pressão de swap, combinar o início das compilações Ruby, exportações grandes e suites de navegador locais: uma frente pesada por vez. Preparação de código/arte/documentação e CI remoto podem continuar em paralelo.

Na atualização deste registro, cenários está fechando a exportação/QA da 1.4; a frente de bosses foi orientada a combinar a próxima rodada pesada após essa conclusão. Isto é uma fotografia da fila, não um bloqueio permanente: confirmar a conclusão com o responsável antes de iniciar a próxima rodada.

Não encerrar processos ou apagar diretórios de outra frente. Limpeza fica restrita aos temporários próprios, encerrados e comprovadamente recuperáveis. Não reutilizar uma amostra local antiga como entrega final.

## Limites

Este arquivo não altera game/VERSION.json, runtime, assets ou o site publicado. Nem a 1.4 nem a 1.5 são declaradas publicadas por esta tabela; o estado real é conferido no merge, workflow de publicação e build-info do site.
