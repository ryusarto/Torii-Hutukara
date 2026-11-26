# Publicação web

**[Site oficial](https://toriiehutukara.com/#jogo)** · [Jogo em uma aba separada](https://ryusarto.github.io/Torii-Hutukara/)

O jogo identifica teclado ou toque na entrada e aceita controles compatíveis. O progresso fica no armazenamento do navegador; exportação e importação permitem transportar uma cópia do save entre a versão portátil e o site.

## Gerar a distribuição

```sh
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
ruby production/build_playtest.rb
python3 -m http.server 8771 --bind 127.0.0.1 --directory production/playtest-dist
```

As dependências de imagem e navegador estão no [workflow de publicação](../.github/workflows/playtest.yml). O exportador separa mídia em arquivos com nomes baseados no conteúdo, verifica a reconstrução do jogo e gera `build-info.json` com os hashes da distribuição.

O workflow **Publish playtest** testa a build antes de enviar `production/playtest-dist/` ao GitHub Pages. Uma falha interrompe a publicação. O HTML portátil fica disponível como artefato da execução.

A pasta exportada, caches, capturas e relatórios são gerados localmente ou pelo CI. Não é necessário incluir credenciais no código nem versionar esses diretórios. Consulte os [testes](QA.md) e o [versionamento](VERSIONING.md).
