# Ranking online do calabouço

O ranking mostra a maior pontuação de cada pessoa no Calabouço Infinito (Fenda das Ressonâncias), separado em solo e co-op. Os dados ficam num projeto [Supabase](https://supabase.com) no plano gratuito.

## Para quem joga

- A participação é opcional. Na primeira vez em que abre o ranking, a pessoa escolhe entre **PARTICIPAR** (com um apelido) e **SÓ VER O RANKING**.
- Quem participa envia só o apelido e o recorde de cada modo, com a onda em que ele foi feito. Save, campanha e medidor de ritmo continuam só no aparelho.
- O jogo envia o recorde ao fim de cada expedição, ao continuar o jogo e quando a internet volta. Sem conexão, o recorde fica pendente e o jogo continua normalmente.
- Cada aparelho tem uma identidade própria, guardada no navegador (`torii_hutukara_ranking_v1`), separada do save. Exportar e importar o save não leva essa identidade. Um save importado só soma pontos à identidade do aparelho em que é jogado.
- **SAIR DO RANKING** apaga do servidor as linhas daquela pessoa.

O botão **RANKING ONLINE** aparece no resultado da expedição, no briefing do calabouço e na tela de fim de jornada. No menu de sistema, o botão é **RANKING DO CALABOUÇO**.

## Configurar o Supabase (uma vez)

1. Crie um projeto em supabase.com.
2. Em **SQL Editor**, cole e rode [`production/supabase/ranking_calabouco.sql`](../production/supabase/ranking_calabouco.sql). O arquivo pode ser rodado de novo depois de mudanças, sem perder dados.
3. Em **Project Settings → API** (ou **API Keys**), copie a **URL do projeto** e a chave **pública** (`anon` ou `publishable`).
   **Nunca** use a chave `service_role`/`secret`. O build se recusa a embutir essa chave no jogo.
4. Informe os dois valores ao build de uma destas formas:
   - em `game/source/chapter-03/ranking_config.json` (`url` e `chave`). A chave pública pode ficar no repositório;
   - ou nas variáveis do GitHub, em **Settings → Secrets and variables → Actions → Variables**: `TORII_RANKING_URL` e `TORII_RANKING_CHAVE`. O workflow *Publish playtest* usa essas variáveis, que têm prioridade sobre o JSON.
5. Gere o jogo de novo. Sem URL e chave, a tela do ranking avisa que ele ainda não está disponível.

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
