# Processo de contribuição

## Princípios

1. Não sobrescrever builds publicadas: cada versão nova recebe pasta própria, e a anterior fica no histórico do git e na sua tag.
2. Não alterar a base 1.1.2; mudanças entram pelo runtime ou por uma nova arquitetura versionada.
3. Toda condição narrativa deve depender de estado concluído, não da quantidade de cliques em um NPC.
4. Recompensas e transições precisam ser idempotentes.
5. Toda alteração de código deve vir acompanhada por validação e atualização do changelog.

## Fluxo recomendado

1. Criar uma branch com nome descritivo.
2. Alterar fonte, assets ou documentação.
3. Gerar uma nova build.
4. Executar o validador estático.
5. Fazer playtest dos caminhos afetados.
6. Registrar o resultado em `qa/`.
7. Atualizar `CHANGELOG.md`.
8. Abrir revisão antes de promover uma nova build como principal.

## Convenções de commit

- `feat:` nova funcionalidade ou conteúdo.
- `fix:` correção de comportamento.
- `art:` sprites, tiles e direção visual.
- `narrative:` falas, cenas e progressão.
- `audio:` trilhas, mixagem ou roteamento musical.
- `docs:` documentação.
- `qa:` testes e relatórios.
- `build:` empacotamento e automação.

