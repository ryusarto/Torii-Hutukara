# Arte dos protagonistas V5

O GitHub é a fonte oficial do jogo e do código; o Dropbox guarda backups de assets, ZIPs, prévias e temporários.

O pacote oficial está em assets/protagonistas/v5: 24 atlas, 32 retratos, manifesto, relatórios e prévia offline. Os 1.728 PNGs individuais e as pranchas brutas ficam no backup. production/export_main_sprites_v5.py permite reconstruir os frames sem duplicá-los no Git.

Franco e Ryuchi principais têm quatro direções, com e sem máscara, em doze estados: espera, caminhada, corrida, rolamento, três golpes, duas técnicas, especial, dano e derrota. São 192 sequências direcionais. As variantes arqueiro, katana, sintetizador e percussionista não são substituídas por este pacote.

Células 256 × 256, pivô (128,224), atlas 2304 × 2048. Estados em loop usam 00–07; 08 é fechamento. Derrota sustenta 07/08. A arte 2D foi gerada pela ferramenta integrada; modelos 3D foram usados somente como referência. Prompts, hashes e correções ficam em design/sprites-principais-v5.

Os relatórios especificam os testes de estrutura e navegador. As pranchas de movimento e os GIFs do backup permitem revisar as transições. A fonte da Beta 1.2 integra o pacote por `protagonist_art_v5.js`, depois das camadas de gameplay e variantes. Ações só começam quando aceitas; P1/P2 têm relógios separados, diálogos pausam os relógios e troca de integrante/área/save descarta a ação anterior. Máscaras usam linhas 4–7 depois da aquisição, sem sobrepor outra máscara. Os retratos acompanham a mesma flag.

A integração não altera dano, cooldowns, colisões, duração da esquiva ou invulnerabilidade. O rolamento usa os quadros desenhados; não gira o corpo por código. Derrota permanece com a troca automática anterior, sem acrescentar uma espera para mostrar todos os quadros. O cache limita oito atlas e carrega ações sob demanda; não equivale a uma medição em telefone físico.

Teste reproduzível: gerar build, validar, exportar com `production/build_playtest.rb` e executar `node qa/run_art_integration.cjs` com Playwright instalado. O workflow Art integration QA faz o mesmo em Chromium isolado e preserva relatórios e capturas como artefato.
