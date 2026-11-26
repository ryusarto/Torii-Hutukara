# Versões

`game/VERSION.json` define o número, o estágio e o nome dos arquivos gerados. O gerador, o validador, o site e os testes usam essa fonte. `web/playtest/build.json` registra o manifesto da distribuição.

O número da versão não é o schema do save. Alterações devem preservar os contratos de persistência e as migrações existentes.

Cada build gera HTML, manifesto e SHA-256 em `game/builds/`. Esses arquivos não são versionados; podem ser reproduzidos a partir da versão das fontes e do ambiente de build correspondente. A exportação web fica em `production/playtest-dist/`.

Uma versão de lançamento deve passar por geração, validação, regressão e revisão dos fluxos alterados antes da publicação. As notas públicas resumem o resultado para jogadores e colaboradores.
