# Direção de arte, inimigos e próximos encontros

Revisado em 17/11/2026. Este plano acompanha as correções da Beta 1.0.1; os inimigos propostos e a produção de arte abaixo continuam pendentes. O GitHub mantém código, manifestos e documentos oficiais. O Dropbox guarda backups, originais, ZIPs e temporários.

## Ordem de progressão

O estúdio, o corredor e a câmara são apresentação e descoberta. Não possuem inimigos hostis. A primeira luta acontece depois da entrega do Baixo de Raiz e da apresentação dos comandos. A entrada da floresta permanece segura enquanto o instrumento está bloqueado.

Cada encontro precisa de três condições: combate liberado na história, comandos funcionais no mapa e espaço navegável para reagir. Antecipar uma luta para melhorar uma métrica de ritmo não pode atropelar essas condições.

Depois de ensinar uma ação, apresentar um inimigo isolado que permita praticá-la; depois combinar funções. Não exigir técnicas bloqueadas nem um integrante específico para vencer um inimigo comum.

## Inventário de arte e entregas

| Grupo | Estado rastreado | Próxima entrega |
|---|---|---|
| Franco e Ryuchi principais | Pacote V5 publicado em `assets/protagonistas/v5`, com 192 sequências e 32 retratos. Ainda não aplicado ao runtime. | Integrar e verificar máscara, escala, pivô, transições e sincronismo de impacto. Não regenerar o conjunto inteiro. |
| Arqueiro, Katana, Sintetizador e Percussionista | Locomoção e efeitos existentes; rolada atual usa uma linha por herói e espelhamento lateral. | Completar preparação, impacto, recuperação, dano, derrota e direções de rolamento próprias. |
| Metrônomo Menor, Eco Espelho e Abafador | Reaproveitam hush/whisper com aura e marcador de cor. | Silhuetas e estados próprios, reconhecíveis também sem cor. |
| Eco de Distorção e Drone de Retorno | Usam a mesma célula de imagem, com tamanho diferente. | Diferenciar corpo terrestre e máquina voadora; definir ataque próprio do Drone. |
| Viajante, Arauto, Metrônomo e Silêncio | Representações existentes. | Ciclos de preparação, ataque, recuperação, reação, fase e encerramento; preservar a revelação do Viajante. |
| Piso, nuvens e arena final | Texturas e atlas disponíveis; recortes ainda repetem fachadas/canos no chão. | Separar superfície de apoio, borda, fachada e decoração; eliminar emendas; reduzir contraste sob o combate. |
| Contratempo | Palco, caixas, mesas e balcão ainda são formas simples. | Props com escala e perspectiva coerentes; estados antes e depois do show. |
| Consequências das missões | Elevador aberto/fechado e interferência calma já possuem arte. | Ligar estados disponíveis às flags antes de pedir novas imagens. Completar apenas estados realmente ausentes. |
| Efeitos e ícones | Representações funcionais disponíveis. | Vocabulário coerente de perigo, proteção, impacto e recuperação. A correção de sobreposição do diálogo é de interface. |
| NPCs e fundos | Elenco principal, moradores, trabalhadores e fundos cinematográficos disponíveis. | Expressões e reações adicionais são refinamentos opcionais. |

Consulte também [Arte dos protagonistas V5](ARTE_PROTAGONISTAS_V5.md). O relatório estrutural e a prévia do pacote validam cobertura e apresentação dos arquivos; não certificam fluidez ou ergonomia no jogo.

## Proposta de variedade de inimigos

Há sete tipos normais no catálogo atual. Eco de Distorção e Drone não representam estilos completos diferentes apenas por mudarem de nome e tamanho. Antes de aumentar a quantidade de encontros, consolidar funções reconhecíveis.

| Proposta | Comportamento | Decisão do jogador | Introdução |
|---|---|---|---|
| Estalo de Raiz, novo | Agacha, marca uma direção e avança em linha curta. Fica exposto ao errar. | Desviar lateralmente e atacar na recuperação. | Floresta, após ataque e esquiva básicos. |
| Corista da Estática, novo | Canaliza proteção para um aliado por uma ligação visível. Um golpe interrompe. | Escolher prioridade e interromper o suporte. | Cidade das Vozes, primeiro com um inimigo básico. |
| Ressonador Blindado, novo | Protege a frente, gira devagar e expõe o núcleo atrás. | Flanquear, atrair ou coordenar P1/P2. | Usina, com espaço lateral disponível. |
| Drone de Retorno, retrabalho | Mostra a mira, fixa a direção, dispara rajada curta e recarrega. | Usar cobertura e avançar entre disparos. | Capítulo 3, antes de combiná-lo com outro papel. |
| Metrônomo Menor, existente | Ataca em pulso próprio com preparação visível. | Entrar entre batidas. | Isolado antes de misturas. |
| Eco Espelho, existente | Acumula resposta a golpes e devolve onda anunciada. | Controlar a sequência e abrir distância. | Depois de apresentar esquiva e leitura de avisos. |
| Abafador, existente | Cria zona que bloqueia técnicas. | Sair da aura ou usar ataque básico. | Após apresentar técnicas e onde haja saída da zona. |

O pulso do Metrônomo Menor não implica sincronismo com a faixa musical. A proposta de golpe na batida continua separada e adiada conforme a decisão anterior do autor.

## Ritmo de história e combate

O encontro deve transformar um problema do mundo. Exemplo: ouvir o trabalhador preso, reconhecer a mira do Drone, atravessar a cobertura, abrir a comporta e ver os trabalhadores saírem. Uma reação curta pode concluir o arco porque o jogador viveu a consequência.

Introduzir uma novidade por vez; depois testar duplas e grupos pequenos. Não combinar vários controladores de área em corredores estreitos. Preservar portas, NPCs e gravadores como respiro; não repetir uma patrulha em todo retorno apenas para aumentar a porcentagem de combate.

## Aceite das entregas

- Arte com manifesto de estado, direção, células, pivô e duração; PNG transparente para sprites e props.
- Escala, volume e âncora consistentes entre ações, P1, P2 e seguidores.
- Máscara de costas com parte traseira correta; identidade e roupa aprovadas preservadas.
- Piso repetido em área de teste sem emendas, com fachadas e canos separados da superfície.
- Preparação, impacto e recuperação reconhecíveis e coerentes com alcance, dano e invulnerabilidade.
- Perigos visíveis no mobile fora das zonas dos polegares e distinguíveis sem depender só de cor ou som.
- Playtest com habilidades realmente disponíveis naquela etapa, em solo e coop, sem equipamento de QA.
- Medir dano recebido, mortes, recursos usados e se a pessoa entende o ataque após perder; ajustar HP e quantidade depois disso.
