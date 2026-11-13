# Controles PlayStation e coop local

## Objetivo

A Alpha 1.2.1 aceita controles reconhecidos pela Gamepad API do navegador, incluindo DualShock 4 e DualSense. Teclado, mouse e controles de toque continuam disponíveis. O navegador e o sistema precisam expor o controle conectado, por USB ou Bluetooth.

O suporte para duas pessoas segue a lógica da formação física do jogo: o Jogador 1 controla o líder e conduz câmera, menus e história; o Jogador 2 controla de verdade outro integrante escalado, com posição, direção, recargas, esquiva e HP próprios.

## Mapeamento

| Ação | PlayStation |
|---|---|
| Mover | Analógico esquerdo ou direcional |
| Correr | L2, L3 ou analógico inclinado até o fim |
| Interagir / confirmar | Cruz (✕) |
| Ataque | Quadrado (□) |
| Esquiva | Círculo (○) |
| Técnica | L1 |
| Técnica avançada | R1 |
| Especial de ressonância | R2 |
| Trocar integrante | Triângulo (△) |
| Pausa | Options / Start, por qualquer um dos dois controles |

## Regras do coop

- Dois controles conectados ativam o coop automaticamente quando há pelo menos dois integrantes vivos na formação.
- O Jogador 2 assume o primeiro aliado vivo que não seja o líder.
- Triângulo alterna o personagem do Jogador 2 quando há um terceiro integrante disponível.
- O segundo personagem possui ataques e tempos de recarga próprios e pode ser atingido por inimigos, projéteis e padrões dos chefes.
- A assistência automática do primeiro seguidor é desativada enquanto o segundo controle está ativo; as ações passam a depender do Jogador 2.
- A câmera continua ancorada no líder. Ao se afastar, o segundo jogador é puxado gradualmente por uma rota caminhável. A liderança aguarda se continuar se afastando demais. Não há teleporte por distância.
- Mudanças reais de mapa e carregamento colocam o segundo jogador em um ponto válido próximo da entrada, com o corpo fora das paredes.
- Círculo sempre esquiva durante exploração e combate. Não abre a pausa em cidades ou interiores.
- A simulação do segundo jogador e suas recargas param durante menus e diálogos.
- O Jogador 2 pode avançar diálogos. Para iniciar uma interação no cenário, precisa estar próximo do líder.
- Se o integrante do Jogador 2 ficar sem HP, outro aliado vivo disponível assume. Sem outro aliado, o segundo controle aguarda a recuperação ou uma nova formação.

## Referências de design

O sistema usa princípios estudados em Chrono Trigger — equipe visível no mapa, formação curta e identidade individual — e em Moonlighter — controle direto, esquiva legível e ações responsivas. Não utiliza código, sprites, áudio ou dados desses jogos.

## Limitações da Alpha

- A câmera é compartilhada; não há tela dividida.
- O Jogador 1 continua sendo a autoridade de menus, transições e decisões narrativas.
- O navegador só expõe o controle depois que ele é conectado e, em alguns casos, depois do primeiro botão pressionado.
- O nome exibido pelo navegador varia conforme sistema operacional, cabo, Bluetooth e drivers, mas o mapeamento segue o padrão de botões da Gamepad API.
- As técnicas do Jogador 2 ainda são versões simplificadas; o catálogo completo dos kits precisa ser unificado entre P1 e P2 no refinamento seguinte.

## Mobile dedicado

- Celulares e tablets recebem automaticamente controles próprios; desktop começa com teclado.
- Retrato usa uma câmera com enquadramento próprio e controles abaixo da cena. Paisagem coloca analógico à esquerda e ações à direita.
- O analógico permite andar gradualmente e correr ao alcançar a borda. Outro dedo pode atacar, esquivar ou usar uma técnica simultaneamente.
- Soltar um dedo preserva os demais comandos; cancelar toque, girar a tela ou trocar de aplicativo limpa os gestos.
- Um controle físico conectado recolhe os botões de toque, que podem ser reexibidos.
- Chrome com simulação de iPhone foi testado automaticamente; a ergonomia e o Safari iOS ainda requerem teste em aparelho físico.

## Teste recomendado

1. Conectar o primeiro controle antes ou depois de abrir o HTML e confirmar o indicador `CONTROLE 1P`.
2. Iniciar ou carregar o jogo e verificar movimento, interação, ataque, esquiva e pausa.
3. Conectar o segundo controle e confirmar `CO-OP · P2 <personagem>`.
4. Testar movimento simultâneo, limite da câmera, troca de personagem e transição entre mapas.
5. Em combate, confirmar dano independente, técnicas, morte do segundo integrante e continuação pelo líder.
6. Repetir o teste com DualShock 4 e DualSense, em USB e Bluetooth quando disponíveis.
