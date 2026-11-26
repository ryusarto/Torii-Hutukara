# Torii & Hutukara — A Última Frequência

RPG musical de ação e narrativa de **Ryuchi** e **Franco, The Sir**, feito para navegador. Explore três capítulos, forme uma equipe de até três integrantes e use música para atravessar cenários e enfrentar O Silêncio. O jogo inclui seis personagens jogáveis, desafios musicais e a Fenda das Ressonâncias, com expedições solo ou em coop local.

**[Site oficial](https://toriiehutukara.com/#jogo)** · [Abrir o jogo diretamente](https://ryusarto.github.io/Torii-Hutukara/)

**Versão 1.0** · Campanha completa, seis personagens jogáveis, sete desafios musicais e pós-jogo solo ou cooperativo. A versão das fontes está em [`game/VERSION.json`](game/VERSION.json); a distribuição mostra seu número no jogo.

## Controles

| Ação | Teclado |
|---|---|
| Mover / correr | WASD ou setas / Shift |
| Interagir | E |
| Atacar | J ou Espaço |
| Técnicas | Z e X |
| Esquivar / especial | Q / K |
| Trocar integrante / curar | 1, 2, 3 / R |

Celulares e tablets usam controles de toque. Controles compatíveis com a Gamepad API permitem jogar sozinho ou em coop local com dois controles. As teclas e os botões podem ser remapeados em Opções. Consulte [controles e acessibilidade](docs/CONTROLLER_SUPPORT.md).

## Progresso

O progresso fica salvo no navegador e no aparelho usado. O jogo permite exportar e importar o save em JSON, inclusive os saves compatíveis das versões anteriores. Guarde uma cópia antes de limpar os dados do navegador; não há sincronização automática entre aparelhos.

## Construir e testar

São usados Ruby, Node.js e Python 3. As versões e dependências da distribuição estão nos [workflows](.github/workflows/).

```sh
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
node qa/input_regression.cjs
node qa/gameplay_regression.cjs
```

O HTML portátil e seu manifesto são gerados em `game/builds/`, fora do versionamento. A geração também usa Python 3 com Pillow e NumPy para embutir as imagens em WebP (`TORII_PNG_ORIGINAL=1` mantém os PNGs). Para a versão web, instale as dependências de imagem indicadas no workflow e execute:

```sh
ruby production/build_playtest.rb
python3 -m http.server 8771 --bind 127.0.0.1 --directory production/playtest-dist
```

Veja [arquitetura](docs/ARCHITECTURE.md), [validação](docs/QA.md) e [publicação](docs/PLAYTEST_SITE.md). A distribuição para download fica nos artefatos do workflow [Publish playtest](https://github.com/ryusarto/Torii-Hutukara/actions/workflows/playtest.yml).

## Créditos e licenças

Obra de **Ryuchi e Franco, The Sir**, com participação de **Belga, Colli, Mazza e Dney**. As versões 16-bit das músicas foram produzidas com Suno a partir das faixas originais do álbum.

O jogo é gratuito e sem fins comerciais. Código e documentação seguem a [licença MIT](LICENSE). Arte, músicas, máscaras e identidades dos personagens têm condições próprias, descritas em [LICENSE-ASSETS.md](LICENSE-ASSETS.md) e [origem dos materiais](docs/ASSET_PROVENANCE.md).
