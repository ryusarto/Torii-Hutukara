# Correção do quadro pulado — Beta 1.7.1

Franco Sintetizador e Ryuchi Percussionista podiam pular uma pose de ataque quando a seleção por elapsed recebia um update maior. A baseline1.6.1 reproduziu22 falhas em72 cenários reais:12 com Franco e10 com Ryuchi. O teste corrigido usa o mesmo cenário, comandos e intervalos, sem atribuir combo, elapsed ou frame. A espera do próximo combo respeita cooldown>0, incluindo o resíduo de ponto flutuante de Ryuchi/P2.

## Resultado antes/depois

| Personagem | Antes | Corrigido |
| --- | --- | --- |
| Franco |24/36|36/36|
| Ryuchi |26/36|36/36|
| Total |50/72|72/72|

São três etapas de ataque, P1/P2, duas máscaras e três perfis:60Hz,30Hz e um update60ms no meio do ataque. A fonte desenhada pelo drawActor é inspecionada em cada amostra; os oito quadros devem ocorrer na ordem0→7 e terminar dentro do orçamento visual. A execução a30Hz é uma simulação de intervalo, não uma validação de hardware físico.

## Correção aplicada

Attack_1/2/3 usam cursor confirmado após drawImage real bem-sucedido, no máximo uma pose por tick visual. Fallback idle, consulta de pose e repetição de desenho no mesmo tick não consomem poses. A decodificação antecipada de idle/ataque é assíncrona e não bloqueia input. O último corpo efetivamente desenhado é congelado ao pausar, e a máscara mantém a fase.

Um ataque já exibido pode concluir uma cauda de até100ms de tempo ativo de simulação (art.clock). Não é uma promessa de100ms de relógio de parede durante travadas. Movimento cancela a cauda permanentemente; novo ataque, dano, roll, mudança de área/save/personagem interrompem o registro antigo. Um atlas que só chega depois do prazo não inicia um golpe nunca visto. Dano, cooldown, ressonância, colisão e movimentação continuam no controlador original. Outros estados conservam suas linhas de tempo. Os140 PNGs canônicos são byte-idênticos à main.

## Validação final

- 111 verificações focadas passaram, incluindo consultas repetidas, desenho duplicado, erro de drawImage, atlas pendente/quebrado, atraso excessivo, pausa, máscaras e interrupções.
- 72/72 casos de ataque no renderer integrado passaram;208 sequências/1.664 poses e48 transições existentes passaram.
- RAF nativo:4/4 combinações de personagem/máscara exibem todos os oito quadros com atraso150ms no PNG e entrada nominal200ms.
- RAF nativo com travada deliberada180ms após o desenho do quadro2:4/4 combinações exibem todos os oito quadros. Hitches medidos constam nos relatórios. Ambos os ensaios executaram MUSICIAN_COLD_STRICT=1.
- As 138 verificações estáticas e as regressões locais de músicos, controles, gameplay, protagonistas, Ninja/Arqueiro, inimigos, chefes, efeitos de chão e site passaram. A build preserva a main1.7.0 (3e7ad3f).

O RAF nativo cobre attack_1/P1; combos e P2 são cobertos pelos72 casos controlados. Interrupções intencionais e FPS continuamente extremo cortam a cauda em vez de formar fila ou atrasar controles. Não houve nova campanha manual completa nem teste de telefone/controle físico.

Portátil final SHA-256: `70281f63e2af8b8a5f479d3253295667af82ddc9e8a84cd82ebbe8bae75ef28e`.
