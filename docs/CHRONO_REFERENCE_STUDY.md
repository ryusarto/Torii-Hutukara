# Estudo sistêmico de Chrono Trigger

## Objetivo e limites

Este estudo usa a ROM norte-americana 1.0 fornecida pelo autor e o projeto ChronoRET como referência de engenharia de jogo. O objetivo é compreender princípios de design e arquitetura que podem elevar Torii & Hutukara. Não serão copiados gráficos, músicas, mapas, textos, personagens, dados ou código do jogo original.

## Fontes verificadas

- ROM sem cabeçalho, 4 MiB, título interno `CHRONO TRIGGER`.
- SHA-256: `06d1c2b06b716052c5596aaa0c2e5632a027fee1a9a28439e509f813c30829a9`.
- ChronoRET: recompilação em assembly 65816/SPC700 que declara correspondência byte a byte com esse mesmo alvo.
- Evidências principais: `asm/include/ram_menu.inc`, `asm/include/ram_battle.inc`, `asm/include/constants_battle.inc`, `asm/bankC1/bankC1.asm` e `asm/bankC2/bankC2.asm`.

## O que foi confirmado

### Equipe e reservas

- A ordem da equipe possui nove posições; as três primeiras formam o grupo ativo.
- O menu constrói listas separadas de ativos e reservas e permite trocar personagens, inclusive com bloqueios narrativos em situações específicas.
- O mapa mantém três integrantes e calcula a caminhada dos seguidores usando posições anteriores do líder. Quando uma rota direta está bloqueada, tenta caminhos alternativos e volta à trilha registrada.

### Níveis e progressão

- Cada personagem possui registro próprio, nível de 1 a 99, experiência acumulada e experiência necessária para o próximo nível.
- A vitória distribui a experiência integral aos integrantes válidos da batalha.
- Personagens recrutados que ficaram na reserva recebem 15/20 da experiência, reduzindo o custo de experimentar novas formações.
- Pontos de técnica são separados da experiência comum e alimentam a aprendizagem de habilidades.

### Identidade e cooperação

- Técnicas simples pertencem a um personagem; técnicas duplas e triplas exigem parceiros específicos presentes e prontos.
- A seleção de alvos não é apenas “um inimigo ou todos”: há modos e formas de área, incluindo linha, círculo, faixa e triângulo.
- O sistema de movimento dos inimigos oferece comportamentos legíveis, como aproximação, investida, manutenção de distância, órbita e alinhamento por eixo.

### Vida fora da batalha

- O personagem deixa a pose estática e executa uma animação de espera após permanecer parado.
- Movimento, pose, orientação e evento são estados separados. Isso permite que pessoas reajam à posição do jogador, caminhem até pontos e mudem após acontecimentos narrativos.
- O grupo acompanha fisicamente a navegação, reforçando a sensação de jornada compartilhada.

## Tradução para Torii & Hutukara

### Equipe

- Manter até três integrantes ativos.
- Exibir reservas, função musical, nível, experiência e próxima técnica na mesma tela.
- Permitir troca fora de combates e em pontos narrativamente seguros.
- Preservar personagens obrigatórios apenas quando a cena realmente depender deles.

### Níveis

- Cada personagem terá curva própria e atributos alinhados ao instrumento e ao estilo de jogo.
- Reservas receberão 75% da experiência e nunca ficarão inutilizáveis por terem chegado tarde.
- Um mecanismo de recuperação elevará rapidamente quem estiver muito abaixo do nível médio do grupo.
- Pontos de repertório destravarão técnicas sem depender apenas do nível.

### Identidade de combate

| Personagem | Função principal | Assinatura |
|---|---|---|
| Ryuchi principal | duelista móvel | corte, deslocamento e precisão |
| Ryuchi ninja | controle e evasão | sombras, armadilhas e reposicionamento |
| Ryuchi percussionista | ritmo e impacto | combos no tempo, contra-ataque e ondas de pulso |
| Franco principal | suporte criativo | ligação do grupo e manipulação musical |
| Franco alternativo | pressão tática | variações conforme a versão narrativa |
| Franco sintetista | área e modulação | zonas, frequências e efeitos sustentados |

- Técnicas combinadas serão autorais e nascerão da relação entre instrumentos, não de equivalentes diretos do jogo de referência.
- Formas de alvo serão comunicadas antes do golpe: linha, cone, círculo, faixa e pulso radial.

### Cidades e NPCs

- Todo NPC importante terá pose de espera, reação à proximidade, orientação e pelo menos uma pequena mudança após eventos.
- Moradores poderão alternar entre dois ou três pontos seguros para evitar a sensação de manequins.
- Conversas e posições serão controladas pelos mesmos estados de missão; assim, fala, marcador e passagem física nunca divergem.
- Ruas terão identidade por materiais, iluminação, placas, som ambiente e pequenas ações locais.

### Roteiro e estados

- Cada etapa narrativa terá entrada, ação observável, consequência visual e próximo objetivo.
- Portas e passagens dependerão do acontecimento que o jogador já realizou, nunca de um estado que só pode ser criado depois da própria passagem.
- Recrutamentos serão preparados antes da entrada do personagem, seguidos por reação do grupo e demonstração jogável da nova identidade.

## Aplicação imediata na Alpha 1.1.1

- Ryuchi percussionista recebeu repertório rítmico próprio, corrida, rolamento e poses diferenciadas.
- NPCs do Capítulo 3 receberam alternância de quadros e reação à proximidade.
- A passagem do Clube Contratempo ao elevador foi corrigida para depender da frase concluída, removendo um ciclo impossível.
- O Distrito ganhou materiais, placas e marcos visuais que tornam seus lugares reconhecíveis.
- A tela de equipe passou a exibir função, nível e experiência dos seis personagens; integrantes na reserva recebem 75% da experiência e novos aliados entram com recuperação de 75% da média dos protagonistas.

## Próxima implementação

O gerenciamento básico de equipe e a progressão individual já estão visíveis na Alpha 1.1.1. Técnicas combinadas autorais, formas de alvo e rotas mais elaboradas de seguidores e NPCs entram no ciclo Alpha 1.2, depois do playtest integral. Essa separação evita misturar a correção crítica de progressão com todas as mudanças estruturais de combate de uma só vez.
