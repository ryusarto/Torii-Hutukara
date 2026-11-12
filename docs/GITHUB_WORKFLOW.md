# Fluxo de atualização no GitHub

O GitHub é a fonte oficial do projeto. Toda alteração aprovada deve terminar registrada no repositório privado.

## Em cada mudança

1. Criar uma alteração pequena e identificável.
2. Atualizar o arquivo-fonte, nunca editar uma build histórica para substituí-la.
3. Gerar uma nova build quando a mudança afetar o jogo.
4. Executar a validação automática e registrar o playtest correspondente.
5. Atualizar `CHANGELOG.md` e, quando necessário, roadmap, arquitetura ou roteiro.
6. Conferir se nenhuma credencial, save pessoal ou arquivo temporário entrou no pacote.
7. Criar um commit descritivo e enviar ao GitHub.

## Convenção de commits

- `feat:` nova funcionalidade ou conteúdo.
- `fix:` correção de falha.
- `art:` sprites, animações, cenário ou interface.
- `story:` roteiro, diálogo ou missão.
- `audio:` trilha, efeito ou integração sonora.
- `docs:` documentação.
- `test:` validações e relatórios de playtest.
- `build:` geração e empacotamento de versão.

## Regra de versões

- A build anterior permanece intacta em `game/builds/`.
- Cada versão recebe pasta, nome, manifesto, hash e relatório próprios.
- Uma correção pequena incrementa o último número: 1.1.0 → 1.1.1.
- Um conjunto novo de conteúdo incrementa o número intermediário: 1.1.x → 1.2.0.
- Tags de lançamento devem usar o formato `alpha-1.1.0`, `beta-1.0.0` ou `v1.0.0`.

## Antes de publicar

- Todos os JSONs precisam ser válidos.
- Nenhum arquivo individual pode superar o limite do GitHub.
- O hash da build deve coincidir com o manifesto.
- O relatório deve separar claramente validação automática de playtest manual.
- Pendências conhecidas devem aparecer em `docs/PROJECT_STATUS.md` ou `docs/ROADMAP.md`.
