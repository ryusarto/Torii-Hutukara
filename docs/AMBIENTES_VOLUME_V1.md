# Fachadas com volume e interiores distintos

Incremento ambiental sobre a main `7553828a669d33921940f5b8d1a99923636485a2` (Beta 1.7.1), solicitado pelo autor em 20/11/2026. O módulo `game/source/chapter-03/environment_depth_v1.js` conserva a engine Canvas, as fachadas C3 aprovadas e integra oito novas fachadas C1/C2 em perspectiva, produzidas pela frente principal. Não modifica a base histórica, mapas, colisões, props, portas, eventos, NPCs, flags ou saves.

## Fachadas

As casas da Cidade do Eco (`house`), da Cidade das Vozes (`voiceHouse`) e do Distrito (`c3_house`, `c3_club`, `c3_workshop`, entrada da usina `c3_machine`) recebem:

- sombra projetada e contato seguindo a largura real da base, no passe do chão antes dos atores;
- parede lateral curta com juntas e pontos de fixação, rebaixo no beiral e fundação chanfrada;
- ordenação pela base física da fachada, para que passar atrás ou na frente do prédio tenha leitura coerente;
- transparência quando um dos jogadores fica encoberto. A residência C3 conserva seu guard existente sem multiplicá-lo por um segundo fade.

Dimensões C3 acompanham o ajuste real de proporção/célula do atlas, e não somente o tamanho máximo solicitado. A camada não alarga volumes de colisão nem acrescenta degraus sólidos. C1/C2 usam dois atlas RGBA de oito fachadas com telhado e lateral próprios, em `assets/environment-volume/v1/`. Cada recorte possui pivô explícito na soleira, alinhado à âncora de entrada anterior. Os letreiros C2 são desenhados pelo jogo. C3 preserva as fachadas desérticas aprovadas, com volume adicional no renderer; os novos PNGs C1/C2 não recebem uma segunda parede opaca por código.

## Diferenciação dos interiores

| Área | Estrutura e materiais |
|---|---|
| `studio` | Madeira e tapete tecidos autorais preservados; linha discreta da área de gravação e detalhe de absorção nas paredes. |
| `corridor` | Pedra autoral preservada; faixas transversais translúcidas como nervuras e bordas rebaixadas ao longo do caminho. |
| `chamber` | Mármore autoral preservado; linhas cerimoniais e anéis de incrustação discretos ao redor do pedestal. |
| `celina_home` | Madeira original, cozinha com textura de pedra autoral e zona de dormir com material de tapete tecido. |
| `bento_shop` | Textura de pedra autoral, baia de serviço com metal industrial detalhado e faixa de segurança junto à bancada. |
| `tape_market` | Pedra de santuário autoral e corredor central em tapete tecido, com limites laterais de exposição. |
| `radio9` | Madeira escura autoral, área técnica em tapete tecido e limite do estúdio de transmissão. |
| `voice_tower` | Placas e textura originais preservadas; circuitos discretos de piso e três anéis concêntricos de transmissão. |
| `contratempo` | Madeira-fonte preservada; apron em madeira de oficina detalhada, borda de palco, losangos discretos na pista e tapete junto ao balcão. |
| `ciro_workshop` | Madeira-fonte preservada, duas baias de teste em metal industrial autoral, calhas de cabos e zona central de metal da bancada. |
| `power_plant` | Placas industriais-fonte preservadas, rebites, faixas de segurança e conduto transversal. A barreira real da usina conserva seu desenho. |
| `last_torii` | Pedra-fonte preservada, círculos de incrustação e duas linhas que conduzem ao círculo de ressonância. |
| `silence_core` | Basalto-fonte preservado, juntas de placas largas e fissuras esparsas de baixo contraste. |

Revisão artística: retirados os pisos planos/checkerboards da primeira implementação. As superfícies originais continuam detalhadas; zonas distintas usam `CenariosV2.material` e texturas autorais existentes. Paredes recebem apenas detalhe de baixa opacidade sobre a textura base. Nenhuma placa lisa opaca substitui madeira, tapete ou mármore. Todos os pisos são recortados na célula já desenhada. Vazio e céu não recebem textura caminhável. Não são criados novos cômodos dentro das casas cuja interação continua externa.

## Integração

Carregar o módulo depois de `CenariosV2` e `CenariosDesertoV1`. O gerador substitui uma ocorrência de `__ENVIRONMENT_VOLUME_ASSETS__` (URIs por folha `c1`/`c2`) e `__ENVIRONMENT_VOLUME_MANIFEST__` (manifesto dos recortes/pivôs). O módulo solicita ambos os PNGs sem aguardar; `image(sheet)` conserva o cache, e `ready()` permite ao QA aguardar o decode antes das capturas. O jogo mantém o renderer anterior enquanto a imagem não está pronta, sem bloquear menus ou início. Ele envolve `drawTile` e `drawProp` uma vez, preservando seus retornos. O gerador integra dois hooks no renderer base:

1. `EnvironmentDepthV1.drawGround()` no passe anterior à lista ordenada de atores, junto ao passe de FX dos chefes;
2. `EnvironmentDepthV1.sortY(p)` para calcular a profundidade dos props. Props sem fachada mantêm `p.y + .5`.

`EnvironmentDepthV1.enabled = false` desliga esta camada para a comparação reversível de QA; não altera dados de jogo. `profiles` contém os treze perfis. `lightingProfile(area)` entrega ao módulo de atmosfera:

```js
{
  ambient: 0.8, // luminosidade de 0 a 1
  tint: '#21192b',
  lights: [{ x: 19, y: 2, radius: 6, color: '#ffd3a0', intensity: 0.3 }]
}
```

Coordenadas e raios são em tiles. O retorno é independente, sem expor os arrays de ancoragem para mutação pelo consumidor. A implementação da luz, sépia, poeira e vento pertence a `environment_atmosphere_v1.js`.

## Evidência e limites

Executados: parsing Node e **17 testes de contrato** em `qa/environment_depth_v1.cjs`, aprovados. Cobrem delegação, estado lógico intacto, treze receitas distintas, recorte do piso, vazio, bases de ordenação, sombra limitada à câmera, ajuste do atlas, oclusão de P1/P2, fallback, perfis de luz e restauração de estado do canvas em erro. Também verificam a preservação das texturas autorais, a seleção dos materiais das zonas, oito recortes/pivôs de portas, decode/cache das duas folhas e o mapping das fachadas secundárias C2.

Esses testes não afirmam aceite estético ou uma campanha jogada. A validação visual da composição final deve usar as capturas comparáveis de `qa/environment_world_browser.cjs` e conferir fachadas, entradas, sinalização e leitura do combate na câmera real. Não houve validação desta camada em telefone ou controle físico.
