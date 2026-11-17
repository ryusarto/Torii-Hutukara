# Arquitetura técnica

## Visão geral

O jogo é distribuído como um único HTML executável localmente. A base 1.1.2 contém HTML, CSS, JavaScript, imagens e áudio incorporados. O Capítulo 3 é mantido como módulo aditivo e injetado antes de `init()` pelo gerador Ruby.

```text
base 1.1.2
    + diálogos JSON
    + runtime do Capítulo 3
    + áudio e imagens em Base64
    + patches de compatibilidade
             ↓
HTML completo (versão em game/VERSION.json)
```

## Componentes

### Base preservada

`game/source/base/TORII_HUTUKARA_1_1_2_TRILHAS.html`

É tratada como fonte imutável. Seu hash é verificado antes de aceitar a nova build.

### Runtime do Capítulo 3

`game/source/chapter-03/chapter3_runtime.js`

Responsabilidades:

- estado `G.c3`;
- onze áreas e suas conexões;
- missões, NPCs, relíquias e objetivos;
- dois personagens jogáveis adicionais;
- roteamento das seis faixas;
- bosses O Metrônomo e O Silêncio;
- transição do Capítulo 2;
- epílogo e pós-jogo;
- renderização dos sprites e atlas do Capítulo 3;
- ferramentas de QA.
- adaptação da Gamepad API, mapeamento PlayStation e estado do segundo jogador.

### Entrada e combate multiplataforma

`game/source/chapter-03/input_mobile_combat.js` é injetado depois do runtime narrativo. Separa a propriedade dos comandos por dispositivo e mantém movimento/recargas no mesmo ciclo de simulação. Também implementa layout mobile, Pointer Events por dedo, perfil de rolada, colisão por corpo, puxão com busca de caminho e abertura de contra-ataque dos chefes.

O enquadramento usa dimensões lógicas mutáveis: 768×432 no desktop/paisagem e 512×480 no mobile em retrato. O estado narrativo e o schema de save continuam os mesmos.

Na Beta 1.0.1, diálogo, menus e desafios musicais passam para `#app` no mobile e voltam para `#frame` no desktop. Assim compartilham o contexto de empilhamento do deck e continuam dentro da raiz de fullscreen.

### Progressão compatível

`C3.ensureProgression` atende os três capítulos. `G.progressionRoster` registra recrutamentos já compensados; saves sem esse campo recebem a migração uma vez. A normalização preserva XP dos seis integrantes e recalcula níveis sem repetir a compensação. `G.c3.patrolResetAt` mantém o relógio das patrulhas no próprio save. Os campos são aditivos e mantêm schema 13 e a chave de salvamento existente.

### Camadas de jogo da Beta

Injetadas pelo gerador, nesta ordem, depois de `input_mobile_combat.js`:

| Arquivo | Função |
|---|---|
| `dialogue_edits.js` | aplica `design/dialogo/EDICOES_DIALOGO.json` (cortes, trocas, avisos) e evita cenas repetidas |
| `pacing.js` | encontros extras, patrulhas do Distrito, flauta no Contratempo, levantar quem caiu, correção de projéteis |
| `healing.js` | fitas de cura, mercadores, gravadores do Capítulo 3, equipe recuperada a cada capítulo |
| `combat_patterns.js` | padrões de chefe com RNG, inimigos musicais, ajuste do Viajante |
| `flow_fixes.js` | Capítulo 2 → 3 contínuo, diálogo preso, integrante ativo e formação |
| `accessibility.js` | opção "Texto maior" |
| `../telemetry/pace_meter.js` | medidor de ritmo (`?ritmo`) |

Cada camada documenta no topo o que faz e por quê. A próxima etapa técnica é fundir essas camadas e as da base em módulos (roteiro, Fase 2).

### Gerador

`game/source/chapter-03/build_alpha.rb`

O gerador:

1. lê a base preservada;
2. aplica patches identificados e únicos;
3. serializa os diálogos;
4. incorpora áudio e imagens otimizadas;
5. injeta o runtime antes da inicialização;
6. rejeita placeholders restantes;
7. grava HTML, manifesto e SHA-256 em `game/builds/` (pasta gerada, fora do git; o GitHub Actions repete o processo a cada publicação).

### Validador

`game/source/chapter-03/validate_alpha.rb`

Verifica arquivos, mapas, cenas, músicas, funções finais, schema do save, migração, assets, progressão, placeholders, estrutura do HTML e preservação da base.

## Estado e salvamento

- Schema atual: 13.
- Chave local da Alpha: `torii_hutukara_alpha_v1`.
- Saves anteriores da 1.1.2 são migrados.
- Estado do Capítulo 3 é guardado em `G.c3`.
- Checkpoints carregam um snapshot do estado narrativo e da formação.
- Recompensas e conclusões são idempotentes.

## Renderização de sprites

Personagens do Capítulo 3 usam folhas horizontais com oito quadros:

`frente A, frente B, esquerda A, esquerda B, costas A, costas B, direita A, direita B`.

Os arquivos de produção ficam em `assets/chapter-03/sprites/`. Cópias menores ficam em `assets/chapter-03/runtime/` para reduzir o tamanho do HTML sem perder qualidade na escala real de 64×80 px.

Atlas ambientais usam grades 3×3; postes usam 3×2. O runtime recorta cada célula por tipo de objeto.

## Dívida técnica conhecida

- O runtime ainda estende funções globais da base por wrappers.
- O HTML final permanece grande porque capítulos anteriores já contêm mídia incorporada.
- Os NPCs não possuem um sistema geral de pathfinding; animações de deslocamento narrativo ainda precisam de uma camada própria.
- Parte dos mapas usa tiles procedurais, não um tileset completo.
- Testes são majoritariamente estáticos e manuais.
- O coop usa câmera compartilhada e mantém o Jogador 1 como autoridade narrativa; tela dividida não faz parte desta Alpha.

## Direção futura

Depois da estabilização da Alpha, migrar gradualmente para módulos separados:

- núcleo de estado e save;
- renderizador;
- mapas declarativos;
- sistema de quests;
- diálogos externos;
- catálogo de assets;
- suíte automatizada de progressão.

Essa migração deve preservar uma build portátil para jogadores.

