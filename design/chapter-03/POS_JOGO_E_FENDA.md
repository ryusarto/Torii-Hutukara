# Pós-jogo e Fenda das Ressonâncias — Beta 1.12

## Último Torii: presença coerente

Ao entrar na sala, consultar a formação de até três integrantes, o líder e o personagem controlado pelo P2. Selecionar até duas pessoas desbloqueadas que estejam fora desse grupo. Remover os antigos NPCs fixos Arqueiro/Katana. A seleção também é atualizada se o jogador trocar a formação dentro da sala.

Cada reserva usa o próprio sprite e uma fala que retoma seu arco: o Arqueiro abandona a necessidade de provar sua diferença; Katana oferece companhia sem negar o medo; Sintetizador mantém um acorde aberto para o retorno; Percussionista encontra o pulso ouvindo os outros. O líder presente responde. Se não houver reservas disponíveis, Belga e Colli sustentam a passagem. Nunca recrutar ou desbloquear alguém por causa desta cena.

## Final: permanecer em Hutukara

Preservar C3_025 e a resolução do Silêncio. Reescrever C3_026 e C3_027: as máscaras deixam de impor uma saída, os caminhos permanecem abertos e uma ressonância sob o Torii anuncia a expedição. Não transportar automaticamente para o estúdio. Encerrar junto ao Último Torii com a equipe recuperada e um checkpoint de campanha concluída.

A tela final oferece entrar no calabouço, explorar cenários, criar outra frase musical, permanecer no Torii e exportar o save. A exploração é uma escolha, não outra lista de entregas. O estúdio não faz parte das viagens rápidas de pós-jogo.

## Viagens

Após a conclusão, M ou o botão de mapa abre os cenários. O menu também oferece viagens e calabouço, aproveitando a navegação existente de controle e toque. O seletor mostra somente três destinos de capítulo (city, voices e distortion_district) e o calabouço; a exploração interna segue pelas passagens normais. Cada chegada usa a posição de uma passagem existente, ajustada para um local onde o corpo inteiro cabe. Salvar e carregar em mapas anteriores mantém o destino escolhido.

Não viajar durante combate, diálogo ou desafio musical. Na expedição, o mesmo mapa permite encerrá-la e registrar a pontuação antes de viajar.

## Expedição infinita

Nome: **Fenda das Ressonâncias**. Uma arena fixa usa o piso e os objetos existentes do Núcleo. O que é procedural são as composições e posições dos inimigos, a partir de uma semente por tentativa. Não há salas procedurais nem boss novo nesta entrega.

- Meta de projeto: uma tentativa boa entrar em pressão alta após aproximadamente 15–20 minutos, com escalada gradual. Isso é uma meta de playtest humano, não uma duração garantida nem um limite de partida.
- Cinco perfis se alternam: Pulso, Contratempo, Interferência, Ressonância e Crescendo. Famílias entram nas ondas 1/3/4/6/8/10; apenas um abafador por composição. A cada quinta onda, o último adversário é ressonante (HP ×1,4 e poder ×1,08), usando o sprite aprovado.
- Intensidade `i = (onda−1) × 0,72` solo ou `× 0,90` coop. Quantidade: `3 + floor(i × 0,55)`, limitada a15solo; coop multiplica por1,3 e arredonda acima, limitado a18. Até6vivos solo /7coop. Não alterar tempos de ataque/aviso das famílias.
- HP: `1 + 0,018i + 0,20log2(1+i/5)` (×1,12 no coop). Poder: `min(3,25;1+0,022i)`, com limite adicional de32% do menor HP máximo da formação, respeitando o poder base do inimigo. Evita crescimento de esponjas e mortes por um único golpe nas condições normais.
- Surgimentos avisados no chão por0,95s, dentro da câmera e afastados dos dois jogadores. Posição é revalidada ao nascer; entrar no aviso o desloca. Cadência1,25s solo /1,05scoop, respeitando o limite de vivos.
- Eliminações têm valores próprios por família, crescem6% poronda e recebem ×1,5 para ressonantes. Ritmo por ondas concluídas sem KO dá até50% adicional; KO reduz dois níveis. Limpar sem perda real de HP dá25% extra sobre o prêmio da onda. Não há bônus por velocidade, para respeitar armas lentas.
- Prêmio de conclusão: `150+50×onda`, mais `250×floor(onda/5)` em marcos de cinco ondas. Pontuação compartilhada no coop; recordes SOLO/COOP separados. Participação do P2 marca toda a tentativa como coop, mesmo se desconectar depois.
- Descanso4s, ou8s nos marcos de cinco. Botão de toque PRÓXIMA ONDA com área mínima44px permite antecipar o intervalo. Não reutilizar ataque/esquiva como atalho de confirmação.
- Recuperar10% do HP ao concluir;25% nos marcos, inclusive aliados derrubados. Iniciar com3fitas temporárias solo /4coop; marcos concedem1/2, até6. Recursos são consolidados na conclusão da onda e não recalculados no carregamento.
- Pausa, diálogos e menus congelam avisos e tempo de combate. O HUD mobile mostra onda, pontos e ritmo em ambas as orientações. P2 conserva movimento, esquiva, interação e ataques próprios.
- Desconexão reduz apenas a fila futura ao perfilsolo; preserva inimigos vivos e a classificação coop. Reconectar não amplia a onda em andamento. A saída fica no extremo norte da arena, longe da chegada, para não consumir a confirmação simultânea dos dois controles.
- Não gerar XP ou fragmentos permanentes. Guardar fitas/ressonância da campanha ao entrar e restaurar ao sair. Derrota ou saída registra resultado/duração e recupera a equipe no Torii. Nova tentativa começa do zero.

Não há onda final predefinida. Há limites numéricos defensivos (onda 1 milhão, HP 2 milhões, poder 9999 e pontuação 9 trilhões) para impedir estados inválidos em saves editados ou sessões extremas; não são metas de balanceamento.

## Save e limites da entrega

O schema geral continua 13. O módulo adiciona apenas `G.postgame.version = 2`, recordes, última tentativa e a tentativa ativa. Saves anteriores recebem os valores padrão. Saves concluídos que estavam no estúdio recebem as opções de pós-jogo sem obrigar a refazer o boss.

Ao carregar/exportar/importar uma expedição, recomeçar a onda atual com HP, fitas, ressonância, ritmo e tempo do início e os pontos/eliminações consolidados antes dela. Uma onda já concluída segue para a próxima. Não conservar inimigos parcialmente feridos ou permitir duplicação dos pontos parciais. Recordes anteriores permanecem como histórico; tentativas antigas em andamento não entram nos placares das regras novas. O recorde é local ao save, não existe ranking online.

Os testes automatizados usam fixtures do runtime em Chrome isolado. Verificam formações, encerramento, viagens, progressão de ondas, derrota/retry, save e coop simulado. Não substituem balanceamento humano prolongado nem testes em controles ou aparelhos físicos.

## Validação 1.12

`qa/dungeon_balance_unit.cjs` cobre regras, recursos, migração e classificação; `qa/dungeon_playtest.cjs` executa60ondas por modalidade, desconexão, reentrada, confirmação simultânea e toque real via CDP em390×844 e844×390. As60ondas usam eliminações controladas para verificar integridade, sem representar dificuldade humana. O benchmark opcional `DUNGEON_BENCH=1` usa ações/IA/dano reais e um bot simples; suas durações servem para comparar candidatos e não comprovam diversão nem equivalência entre personagens. Evidências em `qa/dungeon-v2/`.
