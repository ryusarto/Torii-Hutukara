# TORII & HUTUKARA — A Última Frequência

RPG musical de ação e narrativa feito em HTML Canvas. A jornada acompanha Franco, Ryuchi e suas outras frequências através de três capítulos conectados por música, memória, criação e medo de começar.

## Estado atual

**Versão atual:** Beta 1.8.0 — fachadas em perspectiva, interiores próprios, luz e vento, portal para as nuvens e reconstrução/queda animadas. A versão fica em `game/VERSION.json`.

- Capítulo 1: fundação da jornada, floresta, ruínas e primeiras relíquias.
- Capítulo 2: Cidade das Vozes, novas formações e o primeiro confronto com O Silêncio.
- Capítulo 3: Distrito da Distorção, Clube Contratempo, Usina de Retorno, Canal Suspenso, Mar de Nuvens, O Metrônomo e a luta final.
- Seis personagens jogáveis e formação de até três integrantes.
- Salvamento local, importação/exportação em JSON e checkpoints.
- Seis faixas próprias do terceiro capítulo incorporadas à build.
- Ninja e Arqueiro: 12 estados, oito poses por ação, rolamento, retratos e animações independentes no coop. [Detalhes e prévia dos assets](docs/ARTE_NINJA_ARQUEIRO_V1.md).
- Franco e Ryuchi principais: 192 sequências V5 com e sem máscara, retratos e ações independentes no co-op. [Integração dos protagonistas](docs/ARTE_PROTAGONISTAS_V5.md).
- Cenários C3 desérticos: 13 atlas, 131 recortes/estados e dois fundos de diálogo; terra, ferrugem, sucata e passagens elevadas legíveis. C1/C2 mantêm os 20 recortes compartilhados. [Assets e integração](docs/CENARIOS_DESERTO_V1.md).
- Ryuchi Percussionista e Franco Sintetizador: 208 sequências, 1.664 poses e 32 retratos, com/sem máscara, na paleta canônica de terra e sucata. [Assets, integração e prévia](docs/ARTE_PERCUSSAO_SINTETIZADOR_V1.md).
- Sprites detalhados para os personagens e NPCs do Capítulo 3.
- Fachadas com volume e portas alinhadas, 13 interiores distintos, iluminação local, poeira e copas ao vento.
- Portal para o Mar de Nuvens, reconstrução animada das passagens e queda mortal ao sair da borda, inclusive no coop. [Ambientes, arte e testes](docs/AMBIENTES_MUNDO_VIVO_V1.md).
- Golpes dos quatro chefes com 32 quadros de FX: energia, interferência, poeira/sucata e vórtice oxidado, da preparação ao impacto e à dissipação. [Sprites, prompts e integração](docs/BOSS_GROUND_FX_V1.md).
- Jogo distribuído como um único HTML portátil, sem instalação.
- Suporte a DualShock 4, DualSense e controles compatíveis, com coop local para duas pessoas.

## Jogar

