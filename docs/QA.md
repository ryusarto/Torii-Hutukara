# Validação

Os workflows [`Gameplay regression`](../.github/workflows/quality.yml) e [`Publish playtest`](../.github/workflows/playtest.yml) definem a cobertura automática de publicação.

## Preparar

```sh
python3 -m pip install pillow==12.3.0 numpy==2.5.3
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium webkit
export CHROME_PATH="$(node -p "require('playwright').chromium.executablePath()")"
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
```

Os workflows também declaram as dependências de imagem da exportação. Em Linux, a instalação do Chromium pode exigir as dependências de sistema indicadas pelo Playwright.

## Verificações principais

```sh
node qa/input_regression.cjs
node qa/gameplay_regression.cjs
node qa/narrativa_fase4.cjs
node qa/dificuldade_unit.cjs
```

Depois de exportar e servir o site em `http://127.0.0.1:8771/`:

```sh
python3 -I qa/portable_media_parity.py
node qa/release_controls_lifecycle.cjs http://127.0.0.1:8771/
BROWSER_ENGINE=webkit node qa/release_controls_lifecycle.cjs http://127.0.0.1:8771/
node qa/release_state_recovery.cjs http://127.0.0.1:8771/
STATE_ENGINE=webkit node qa/release_state_recovery.cjs http://127.0.0.1:8771/
node qa/release_lifecycle_v1.cjs http://127.0.0.1:8771/
node qa/release_startup_final.cjs http://127.0.0.1:8771/
node qa/release_mobile_final.cjs http://127.0.0.1:8771/
node qa/release_combat_final.cjs http://127.0.0.1:8771/
node qa/release_diagnostics_final.cjs http://127.0.0.1:8771/
node qa/final_asset_loading_v1.cjs http://127.0.0.1:8771/
node qa/loading_input_continuity_v1.cjs http://127.0.0.1:8771/
node qa/guidance_runtime_v1.cjs http://127.0.0.1:8771/
BROWSER_ENGINE=webkit node qa/guidance_runtime_v1.cjs http://127.0.0.1:8771/
node qa/guidance_campaign_v1.cjs http://127.0.0.1:8771/
node qa/npc_scale_v1.cjs http://127.0.0.1:8771/
node qa/render_performance_v1.cjs http://127.0.0.1:8771/
node qa/environment_depth_noop.cjs http://127.0.0.1:8771/
node qa/playtest_site.cjs http://127.0.0.1:8771/
node qa/dungeon_playtest.cjs http://127.0.0.1:8771/
node qa/interface_controls_v7_browser.cjs http://127.0.0.1:8771/
```

## Critérios

- Campanha até o epílogo nas duas ordens de Usina e Canal.
- Save, recarga, importação, recuperação de posição e checkpoints.
- Orientação desde a primeira abertura, retorno ao título e aproximação dos chefes, com saves existentes.
- Metrônomo visível antes da conversa, com o sprite inteiro ao alcançar o prompt em retrato e paisagem.
- Combate, chefes, pausa, derrota, reinício e retorno ao mapa.
- Fenda: escolha de melhorias, retomada, recursos e pontuação solo/coop.
- Teclado, remapeamento, toque e dois controles sem confirmação dupla.
- Arte, animações e camadas preservadas nos cenários de referência.
- Tempos de quadro, picos, resolução e ambiente registrados nas medições de desempenho.

Fixtures históricas usadas como entrada permanecem em `qa/`. Relatórios, capturas e gravações são saídas geradas e ficam nos artefatos de CI ou no arquivo local de produção.

Testes em navegador com toque ou controle emulado não substituem a validação em celulares e controles físicos. Uma medição de CPU ou uma captura de tela isolada não comprova FPS constante nem a experiência completa de jogo.

O medidor local de ritmo fica desativado por padrão. Ative com `?ritmo` ou `ToriiRitmo.enable()` para sessões de QA; ele não envia dados para servidores. As ferramentas de salto de capítulo só são expostas com `?qa`.
