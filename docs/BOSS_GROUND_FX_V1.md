# Sprites animados dos golpes no chão · FX V1

Quatro sequências de oito quadros, geradas com o ImageGen integrado: onda âmbar do Viajante, interferência elétrica do Arauto, impacto de sucata do Metrônomo e energia oxidada do Silêncio. Cada sequência acumula energia, rompe no impacto e perde densidade até desaparecer. A prévia dos 32 quadros fica em `qa/boss-ground-fx-v1/PREVIA_FX.gif`.

As fontes PNG e atlas estão em `assets/boss-ground-fx/v1/`; os prompts completos e a proveniência em `design/boss-ground-fx-v1/`. O exportador `production/export_boss_ground_fx_v1.py` preserva as células inteiras e a escala comum para manter a expansão/desagregação. Não pinta efeitos nem remove fundos por código. Atlas RGBA de 1024×512, quatro colunas, duas linhas e células de 256; os oito quadros de cada atlas são distintos e auditados por hash.

O módulo `boss_ground_fx_v1.js` carrega após a coreografia dos chefes. O FX segue o evento real de impacto e é recortado pela geometria já existente, incluindo setor, cruz, faixas, corredor, coroa e ondas móveis. O centro seguro da coroa continua vazio. Resíduos são somente textura que se apaga; não acrescentam dano ou um novo contorno de ameaça. Os personagens continuam sobre a camada do chão.

Os registros são separados do estado salvo. Pausa congela o tempo; mudança de jogo, área, chefe ou etapa final cancela resíduos. Movimento reduzido conserva poses estáveis e intensidade menor. O limite de carimbos por passagem evita que faixas extensas gerem trabalho ilimitado.

## Validação

`qa/boss_ground_fx_unit.cjs` verifica recorte, disparos, passagem original única, descarte de resíduos e preservação dos callbacks da simulação. `qa/boss_ground_fx_browser.cjs` decodifica as quatro folhas no jogo compilado, verifica os impactos e a paridade de dano, e registra capturas reais. Evidências de execução pertencem ao artefato de CI; a prévia do atlas sozinha comprova apenas a arte exportada.

## Publicação e integração

**Beta 1.7.0 publicada** pelo [PR #15](https://github.com/ryusarto/Torii-Hutukara/pull/15), merge `3e7ad3f5c9ba484e9e257e016102c19d8389c235`. Incorpora a main 1.6.1, preservando cenários desérticos, geração/exportação streaming, máscaras e fluidez dos músicos, protagonistas e inimigos.

[Publish playtest 44232084397](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44232084397) aprovado. [Jogo online](https://ryusarto.github.io/Torii-Hutukara/) conferido em 20/11/2026: versão 1.7.0, SHA-256 da fonte `5af9381eddcafa26fd671adbca39cc27bb879549f8e4a85500db962ac151a6d7`, hash do HTML e os quatro atlas publicados idênticos aos validados. Roundtrip da exportação e preservação do HTML portátil aprovados.

[Relatório, evidências e limites](../qa/boss-ground-fx-v1/PLAYTEST.md). A prévia GIF representa os atlas; as capturas e o relatório de navegador comprovam a integração no jogo.
