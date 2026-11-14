# Histórico de versões

Todas as alterações relevantes do projeto são registradas aqui.

## [Não lançado]

### Fase 3 (parte 2) — padrões de chefe e inimigos musicais

- Chefes com padrão por fase + 20% de variação (RNG), nunca 3 ataques iguais seguidos e nome de cada ataque na tela. Viajante deixa de ser sorteio puro; Arauto ganha variação e aviso um pouco mais longo; Metrônomo varia só na fase 3; O Silêncio ganha 15% de variação.
- Três inimigos novos: Metrônomo Menor (ataca no compasso fixo), Eco Espelho (devolve onda após 2 golpes) e Abafador (aura que bloqueia técnicas). Um aviso explica cada um na primeira vez.
- Laboratório de combate (`qa/combat_lab.cjs`) e relatório em `docs/COMBATE_PADROES.md`.

### Fases 3 e 4 (parte 1) — mais ação, menos idas e voltas, cura

- 14 encontros novos no caminho principal; o primeiro combate acontece no corredor do estúdio (190 s → 40 s no perfil típico).
- Duas patrulhas de ecos menores no Distrito da Distorção, ativas depois da primeira frente concluída; voltam a cada nova passagem, mas não depois de uma derrota.
- Capítulo 3: Mazza e Colli levam a Flauta dos Ventos ao Contratempo; a ida à oficina deixa de ser obrigatória.
- Fitas de cura passam a funcionar (antes eram compradas e ganhas, mas não havia como usar): R, Share/Create ou botão ♥ FITA; recuperam 40% da vida do integrante ativo.
- Mercadores com fitas nos três capítulos: Mercadora (Cap. 1), banca do Colli no Mercado das Fitas (Cap. 2) e balcão do Belga no Contratempo (Cap. 3).
- Três gravadores novos no Capítulo 3 (Distrito e Mar de Nuvens) que curam a equipe e salvam o ponto.
- Ao concluir cada etapa grande do Capítulo 3, quem caiu volta com 30% da vida. Cada capítulo novo começa com a equipe recuperada.
- Corrigido (bug antigo da 1.0): o jogo podia travar quando um projétil derrotava o último inimigo da luta.
- Jogada automática: 0 derrotas e nenhum travamento nos dois perfis; maior trecho sem lutar 4,3 → 2,1 min.

### Fase 5 — cortes de diálogo

- 225 → 139 falas obrigatórias, preservando estúdio e chegada ao Hutukara, máscaras, revelação do mascarado, encontro das versões, plot twist e final. Edições em `design/dialogo/EDICOES_DIALOGO.json`, aplicadas por `dialogue_edits.js`.
- Avisos de sistema (itens, retransmissores, novo aliado, ressonância) viram notificação rápida, sem travar o jogo.
- Capítulo 2: a Íris explica tudo de uma vez e o Belga entrega o acoplador; a parada obrigatória na Rádio 9 deixa de existir (saves antigos são ajustados).
- Belga, Colli, Mazza e Dney com mais presença: Dney conduz a cena do Contratempo e Mazza ganha falas próprias.
- Final: 3 falas novas com o gancho dos mundos dentro do Hutukara e das próximas sessões (aprovadas pelo autor).
- Corrigido: cena do Canal repetia inteira ao falar de novo com Colli ou com o Percussionista; cenas automáticas se repetiam depois de uma derrota; nomes "BENTO" e "NARA" no lugar de BELGA e COLLI; duas aberturas contraditórias na revelação do mascarado; mesma fala nas duas pedras; fala do Mazza respondendo a uma fala cortada.
- Corrigido no medidor de ritmo: o início do teste do Capítulo 3 não era registrado.
- Jornada típica medida: 27,5 → 20,3 min.

### Fase 1 — medição de ritmo

