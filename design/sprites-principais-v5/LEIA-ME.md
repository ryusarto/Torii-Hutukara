# Protagonistas principais V5 · 17/11/2026

Franco e Ryuchi principais em pixel art 2D: doze estados, quatro direções e versões com e sem máscara. A máscara mantém tecido claro, costura central, espinhos, óculos redondos e pele na abertura inferior. Ryuchi usa touca; Franco mantém o cabelo cacheado e a jaqueta vermelha/dourada.

Os 24 atlas oficiais, os 32 retratos, o manifesto e a prévia offline ficam em [assets/protagonistas/v5](../../assets/protagonistas/v5/). São 192 sequências, cada uma com oito poses únicas e um quadro adicional de fechamento. Os estados são espera, caminhada, corrida, rolamento, três golpes, técnica Z, técnica X, especial K, dano e derrota. As células medem 256 × 256, com pivô (128,224); os atlas medem 2304 × 2048.

O GitHub é a fonte oficial do jogo e das ferramentas. Os 1.728 PNGs individuais, originais, estudos, ZIP, folhas de contato e GIFs ficam no backup Dropbox/T&H/Assets/Torii & Hutukara/Personagens principais/sprites-principais-v5. Os arquivos brutos não são duplicados no Git.

## Revisão e exportação

Baixe o repositório e abra assets/protagonistas/v5/PREVIA.html no navegador. A prévia tem pausa, avanço de quadro e velocidade ajustável. Caminhada, corrida e espera usam 00–07 em loop. O frame 08 fecha as outras ações; na derrota, repete 07 e mantém a pose no chão.

Com Python e Pillow instalados, verificar os atlas: `python3 production/export_main_sprites_v5.py --check-only`. Para extrair todos os PNGs: `python3 production/export_main_sprites_v5.py --out "/caminho/do/backup"`. A extração usa os pixels dos atlas oficiais sem pintura ou interpolação.

A validação confirmou 1.728 frames, 32 retratos, transparência, margens, dimensões, igualdade entre atlas e frames e fechamento das 192 sequências. A prévia foi testada nas 192 combinações. Esses testes não substituem avaliação artística nem a sincronização dentro do jogo.

## Produção e procedência

A arte foi gerada pela ferramenta integrada de imagens. Os modelos 3D serviram apenas de referência. Prompts e hashes ficam em fontes.json, retratos.json, GERADOS_V5.json e REFINAMENTOS_V5.json. Os caminhos de pranchas brutas nesses registros referem-se ao backup, não a arquivos necessários para usar os atlas no Git.

CORRECOES_V5.json registra as direções completadas e as montagens; as laterais comprimidas de Franco e o rolamento mascarado de Ryuchi foram refeitos com poses adicionais. O processamento posterior apenas recorta, alinha e empacota os desenhos. As ferramentas que trabalham com originais recebem --base com o caminho do backup.

Integrados à fonte da Beta 1.2 em `game/source/chapter-03/protagonist_art_v5.js`. A camada acompanha locomoção, ações aceitas, dano e rolamento por jogador, sem alterar invulnerabilidade ou regras de combate. A publicação depende da revisão e do fluxo de publicação.
