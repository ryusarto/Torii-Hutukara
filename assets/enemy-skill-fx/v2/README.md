# Efeitos de inimigos V2 — matéria visível, cenário preservado

26/11/2026. Fontes produzidas com o **image_gen integrado**, usando os efeitos já
existentes dos bosses como referência de material. Prompts exatos em
`PROMPTS.json`; origem, política de derivação e hashes em `PRODUCTION.json`.

O Tambor passa de filamentos para cristas largas de pressão cobre/marfim que
irrompem à frente, avançam e se quebram. As duas poses de pico têm48,7%/48,2%
de pixels sólidos dentro dos próprios bounds: os espaços grandes continuam
mostrando o chão. O Flautim atira uma cápsula sólida marfim/lima com cauda grossa
e fragmentada; o contato tem ruptura própria. Não são notas, ícones ou armas.

## Contrato e fonte editável

`source/tambor.png` e `source/flautim.png` preservam o RGBA original do gerador,
respectivamente1774×887 e1254×1254. São fontes raster editáveis, não arquivos
de pintura com camadas inventadas. `atlas/` contém seis PNGs para integração.
Tambor e Flautim são novos; Coro, Maestro, Muralha e Antena são cópias exatasV1.

Dez chaves de clip existentes preservadas,80 poses no total:24 novas e56
reutilizadas. Células128×128, quatro colunas, oito poses por clip; `rowOffset`
0/2, pivô nominal[64,64], nearest, sem loop geral. Fases0–2 preparo,3/4 pico,
5–7 ruptura/dissipação; cronômetros reais continuam definidos pelo jogo.

`production/import_enemy_skill_fx_v2.py` lê as fontes e o manifestoV1, verifica
as divisórias globais **antes** de recortar e exporta a célula completa com
escala nominal fixa112×112 mais margem8. Limpa alfa≤8 e RGB transparente
somente nos derivados. Não apaga componentes nem recentra cada pose.

O núcleo do Flautim é medido no atlas final por componente contínuo marfim;
`flightCorePivots` guarda3:[94.47,68.51],4:[95.29,67.44],5:[95.02,68.02]. Esses
pivôs alinham o núcleo com o projétil físico. Bounds de núcleo21×14,20×15,
23×14; com draw72×56 ficam11–12×7px,37–40pixels claros. A cápsula permanece
legível em terra/vegetação, mais densa queV1, com cauda vazada.

## Validação e limites

`IMPORT_QA.json`:24/24 células novas correspondem integralmente à fonte
derivada; divisórias alfa>8 vazias, exterior vazio, guard8 e oito poses distintas.
Os quatro atlases reutilizados têm os mesmosSHA256 deV1. Nenhum PNGV1 foi
alterado. `NATIVE_CORE_QA.json` registra a redução nearest no orçamento72×56.

`preview/all-new-frames-*.jpg` mostra todas24poses em fundos claro/escuro.
Os três GIFs são prévias dos atlases, sem representar gameplay. As composições
`native-context-static.png` e `tambor-context-static.png` usam recortes reais do
cenário apenas para análise estática de material/contraste; estão identificadas
como composições e não comprovam integração. Demos no runtime e aceite final
do comportamento pertencem ao coordenador/integrador.

Fontes, atlases e manifesto congelados para integraçãoV2. Nenhum dado de dano,
IA, colisão, corpo de inimigo, menu, engine ou builder foi alterado pelo artista.
