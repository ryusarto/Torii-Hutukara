# Interface Ressonâncias — Beta 1.17.0

Implementação local da direção aprovada em `REDESIGN_RESSONANCIAS_V3`. Base: GitHub main `66b0dbc3ca12b6f0342fb49e1b3e27f2f38c47a7` (Beta 1.16.0), com preservação adicional de `lumi_melody.js` da build local `TORII_PLAYTEST_LUMI`. O checkout `REPOSITORIO` e a build anterior não foram alterados. A pasta `BUILD_INTERFACE_1_17` reúne fontes, assets, testes e builds deste incremento.

## Entrega

- Principal com exatamente quatro opções, cenário do estúdio e sprites nativos. Calabouço respeita o desbloqueio existente após a história.
- Pausa B lateral: continuar, equipe, mapa, diário, opções e ações reais de pós-jogo. A suspensão mantém a expedição; encerrar continua sendo uma decisão distinta.
- Cartas de melhorias com raridade, personagem, descrição e valores derivados de `PostGame.cards` e `cardValue`. Os 22 ícones de melhorias e três de respiro usam PNG transparente 64 × 48.
- Instrumentos com três notas e quatro timbres: decoram os botões originais, preservando sequência, criação livre, áudio, recompensas e bloqueios de saída. Pequenos mostradores apenas no PC.
- Vida, ressonância e técnicas do PC derivadas do estado real, incluindo bloqueio, nível, recarga e custo. Retratos respeitam as máscaras.
- Diálogo com moldura em pixels, mantendo retratos, leitura, histórico e avanço existentes.
- Toque vertical com painel próprio; horizontal com pads transparentes e opacidade ajustável. Editor por arraste ou teclado, sem sobreposição, limitado a zonas. Vertical e horizontal têm posições independentes. Salvar, Padrão e Voltar/Esc são implementados.

## Arquivos

- `game/source/chapter-03/interface_v7.js` e `.css`: apresentação e integração aditiva.
- `game/source/chapter-03/touch_layout_v1.js`: controles/editor preservando os nós e handlers originais.
- `game/source/chapter-03/build_alpha.rb`: injeta módulos e assets antes do `init()`; inclui fontes no manifesto.
- `assets/interface/v1/`: ícones, atlas, manifestos e imagem nativa do título.
- `game/builds/beta-1.17.0/TORII_HUTUKARA_BETA_1_17_0.html`: build portátil completa.
- `production/playtest-dist/`: exportação para servidor HTTP com mídia cacheável.

Nenhuma chave de salvamento da campanha foi trocada. O layout usa `torii_hutukara_touch_layout_v1`, separado dos saves. As posições são normalizadas, validadas e limitadas; dados inválidos voltam ao padrão.

## Validação

Revisão independente estática aprovada após corrigir retorno das configurações sem jogo, retratos com máscara, objetivo mobile e estado das técnicas PC. JavaScript e Ruby passam parsing. Validador legado: 148/148 verificações.

Automação em Chromium real, com sessões isoladas e fixtures de campanha:

- `qa/interface_v7_browser.cjs`: 11 fluxos de interface, instrumentos, efeitos das cartas e suspensão/reload/retomada. Também executado na exportação HTTP.
- `qa/touch_layout_v1_unit.cjs --browser`: 20 verificações de toque/editor, multitoque, cancelamento, colisão, persistência e orientação; unidades em oito cenários.
- `qa/input_regression.cjs`: 22 verificações de movimento, rolamento, coop, toque, rotação e cancelamento no diálogo.
- `qa/review110_mobile_regression.cjs`: 39 verificações de roteamento da pausa.
- `qa/postgame_unit.cjs`: 48 verificações, 41 formações e 2.000 ondas procedurais.
- `qa/review111_postgame_unit.cjs`: 10 verificações de combate e viagem.

Resultados e capturas em `qa/beta-1.17.0/`. As capturas foram inspecionadas visualmente. Isso não constitui campanha completa jogada por humano nem teste físico Android/iOS/gamepad. O conforto dos controles e a legibilidade em aparelhos reais ainda precisam de playtest.

## Gerar e executar

```sh
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
ruby production/build_playtest.rb
python3 -m http.server 8877 --bind 127.0.0.1 --directory production/playtest-dist
```

