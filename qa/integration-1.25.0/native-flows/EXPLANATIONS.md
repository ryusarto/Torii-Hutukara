# Adaptações das regressões importadas

Build inicialmente testada: `dcaa8b63`. Os doze scripts foram executados em série; nenhum resultado inicial foi apagado. `REPORT.json` conserva cada tentativa, exit e caminhos dos logs integrais. Cópias dos três testes antes dos ajustes estão em `logs/*.before-ui7.cjs`, acompanhadas dos hashes em `*_fixture_adjustment.json`.

- **Lumi:** pausa B aprovada substituiu o botão Jornada por Mapa/Diário. Na ausência de `#journey10`, o teste exige a pausa B e chama o callback nativo original `openJourney10`; a seleção da pausa passa a usar `.ui7-pause-sidebar` e exige Continuar; a equipe usa o texto aprovado Escolha até três integrantes. Mantém todas as verificações negativas de dicas por plataforma, diálogo e NPC e acrescenta ausência explícita de `<kbd>` nos golpes da equipe mobile.
- **FinalEchoes:** o mudo persiste ao continuar. O helper antigo invertia a preferência já correta no segundo uso. O helper passou a ser idempotente e foi acrescentada uma verificação explícita de persistência antes de usá-lo após reload.
- **Controles:** o final importado tem memória e ecos físicos, em vez do modal legado de quatro notas. O ensaio agora valida os quatro eventos nativos, contador zero e vitória ainda ausente antes/depois de Escape, B e Start, incluindo retomada. Os demais ensaios de menu/controle permanecem.

## Falha real de abertura no toque

O primeiro teste de Plant no mobile criou o painel e o fechou no mesmo gesto. O trace `logs/plant-mobile-touch-trace-dcaa8b63.json` confirmou: pointerdown AÇÃO → callback C3.completePlant → menu visível → pointerup/touchend → click retarget em plantClose → closeOverlay. Esse achado foi encaminhado ao coordenador; nenhuma produção foi alterada por este agente. Os retestes devem usar a exportação com a correção do input.

## Evidências intermediárias e reteste delimitado

A exportação `9aad39e9` concluiu os doze cenários: onze passaram; Lumi encontrou seletores herdados da pausa/equipe. A inspeção com seletores atuais comprovou também três problemas reais de apresentação: Esc na pausa mobile, números de tecla `<small>` no instrumento Lumi mobile e `<kbd>` na equipe mobile. A produção dessas três correções pertence ao coordenador. Nenhuma dessas asserções foi removida para aprovar o jogo.

O trace `logs/plant-mobile-touch-trace-9aad39e9.json` confirma que o primeiro toque mantém o painel aberto; os próximos gestos Referência e Fechar funcionam, sem erros de JavaScript. Canal e os demais desafios foram reexecutados no lote completo após a correção de input.

O reteste da exportação final abrange Lumi, Screens e Controls. Os demais resultados de `9aad39e9` permanecem evidências da lógica idêntica de desafios/input, conforme confirmação do coordenador; não serão apresentados como execução de todos os doze scripts no mesmo hash final. Todos os logs de falha originais são conservados.

## Resultado final

Exportação final: `be9ba974c3c206db0842cd6cde851ef2c165963c6f52143d52df7a86c19d4799`. Lumi passou no teclado e toque (2 saídas OK), Screens passou nas 68 telas e Controls passou nos 14 casos. Todos os três processos saíram com código 0 e stderr vazio; Chrome encerrado.

As últimas execuções dos doze cenários estão aprovadas. Nove foram executadas na exportação `9aad39e9` depois da correção de toque; três foram reexecutadas no hash final porque o último patch modificou apenas a apresentação de pausa, equipe e instrumento. Essa aplicabilidade foi confirmada pelo coordenador e está explícita em `REPORT.json/finalApplicability`; as exportações e resultados não foram fundidos como se fossem um único lote.

Limites: Chromium automatizado com emulação mobile; não valida um aparelho físico nem uma campanha humana completa. Não houve edição produtiva, publicação ou merge por este agente de QA.
