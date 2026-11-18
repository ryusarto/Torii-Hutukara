# Revisão de fluidez — Beta 1.6.1

Composição baseada na main bf1c2dc (cenários desérticos1.6, inimigos e chefes1.5), preservando a coordenação documental posterior08e4c379. Portátil SHA-256 `ec3a9ebbef4236101a0f4ff4be22804f3493a49f1f6ce0be490d328415968d52`.

## Correções

- Hurt tem prioridade sobre rolamento para P1/P2; uma esquiva aceita cancela o registro visual de cast interrompido.
- Pausa conserva estado, quadro e direção, inclusive locomoção, acompanhantes e performance. Troca de máscara mantém fase. Derrota continua até a pose no chão e a mantém.
- Caminhada/corrida compartilham fase, mantendo as cadências e a movimentação existentes.
- Entrada/seleção antecipam idle+attack_1; troca de máscara antecipa idle+estado atual. Cache permanece limitado a oito imagens; nenhuma espera ou alteração em dano/cooldowns/input/save.
- Máscara facial aberta atrás restaurada em143 poses de nove estados mascarados.18 PNGs (nove fontes/nove atlas);152 poses revistas, nove poses oclusas de roll preservadas. Todos os pixels fora dos retângulos de cabeça são idênticos. Outros122 PNGs da auditoria histórica permanecem intactos. A cadeia de paleta original foi preservada.

## Executado na composição final

- Validação estática138/138.
- Controlador e renderer reais:208 sequências × oito poses =1.664 poses em quatro direções, dois músicos e duas máscaras;48 transições. Atualização controlada a60Hz, com comandos aceitos; sem substituir módulo/PNG ou atribuir quadros. Performance cobre NPC.
- Unit dos músicos31 verificações; render integrado8; Protagonistas V5 browser11; Ninja/Arqueiro8; controles22; gameplay20; NPC32 casos direcionais; estados V5 e unidades dos chefes aprovados.
- Inimigos8; chefes8; cenários13 e19 capturas reais de estados; site4 verificações com emulação de perfis PC/mobile/tablet.
- Exportação dos1.664 PNGs individuais e comparação RGBA com os recortes finais aprovadas. Prancha visual final e pareceres artísticos anexos.

## Diagnóstico nativo e limites

PREWARM_FINAL usa RAF nativo, entrada nominal200ms e atraso adicional150ms no PNG de attack_1, sem alterar quadros ou tempos do jogo. Contrato de requisição/cache/ausência de erros aprovado nos quatro casos. Todos os oito quadros foram observados em3/4 casos; Franco sem máscara mostrou sete, com atlas ainda pendente na marca de entrada e RAF médio33,33ms/máximo316,6ms. Nenhuma ação ficou invisível. `strictAll8:false` permanece no relatório: este diagnóstico NÃO comprova oito poses exibidas em toda máquina/latência/FPS. As sequências e transições a60Hz passaram separadamente. Não atrasamos gameplay para esconder essa limitação.

Chrome em contextos descartáveis e saves artificiais; sem controle/telefone físico e sem nova campanha manual completa. A revisão visual estática não substitui essas limitações. O teste antigo musician_art foi atualizado para verificar a pausa da esquiva real; deixou de injetar um cast impossível durante roll que agora é corretamente cancelado. O diagnóstico nativo é observacional por padrão; MUSICIAN_COLD_STRICT=1 exige todos os oito quadros e preserva resultado estrito separado.