O otimizador web requer Python com NumPy e Pillow. Os testes de navegador aceitam `PLAYWRIGHT_CORE` e `CHROME_PATH`. A build portátil pode ser aberta diretamente. O pacote `playtest-dist` deve ser servido por HTTP para áudio/fetch. Nenhum deploy ou alteração remota foi realizado.

## Correções após a revisão do usuário

O usuário cancelou o merge; a versão continua somente local. A caixa de diálogo saía do recorte porque a classe genérica da moldura usava `position: relative`; o posicionamento de overlay agora é explícito no PC e mobile. Uma resposta da Anciã também sumia porque suas duas falas eram cortadas por edições antigas: respostas de escolhas explícitas agora são preservadas.

- Moldura aplicada às falas, opções da Anciã e escolha de dificuldade.
- `interface_controls_v7.js` e bootstrap precoce no builder: setas, teclas de movimento remapeadas, interação/confirmar, voltar e analógico/D-pad. Preserva captura de novas teclas, sliders e decisões obrigatórias. P2 navega pausa, mantendo a autoridade narrativa de P1.
- `enemy_health_v7.js`: barra pequena por inimigo/chefe, ancorada à silhueta e acompanhando câmera/escala. Apenas as barras coletivas e as barras de canvas antigas são suprimidas; HP e combate não mudam.
- `qa/interface_v7_dialogue_browser.cjs`: 28 verificações, incluindo partida nova, recorte dos glifos, oclusão, Anciã e resposta, em PC/vertical/horizontal com layout mobile confirmado.
- `qa/interface_controls_v7_browser.cjs`: 14 verificações de teclado, remapeamento Arrow/Escape, analógico/D-pad, P1/P2 e mobile.
- `qa/enemy_health_v7_browser.cjs`: 12 verificações de vidas, dano real, chefes, câmera, morte e troca de mapa.

A revisão estática independente das correções está em `qa/beta-1.17.0/REVISAO_CORRECOES_UI.md`. Os resultados anteriores, que verificavam conteúdo sem detectar o recorte visual do diálogo, foram complementados por testes de renderização e inspeção das capturas.

## Tipografia, descrições e corrida do Franco

As falas aprovadas foram preservadas. Caixas de diálogo, respostas, descrições e menus usam a mesma família monoespaçada, alinhamento à esquerda para leitura e entrelinha de 1,55. Títulos e avisos têm uma hierarquia própria; o logotipo aprovado e o HUD compacto mantêm suas escalas. O texto ampliado continua disponível, e os cartões podem encolher/rolar sem cortar descrições no mobile.

| Dificuldade apresentada | Descrição | Chave preservada |
| --- | --- | --- |
| Fácil | Para aproveitar a história e explorar no seu ritmo, com combates mais tranquilos. | `historia` |
| Médio | Uma experiência equilibrada entre história, exploração e combate. | `normal` |
| Difícil | Para quem busca um desafio maior, com inimigos mais exigentes e combates que pedem estratégia. | `dificil` |

Médio continua recomendado. Nenhum multiplicador, encontro ou regra de dificuldade foi alterado.

Foi reproduzido um caso de Franco estático com carregamento HTTP atrasado: o corpo andava, mas o fallback desenhava `franco_idle/0` em todos os quadros. A correção em `protagonist_art_v5.js` aproveita um atlas de locomação já decodificado com a mesma fase física; se ambos ainda faltam, usa o renderer animado original. Assim, o carregamento não transforma deslocamento em uma imagem de descanso parada. Ataques, rolamento e a simulação permanecem intactos. O relato intermitente foi tratado pela reprodução comprovada; outras condições dependem de nova reprodução.

Verificações do incremento: `qa/interface_v7_dialogue_browser.cjs` confere também família da fonte, alinhamento e ausência de corte; `qa/dificuldade_unit.cjs` confere regras e persistência; `qa/franco_locomotion_regression.cjs` atrasa os atlas por HTTP e mede os pixels realmente desenhados, além das transições de movimento. Revisão independente em `qa/beta-1.17.0/REVISAO_TEXTOS_CORRIDA.md`. Tudo continua local, sem merge.


