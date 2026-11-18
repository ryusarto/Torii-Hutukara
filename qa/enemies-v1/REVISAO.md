# Inimigos V1 · Beta 1.3 · 17/11/2026

Base integrada: main `14923f43ca0101b46e364fe4c4f969e5b1c10ef0`, incluindo cenários V2, correções de progressão/coop e protagonistas V5. A base 1.1.2 permanece imutável.

## Produzido e integrado

- Onze identidades hostis: sete comuns e quatro chefes. Duas variantes adicionais (`compasso_c3`, `abafador_c3`) selecionadas somente nas áreas de C3. **13 PNGs fonte finais, 13 atlas RGBA 512×512, 52 poses**.
- Poses frontais discretas: repouso, preparação, execução e reação. Não são ciclos direcionais de caminhada ou animações de morte. Eventos de dano, colisões, morte, recompensas e progressão continuam na simulação.
- Viajante corpóreo renovado a partir da captura do autor: jaqueta vermelho/dourado, calça tan e grande máscara marfim cobrindo o rosto. Estudos de mago e sombra foram descartados e não estão no manifesto. O corpo do chefe não reutiliza o ator jogável `alt` ampliado.
- C3 aprovado pelo autor em ferrugem/cobre, aço gasto, lona empoeirada e eletrônica de sucata. Drone, Metrônomo e Silêncio preservam suas silhuetas de referência. Compasso/Abafador de C1/C2 conservam suas versões anteriores à variante C3.
- A direção ambiental geral segue `design/chapter-03/DIRECAO_DESERTO_POS_APOCALIPTICO.md`; esta frente não modifica o renderer de cenários nem afirma ter convertido todos os mapas em deserto. A amostra usa os cenários V2 oficiais atuais.
- Nenhum rosto, figurino ou pacote dos protagonistas foi redesenhado. `ninja_archer_art_v1.js` e `protagonist_art_v5.js` conferem byte a byte com a main de integração. Arqueiro após revelação mantém sua arte normal e máscara no cinto; Ninja continua sem máscara.

Ferramenta de produção: **imagegen integrada**. Prompts/referências em `design/enemies-v1/PRODUCAO_FINAL.json`, `PROMPTS.json` e `PROMPT_VIAJANTE_AUTOR.txt`. Fontes selecionadas estão em `assets/enemies/v1/source/`, conforme `manifest.json`; estudos não selecionados não são dependências de runtime. Empacotamento reprodutível em `production/export_enemy_sprites_v1.py` (Pillow). Só recorta, escala e ancora as fontes: não pinta os sprites nem gera fundos.

## Contrato

Células 256×256, grade 2×2, pivô `(128,224)`, nearest-neighbor, uma escala por identidade. O empacotador identifica os gutters transparentes das pranchas, sem assumir que o espaçamento da geração seja perfeitamente uniforme. Alpha abaixo de 16 é ignorado apenas para calcular o enquadramento; o conteúdo RGBA dos recortes é preservado. Os RGB invisíveis sob alpha zero não constituem um fundo opaco.

O seletor prioriza ID dos chefes e depois o tipo/variante contextual. Usa `wind`, `tele09`, `retaliate`, `echoWarning092`, `stun` e `flash`; a queda de preparação fornece uma breve pose cosmética de execução. Relógio/WeakMap cosméticos não são persistidos; diálogo/pausa interrompem o relógio, mudanças de área/partida descartam registros. Auras e telegráficos originais continuam desenhados, incluindo alcance funcional do Abafador. O desenho duplicado dos chefes C3 foi removido.

## Evidências da mesma build

Build portátil: `game/builds/beta-1.3.0/TORII_HUTUKARA_BETA_1_3_0.html`, **237.628.160 bytes**, SHA-256 `ae12c40b5be906d4017d1d9a6f0c8e4bb20ef8c5b95f11a93bf61a61175bc83d`.

- Validador: **122/122**, incluindo cobertura de 13 pranchas, dimensões/alpha, materiais C3, rota própria do Viajante, base e schema 13 preservados.
- Regressão NPC: **32** combinações direcionais/tempo e fallback aprovados.
- Estado dos protagonistas V5: **24** verificações aprovadas.
- Inimigos em navegador: **8/8** verificações; 52 células decodificadas; variantes C1/C2/C3; prioridade dos IDs; poses e ausência de mutação dos atores; pausa/load/área; auras; um desenho por chefe; nenhum desenho do Arqueiro descoberto no Viajante, mesmo com atlas não carregado; retrato `musician` continua mascarado quando a flag de revelação já foi definida.
- Controles/coop/mobile: **22/22**, `qa/beta-1.3.0/INPUT_TEST_RESULTS.json`.
- Progressão/XP/saves/combate/diálogos mobile: **20/20**, `qa/beta-1.3.0/GAMEPLAY_TEST_RESULTS.json`.
- Exportação web local: HTML de **724.718 bytes**, 213 arquivos de mídia em cache; deriva do mesmo hash portátil. Testes web adicionais ficam registrados nos JSONs correspondentes.

`PORTATIL_RESULTADOS.json` registra a primeira execução isolada contra o HTML portátil; `RESULTADOS.json` registra a conferência reproduzível mais recente. `ELENCO_52_POSES.png` usa composição real no navegador para conferir alpha, recorte e âncora. `CHEFES_MAPAS.png` mostra os quatro renderizadores de chefe nos mapas reais, com posições controladas pelo teste; não é uma caminhada de campanha.

Diretor artístico reviu fontes e capturas integradas: **sem bloqueador visual** para o escopo, com máscara do Viajante íntegra nas quatro poses, escala/apoio coerentes e distinção Eco (uma máscara)/Silêncio (duas). No quadro do Arauto, a posição artificial próxima da borda superior limita aquele enquadramento; a prancha confirma o atlas completo. Barras de vida sobrepostas não foram confundidas com cortes de atlas.

## Limites

Chrome isolado/headless e perfis emulados não equivalem a telefone físico, controles físicos ou playtest humano. Não houve nova campanha completa nas duas ordens das rotas neste lote; a suíte de regressão exercita regras específicas e mantém as correções históricas. Capturas estáticas não validam sensação de combate ou transição em tempo real. Este registro não declara publicação no Pages.

PNG runtime total: **3.585.436 bytes**; máximo adicional de RGBA dos 13 atlas decodificados: **13 MiB**. O carregamento é sob demanda por identidade. Não foi feita medição comparativa de FPS/frame time em aparelho físico.

A integração com a main foi feita após inventário de hashes e backups, com comparação de três versões. Mudanças alheias de cenários, progressão e coop foram preservadas; um arquivo local de QA divergente não foi sobrescrito. O PR é montado por lista explícita de arquivos, para não tratar ausências do checkout sparse como exclusões.

### Correção final do aviso do Arauto

A preparação do Arauto usa um objeto `tele09` com campo `time`, diferente do `wind` numérico. O seletor lê `tele09.time`; a regressão usa o formato real `{type, time, x, y}` e verifica também a transição ao limpar o objeto. Build, estrutura, inimigos, controles, jogabilidade e exportação web foram revalidados após esse ajuste. As fontes e os atlas aprovados não mudaram.
