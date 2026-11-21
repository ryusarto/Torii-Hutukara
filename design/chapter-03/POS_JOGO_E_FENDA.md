# Pós-jogo e Fenda das Ressonâncias — Beta 1.9

## Último Torii: presença coerente

Ao entrar na sala, consultar a formação de até três integrantes, o líder e o personagem controlado pelo P2. Selecionar até duas pessoas desbloqueadas que estejam fora desse grupo. Remover os antigos NPCs fixos Arqueiro/Katana. A seleção também é atualizada se o jogador trocar a formação dentro da sala.

Cada reserva usa o próprio sprite e uma fala que retoma seu arco: o Arqueiro abandona a necessidade de provar sua diferença; Katana oferece companhia sem negar o medo; Sintetizador mantém um acorde aberto para o retorno; Percussionista encontra o pulso ouvindo os outros. O líder presente responde. Se não houver reservas disponíveis, Belga e Colli sustentam a passagem. Nunca recrutar ou desbloquear alguém por causa desta cena.

## Final: permanecer em Hutukara

Preservar C3_025 e a resolução do Silêncio. Reescrever C3_026 e C3_027: as máscaras deixam de impor uma saída, os caminhos permanecem abertos e uma ressonância sob o Torii anuncia a expedição. Não transportar automaticamente para o estúdio. Encerrar junto ao Último Torii com a equipe recuperada e um checkpoint de campanha concluída.

A tela final oferece entrar no calabouço, explorar cenários, criar outra frase musical, permanecer no Torii e exportar o save. A exploração é uma escolha, não outra lista de entregas. O estúdio permanece como destino voluntário no mapa, sem ser o encerramento obrigatório.

## Viagens

Após a conclusão, M ou o botão de mapa abre os cenários. O menu também oferece viagens e calabouço, aproveitando a navegação existente de controle e toque. Todos os mapas da campanha ficam disponíveis. Cada chegada usa a posição de uma passagem existente, ajustada para um local onde o corpo inteiro cabe. Salvar e carregar em mapas anteriores mantém o destino escolhido.

Não viajar durante combate, diálogo ou desafio musical. Na expedição, o mesmo mapa permite encerrá-la e registrar a pontuação antes de viajar.

## Expedição infinita

Nome: **Fenda das Ressonâncias**. Uma arena fixa usa o piso e os objetos existentes do Núcleo. O que é procedural são as composições e posições dos inimigos, a partir de uma semente por tentativa. Não há salas procedurais nem boss novo nesta entrega.

- Onda 1: três inimigos. A composição cresce até 18 inimigos por onda, com até oito vivos simultaneamente.
- Novas famílias entram progressivamente no conjunto: hush, whisper, compasso, espelho, abafador, drone e eco.
- HP: multiplicador `1 + 0,13 × (onda − 1)`. Poder: `1 + 0,065 × (onda − 1)`.
- Eliminar um inimigo vale `25 + 5 × onda`; concluir a onda vale `100 × onda`.
- Intervalo de três segundos entre ondas. Recuperar 20% do HP máximo antes da próxima onda, incluindo aliados derrubados.
- Pausa, diálogos e menus congelam a contagem. As mesmas armas, esquivas, técnicas, IA e regras de coop da campanha continuam em uso.
- Não gerar XP ou fragmentos permanentes na expedição. O prêmio é a pontuação e o recorde neste save, sem farming da progressão da campanha.
- Derrota ou saída: registrar pontos, ondas concluídas, eliminações e semente; recuperar a equipe no Torii. Tentar novamente inicia uma tentativa nova.

Não há onda final predefinida. Há limites numéricos defensivos (onda 1 milhão, HP 2 milhões, poder 9999 e pontuação 9 trilhões) para impedir estados inválidos em saves editados ou sessões extremas; não são metas de balanceamento.

## Save e limites da entrega

O schema geral continua 13. O módulo adiciona apenas `G.postgame.version = 1`, recordes, última tentativa e a tentativa ativa. Saves anteriores recebem os valores padrão. Saves concluídos que estavam no estúdio recebem as opções de pós-jogo sem obrigar a refazer o boss.

Ao carregar/exportar/importar uma expedição, recomeçar a onda atual com HP do início e os pontos/eliminações consolidados antes dela. Uma onda já concluída segue para a próxima. Não conservar inimigos parcialmente feridos ou permitir duplicação dos pontos parciais. O recorde é local ao save, não existe ranking online.

Os testes automatizados usam fixtures do runtime em Chrome isolado. Verificam formações, encerramento, viagens, progressão de ondas, derrota/retry, save e coop simulado. Não substituem balanceamento humano prolongado nem testes em controles ou aparelhos físicos.
