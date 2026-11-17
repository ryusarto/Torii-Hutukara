# Arte dos protagonistas V5

O GitHub é a fonte oficial do jogo e do código; o Dropbox guarda backups de assets, ZIPs, prévias e temporários.

O pacote oficial está em assets/protagonistas/v5: 24 atlas, 32 retratos, manifesto, relatórios e prévia offline. Os 1.728 PNGs individuais e as pranchas brutas ficam no backup. production/export_main_sprites_v5.py permite reconstruir os frames sem duplicá-los no Git.

Franco e Ryuchi principais têm quatro direções, com e sem máscara, em doze estados: espera, caminhada, corrida, rolamento, três golpes, duas técnicas, especial, dano e derrota. São 192 sequências direcionais. As variantes arqueiro, katana, sintetizador e percussionista não são substituídas por este pacote.

Células 256 × 256, pivô (128,224), atlas 2304 × 2048. Estados em loop usam 00–07; 08 é fechamento. Derrota sustenta 07/08. A arte 2D foi gerada pela ferramenta integrada; modelos 3D foram usados somente como referência. Prompts, hashes e correções ficam em design/sprites-principais-v5.

Os relatórios especificam os testes de estrutura e navegador. As pranchas de movimento e os GIFs do backup permitem revisar as transições. A aplicação à build do jogo permanece pendente; sincronizar os quadros com locomoção, janelas de dano e invulnerabilidade nessa etapa.
