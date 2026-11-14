# Torii & Hutukara — Análise completa e roteiro de correção

Análise feita sobre o commit `2fbd69f` (Alpha 1.2.4 Mobile & Co-op), lendo o código do HTML final, o runtime do Capítulo 3, os documentos de design e rodando a build num navegador headless.

---

## 1. Diagnóstico em uma frase

O jogo tem identidade (tema forte, arte bonita, elenco com afeto), mas **o tempo do jogador é gasto quase todo andando e lendo**. O combate, que é o que poderia "prender", aparece pouco, com poucos inimigos e pouca variedade. A música, que é a premissa ("RPG musical"), quase não entra no laço de jogo. E o código chegou num ponto em que cada mudança fica mais cara.

---

## 2. Defeitos de ritmo e game design (o que causa a "enrolação")

### 2.1 Combate raro demais
Contagem de inimigos de campo no código (`enemy(...)`):

| Capítulo | Áreas grandes | Inimigos de campo | Tipos |
|---|---|---|---|
| 1 | cidade 58×45, floresta 63×41, ruínas 49×36 | **6** | 2 (`hush`, `whisper`) |
| 2 | Cidade das Vozes 64×44 + telhados + torre | **8** (6 só aparecem guardando relés) | os mesmos 2 |
| 3 | Distrito 64×44, usina, canal, nuvens | **7** | 2 novos (`c3_echo`, `c3_drone`) |

- ~21 inimigos comuns no jogo inteiro, 4 tipos ao todo. Inimigo derrotado nunca volta (`G.defeated`).
- O primeiro combate só acontece depois de estúdio → corredor → câmara → cidade → conversa com Ema → portão leste → floresta. Pela distância e falas, estimo **vários minutos sem lutar** (vale cronometrar num playtest).
- A IA comum tem 1 ataque cada (`swipe` corpo a corpo ou `orb`). O chefe do Cap. 1 sorteia entre 3 ataques (`ring`, `fan`, `charge`) com `Math.random()`, então o padrão não se aprende, só se reage.

### 2.2 Missões de "vá até lá e fale"
`objectiveData()` do Cap. 1 é uma fila linear: mesa → porta → corredor → pedestal → Ema → portão → mascarado → ponte → pedra A → pedra B → fenda → revelação → conversa final. Quase todo passo é **andar + interagir + ler**. No Cap. 3 se repete o vai e volta: clube → usina/canal → oficina → clube → elevador. O próprio `design/COMBATE_E_RITMO_PROPOSTA.md` já reconhece isso, mas nada foi cortado ainda.

### 2.3 Texto demais, sem controle do jogador
- No HTML base, **110 das 265 falas (≈42%) são do Narrador**: ele descreve o que a tela já mostra.
- Cap. 3: 32 cenas, 146 falas; várias cenas com 5–8 falas seguidas antes de devolver o controle.
- Não existe pular cena, acelerar texto nem registro de falas (procurei por skip/pular/log no código: nada).

### 2.4 A música não é mecânica de verdade
A premissa é "a música organiza combate, exploração e escolhas", mas na prática as relíquias são **chaves de porta** (o Baixo abre raízes e a ponte; o Violino revela uma passagem). O mini-game de ritmo é uma tela separada. O combate não usa batida (só o Percussionista tem bônus "no tempo"). Os três capítulos tocam versões 16-bit das faixas do álbum (correção de 14/11/2026: a análise inicial dizia, por engano, que os Caps. 1–2 usavam só som sintetizado).

### 2.5 Sem curva de tensão
Faltam picos entre os chefes: nada de emboscada, perseguição, sala com tempo, escolha com custo, recompensa no meio do caminho. Os XP_STEPS (`0,25,65,130,225…`), com tão poucos inimigos, fazem o nível subir quase só por roteiro.

### 2.6 Coop e mobile incompletos
O P2 tem kit simplificado (documentado em `PROJECT_STATUS.md`). Câmera compartilhada sem limite de distância puxa o outro jogador.

---