- Medidor de ritmo (`game/source/telemetry/pace_meter.js`): tempo andando, lendo, lutando e em menus por área e por etapa, guardado só no aparelho. Com `?ritmo` no endereço aparece o botão RITMO para baixar o relatório.
- Jogada automática (`qa/pace_bot.cjs`) que zera o jogo seguindo os objetivos, com perfis rápido e típico.
- Resultado em `docs/RITMO_FASE1.md`: 73% do tempo lendo, 9% em combate, 225 falas obrigatórias, Capítulo 3 com metade do tempo e 109 falas.
- Corrigido: falas do Franco Sintetizador, do Ryuchi Percussionista e do Metrônomo apareciam como SYNTH, PERCUSSION e METRONOME e com retrato errado.

### Fase 0 — licença e identificação

- Projeto licenciado como código aberto: código em MIT (`LICENSE`), materiais abertos em CC BY 4.0 e materiais protegidos em CC BY-NC-ND 4.0 (`LICENSE-ASSETS.md`). Protegidos: Ryuchi e Franco, The Sir em todas as versões, máscaras Torii, músicas e participantes do álbum.
- README e `docs/ASSET_PROVENANCE.md` atualizados com as licenças, as autorizações e o crédito ao Suno.
- Repositório limpo: builds Alpha 1.0 a 1.2.3 (~700 MB) saíram da árvore e ficam no histórico do git, nas tags `alpha-*` e no branch `claude/arquivo-builds-ate-1.2.4`. Removidos também dois HTMLs de outros projetos em `design/chapter-03/` (*Assim que as Flores Crescem* e o painel IKIRU) e `docs/SHA256SUMS.txt`, que duplicava o hash da base com caminho errado.
- Builds deixam de ser versionadas: `game/builds/` está no `.gitignore` e o workflow de publicação gera a build com `build_alpha.rb`, valida com `validate_alpha.rb` e só então publica. Verificado que o gerador reproduz a Alpha 1.2.4 publicada byte a byte (SHA-256 `0af38b67…aad2`). O HTML portátil fica como artefato do workflow por 90 dias.
- Preparado `production/limpar_historico.sh` e o guia `docs/LIMPEZA_HISTORICO.md` para remover as builds do histórico do git (clone de 204 MB → 134 MB). Precisa ser executado pelo administrador depois do merge; testado num remoto local com conteúdo final idêntico.
- Os três scripts de regressão de controles por versão viraram um só, `qa/input_regression.cjs`, que lê a build atual de `web/playtest/build.json`. 22/22 verificações aprovadas na Alpha 1.2.4.
- Corrigido o rótulo de versão no topo da tela: camadas antigas reescreviam "1.0 · PRÉ-ALPHA" a cada atualização do HUD. Agora um único `BUILD_LABEL` é reaplicado por último. Entra na próxima build gerada.

### Planejado

- Playtest completo da Alpha 1.2.0 em desktop e celular.
- Ajustes finos de escala, colisão e ordenação dos novos objetos.
- Animação visível da saída de Colli da oficina e chegada ao canal.
- Mais reações de grupo ao encontro das versões de Franco e Ryuchi.
- Balanceamento dos dois chefes finais a partir de tentativas reais.

## [Alpha 1.2.4 · Nome de Colli] — 2026-11-13

- Corrigido o cabeçalho dos diálogos de Colli no capítulo 2: o ID legado `nilo` agora é resolvido como COLLI pelo próprio renderizador de diálogo, em vez de usar o ID em maiúsculas.
- IDs de NPC, sprites e flags das fitas permanecem compatíveis com saves existentes.
- Verificadas no navegador as falas com zero, uma e duas fitas: todas mostram COLLI e a recompensa continua funcionando. Validação estática: 103/103.

## [Alpha 1.2.3 · Coop e identidade] — 2026-11-13

- Estado de ataque, combinação, passada e rolamento do P2 vinculado ao personagem. Trocas cancelam a animação anterior, inclusive quando P1 muda de líder.
- Ataques básicos distintos no P2: arco com projétil, oscilador, batidas de percussão, estocada, corte de katana e golpe amplo de baixo. Os estados de ação do P1 ficam isolados.
- Rolamento renderizado somente para a identidade que iniciou a ação; passada do P2 independente da movimentação do líder.
- Puxão passa de 6 para 9,5 blocos; limite de afastamento do líder passa de 7,6 para 11. Câmera busca o ponto médio dos jogadores.
- P2 usa ✕ para conversar, acionar eventos e atravessar passagens a partir da própria posição, mantendo requisitos e transições da história.
- Franco principal: rolada de 0,36 s e 2,76 blocos, recarga de 0,76 s e recuperação do ataque reduzida. Velocidade normal de caminhada já é compartilhada entre personagens.
- 103 verificações estáticas e 22 funcionais aprovadas com controles simulados; playtest com dois controles físicos permanece necessário.

