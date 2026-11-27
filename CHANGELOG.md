# Notas de versão

## 1.27.0 — em desenvolvimento

- Ranking do calabouço mais direto: o briefing pede o nome da pessoa antes da expedição, e o resultado já mostra o ranking completo com a posição dela. Quem divide o navegador aparece separado no ranking.
- Ranking online do calabouço com a maior pontuação de cada pessoa, em solo e co-op. A participação é opcional e usa um apelido. Sem internet, o recorde é enviado depois. Ele abre pelo resultado da expedição, pelo briefing do calabouço, pela tela de fim de jornada e pelo menu de sistema. Configuração do Supabase em `docs/RANKING.md`.
- O quadro do jogo cabe na altura da janela no PC. Em notebooks (1366×768, 1280×800, 1280×720), o HUD, a fita de cura e as técnicas não ficam mais cortados embaixo.
- Tela de créditos no menu principal.
- A versão aparece certa no menu principal, nos menus e na aba do navegador. Antes, o menu mostrava "BETA 1.17.0" e a aba dizia "Pré-beta".
- Parado, o aliado fica ao lado do líder, sem cobri-lo.
- Celular em pé: o menu de título ocupa a tela toda.
- Celular: o objetivo, a vida e os botões de técnica não ficam mais por cima do título do capítulo durante as cenas. Na horizontal, a faixa de objetivo ocupa só a esquerda da tela.
- PC: o objetivo não aparece mais duplicado embaixo do quadro.
- Mapa, equipe e outras telas longas: a moldura acompanha a rolagem e a tela abre no topo, com o título visível.
- HTML portátil 24% menor (483 → 368 MB) e com carregamento cerca de 2,5 vezes mais rápido: as imagens são embutidas em WebP pelo mesmo conversor da versão web, com pixels idênticos.
- Estados dos chefes do teste de dificuldade atualizados com uma campanha da versão atual.
- Teste de locomoção do Franco atualizado para o carregamento da 1.26 (a cena pausa até a arte chegar) e para a corrida mascarada de oito poses; volta a rodar na publicação.
- Testes: não dependem mais de `/usr/bin/ruby`, do idioma do sistema nem de `playwright-core`. O validador reprova rótulos de versão antigos e o aumento das camadas sobre as funções centrais.

## 1.26.0

- Otimização da renderização e do carregamento da arte final.
- Correções da orientação da campanha e da recuperação de checkpoints.
- Ajuste das proporções dos NPCs e da apresentação do Metrônomo.
- Organização do código e da documentação de lançamento.

## 1.25.0

- Campanha com três capítulos e sete desafios musicais integrados.
- Interface, controles e animações atualizados.
- Correções de colisão, recuperação de saves, áudio e menus cooperativos.

A versão de cada build é definida em [`game/VERSION.json`](game/VERSION.json). Para alterações anteriores, consulte as versões correspondentes no histórico do projeto.
