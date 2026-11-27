-- TORII & HUTUKARA — Ranking online do Calabouço Infinito (Fenda das Ressonâncias)
--
-- Rode este arquivo uma vez no SQL Editor do projeto Supabase. Ele pode ser rodado
-- de novo sem perder dados (create ... if not exists / create or replace).
--
-- Modelo: uma linha por pessoa e por modo (solo/coop), guardando só a maior
-- pontuação. A tabela não é acessível diretamente pela chave pública; o jogo usa
-- apenas as quatro funções abaixo, que validam os dados no servidor.
--
-- O player_id é um UUID aleatório gerado no aparelho e funciona como senha da
-- pessoa: nunca é devolvido pelas funções de leitura.
--
-- Moderação (pelo Table Editor ou SQL):
--   update ranking_calabouco set oculto = true where name = 'Apelido';   -- esconde
--   delete from ranking_calabouco where name = 'Apelido';                -- apaga

create table if not exists public.ranking_calabouco (
  player_id  uuid        not null,
  mode       text        not null check (mode in ('solo', 'coop')),
  name       text        not null check (char_length(name) between 2 and 16),
  score      bigint      not null check (score > 0),
  wave       integer     not null check (wave >= 0),
  build      text,
  oculto     boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (player_id, mode)
);

create index if not exists ranking_calabouco_ordem
  on public.ranking_calabouco (mode, score desc, wave desc, updated_at asc)
  where not oculto;

-- Sem políticas: com RLS ligado, a chave pública não lê nem escreve a tabela.
alter table public.ranking_calabouco enable row level security;
revoke all on public.ranking_calabouco from anon, authenticated;

-- Teto generoso de pontos por onda concluída. Uma partida real fica bem abaixo;
-- o teto só barra valores impossíveis. Mantenha igual a RankingV1.limite no jogo.
create or replace function public.ranking_limite(p_wave integer)
returns bigint language sql immutable as $$
  select 5000::bigint + 25000::bigint * (p_wave + 1) + 1000::bigint * (p_wave + 1) * (p_wave + 1);
$$;

-- Envia um recorde. Guarda a maior pontuação; o apelido acompanha o envio mais
-- recente. Devolve 'ok', 'mantido' (já havia pontuação maior), 'aguarde' (envios
-- seguidos demais) ou 'invalido'.
create or replace function public.enviar_recorde(
  p_id uuid, p_mode text, p_name text, p_score bigint, p_wave integer, p_build text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_atual public.ranking_calabouco%rowtype;
begin
  if p_id is null or p_mode not in ('solo', 'coop')
     or v_name !~ '^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _.\-]{2,16}$'
     or p_score is null or p_score <= 0 or p_wave is null or p_wave < 0 or p_wave > 100000
     or p_score > public.ranking_limite(p_wave) then
    return 'invalido';
  end if;

  select * into v_atual from public.ranking_calabouco where player_id = p_id and mode = p_mode for update;
  if found then
    if v_atual.updated_at > now() - interval '5 seconds' then
      return 'aguarde';
    end if;
    update public.ranking_calabouco
       set name = v_name,
           score = greatest(score, p_score),
           wave = case when p_score > score then p_wave else wave end,
           build = case when p_score > score then left(p_build, 32) else build end,
           updated_at = now()
     where player_id = p_id and mode = p_mode;
    return case when p_score > v_atual.score then 'ok' else 'mantido' end;
  end if;

  insert into public.ranking_calabouco (player_id, mode, name, score, wave, build)
  values (p_id, p_mode, v_name, p_score, p_wave, left(p_build, 32));
  return 'ok';
end;
$$;

-- Os melhores de um modo, sem o player_id.
create or replace function public.ranking_top(p_mode text, p_limit integer default 20)
returns table (posicao bigint, name text, score bigint, wave integer, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by r.score desc, r.wave desc, r.updated_at asc) as posicao,
         r.name, r.score, r.wave, r.updated_at
    from public.ranking_calabouco r
   where r.mode = p_mode and not r.oculto
   order by r.score desc, r.wave desc, r.updated_at asc
   limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

-- A posição da própria pessoa num modo (nenhuma linha se ela ainda não enviou).
create or replace function public.ranking_posicao(p_id uuid, p_mode text)
returns table (posicao bigint, score bigint, wave integer, total bigint)
language sql stable security definer set search_path = public as $$
  select (select count(*) + 1 from public.ranking_calabouco o
           where o.mode = me.mode and not o.oculto
             and (o.score > me.score
                  or (o.score = me.score and o.wave > me.wave)
                  or (o.score = me.score and o.wave = me.wave and o.updated_at < me.updated_at))) as posicao,
         me.score, me.wave,
         (select count(*) from public.ranking_calabouco t where t.mode = me.mode and not t.oculto) as total
    from public.ranking_calabouco me
   where me.player_id = p_id and me.mode = p_mode and not me.oculto;
$$;

-- Quem sai do ranking apaga as próprias linhas.
create or replace function public.ranking_remover(p_id uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare v_total integer;
begin
  delete from public.ranking_calabouco where player_id = p_id;
  get diagnostics v_total = row_count;
  return v_total;
end;
$$;

revoke all on function public.enviar_recorde(uuid, text, text, bigint, integer, text) from public;
revoke all on function public.ranking_top(text, integer) from public;
revoke all on function public.ranking_posicao(uuid, text) from public;
revoke all on function public.ranking_remover(uuid) from public;
grant execute on function public.enviar_recorde(uuid, text, text, bigint, integer, text) to anon, authenticated;
grant execute on function public.ranking_top(text, integer) to anon, authenticated;
grant execute on function public.ranking_posicao(uuid, text) to anon, authenticated;
grant execute on function public.ranking_remover(uuid) to anon, authenticated;