## [Alpha 1.2.2 · Mobile horizontal] — 2026-11-13

- Controles na horizontal com elementos posicionados e captura de toques simultâneos; removido o uso de `display:contents` nessa orientação.
- Jogo ocupa a área horizontal completa, com controles semitransparentes sobrepostos e respeito às áreas seguras.
- Diálogos cancelam movimento, rolamento e comandos mantidos; analógico não acumula movimento durante falas.
- Trilha pausada durante desafios musicais, inclusive impedindo que uma decodificação atrasada reinicie a música durante a prova.
- Rolamento dos seis personagens com aproximadamente 15% mais distância, mantendo duração, invulnerabilidade e colisão.
- 103 verificações estáticas e 19 testes funcionais aprovados no Chrome, incluindo multitouch horizontal, bloqueio em diálogo e pausa musical. Testes em aparelhos físicos continuam pendentes.

## [Site provisório de testes] — 2026-11-13

- GitHub Pages com HTTPS no mesmo repositório, tornado público pelo autor.
- Publicação da Alpha 1.2.1 no endereço fixo `https://ryusarto.github.io/Torii-Hutukara/`.
- Identificação PC/MOBILE na entrada por quatro segundos, seguida de remoção completa do aviso.
- Exportação web com imagens em cache e MP3 sob demanda; HTML portátil preservado e conteúdo reconstruído byte a byte durante a verificação.
- Publicação automática da versão selecionada em `web/playtest/build.json`, com hashes e relatório públicos.
- Verificação de PC, celular e tablet por emulação, incluindo rotação, músicas e entrada do capítulo 3.

## [Alpha 1.2.1 · Mobile & Co-op] — 2026-11-13

### Corrigido

- Leitura de gamepad apagando movimento e ataque de toque quando não havia controle físico conectado.
- Círculo abrindo a pausa em áreas sem combate; agora sempre esquiva durante exploração e luta.
- Teleporte por distância do segundo jogador e projeção de posição para dentro de casas.
- Colisão pontual do P2: agora usa o corpo inteiro e passos curtos, com recuperação de posição inválida.
- Simulação e recargas do P2 continuando durante menus.
- Rolada com direção, duração e integração inconsistentes entre controle, personagem e ciclo de simulação.

### Adicionado

- Layout mobile automático em retrato e paisagem, com enquadramento próprio, zonas seguras e painéis de toque dedicados.
- Analógico com intensidade, corrida na borda, captura de cada dedo e cancelamento seguro ao girar ou trocar de aplicativo.
- Convivência de toque e controle físico no celular; teclado como apresentação inicial do desktop.
- Puxão gradual do coop por rota caminhável e espera do líder ao alcançar o limite de afastamento.
- Perfis autorais de rolada e recuperação de ataques para os seis personagens.
- Abertura de contra-ataque sinalizada após padrões dos chefes finais, prevenção de repetição imediata e alternância de mira entre jogadores.
- Estudo do Delta e aprofundamento do Moonlighter com REA: 36 tipos e 1.019 métodos selecionados, sem alterar a instalação ou incorporar seu conteúdo.
- Proposta para discutir as habilidades dos seis personagens e reduzir o deslocamento vazio das quests.

### Verificação

- 16 testes funcionais no Chrome, incluindo multitouch real simulado, orientação e dois controles simulados.
- Roladas verificadas a 30, 60 e 120 quadros por segundo, inclusive contra paredes e no ciclo real de atualização.
- Testes físicos em Safari iOS/Android e com dois controles reais continuam pendentes.
- Sprites cyberpunk e cortes narrativos ficam no ciclo seguinte, após a prioridade de controles e discussão dos kits.

