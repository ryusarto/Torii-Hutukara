# Ambientes vivos, profundidade e nuvens

Pedido do autor de 20/11/2026. Candidata Beta 1.9 construída sobre main `7553828a669d33921940f5b8d1a99923636485a2` (1.7.1), preservando as correções de apresentação dos músicos, os FX dos chefes e os cenários desérticos.

A composição 1.9 incorpora também a frente do PR #18 (head 62fdce53): NPCs vivos, estúdio, corrida e cinema. Gerador, workflows e validação foram conciliados por trechos; o sofá conserva seu ponto de ordenação no chão. As evidências finais precisam corresponder ao executável composto.

## Arquitetura e interiores

Oito novas fachadas em dois atlas RGBA: casa, loja, pousada e arquivo do C1; residência, oficina, loja de discos e rádio do C2. Os PNGs mostram telhados, paredes frontais/laterais, beirais e fundações. O pivô de cada recorte é a soleira da porta; mapas, colisões e eventos não são movidos para encaixar a imagem. Sombras no chão e ordenação pela base unem a fachada ao mapa. A fachada perde opacidade quando esconde P1 ou P2. C3 mantém a arte de sucata aprovada.

Treze interiores usam perfis próprios: estúdio, corredor, câmara, casa de Celina, oficina de Belga, mercado de fitas, Rádio 9, torre, Contratempo, oficina de Mazza, Usina, Último Torii e Núcleo. Diferenciam materiais e organização visual, sem trocar props, NPCs ou rotas. A revisão visual rejeitou um primeiro passe de pisos lisos; a composição final preserva texturas detalhadas e usa materiais autorais para zonas de trabalho, palco, tapetes e incrustações. [Contrato de volume](AMBIENTES_VOLUME_V1.md).

## Luz, areia e vento

Luz ambiente por sala, com aberturas graduais na máscara de sombra ao redor das fontes locais. Clube, corredor, rádio e Usina têm níveis de luz distintos. A camada aparece antes dos destaques de combate e navegação e não modifica o HUD. A coloração quente e as partículas de areia ficam no passe do chão dos exteriores do C3, sob atores e fachadas; o Mar de Nuvens conserva sua própria cor.

O vento movimenta a copa em uma passagem separada, mantendo a parte inferior do tronco e a raiz estáveis. Relógio cosmético para em menus/diálogos; efeitos suaves estabilizam as árvores e reduzem a densidade das partículas. A atmosfera não grava estado, sorteia partículas no render nem altera mecânicas de combate.

## Portal, reconstrução e queda

O Elevador do Céu é um portal de ressonância para o alto do mesmo mundo de deserto e sucata. Narrativa, aviso da borda, objetivo e fundo cinematográfico foram ajustados. Tiles originais de nuvens marfim/rosa/lavanda voltam somente ao Mar de Nuvens; terraço e santuário continuam estruturas suspensas de pedra e metal.

Oito quadros reais mostram a nuvem se reunindo. As colunas da passagem avançam gradualmente, e o apoio físico chega quando a superfície já está formada. A aceitação da ação musical mantém as flags existentes; reload de uma passagem em construção conclui o caminho ganho, evitando softlock.

Sair do chão no Mar de Nuvens inicia uma queda de 0,85 s: o personagem diminui e desce até a derrota. Caminhada, rolamento e P2 usam a mesma regra. A vítima morre e a tentativa compartilhada termina no fluxo existente de checkpoint; não é uma perda automática de HP dos outros integrantes. Paredes e colisões fora da travessia permanecem normais. Seguidores não recebem a colisão de abismo dos jogadores. [Persistência e regras da queda](NUVENS_E_QUEDA_V1.md).

## Fontes e reprodução

- `assets/environment-volume/v1/`: duas fontes PNG, dois atlas, manifesto com soleiras e auditoria de exportação.
- `assets/cloud-world/v1/`: fonte/atlas dos oito quadros, fonte/fundo do portal, manifesto e auditoria.
- `design/environment-world-v1/`: quatro prompts completos, procedência e caminhos dos originais do **ImageGen integrado**; nenhuma chave/API externa utilizada.
- `production/export_environment_volume_v1.py` e `production/export_cloud_world_v1.py`: exportação determinística com Pillow; células/cortes técnicos, redução por nearest e alpha original preservado. Nenhuma pintura ou remoção de fundo por código.
- `qa/environment-world-v1/NUVEM_RECONSTRUCAO.gif`: prévia dos sprites; não substitui as capturas reais da integração.

Módulos novos: `environment_depth_v1.js`, `cloud_world_v1.js`, `environment_atmosphere_v1.js`, `cloud_story_v1.js`. O gerador os injeta após a arte/FX existentes e registra os arquivos usados no manifesto. Hooks explícitos posicionam o ground pass e a iluminação. As suítes novas estão no CI e no publicador.

## Validação

Regras de nuvens/queda: 17 testes. Arquitetura/portas/fallbacks: 18 testes. Atmosfera/pausa/limites: oito testes. A composição passa por verificação estática e pelo navegador real com capturas de fachadas, interiores, reconstrução e queda de P1/P2. O [relatório independente](../qa/environment-world-v1/RELATORIO_REVISAO.md) e `BROWSER_RESULTADOS.json` identificam o estado e o hash efetivamente executados; resultados de versões anteriores não comprovam a composição final.

Não foi executada uma nova campanha humana completa nem teste em aparelhos ou controles físicos nesta entrega. As capturas usam cenas e ações reais em condições controladas no Chrome isolado.
