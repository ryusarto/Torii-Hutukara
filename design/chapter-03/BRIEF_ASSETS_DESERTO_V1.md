# Brief de assets C3 — deserto v1

Complemento ao [contrato de direção](DIRECAO_DESERTO_POS_APOCALIPTICO.md) e à [paleta estruturada](PALETA_DESERTO_V1.json). Estado: especificação de produção; estes prompts não são novas imagens nem prova de integração.

## Amostra e reuso

Partir das células atuais e da câmera real. A frente de cenários é dona dos PNGs e da integração de ambiente; este brief não cria uma produção paralela dos mesmos atlas.

Primeiro lote: superfície/guia/soleira e fachada do Distrito, palco e caixa idle/active do Contratempo, entrada e mecanismo inactive/active da Usina. Conferir também um enquadramento de altura antes de expandir nuvens/mecanismos. Usar os protagonistas aprovados como referência de escala.

Reaproveitar organização, pivôs e estados de A01–A10. O manifesto contém 106 células C3 e 20 compartilhadas; não gerar automaticamente 126 novos objetos. As fachadas icônicas antigas precisam de variantes C3 coerentes. A11/A12 originais permanecem.

O pacote combinado com o integrador é `assets/cenarios/deserto-v1/`. Registrar por item: ID original, contexto C3, fonte, retângulo medido, pivô, escala, estado/flag, camada, hash, exportação e situação de integração. Não copiar caixas de recorte de uma geração antiga sem medi-las.

## Linguagem de matéria

Mostrar aço remendado, soldas, concreto erodido, lona tensionada e eletrônica recuperada. Substituir o excesso ornamental por construção funcional. Areia acumula nas bordas e nas bases; não encobre toda a rua. Vegetação rara e cuidada e janelas quentes mostram comunidade.

Materiais são superfícies silenciosas. Canos, sucata, olhos, símbolos, móveis e fachadas ficam em peças separadas. Água permanece água; topo caminhável, condensação futura e vazio têm contornos e valores distintos.

## Prompts de produção

Substituir os campos por um item/contexto real e anexar a célula aprovada como referência estrutural. A grade pedida ao gerador não comprova cortes corretos. Escala e encaixe são verificados após a geração.

### Material

> Torii & Hutukara, existing 2D top-down three-quarter 16-bit JRPG environment material. Post-apocalyptic desert settlement built from salvaged technology. Palette: sand #C3A06C, sunlit dust #DFC49A, rust #9A5537 and #6E3F2A, worn steel #53524A, charcoal #282724, bone #F0E0BD, cool shadows #3F5155. Dry eroded concrete, compacted sand in cracks and restrained rusted flush metal according to <MATERIAL>. Quiet surface, deliberate square pixel clusters, no photographic texture or blur. Seamless statistics across opposite edges, no centered motif, no buildings, pipes, signs, furniture or symbols embedded in the floor. Preserve the material's readable walkable role at a 24-pixel logical tile. Separate transparent gutter from opaque material interior. Avoid general neon reflections.

### Fachada

> Adapt the supplied approved building for Torii & Hutukara's Chapter 3 post-apocalyptic desert world. Preserve the frontal three-quarter camera, outer footprint, door position, ground anchor and recognizable silhouette. Patched steel, restrained rust, eroded concrete, sun-worn canvas and visibly reused electronics; hand-repaired functional construction. Keep warm inhabited windows and a few cared-for plants. Cyan #6CC1BC only on functional technology; amber #E7B26B for inhabited light. No generated text, people, vehicles, skull ornaments or additional masks. Isolated RGBA architecture sprite, complete object, transparent door opening where the existing state requires one. Use the attached crop as structural reference and retain the authored door/ground alignment.

### Mecanismo e estado

> Two matched states of the same salvage-built musical mechanism for Torii & Hutukara: <OFF_STATE> and <ON_STATE>. Identical camera, footprint, pivot, scale and material wear. Rusted metal, repaired cable routes and reused electronic control parts. The active state has a clear mechanical change plus a small functional light. Preserve the existing interaction point and empty floor around the object. No backdrop, floor panel, text, characters, weapons or oversized glow. Real transparent RGBA. Preserve open/closed geometry when the mechanism is a gate.

### Atmosfera

> Restrained pixel-art desert wind and dust for Torii & Hutukara, transparent RGBA effect layer. Sparse sand particles, directional wisps and low-contrast dust near distant edges, using the Chapter 3 earth palette. Keep actor silhouettes, projectiles, attack telegraphs and walkable boundaries unobscured. No fullscreen opaque haze, motion blur, photo particles or new gameplay symbols. Background atmosphere is separate from impact and warning effects.

## Personagens e entrega

Preservar rostos, pele, roupa, instrumentos e contratos de animação dos seis heróis. Não recolorir V5 inteiro nem trocar a máscara Torii por máscara de gás. Ninja sem máscara; máscara do Arqueiro no lado direito do cinto. O contexto pós-apocalíptico aparece primeiro no mundo e em props.

Entregar o PNG fonte realmente produzido, atlas RGBA, manifesto, hashes e script de empacotamento. Estados correspondentes mantêm escala e pivô. Fontes editáveis são listadas somente se existirem. Material tem miolo opaco; props e vãos têm alpha real. Conferir halos, costuras e repetição 3×3.

O diretor artístico avalia a aparência nas capturas reais; arquitetura confere exportação/integração; game design e revisão verificam leitura e estado. Nomear separadamente o que foi produzido, integrado, executado e testado. Recoloração ou spritesheet gerada sozinhas não significam capítulo concluído.