## 3. Defeitos técnicos

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| T1 | **Monkey-patch em camadas** | `buildMaps` é reatribuída 10×, `drawActor` 9×, `update`/`drawTile` 7×, `normalizeSave`/`advanceDialogue` 6× (`const _x=x; x=function(){…_x()}`) | Ninguém sabe a ordem real de execução. Cada bug corrigido pode quebrar outra camada. |
| T2 | **CSS empilhado com `!important`** | blocos "Build 0.4", "v0.6", "1.0", sobrescrevendo uns aos outros | Layout mobile frágil |
| T3 | **HTML de 98 MB** com áudio/imagem em Base64 | 6 faixas MP3 ≈ 30 MB só em Base64 | Carregamento pesado no celular e muita memória |
| T4 | **Repositório de 1,2 GB** | `game/builds/` tem 791 MB: 9 builds de ~90 MB versionadas no git | Clone lento. O GitHub reclama de arquivos >50 MB e bloqueia >100 MB. |
| T5 | Base 1.1.2 "imutável" + patches por regex no Ruby | `build_alpha.rb` aplica substituições textuais | Não dá para corrigir os Caps. 1–2 de verdade |
| T6 | Testes quase só estáticos | `validate_alpha.rb` checa strings; `input_regression.cjs` copiado por versão (unificado na Fase 0) | Travas de quest só aparecem no playtest |
| T7 | Rótulo de versão errado | Cabeçalho in-game mostra **"1.0 · PRÉ-ALPHA"** na build 1.2.4 | Confusão em feedback de testers |
| T8 | Mapas procedurais com `rng()` + "garantir caminho" depois | floresta refaz `path(...)` duas vezes | Colisões imprevisíveis, árvores bloqueando rota |

---

## 4. Riscos legais e de privacidade (resolver primeiro)

Contexto confirmado pelo autor: jogo **gratuito, sem uso comercial, código aberto, jogado no navegador**, feito para divulgar o álbum colaborativo de Ryuchi e Franco, The Sir.

1. **Licença não bate com "código aberto"**: o README diz "direitos reservados" e não existe arquivo `LICENSE`. Para ser open code de verdade, separar:
   - **código** sob uma licença aberta (MIT se qualquer um puder reaproveitar; GPL-3.0 se quiserem que derivados também fiquem abertos);
   - **músicas, máscaras, rostos e personagens** sob outra licença (ex.: CC BY-NC-ND 4.0, ou "todos os direitos reservados"), descrita num `ASSETS_LICENSE.md`. Isso deixa o código aberto sem permitir que alguém reutilize a identidade de vocês.
2. **Músicas** — *resolvido pelo autor*: cada faixa é uma versão 16-bit de uma faixa do álbum, feita no Suno. Único cuidado: a conta precisa ter sido de plano pago quando as faixas foram geradas (no gratuito, o Suno fica dono). Registrar em `ASSET_PROVENANCE.md` qual faixa do álbum cada arquivo representa.
3. **Pessoas retratadas** — *resolvido pelo autor*: todas autorizaram e participaram do álbum. Registrar isso em `ASSET_PROVENANCE.md`.
4. **Estudo de Moonlighter** — *decisão do autor*: mantido por enquanto.

---

## 5. Como deixar o jogo mais dinâmico e com mais momentos que prendem

### Princípio: "problema → ação → consequência → avanço"
Cada trecho de 2–4 minutos precisa ter **uma coisa para fazer com as mãos** e **uma recompensa visível**. Andar só vale quando a caminhada tem algo no caminho.

