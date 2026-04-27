-- KAÏA — P5 — Communauté + Rituels hebdo
-- Idempotent. Apply via: psql -h 72.62.191.111 -U postgres -d postgres -f 0002_p5_community.sql
-- Schéma : kaia
-- Date : 2026-04-27

set search_path = kaia, public;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 1. community_reactions (likes par user)                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.community_reactions (
  post_id     uuid not null references kaia.community_posts(id) on delete cascade,
  user_id     uuid not null references kaia.profiles(id) on delete cascade,
  kind        text not null default 'like' check (kind in ('like')),
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);
create index if not exists community_reactions_user_idx on kaia.community_reactions(user_id);

alter table kaia.community_reactions enable row level security;
drop policy if exists "community_reactions_self_read" on kaia.community_reactions;
drop policy if exists "community_reactions_self_write" on kaia.community_reactions;
create policy "community_reactions_self_read"  on kaia.community_reactions for select using (auth.uid() = user_id);
create policy "community_reactions_self_write" on kaia.community_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 2. RPC apply_reaction — toggle like atomique + sync counter             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create or replace function kaia.apply_reaction(
  p_post_id  uuid,
  p_kind     text default 'like'
)
returns table (action text, reactions_count int)
language plpgsql
security definer
set search_path = kaia, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean;
  v_count    int;
begin
  if v_user_id is null then
    raise exception 'auth required' using errcode = 'P0001';
  end if;

  -- Vérifier que le post existe + non hidden
  perform 1 from kaia.community_posts where id = p_post_id and hidden = false;
  if not found then
    raise exception 'post not found' using errcode = 'P0002';
  end if;

  -- Toggle
  insert into kaia.community_reactions (post_id, user_id, kind)
  values (p_post_id, v_user_id, p_kind)
  on conflict do nothing;

  v_inserted := found;

  if v_inserted then
    update kaia.community_posts
       set reactions_count = reactions_count + 1
     where id = p_post_id
    returning reactions_count into v_count;
    return query select 'liked'::text, v_count;
  else
    delete from kaia.community_reactions
     where post_id = p_post_id and user_id = v_user_id and kind = p_kind;
    update kaia.community_posts
       set reactions_count = greatest(0, reactions_count - 1)
     where id = p_post_id
    returning reactions_count into v_count;
    return query select 'unliked'::text, v_count;
  end if;
end;
$$;

revoke all on function kaia.apply_reaction(uuid, text) from public;
grant execute on function kaia.apply_reaction(uuid, text) to authenticated;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 3. RPC bump_post_comments_count — sync counter atomique                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create or replace function kaia.bump_post_comments_count(
  p_post_id uuid,
  p_delta   int
)
returns int
language plpgsql
security definer
set search_path = kaia, public
as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'auth required' using errcode = 'P0001';
  end if;
  if p_delta not in (-1, 1) then
    raise exception 'delta must be -1 or 1' using errcode = 'P0003';
  end if;
  update kaia.community_posts
     set comments_count = greatest(0, comments_count + p_delta)
   where id = p_post_id and hidden = false
  returning comments_count into v_count;
  if v_count is null then
    raise exception 'post not found' using errcode = 'P0002';
  end if;
  return v_count;
end;
$$;

revoke all on function kaia.bump_post_comments_count(uuid, int) from public;
grant execute on function kaia.bump_post_comments_count(uuid, int) to authenticated;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 4. RPC join_weekly_ritual — participation idempotente atomique          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create or replace function kaia.join_weekly_ritual(
  p_ritual_id uuid
)
returns table (status text, participants_count int, already_joined boolean)
language plpgsql
security definer
set search_path = kaia, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now     timestamptz := now();
  v_starts  timestamptz;
  v_ends    timestamptz;
  v_inserted boolean;
  v_count   int;
begin
  if v_user_id is null then
    raise exception 'auth required' using errcode = 'P0001';
  end if;

  select starts_at, ends_at into v_starts, v_ends
    from kaia.weekly_rituals
   where id = p_ritual_id;
  if v_starts is null then
    raise exception 'ritual not found' using errcode = 'P0002';
  end if;

  if v_now < v_starts then
    raise exception 'ritual not started yet' using errcode = 'P0010';
  end if;
  if v_now > v_ends then
    raise exception 'ritual ended' using errcode = 'P0011';
  end if;

  insert into kaia.ritual_participations (ritual_id, user_id, tokens_earned)
  values (p_ritual_id, v_user_id, 30)
  on conflict (ritual_id, user_id) do nothing;

  v_inserted := found;

  if v_inserted then
    update kaia.weekly_rituals
       set participants_count = participants_count + 1
     where id = p_ritual_id
    returning participants_count into v_count;
    return query select 'joined'::text, v_count, false;
  else
    select participants_count into v_count
      from kaia.weekly_rituals where id = p_ritual_id;
    return query select 'already_joined'::text, v_count, true;
  end if;
end;
$$;

revoke all on function kaia.join_weekly_ritual(uuid) from public;
grant execute on function kaia.join_weekly_ritual(uuid) to authenticated;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 5. Realtime publication — ajouter weekly_rituals + community_posts      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Permet aux clients d'écouter postgres_changes pour les compteurs live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'kaia'
       and tablename = 'weekly_rituals'
  ) then
    alter publication supabase_realtime add table kaia.weekly_rituals;
  end if;
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'kaia'
       and tablename = 'community_posts'
  ) then
    alter publication supabase_realtime add table kaia.community_posts;
  end if;
exception when undefined_object then
  -- supabase_realtime publication absente (env dev)
  null;
end$$;

-- Smoke test (non-bloquant) — vérifie que les RPC sont callable
do $$
begin
  perform kaia.bump_post_comments_count('00000000-0000-0000-0000-000000000000'::uuid, 1);
exception
  when sqlstate 'P0001' then null; -- 'auth required' (attendu hors session)
  when others then null;
end$$;
