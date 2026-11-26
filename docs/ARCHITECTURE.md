# Arquitetura

Torii & Hutukara usa HTML Canvas e JavaScript, com um gerador Ruby. A distribuição inclui um HTML portátil e uma exportação web com mídia em arquivos separados.

## Fontes

- `game/source/base/`: base do motor e dos capítulos iniciais.
- `game/source/chapter-03/`: módulos de campanha, combate, controles, interface, áudio e apresentação.
- `assets/`: recursos e manifestos usados pelas fontes e ferramentas de produção.
- `design/dialogo/NARRATIVA_FASE4.json`: dados narrativos incorporados à build.
- `production/`: empacotamento e exportação.
- `qa/`: testes e fixtures de entrada.

`game/source/chapter-03/build_alpha.rb` compõe o jogo e gera manifesto e hash. `validate_alpha.rb` verifica a estrutura, as referências e a integridade. A base de execução é `game/source/base/torii-core.html`, conferida por SHA-256. Código, recursos e integrações são compilados a partir das fontes; o HTML gerado não deve ser editado diretamente.

## Estado e apresentação

A lógica de simulação, colisão, combate e progressão é separada das camadas de apresentação. Animações, efeitos e cenários devem manter a identidade e o timing das ações. Alterações de renderização não podem modificar dano, alcance, recarga, sorte ou estado de save.

O coop local compartilha a câmera, com estados e comandos independentes para os dois integrantes. Saves antigos passam pela normalização existente; IDs de personagens, áreas e missões são contratos de compatibilidade.

## Distribuição

`game/VERSION.json` define a versão. Builds ficam em `game/builds/`. O exportador gera `production/playtest-dist/`, confere a reconstrução do conteúdo e publica somente essa pasta. Os diretórios gerados não são versionados. Consulte [publicação](PLAYTEST_SITE.md) e [validação](QA.md).
