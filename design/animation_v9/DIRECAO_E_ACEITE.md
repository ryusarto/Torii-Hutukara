# Direção e critérios de preservação da animação

Torii & Hutukara mantém as poses, identidades e a pequena suspensão estilizada já aprovadas dos seis personagens: `franco`, `ryuchi`, `alt`, `katana`, `synth` e `percussion`. Não há autorização de redesenho ou geração adicional de poses nesta manutenção.

## Locomoção

- Preservar escala, rosto, cabelo/boné, máscara, roupa, arma/instrumento e silhueta. O registro entre poses deve conservar continuidade de torso e cabeça, sem redimensionar cada quadro.
- Avançar a passada pela distância efetivamente percorrida após colisão. Parede, pausa, teleporte e dash conservam seus comportamentos próprios.
- Manter posição de simulação, colisões, sombra e câmera independentes do alinhamento da arte. Não deslocar o jogador para compensar um sprite.
- Conferir a sequência inteira, incluindo fechamento do ciclo, quatro direções, diagonais, parar/recomeçar, mudança rápida de direção e caminhada→corrida→ataque. Cobrir P1, P2, seguidores e variantes de máscara.
- Preservar o mapa aprovado da caminhada esquerda de Ryuchi sem máscara e a fase contínua ao alternar caminhada/corrida. Verificar direção pela trajetória após colisão.
- Observar os pés no contexto do chão e da sombra. As poses conservam voo breve e pequena suspensão estilizada; a aprovação existente não significa apoio biomecânico perfeito.

## Efeitos e legibilidade

- Preservar os atlas v3 e seus mapas de ações, eventos, pivôs e durações. Dano e colisão continuam definidos pela simulação.
- Priorizar gesto aberto, textura em clusters de pixels, transparência e dissipação. Rosto, mãos, arma/instrumento, emissor e alvo devem permanecer localizáveis.
- Evitar molduras, armas ou instrumentos completos duplicados, grandes massas opacas e flashes sobrepostos. Ação comum, técnica e assinatura precisam continuar distinguíveis.
- Comparar ações completas e combos em fundos claros, escuros e vegetação, incluindo dois jogadores e inimigos próximos. O FX discreto de Franco sobre terra clara faz parte da apresentação aprovada.
- Conferir pausa, movimento reduzido, cancelamento, morte, troca de área e primeiro uso com assets frios. Esses fluxos devem preservar sinais e tempos existentes.

## Transparência e revisão

A correção de halo de Ryuchi deve preservar os detalhes brancos internos, a roupa, a máscara e as regiões opacas, removendo somente contaminação externa confirmada. Conferir idle, caminhada e corrida nas quatro direções e suas transições.

Imagens isoladas e contagens de pixels apoiam o diagnóstico. A revisão visual exige sequências completas em escala do jogo; testes automatizados não substituem campanha jogada por humano ou validação em dispositivo físico.