## Telas restantes, leitura de ataques e Passo Sônico

`interface_screens_v7.js/.css` aplica os componentes internos aos menus em uso. As conclusões dos três capítulos e a equipe receberam layouts próprios; mapas, diários, loja de fitas, escolhas, opções, derrota, viagem e confirmações da Fenda compartilham botões e seções. O histórico de falas é tratado separadamente porque vive fora do overlay. Os nós e callbacks nativos são preservados, incluindo formação, recompensas e contagem de transição do capítulo 2. Os instrumentos aprovados e a seleção de melhorias mantêm seus componentes específicos.

O halo claro da corrida sem máscara do Ryuchi vinha de RGB claro incorporado nas bordas semitransparentes. A correção no decode de `run_stride_v1.js` afeta apenas essas bordas; alpha, pixels opacos e linhas mascaradas são preservados. Não houve redesenho dos protagonistas.

`combat_readability_v1.js`, seu atlas e o manifesto em `assets/combat-readability/v1/` completam a apresentação dos padrões adicionais da Fase 2: ecos dos quatro chefes, investidas, cone de escudo, mira do Flautim, feixe da Antena, cura, invocação, notas em leque e radiais, além de transições. O módulo de dificuldade continua controlando dano, relógios e colisões. Os novos contornos seguem sua geometria real; a decoração fica recortada dentro dela. Contornos e progresso são desenhados sobre a folhagem e independem do orçamento de partículas. Pausa e movimento reduzido mantêm os avisos legíveis. O portal do primeiro chefe reflete as duas pedras ativadas e o estado após o combate, sem alterar a interação original.

O travamento do X foi reproduzido na floresta: o passo antigo testava apenas o centro do personagem e terminava em y=3,14, com o corpo sobreposto à árvore. `skill_movement_v1.js` usa a colisão corporal da caminhada em subpassos; no mesmo caso termina em y=3,35 e permite sair andando. A recuperação de posições antigas procura apenas chão livre próximo (até 0,75 tile), sem atravessar centros sólidos, alterar HP/recursos ou interferir nas quedas das nuvens. Alcance em campo livre, dano e recarga permanecem nativos.

Evidências específicas: `UI_SCREEN_AUDIT_BROWSER.json` (68 verificações em 34 famílias, PC e mobile emulado), `RYUCHI_HALO_BROWSER.json` (12), `SKILL_MOVEMENT_BROWSER.json` (21), `COMBAT_READABILITY_BROWSER.json` e `COMBAT_READABILITY_ASSET.json`. Revisões artística e técnica documentadas em `design/interface_v7/AUDITORIA_TELAS_E_FX.md` e `qa/beta-1.17.0/REVISAO_TELAS_FX_MOVIMENTO.md`. Testes com fixtures não substituem uma campanha humana completa ou aparelhos físicos.


### Revisão da fenda pelo usuário

O portal vertical de pedra foi reprovado e suspenso. A direção atual usa uma abertura horizontal no chão. A imagem nova foi gerada com o `image_gen` integrado, com fundo transparente, e preservada sem edição em `assets/portal-chao/v1/fenda_chao_proposta.png`. O prompt completo e a origem estão em `assets/portal-chao/v1/PROMPT.txt`. Trata-se de uma proposta gerada e integrada para revisão, não de aprovação expressa do usuário.

O PNG é desenhado no passe do chão, antes dos atores, em 2 × 1 tiles. A imagem grande permite ver o desenho, mas na escala do jogo parte do detalhe e dos sigilos fica discreta; as capturas `portal_pronto.png` e `portal_uma_pedra.png` mostram essa escala real. Os estados de ativação e os símbolos das duas pedras continuam derivados das flags originais. Se a mídia não carregar, há um rasgo planar simples de reserva no mesmo lugar; a arquitetura vertical antiga não retorna.


## Animação após o retorno do usuário

A revisão posterior da corrida, do halo inicial e dos efeitos dos personagens está documentada em [ANIMACOES_V9.md](ANIMACOES_V9.md). A corrida manteve 16 poses; os ganhos vêm da fase comum e do registro, com oito poses canônicas na única linha defeituosa de caminhada. Foram geradas novas folhas para os efeitos, com margens transparentes verificadas.
