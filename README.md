# TORII & HUTUKARA — A Última Frequência

RPG musical de ação e narrativa feito em HTML Canvas. A jornada acompanha Franco, Ryuchi e suas outras frequências através de três capítulos conectados por música, memória, criação e medo de começar.

## Estado atual

**Build principal:** Alpha 1.1.2 — jogo completo do início ao fim, com os três capítulos.

- Capítulo 1: fundação da jornada, floresta, ruínas e primeiras relíquias.
- Capítulo 2: Cidade das Vozes, novas formações e o primeiro confronto com O Silêncio.
- Capítulo 3: Distrito da Distorção, Clube Contratempo, Usina de Retorno, Canal Suspenso, Mar de Nuvens, O Metrônomo e a luta final.
- Seis personagens jogáveis e formação de até três integrantes.
- Salvamento local, importação/exportação em JSON e checkpoints.
- Seis faixas próprias do terceiro capítulo incorporadas à build.
- Sprites detalhados para os personagens e NPCs do Capítulo 3.
- Jogo distribuído como um único HTML portátil, sem instalação.

## Jogar

Abra o arquivo abaixo em um navegador moderno:

`game/builds/alpha-1.1.2/TORII_HUTUKARA_ALPHA_1_1_2_COMPLETO.html`

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

O menu **Outras opções** permite iniciar diretamente os capítulos 2 e 3 para testes. A jornada normal começa no estúdio.

## Destaques da Alpha 1.1.2

- A entrada do Núcleo do Silêncio agora possui uma passarela caminhável da porta à arena.
- Franco Sintetizador e Ryuchi Percussionista só entram na equipe depois de suas cenas de apresentação.
- A segunda rota possui narrativa própria e reação do personagem recrutado primeiro.
- Franco Sintetizador ganhou Oscilador em três estágios, Pads Harmônicos persistentes e Filtro de Corte.
- O estudo de combate de Moonlighter foi documentado e traduzido em sistemas autorais, sem copiar código ou conteúdo.

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
  builds/                   versões jogáveis preservadas
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

O gerador preserva a base 1.1.2 e cria uma nova build em `game/builds/alpha-1.1.2/`. A build é aceita somente quando não há placeholders, todas as cenas referenciadas existem e as validações de mapas, músicas, sprites e progressão são aprovadas.

## Documentação

- [Visão e experiência](docs/GAME_DESIGN.md)
- [Arquitetura técnica](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Versionamento e releases](docs/VERSIONING.md)
- [Plano de QA](docs/QA.md)
- [Estado atual do projeto](docs/PROJECT_STATUS.md)
- [Fluxo de atualização no GitHub](docs/GITHUB_WORKFLOW.md)
- [Origem e uso dos assets](docs/ASSET_PROVENANCE.md)
- [Estudo sistêmico de Chrono Trigger](docs/CHRONO_REFERENCE_STUDY.md)
- [Estudo de combate de Moonlighter](docs/MOONLIGHTER_COMBAT_STUDY.md)
- [Histórico de mudanças](CHANGELOG.md)

## Regra de desenvolvimento

Nenhuma build anterior é sobrescrita. Cada mudança deve atualizar o código-fonte, a documentação afetada, o changelog e as verificações correspondentes. Alterações aprovadas são registradas no GitHub para manter o repositório como fonte oficial do projeto. Consulte o fluxo de atualização antes de criar cada nova versão.

## Direitos

Este é um repositório privado de produção. Nenhuma licença de redistribuição foi concedida. Consulte `docs/ASSET_PROVENANCE.md` antes de publicar músicas ou imagens fora do projeto.