Referências reais:
- *Nine Sols*: mais da metade das falas serve para **empurrar o jogador para a ação**, e trechos de narração foram limitados a 20 linhas ([GameGene](https://gamegene.app/library/records/claims/414d0db3-b739-451b-9260-1bb6af0def45)).
- *Firewatch*: em vez de mostrar o trecho onde nada acontece, a cena **corta direto** para o próximo momento de tensão ([GameGene](https://gamegene.app/library/records/claims/e722db23-7cd1-4c86-91b3-8a8ae848a870)). Aplicando aqui: depois de resolver algo, corte para o destino em vez de obrigar a voltar a pé.

### 5.1 Combate: mais, melhor e com ritmo
- **Densidade:** 3–5 encontros desenhados por área grande, cada um com uma ideia (grupo cercando, atirador atrás de cobertura, inimigo que protege outro). Meta: **~60 inimigos** no jogo, não 21.
- **Variedade:** de 4 para ~10 tipos. Exemplos ligados ao tema: *Metrônomo menor* (ataca em batida fixa, ensina timing), *Eco* (repete o seu último golpe), *Abafador* (silencia técnicas numa área), *Feedback* (explode se atingido por som alto), *Coral* (fica mais forte em grupo).
- **Chefes com padrão aprendível:** trocar o `Math.random()` por **sequências fixas por fase**, com uma abertura clara de contra-ataque e telegrafia sonora (cada ataque tem o seu som).
- **Combate no tempo da música:** todo golpe acertado no tempo da faixa dá um bônus pequeno (+dano, +ressonância). O HUD mostra a batida. Isso transforma a premissa em mecânica sem punir quem não tem ritmo.
- **Respawn leve:** inimigos voltam ao recarregar a área (exceto encontros de roteiro), para o caminho de volta não ficar vazio.

### 5.2 Relíquias como armas e ferramentas, não chaves
- **Baixo:** onda de choque que empurra inimigos e move blocos *durante* a luta.
- **Violino:** revela inimigos invisíveis e plataformas por alguns segundos (com limite de tempo).
- **Flauta:** cria passarelas de ar curtas em tempo real (travessias com pressão).
- **Tambor:** alterna plataformas no tempo da música (salas de ritmo).
Cada relíquia ganha **uma sala-desafio curta** logo depois de recebida, para o jogador dominar a habilidade com as mãos.

### 5.3 Cortar enrolação de missão
- **Cap. 1:** fundir estúdio + corredor + câmara numa abertura de 1–2 min, com um inimigo já na câmara (ensina ataque e esquiva antes da cidade). Ema chama vocês em vez de ser procurada. Pedras A/B passam a ser **arenas** (ativar = sobreviver a uma onda).
- **Cap. 2:** relés ativados por combate, com reação curta por vitória (já previsto). Orientações por rádio no lugar de voltar à origem.
- **Cap. 3:** concluir Usina/Canal **avisa Maia pelo rádio**. Nara entrega a Flauta no próprio canal. A frase musical abre o elevador na hora (corte direto). Mar de Nuvens com 3 encontros desenhados em vez de corredor vazio.
- **Viagem rápida** pelos gravadores de ressonância que já existem (checkpoints).

### 5.4 Diálogos
- Regra: **no máximo 3–4 falas antes de devolver o controle**. Falas extras viram conversa opcional (fale de novo com o NPC).
- Narrador só fala o que a tela não mostra. Meta: tirar de 50% a 70% das falas dele.
- Adicionar: segurar botão para **acelerar/pular**, **registro de falas** e opção "pular cena" em cenas já vistas (retry de chefe).
- Banter **enquanto anda** (balões curtos sobre a cabeça) no lugar de caixa de diálogo que trava o jogo.

### 5.5 Momentos que prendem (um por área)
- **Perseguição:** O Silêncio "apaga" o mapa atrás de vocês e é preciso correr até o próximo torii.
- **Corrida contra o tempo:** a comporta do canal fecha em 60 s enquanto os ecos atacam.
- **Defesa:** proteger o Percussionista enquanto ele sustenta a ponte (escolta curta).
- **Escolha com custo:** salvar os trabalhadores ou a peça da usina, mudando uma fala e um item depois.
- **Show como clímax jogável:** a frase musical vira um trecho de ritmo com a faixa real, e o público reage.
- **Reviravolta antecipada:** mostrar O Silêncio usando uma fala real de um protagonista já no Cap. 1 (gancho de mistério).

### 5.6 Progressão que dá vontade de continuar
- Recompensa a cada 5–10 min: técnica nova, upgrade de relíquia, fita colecionável com trecho de música.
- **Árvore pequena por personagem** (3 escolhas por nível), em vez de só números.
- Colecionáveis musicais (fitas) que liberam faixas num "toca-discos" no estúdio, servindo de recompensa temática.

---

## 6. Roteiro de execução

Ordem pensada para cada fase destravar a seguinte. Durações são estimativas para 1 pessoa em tempo parcial.

### Fase 0 — Emergência (1–2 dias)
- [ ] Remover fotos de rosto reais e reescrever o histórico (ou tornar o repo privado).
- [ ] Tirar os documentos de engenharia reversa de Moonlighter do repo público.
- [ ] Registrar em `ASSET_PROVENANCE.md` a faixa do álbum de cada arquivo, o plano Suno usado e a autorização das pessoas retratadas.
- [ ] Corrigir o rótulo "1.0 · PRÉ-ALPHA" no cabeçalho.
- [ ] Mover `game/builds/` antigas para **GitHub Releases** (anexos) e tirá-las do git. Manter só a build atual (ou nenhuma, gerada no CI).

### Fase 1 — Medir antes de mudar (3–5 dias)
- [ ] Instrumentar a build: logar tempo em cada `G.area`, tempo em `mode==='dialogue'` vs `walk` vs `action`, mortes e retries.
- [ ] Fazer 3–5 playtests gravados (alguém que nunca jogou) e anotar onde a pessoa pega o celular/fica entediada.
- [ ] Meta para comparar depois: % do tempo em combate/puzzle, tempo até o primeiro combate, maior trecho sem ação.

### Fase 2 — Fundação técnica (2–4 semanas)
- [ ] Extrair o JS da base 1.1.2 para `src/` em módulos (estado/save, input, render, combate, mapas, quests, diálogos, áudio).
- [ ] **Achatar os wrappers**: para cada função com N camadas, escrever uma versão única e testar a equivalência.
- [ ] Mapas, inimigos, missões e diálogos em **JSON declarativo** (`data/`).
- [ ] Assets como arquivos (não Base64) na versão web. Gerar o HTML portátil único só como artefato de release.
- [ ] Unificar CSS sem `!important` (um arquivo, mobile-first).
- [ ] Testes automáticos de progressão com Playwright: rodar Cap. 1→3 por script com flags, Usina→Canal e Canal→Usina, save/load em cada etapa.
- [ ] Manter o schema de save e a migração (`normalizeSave`) com teste de saves antigos.

### Fase 3 — Núcleo de combate (2–3 semanas)
- [ ] Unificar os kits P1/P2.
- [ ] Sistema de "batida" global (BPM por faixa) + bônus de acerto no tempo.
- [ ] 6 novos tipos de inimigo + IA com 2–3 ataques cada.
- [ ] Chefes com padrões fixos por fase e aberturas claras.
- [ ] Relíquias como habilidades de combate/travessia.
- [ ] Sala de treino/arena para testar balanceamento.

### Fase 4 — Reestruturar o ritmo dos capítulos (3–4 semanas)
- [ ] Reescrever o fluxo de cada capítulo como **batidas** (beat sheet): para cada 2–4 min, ação + consequência.
- [ ] Cap. 1: abertura compacta, primeiro combate em < 90 s, pedras como arenas.
- [ ] Cap. 2: relés por combate, rádio no lugar de retornos.
- [ ] Cap. 3: eliminar retornos ao clube/oficina por rádio + corte de cena. Encontros desenhados nas nuvens.
- [ ] Viagem rápida pelos gravadores.
- [ ] 1 "momento que prende" por área (seção 5.5).

### Fase 5 — Diálogo e narrativa (1–2 semanas)
- [ ] Cortar o Narrador e limitar a 4 falas por bloco obrigatório.
- [ ] Acelerar/pular, histórico e pular cena vista.
- [ ] Banter em balões durante a caminhada.
- [ ] Gancho do Silêncio já no Cap. 1.

### Fase 6 — Identidade musical (1–2 semanas)
- [x] Trilha consistente nos 3 capítulos (já era: versões 16-bit do álbum em todos).
- [ ] Música adaptativa: camada de percussão entra no combate e sai na exploração.
- [ ] Show do Contratempo como sequência de ritmo jogável.
- [ ] Fitas colecionáveis + toca-discos no estúdio.

### Fase 7 — Polimento e Beta (contínuo)
- [ ] Repetir os playtests da Fase 1 e comparar as métricas.
- [ ] Juice: hit-stop, partículas, som por impacto, tremor de câmera dosado.
- [ ] Desempenho em celular básico (meta: carregar em < 5 s no 4G).
- [ ] Acessibilidade: daltonismo, redução de tremor, legenda de efeitos sonoros.
- [ ] Congelar conteúdo e entrar em Beta.

---

## 7. Metas mensuráveis (para saber se funcionou)

| Métrica | Hoje (estimado) | Meta |
|---|---|---|
| Tempo até o 1º combate | vários minutos | < 90 s |
| Inimigos comuns no jogo | 21 | ~60 |
| Tipos de inimigo | 4 | ~10 |
| Falas do Narrador | ~42% das falas base | < 15% |
| Falas obrigatórias seguidas | até 8 | ≤ 4 |
| Maior trecho só andando | ? (medir) | < 45 s |
| Tamanho do download web | 98 MB | < 30 MB (assets em arquivo + streaming de áudio) |
| Tamanho do repo | 1,2 GB | < 200 MB |

---

## 8. O jogo como divulgação do álbum

### O que o jogo precisa comunicar
1. As **máscaras (Torii)** são reais: vocês vão usá-las na vida real.
2. Os Torii levam a **vários mundos (Hutukara)**, em várias realidades.
3. Em cada realidade existe um **Ryuchi e um Franco, The Sir diferentes**, cada um com um **estilo musical**.
4. No final, Ryuchi e Franco **sabem desses universos** e vão viajar por eles. **Cada viagem = uma mixtape de um gênero.**

Hoje o jogo conta 1, 2 e parte de 3 (o Arqueiro, o Katana, o Sintetizador e o Percussionista já são versões alternativas), mas **as versões não são ligadas a gêneros musicais de forma explícita** e o final não aponta para as mixtapes.

### Mudanças de design que servem à divulgação

**Cada mundo = um gênero = uma faixa/mixtape.**
- Cada Hutukara tem visual, inimigos, trilha e mecânica de combate do seu gênero. Exemplo de como pensar (os gêneros reais são de vocês):
  - mundo trap/drill → combate de ataques curtos e pesados no 808, inimigos que "travam" o tempo;
  - mundo eletrônico/synth → o Franco Sintetizador e seus campos (já existe);
  - mundo percussivo/afro/funk → o Percussionista e golpes no tempo (já existe);
  - mundo lo-fi/jazz → exploração mais calma, puzzles de ritmo.
- **A versão de Ryuchi/Franco de cada mundo apresenta o gênero**: ela fala como alguém daquela cena, a faixa daquele mundo toca quando ela entra na equipe.
- **A música do jogo é a música do álbum.** Os três capítulos já tocam versões 16-bit do álbum. Falta mostrar o nome da faixa na tela, com o nome da faixa aparecendo na tela ("♪ Agora tocando: …"). O jogo vira o player do álbum.

**Máscaras como peça central.**
- A máscara do jogo deve ser idêntica à máscara física (a referência `TORII_MASK_PHYSICAL_REFERENCE.png` já existe).
- Colocar a máscara no momento mais forte de cada capítulo (a travessia), sempre com o mesmo efeito visual e sonoro, para virar marca.

**Final que abre a série de mixtapes.**
- Depois do Silêncio, Ryuchi e Franco voltam ao estúdio e aparece um **mapa do multiverso**: os mundos já visitados acesos e vários portais apagados, cada um com o nome de um gênero/mixtape futura ("Em breve").
- Cada mixtape lançada na vida real = **um mundo novo e curto no jogo** (15–20 min), que acende um portal. Isso dá motivo para voltar ao jogo a cada lançamento e para divulgar cada mixtape com uma atualização.
- Tela final com links para ouvir o álbum, redes de vocês e créditos.

### Por isso, a estrutura ideal muda
- **Hub (estúdio) + mundos curtos e independentes**, em vez de uma campanha longa e linear. Cada mundo: chegada → encontrar a versão daquele mundo → 3–5 encontros → chefe → a versão entra na equipe → faixa desbloqueada.
- **Duração-alvo da campanha principal: 45–75 min.** Quem chega por um link de divulgação precisa ver máscara, travessia, uma versão alternativa e um combate nos **primeiros 5 minutos**.
- A modularização da Fase 2 vira obrigatória: cada mundo é uma pasta de dados (`worlds/<genero>/`) que dá para acrescentar sem mexer no resto.

### Requisitos de divulgação (entram nas fases do roteiro)
- **Carregar rápido pelo link do Instagram/TikTok** (navegador interno do app, celular, 4G): hoje são 98 MB. Meta: tela de título em < 5 s, áudio carregado sob demanda. Isso sobe para a **Fase 0/2**.
- **Mobile em primeiro lugar**: é por onde quase todo mundo vai chegar.
- **Compartilhar**: botão de print com moldura do álbum ao vencer um chefe ou recrutar uma versão.
- **Página de entrada** (`web/album/` já existe) ligando álbum ↔ jogo ↔ máscaras reais.
- **Créditos e links** acessíveis do menu principal, não só no fim.

### Ajuste no roteiro
| Fase | Acréscimo |
|---|---|
| 0 | `LICENSE` (código) + `ASSETS_LICENSE.md` (identidade/música); registrar autorizações e origem das faixas |
| 2 | Estrutura hub + `worlds/`; áudio e imagens fora do HTML, carregados sob demanda |
| 4 | Recortar os capítulos atuais em mundos por gênero; início com máscara + travessia + combate em 5 min |
| 6 | "Agora tocando" com o nome da faixa do álbum |
| 7 | Mapa do multiverso pós-final, portais "em breve", links do álbum, botão de compartilhar |

---

## 9. Prioridade definida pelo autor

**Foco agora: deixar Torii & Hutukara redondo.** Mundos por mixtape (funk, trap, solos, The Whistles) ficam como **expansões futuras**, lançadas junto de cada álbum, depois que o jogo principal estiver pronto. A estrutura em mundos (seção 8) continua útil como arquitetura, mas não muda o prazo atual.

Ordem de trabalho: Fase 0 (só licença e rótulo de versão) → Fase 1 (medir) → Fase 3 (combate) → Fase 4/5 (ritmo e diálogos) → Fase 2 em paralelo, conforme cada sistema for tocado.

## 10. Combate no tempo com as faixas 16-bit prontas

As faixas não precisam ser refeitas. Músicas no estilo 16-bit (tipo Zelda) têm andamento fixo, o que facilita.

1. **Mapa de batida por faixa:** um arquivo `beats.json` com BPM e o instante da primeira batida de cada faixa (medido uma vez, com detecção automática ou uma ferramenta de "bater no ritmo" no navegador).
2. **Relógio do áudio:** a posição da batida vem de `AudioContext.currentTime`, não do relógio do jogo, para não dessincronizar no celular.
3. **Janela generosa:** golpe a ±120 ms da batida conta como "no tempo". Só **dá bônus** (dano extra, ressonância, efeito visual); nunca pune quem ignora o ritmo.
4. **Leitura visual:** um pulso discreto no HUD e no chão em cada batida, e os inimigos telegrafam ataques no compasso, para o ritmo ser visto e não só ouvido.
5. **Onde usar mais:** combos (terceiro golpe no tempo = golpe forte), técnicas do Percussionista, e padrões dos chefes alinhados ao compasso da faixa do chefe.
6. **Calibração:** opção de ajuste de atraso (fone Bluetooth atrasa o som).

Teste antes de espalhar: aplicar só ao combo básico numa arena e ver se o jogador sente diferença.