**Teste no navegador:** [Abrir Torii & Hutukara](https://ryusarto.github.io/Torii-Hutukara/).

O link identifica PC ou mobile na entrada e exibe um aviso por quatro segundos. Depois, o aviso some. A interface de toque é automática em celular/tablet. Veja [publicação e testes entre aparelhos](docs/PLAYTEST_SITE.md).

**Versão para baixar e jogar offline:** um único HTML portátil, gerado automaticamente a cada publicação. Baixe em [Actions → Publish playtest](https://github.com/ryusarto/Torii-Hutukara/actions/workflows/playtest.yml), na execução mais recente, artefato `torii-hutukara-html-portatil`, ou gere localmente (veja *Construir a versão jogável*). O arquivo fica em `game/builds/beta-1.8.0/`.

Controles principais:

| Ação | Teclas |
|---|---|
| Movimento | WASD ou setas |
| Correr | Shift |
| Interagir | E |
| Ataque | J ou Espaço |
| Técnicas | Z e X |
| Dash | Q |
| Ação especial | K |
| Trocar integrante ativo | 1, 2 e 3 |
| Usar fita de cura | R (ou tocar em ♥ FITA no topo da tela) |

Controle PlayStation:

| Ação | Botão |
|---|---|
| Movimento / corrida | Analógico ou direcional / L2 |
| Interagir / confirmar | ✕ |
| Ataque / esquiva | □ / ○ |
| Técnicas | L1 / R1 |
| Especial de ressonância | R2 |
| Trocar integrante | △ |
| Pausa | Options |
| Usar fita de cura | Share / Create |

Ao conectar dois controles, o segundo jogador assume outro integrante vivo da formação. Os dois personagens se movem e lutam de modo independente em uma câmera compartilhada.

O menu **Outras opções** permite iniciar diretamente os capítulos 2 e 3 para testes. A jornada normal começa no estúdio.

## Correções de gameplay integradas na Beta 1.2

- Prólogo sem encontros prematuros; combate liberado depois do Baixo de Raiz.
- Patrulhas do Distrito com ataques funcionais para toda a equipe.
- XP e saves consistentes, campos do sintetizador com colisão e regras de coop corrigidas.
- Diálogo mobile acima dos controles e cura por integrante.
- Testes de controles e jogabilidade antes de publicar; [resultados e reprodução](qa/beta-1.2.0/PLAYTEST.md).
- [Lista de arte e plano de inimigos](docs/DIRECAO_ARTE_E_INIMIGOS.md).

## Destaques da Beta 1.0

- Ritmo: diálogos enxutos (225 → 139 falas), mais encontros, primeiro combate em menos de 1 minuto e Capítulo 2 → 3 contínuo.
- Combate: chefes com padrão que dá para aprender + variação (RNG) e três inimigos musicais (Metrônomo Menor, Eco Espelho, Abafador).
- Cura: fitas de cura (R / Share / botão ♥ FITA), mercadores nos três capítulos e gravadores no Capítulo 3.
- Acessibilidade: "Texto maior" e "Efeitos suaves" no menu Sistema.
- Site leve no celular: jogo pronto em menos de 1 s num 4G; a faixa do Arauto ("Walk Talk Twin") voltou a tocar.
- Auditoria de Beta: jornada completa automática nas duas ordens do Capítulo 3, inclusive salvando e recarregando a página no meio (veja `docs/QA.md`).

## Destaques da Alpha 1.2.4

- Mobile dedicado em retrato e paisagem, analógico com intensidade e multitouch.
- Círculo sempre esquiva; Options/Start controla a pausa.
- Coop com puxão por caminho livre, colisão por corpo e recuperação de posições inválidas.
- Rolada única com direção fixada e distância consistente a 30, 60 e 120 quadros por segundo.
- Recuperação de ataques e roladas diferenciadas por personagem.
- Chefes finais com abertura de contra-ataque e alternância de ataques mirados entre P1 e P2.
- Estudo aprofundado de Moonlighter com REA sobre 36 tipos e 1.019 métodos selecionados, com evidências locais e limites registrados.

- A entrada do Núcleo do Silêncio agora possui uma passarela caminhável da porta à arena.
- Franco Sintetizador e Ryuchi Percussionista só entram na equipe depois de suas cenas de apresentação.
- A segunda rota possui narrativa própria e reação do personagem recrutado primeiro.
- Franco Sintetizador ganhou Oscilador em três estágios, Pads Harmônicos persistentes e Filtro de Corte.
- O estudo de combate de Moonlighter foi documentado e traduzido em sistemas autorais, sem copiar código ou conteúdo.
- Controles PlayStation funcionam no navegador por USB ou Bluetooth.
- Coop local permite que duas pessoas controlem personagens diferentes, com HP, ações e esquivas independentes.

- Maia, Nara, Ciro, Vega, Dimas, moradores e trabalhadores agora possuem sprites próprios.
- Nara deixa de surgir sem contexto: ela é apresentada como alguém que foi na frente e já está esperando no canal.
- Ciro não procura Nara enquanto ela está ao lado dele; sua posição muda conforme a missão.
- O objetivo do canal avança da interferência para a comporta depois que a passarela é revelada.
- O objetivo da usina avança da trava grave para o sequenciador.
- Postes, bancos, caixas, máquinas, oficina, canal e elevador usam novos atlas transparentes.
- O encerramento do Capítulo 2 oferece a passagem narrativa imediata ao Capítulo 3, sem sair para o menu ou recarregar o save.
- A frase do Clube Contratempo agora libera a passagem para o Elevador do Céu, eliminando o bloqueio circular que impedia a continuação.
- O Distrito recebeu pisos derivados da arte-fonte, placas legíveis e marcos visuais para clube, oficina, usina, canal e elevador.
- Ryuchi percussionista ganhou corrida, rolamento e poses de ataque próprias, além de golpes rítmicos diferentes das outras versões de Ryuchi.
- NPCs alternam quadros de espera e reagem à proximidade do jogador.
- A equipe exibe função, nível e XP; reservas recebem 75% da experiência para continuarem úteis.

## Organização do repositório

```text
assets/
  chapter-03/
    audio/                 trilhas usadas pelo ato final
    reference/             artes-fonte aprovadas
    runtime/               versões otimizadas incorporadas ao HTML
    sprites/               sprites e atlas em resolução de produção
design/
  chapter-03/               roteiro, diálogos, missões e direção de arte
docs/                       arquitetura, visão, roadmap e processo
game/
  builds/                   gerado pelo build; não versionado
  source/
    base/                   build 1.1.2 original, nunca sobrescrita
    chapter-03/             runtime, gerador e validador
qa/                         relatórios de validação
```

## Construir a versão jogável

Requer Ruby. Na raiz do repositório:

```bash
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
```

O gerador preserva a base 1.1.2 e cria a build atual em `game/builds/<versão>/` (versão em `game/VERSION.json`). Essa pasta é gerada e não vai para o git; o GitHub Actions gera, valida e publica a mesma build a cada mudança no `main`. O gerador é determinístico: as mesmas fontes produzem sempre o mesmo SHA-256. A build é aceita somente quando não há placeholders, todas as cenas referenciadas existem e as validações de mapas, músicas, sprites, progressão e controles são aprovadas.

## Documentação

- [Visão e experiência](docs/GAME_DESIGN.md)
- [Arquitetura técnica](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Versionamento e releases](docs/VERSIONING.md)
- [Plano de QA](docs/QA.md)
- [Estado atual do projeto](docs/PROJECT_STATUS.md)
- [Fluxo de atualização no GitHub](docs/GITHUB_WORKFLOW.md)
- [Endereço de testes e publicação](docs/PLAYTEST_SITE.md)
- [Origem e uso dos assets](docs/ASSET_PROVENANCE.md)
- [Estudo sistêmico de Chrono Trigger](docs/CHRONO_REFERENCE_STUDY.md)
- [Estudo de combate de Moonlighter](docs/MOONLIGHTER_COMBAT_STUDY.md)
- [Controles PlayStation e coop local](docs/CONTROLLER_SUPPORT.md)
- [Estudo mobile do Delta](docs/DELTA_MOBILE_STUDY.md)
- [Aprofundamento de combate com REA](docs/MOONLIGHTER_REA_2026_11_13.md)
- [Proposta para habilidades e ritmo das quests](design/COMBATE_E_RITMO_PROPOSTA.md)
- [Medição de ritmo — Fase 1](docs/RITMO_FASE1.md)
- [Combate: padrões de chefe e inimigos musicais](docs/COMBATE_PADROES.md)
- [Histórico de mudanças](CHANGELOG.md)

## Regra de desenvolvimento

Builds não são versionadas no git: são geradas a partir do código-fonte e dos assets. Cada versão é identificada pelo número, pelo manifesto e pelo SHA-256. Cada mudança deve atualizar o código-fonte, a documentação afetada, o changelog e as verificações correspondentes. Alterações aprovadas são registradas no GitHub para manter o repositório como fonte oficial do projeto. Consulte o fluxo de atualização antes de criar cada nova versão.

## Licença

Torii & Hutukara é gratuito, sem fins comerciais e de código aberto.

- **Código:** [MIT](LICENSE).
- **Arte, cenários, NPCs, roteiro e diálogos:** CC BY 4.0.
- **Protegidos (não podem ser alterados):** Ryuchi e Franco, The Sir em todas as versões, as máscaras Torii, todas as músicas e as pessoas reais que participaram do álbum. Licença CC BY-NC-ND 4.0.

Detalhes e lista de arquivos em [LICENSE-ASSETS.md](LICENSE-ASSETS.md).

## Arte dos protagonistas V5

[Atlas, retratos e prévia offline](assets/protagonistas/v5/) de Franco e Ryuchi principais. [Escopo, produção e exportação dos frames](design/sprites-principais-v5/LEIA-ME.md). Integrados à fonte da Beta 1.2, com máscaras selecionadas pela progressão, animações independentes no coop e retratos nos diálogos. A promoção da build publicada depende da revisão e do fluxo de publicação.

Os inimigos usam sprites próprios. Os quatro chefes possuem animações corporais e FX em sprites sincronizados com as áreas reais de dano. Consulte [coreografia](docs/ANIMACOES_BOSSES_V2.md) e [efeitos dos golpes no chão](docs/BOSS_GROUND_FX_V1.md).
