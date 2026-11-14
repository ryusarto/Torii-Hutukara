# Versionamento e releases

## Números

O projeto usa `MAJOR.MINOR.PATCH` acompanhado do estágio:

- `Alpha 1.1.0`: conteúdo completo, ainda em estabilização.
- incremento de patch: correção compatível, sem novo conteúdo substancial;
- incremento minor: novo conjunto de assets, cenas ou sistemas;
- incremento major: mudança incompatível de arquitetura ou save.

O número da build e o schema do save não são a mesma coisa. A Alpha 1.1.0 continua usando schema 11 porque seus novos campos têm defaults compatíveis.

## Preservação

- Builds não ficam no git. `game/builds/` é gerado por `build_alpha.rb` (localmente ou no GitHub Actions) e está no `.gitignore`.
- Para recuperar uma versão, gere a build a partir do commit ou da tag correspondente (`alpha-x.y.z`); o resultado tem o mesmo SHA-256 do manifesto.
- A cada publicação, o HTML portátil fica disponível por 90 dias como artefato do workflow.
- A base 1.1.2 nunca é modificada.
- Manifesto e SHA-256 acompanham cada HTML.
- Uma versão só vira principal depois de validação e playtest.

## Branches

- `main`: estado integrado e documentado.
- `feature/...`: funcionalidades.
- `fix/...`: correções.
- `art/...`: assets e integração visual.
- `narrative/...`: roteiro e diálogos.
- `release/...`: estabilização de uma versão candidata.

## Checklist de release

1. Atualizar código e dados.
2. Gerar a build em pasta nova.
3. Executar a validação estática.
4. Executar playtests das rotas afetadas.
5. Registrar resultados em `qa/`.
6. Atualizar README, roadmap e changelog.
7. Confirmar tamanho abaixo do limite de 100 MB por arquivo do GitHub.
8. Criar tag somente depois da aprovação.