## [Alpha 1.2.0 · Pré-beta] — 2026-11-12

### Adicionado

- Retratos autorais consistentes para Franco, Ryuchi e suas variações, incluindo expressões dramáticas.
- Máscara Torii canônica baseada na peça física: tecido marfim, costura central, treze pontas, lentes circulares e abertura inferior transparente.
- Rolamento em seis etapas para os seis personagens jogáveis.
- Corrida própria para Franco Sintetizador e Ryuchi Percussionista.
- Atlas de nuvens volumétricas em 16 bits, pilares, placa, postes e mobiliário cyberpunk.
- Seis fundos cinematográficos próprios para estúdio, câmara, cidades, ruínas e nuvens.
- Retratos naturais de conversa para os seis personagens jogáveis, sem deformação no enquadramento.
- Sprites autorais de Belga, Colli, Mazza e Dney como colaboradores centrais do mundo.
- Movimento multidirecional transparente para os quatro colaboradores, com quadros alternados de passo e retratos próprios.
- Materiais integrados para as ruas, o Mar de Nuvens, o Último Torii e o Núcleo do Silêncio.
- Olhos observadores e altar do Silêncio para a arena do confronto final.
- Suporte à Gamepad API com mapeamento para DualShock 4, DualSense e controles padronizados.
- Navegação de menus, diálogos, exploração, combate, técnicas, especial e pausa pelo controle.
- Coop local automático com dois controles e dois integrantes jogáveis simultaneamente.
- Movimento, direção, recargas, esquiva, invulnerabilidade e HP independentes para o Jogador 2.
- Troca do integrante controlado pelo Jogador 2, vibração quando disponível e ajuda dentro do jogo.

### Alterado

- Franco foi redesenhado a partir das referências faciais do artista para manter cabelo, sobrancelhas, rosto, boca e barba curta entre cenas.
- A máscara cobre testa e linha frontal do cabelo, mas revela boca, parte inferior das bochechas, barba e queixo.
- Placas do Distrito foram aproximadas das fachadas e as colisões passaram a acompanhar o volume visível dos prédios.
- A aquisição das máscaras foi dividida em antes e depois de equipá-las, sincronizando retrato e narrativa.
- Franco Sintetizador e Ryuchi Percussionista passaram a usar a mesma escala, âncora e fluidez dos protagonistas.
- O rolamento foi desacelerado, manteve a distância tática e perdeu a rotação artificial da tela inteira.
- O Último Torii deixou de exibir máscaras duplicadas: o círculo de ressonância agora explica a reunião das seis versões.
- Os papéis antes ocupados por Maia, Ciro, Nara e Vega passaram respectivamente a Belga, Mazza, Colli e Dney.
- A lore dos quatro colaboradores agora evolui entre Contratempo, Oficina, Canal, Nuvens e limiar final.
- A assistência automática do primeiro seguidor é suspensa no coop para que suas ações pertençam ao segundo jogador.
- A câmera compartilhada ganhou limite de distância e reposicionamento seguro nas transições.

### Corrigido

- Máscaras flutuando acima dos personagens durante a exploração.
- NPCs genéricos ou deformados no Último Torii.
- Congelamento ao escolher tentar novamente depois de morrer para o chefe final.
- Resíduos de projéteis, padrões e estados de batalha que contaminavam uma nova tentativa.

### Verificação

- 103 de 103 verificações estáticas aprovadas.
- Build final com 97.872.821 bytes.
- SHA-256: `c3ac6d011bdae931d7d0e59f851bee57930f2191deb2d1389f3dddd7ed1e7dca`.

## [Alpha 1.1.2] — 2026-11-12

### Adicionado

- Encontros diferentes para a segunda rota, com reações cruzadas entre as versões de Franco e Ryuchi.
- Kit autoral do Franco Sintetizador: combo Oscilador, Pads Harmônicos persistentes e Filtro de Corte.
- Estudo técnico das estruturas de combate de Moonlighter e registro dos limites de adaptação autoral.

### Corrigido

