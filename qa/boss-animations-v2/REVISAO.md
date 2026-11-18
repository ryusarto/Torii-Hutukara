# Chefes animados V2 · candidata Beta 1.5

Esta entrega está em validação. As evidências finais serão acrescentadas após a execução do navegador na build reconciliada.

- Produzidas cinco sequências, 40 quadros desenhados e distintos, com fontes RGBA e exportação auditada.
- Direção artística revisou as 40 células: identidades, máscara integral do Viajante e estilo de sucata preservados; sem corte pelas bordas.
- Dezoito verificações Node passaram: geometrias reais, predicados de dano, emissão antes do fim do wind, chuva sem reinício por gota, investida, Arauto/ondas/rajada, pausa e descarte de estados.
- Revisão estática do renderer não encontrou bloqueador: centro do chão, anel com centro seguro, guias de emissão e rastro real coerentes.

O conteúdo mecânico também passou 132 verificações estáticas durante a preparação. A candidata foi renumerada para 1.5 para preservar a reserva dos cenários 1.4; relatórios finais devem identificar o hash efetivamente executado após a conciliação.

A revisão dos atlas não comprova ritmo no navegador. Permanecem em andamento as capturas animadas e as regressões da build final. Não há declaração de campanha humana ou teste em aparelhos físicos. A publicação deve preservar a ordem e os avanços da main registrados em `docs/COORDENACAO_RELEASES.md`.

A primeira CI da candidata passou em 132 verificações estáticas e sete cenários de animação no navegador, além das regressões existentes. A revisão dessas capturas identificou sobreposição do brilho no corpo; a camada foi movida para o chão, com teste explícito de uma única passagem antes do sprite. As evidências finais abaixo serão substituídas pela execução após esse ajuste.
