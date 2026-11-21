# Ambientes vivos, profundidade e nuvens

Pedido do autor de 20/11/2026. Beta1.10 publicada pelo PR#19 sobre a base1.9 `b83314b8b5a46d92a08f80e0cd94679f7840bc7a`, preservando músicos, protagonistas, NPCs, estúdio, pós-jogo, FX dos chefes, cenários desérticos e o reparo do publicador.

A composição 1.10 incorpora também a frente do PR #18 (head bd9992e0): NPCs vivos, estúdio, corrida e cinema. Gerador, workflows e validação foram conciliados por trechos; o sofá conserva seu ponto de ordenação no chão. As evidências finais precisam corresponder ao executável composto.

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

Módulos novos: `environment_depth_v1.js`, `cloud_world_v1.js`, `environment_atmosphere_v1.js`, `cloud_story_v1.js`. A composição preserva também o pós-jogo da 1.9 (PR #20), publicado e conferido antes desta entrega. O gerador os injeta após a arte/FX existentes e registra os arquivos usados no manifesto. Hooks explícitos posicionam o ground pass e a iluminação. O pós-jogo é o último módulo; a guarda de viagens durante queda é instalada no init, após todos os módulos, sem acesso antecipado a PostGame. As suítes novas estão no CI e no publicador.

## Validação

Regras de nuvens/queda: 20 testes. Arquitetura/portas/fallbacks: 18 testes. Atmosfera/pausa/limites: oito testes. A composição passa por verificação estática e pelo navegador real com capturas de fachadas, interiores, reconstrução e queda de P1/P2. O [relatório independente](../qa/environment-world-v1/RELATORIO_REVISAO.md) e `BROWSER_RESULTADOS.json` identificam o estado e o hash efetivamente executados; resultados de versões anteriores não comprovam a composição final.

A conciliação final preserva a main `d75a37b115c73e9f8f6ac84ffe62b7b1e95b2404`, incluindo o reparo do publicador por identidade exata do artefato. Os oito testes dessa infraestrutura e o parsing YAML passaram. O executável composto tem SHA-256 `77c6334bb5d84c62539954376bf44e68db8ffc63e10884b3384c6c11a3689fc8`; sua validação estática aprovou 145/145 verificações. O pós-jogo permanece o último módulo e as viagens não podem interromper uma queda, mesmo com os efeitos visuais desativados.

Na composição final, 38/38 verificações de navegador passaram sem erros: 15 de ambientes/nuvens, 11 de estúdio/cinema e 12 de pós-jogo. A revisão visual independente aprovou os cinco contatos e as capturas novas de nuvens/queda. O teste do mapa durante a queda usa checkpoint genérico e deixa os marcos da campanha semeada serem processados no chão antes da travessia; não altera funções ou HP de produção para obter o resultado.

Não foi executada uma nova campanha humana completa nem teste em aparelhos ou controles físicos nesta entrega. As capturas usam cenas e ações reais em condições controladas no Chrome isolado.

## Publicação confirmada

[PR#19](https://github.com/ryusarto/Torii-Hutukara/pull/19) integrado em `91e8642e28bc882a2645a81cf922a1be87c62cde`. [Art44853202078](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44853202078) e [Gameplay44853202027](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44853202027) aprovados no head selado `21bb786`. [Publish44853604429](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44853604429) aprovado com identidade de artefato porrun/attempt.

Conferência independente no [jogo público](https://ryusarto.github.io/Torii-Hutukara/) confirmou1.10.0, sourceSHA77c6334, hash do index igual ao build-info e13PNGs (sete preservados e seis novos/restaurados), além do roundtrip. [Prova independente](../qa/environment-world-v1/COORDENACAO_PUBLICACAO.json) · [Prova dos seis assets](../qa/environment-world-v1/PAGES_VERIFICACAO.json) · [Relatório final](../qa/environment-world-v1/PLAYTEST.md).