- Entrada lateral do Núcleo do Silêncio nascendo sobre vazio bloqueado.
- Franco Sintetizador e Ryuchi Percussionista entrando na formação antes da própria apresentação.
- Golpes do Franco Sintetizador reutilizando o comportamento do Franco Arqueiro.

### Verificação

- 65 de 65 verificações estáticas aprovadas.
- Build final com 86.333.596 bytes.
- SHA-256: `4e283861ec3caf460aa35dcb79f35aee7c9bdcdcfcb73e9428d96ea31993ae40`.

## [Alpha 1.1.1] — 2026-11-12

### Adicionado

- Materiais detalhados do Distrito derivados da arte-fonte aprovada.
- Placas e marcos visuais para Clube Contratempo, Oficina de Ciro, Usina de Retorno, Canal Suspenso e Elevador do Céu.
- Animação ambiente dos NPCs, com alternância de pose e reação à proximidade.
- Corrida, rolamento e poses de ataque em tempo real para Ryuchi percussionista.
- Golpes exclusivos de percussão: combo de três batidas, Contratempo, Quebra-pulso e Pulso Comum.
- Estudo documentado dos sistemas da ROM de Chrono Trigger e do projeto ChronoRET.
- Função, nível e experiência individual para os seis personagens na tela de equipe.
- Experiência de reserva em 75% e recuperação de nível para aliados recrutados mais tarde.

### Corrigido

- Dependência circular que exigia o elevador aberto para entrar na própria sala que o abria.
- Seta de missão que desaparecia após a apresentação no Clube Contratempo.
- Passagem para o Elevador do Céu permanecendo bloqueada apesar da frase musical concluída.

### Verificação

- 62 de 62 verificações estáticas aprovadas.
- Build final com 86.329.154 bytes.
- SHA-256: `93f291f4d68778968e14f48f7ded71e93f9a62937da5529f9e0ec4e94a96b268`.

## [Alpha 1.1.0] — 2026-11-12

### Adicionado

- Nove folhas de movimentação, totalizando 72 quadros.
- Sprites próprios de Maia, Nara, Ciro, Vega, Dimas, moradores, trabalhadora do canal e operador da usina.
- Cinco atlas de ambiente com 42 objetos.
- Mobiliário urbano, iluminação, máquinas da oficina, componentes do canal e estados do elevador.
- Catálogo visual e manifesto dos sprites.
- Estrutura completa de produção no GitHub.

### Alterado

- Nara é apresentada no Canal Suspenso antes de ajudar o grupo.
- Ciro reconhece corretamente que Nara foi ao canal.
- Objetivos da Usina e do Canal agora reagem à etapa concluída.
- Trabalhadora do canal e operador da usina fornecem orientação contextual.
- Transição do Capítulo 2 para o 3 reescrita como passagem aberta pelas máscaras.
- Identidade visual da build atualizada para Alpha 1.1.0.

### Corrigido

- NPCs do Capítulo 3 sem sprite próprio.
- Postes e objetos representados apenas por formas simples.
- Marcador do canal permanecendo na interferência já resolvida.
- Falas que tratavam Nara como ausente quando ela estava presente.
- Necessidade de voltar ao menu para iniciar o Capítulo 3 após o segundo boss.

### Verificação

- 57 de 57 verificações estáticas aprovadas.
- Build final com 82.349.689 bytes.
- SHA-256: `22e0637c4c95d2389a731b6a2038be5eff86bf415eb87f2a9a60340fc536c94f`.

## [Alpha 1.0] — 2026-11-11

- Primeira build jogável completa com três capítulos.
- Distrito, Usina, Canal, Oficina, Elevador, Mar de Nuvens e Último Torii.
- Franco sintetista e Ryuchi percussionista recrutáveis.
- O Metrônomo e O Silêncio como confrontos finais.
- Frase livre de quatro notas e epílogo no estúdio.
- Seis músicas incorporadas ao Capítulo 3.

## [1.1.2 Trilhas] — 2026-11-11

- Última base preservada antes da integração do Capítulo 3 completo.
- Arquivo original mantido em `game/source/base/` com hash de verificação.

