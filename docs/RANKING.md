# Ranking online do calabouço

O ranking mostra a maior pontuação de cada pessoa no Calabouço Infinito (Fenda das Ressonâncias), separado em solo e co-op. Os dados ficam num projeto [Supabase](https://supabase.com) no plano gratuito.

## Para quem joga

- Ao entrar no calabouço, o briefing pede **Seu nome no ranking**. O campo vem preenchido com o último nome usado no aparelho. Na primeira vez, vem com uma sugestão ("Ouvinte 1234"), para quem joga só com controle conseguir entrar; ao tocar no campo, a sugestão fica selecionada para ser trocada. Sem um nome válido (2 a 16 letras, números, espaço, ponto, hífen ou _), a expedição não começa.
- No fim da expedição, a pontuação é enviada e a tela de resultado mostra o ranking completo do modo jogado, com a posição da pessoa destacada.
- **NOVA TENTATIVA** recomeça direto, com o mesmo nome. Para jogar com outro nome, entre de novo pelo calabouço; o briefing sempre mostra o nome.
- Só o nome, a pontuação e a onda saem do aparelho. Save, campanha e medidor de ritmo continuam locais.
- Cada nome usado no aparelho ganha uma identidade própria, guardada no navegador (`torii_hutukara_ranking_v1`, separada do save). Duas pessoas que jogam no mesmo navegador aparecem separadas. Repetir o nome reaproveita a identidade, sem diferenciar maiúsculas de minúsculas. O mesmo nome em outro aparelho é outra linha no ranking.
- Sem conexão, a pontuação fica numa fila e sai ao continuar o jogo, quando a internet volta ou ao abrir o ranking.
- **TIRAR MEU NOME**, na tela do ranking, apaga do servidor a última pessoa que jogou no aparelho.

O ranking também abre pelo botão **RANKING ONLINE** no briefing e na tela de fim de jornada, e pelo **RANKING DO CALABOUÇO** no menu de sistema.

## Configurar o Supabase (uma vez)

1. Crie um projeto em supabase.com.
2. Em **SQL Editor**, cole e rode [`production/supabase/ranking_calabouco.sql`](../production/supabase/ranking_calabouco.sql). O arquivo pode ser rodado de novo depois de mudanças, sem perder dados.
3. Em **Project Settings → API** (ou **API Keys**), copie a **URL do projeto** e a chave **pública** (`anon` ou `publishable`).
   **Nunca** use a chave `service_role`/`secret`. O build se recusa a embutir essa chave no jogo.
4. Informe os dois valores ao build de uma destas formas:
   - em `game/source/chapter-03/ranking_config.json` (`url` e `chave`). A chave pública pode ficar no repositório;
   - ou nas variáveis do GitHub, em **Settings → Secrets and variables → Actions → Variables**: `TORII_RANKING_URL` e `TORII_RANKING_CHAVE`. O workflow *Publish playtest* usa essas variáveis, que têm prioridade sobre o JSON.
5. Gere o jogo de novo. Sem URL e chave, a tela do ranking avisa que ele ainda não está disponível.

## Plano gratuito do Supabase

- **Espaço:** o plano gratuito tem 500 MB de banco por projeto. Cada linha do ranking ocupa poucas centenas de bytes, o que dá espaço para mais de um milhão de pessoas.
- **Pausa por inatividade:** o Supabase pausa projetos gratuitos depois de uma semana com pouco uso e avisa por e-mail antes. O workflow *Ranking keep-alive* (`.github/workflows/ranking-keepalive.yml`) consulta o ranking duas vezes por semana para manter o projeto ativo.
  - O GitHub desliga workflows agendados depois de 60 dias sem atividade no repositório. Se isso acontecer, ele avisa por e-mail; reative em **Actions → Ranking keep-alive → Enable workflow**.
  - Se o projeto for pausado mesmo assim, os dados não se perdem na hora. Reative pelo painel do Supabase (**Restore project**) dentro do prazo indicado nele.
- **Sem pausa:** o plano Pro nunca pausa o projeto.

## Segurança e moderação

- A tabela `ranking_calabouco` fica fechada para a chave pública. O jogo só chama as funções `enviar_recorde`, `ranking_top`, `ranking_posicao` e `ranking_remover`, e o servidor valida modo, apelido e pontuação.
- A pontuação é calculada no navegador, então não há como impedir toda trapaça. O servidor recusa pontuações acima de um teto por onda (`ranking_limite`), bem acima do que uma partida real alcança. O teste `qa/ranking_v1_unit.cjs` confere que esse teto cobre o máximo teórico das regras atuais. **Se a pontuação do calabouço mudar, revise o teto no SQL e em `RankingV1.limite`.**
- Envios do mesmo jogador com menos de 5 segundos de intervalo são recusados.
- Para esconder ou apagar alguém, use o **Table Editor** ou o SQL:

```sql
update ranking_calabouco set oculto = true where name = 'Apelido';
delete from ranking_calabouco where name = 'Apelido';
```

## Testes

```sh
node qa/ranking_v1_unit.cjs
node qa/ranking_v1_browser.cjs
```

O teste de navegador usa o jogo gerado e um servidor simulado; nada sai da máquina.
