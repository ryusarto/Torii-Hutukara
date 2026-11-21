# Boss V3 · passos do Viajante

Novo `boss_walk`: quatro direções×oito poses, RGBA2560×1280, células320, pivô160,280 e a mesma escala0,5234375 dos casts V2. O pacote acrescenta o clip ao manifesto V2; não substitui as cinco sequências de ataque aprovadas.

O renderer observa somente o deslocamento real aceito pelo `updateEnemy`: soma distância/1,8tile e escolhe a direção do passo. Posição, dano, colisão, velocidade e duração dos ataques não são alterados. Investida instantânea, stun e preparação não são tratados como caminhada; o cast tem prioridade. Pausa, troca de área/ator e reload invalidam o estado cosmético. Movimento reduzido utiliza uma pose estável.

Fonte criada pelo ImageGen integrado a partir do boss aprovado; uma segunda passagem solicitou apenas limpeza de alpha. `source/pack_v3.py` recorta/registra/empacota; não pinta passos ou apaga fundo. `PROMPTS.json` e `VALIDACAO.json` registram origem/quadros/alpha/registro. As fontes mantêm-se editáveis por quadro via recorte da grade; atlas e GIF/HTML são exports/previews.

`PREVIA_walk.gif` e `PREVIA.html` mostram poses, não gameplay.18 checks legados de coreografia e7 checks novos de animação passaram em Node/VM. Validação perceptiva/na engine fica com a coordenação. Sem teste físico nesta frente. Nenhum recurso externo de terceiros foi utilizado; identidades continuam sob `LICENSE-ASSETS.md`.
