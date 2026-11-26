# Hero Attack FX V3

6folhas originais geradas por built-in image_gen em25/11/2026, usando os atlas canônicos `boss-ground-fx/v1/pulse` e `scrap` como referência de matéria/temporalidade. Fontes geradas preservadas em `source/`; V1/V2 permanecem intactos. O runtime V2 anterior também está preservado para comparação.

Exportação: `production/import_hero_attack_v3.py`. Recorte de grade exata8×6, células originais181×181, escala nearest para112×112 e margem transparente8px dentro de cada célula128×128. Somente alpha1..8 é zerado no derivado; não há repintura, inversão, interpolações inventadas ou fabricação de poses intermediárias. Atlas1024×768RGBA;36clips/288desenhos, pivot64,64. O manifesto registra origem, hashes, bbox, massa alpha, pixels visíveis/opacos e vazios por fase.

Linhas: attack_1, attack_2, attack_3, skill, advanced, signature. Colunas0..1 concentram o gesto;2..4 fazem ruptura/contato;5..7dissipam. O relógio vem da duração aceita pelo jogo. Fases e corpo permanecem independentes entreP1/P2. Originais não são folhas de personagem: os instrumentos continuam exclusivamente no corpo. Francoâmbar, Ryuchiazul/marfim, Arqueirooliva/cobre, Katanagrafite/violeta, Synthverde-água, Percussãoferrugem/cobre.

`hero_attack_fx.js` usa V3 antes dos caminhos antigos; não executa bassWave/edgeSlivers/props V2 no jogo. Projéteis usam seu ponto e vetor reais. Canais pequenos substituem grandes contornos vetoriais de assinaturas/pad; metadados suprimem apenas os sinais aliados substituídos. Eventos e timers de gameplay são preservados. Enquanto a imagem carrega, a pose corporal continua comunicando o golpe, e projéteis têm um núcleo mínimo como fallback.

Tokens para o builder: `__HERO_ATTACK_V3_ATLASES__` (objeto hero→PNGdataURI) e `__HERO_ATTACK_V3_MANIFEST__` (objetoJSON). Prévia por herói em `preview/`; conjunto em `contact-sheet.png`. Validação em navegador headless não equivale a uma campanha humana nem a aparelhos físicos.

Proveniência detalhada: `PRODUCTION.json` e `PROMPTS.json` guardam o tool built-in, os seis prompts exatos, referências e nomes de geração. `background-review.png` compara fundo claro/escuro e recortes reais de floresta/ruínas.

`preview/six-heroes-runtime.gif` e os seis GIFs individuais mostram três comandos J realmente aceitos, simulação update(1/30) e renderer das ruínas. A reprodução está2,4vezes mais lenta para inspeção; não simula FPS real. No Arqueiro, J repete o estágio0 conforme o gameplay original; os cinco outros combos passam0→1→2. Capturas-fonte e metadados estão em `qa/beta-1.17.0/hero-fx-v3/animation-frames/`.

Atribuição de impactos adiados vem de `withSource`: projétil real, integrante do follower, pad Synth, chuva do Arqueiro, contracorte Katana e factory Percussion. O emissor é restaurado em finally. Sem emissor comprovado, a aparência anterior permanece; o líder ativo não é usado como inferência. Cada alvo que efetivamente perdeHP recebe um contato; a guarda no músico continua um sinal separado.
