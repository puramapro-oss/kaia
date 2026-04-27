-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  KAÏA — P7 Migration : Contests + Donations + Shop + Missions            ║
-- ║  Idempotente · ré-applicable sans risque                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

set search_path = kaia, public;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Donations — colonnes pour reçu fiscal + email donneur
-- ───────────────────────────────────────────────────────────────────────────
alter table kaia.donations add column if not exists donor_email text;
alter table kaia.donations add column if not exists donor_name text;
alter table kaia.donations add column if not exists receipt_pdf_url text;
alter table kaia.donations add column if not exists receipt_sent_at timestamptz;

-- Anti-doublon paiement Stripe (un payment_intent ne crée qu'un seul don)
create unique index if not exists donations_stripe_pi_uniq
  on kaia.donations(stripe_payment_intent)
  where stripe_payment_intent is not null;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Purchases — colonnes refund + idempotency
-- ───────────────────────────────────────────────────────────────────────────
alter table kaia.purchases add column if not exists refunded_at timestamptz;
alter table kaia.purchases add column if not exists stripe_payment_intent text;

-- Anti-doublon checkout (1 session = 1 ligne)
create unique index if not exists purchases_stripe_session_uniq
  on kaia.purchases(stripe_session_id)
  where stripe_session_id is not null;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Mission completions — anti-fraude (même proof_url + même mission)
-- ───────────────────────────────────────────────────────────────────────────
create unique index if not exists mission_completions_dedup_proof
  on kaia.mission_completions(mission_id, user_id, proof_url)
  where proof_url is not null;

-- Index pour le compteur "max_completions_per_user"
create index if not exists mission_completions_user_mission_idx
  on kaia.mission_completions(user_id, mission_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Contests — colonnes signature + métadonnées prizes (JSONB)
-- ───────────────────────────────────────────────────────────────────────────
alter table kaia.contests add column if not exists prizes jsonb not null default '[]'::jsonb;
alter table kaia.contests add column if not exists rules_url text;
alter table kaia.contests add column if not exists draw_seed text;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. RPC consume_contest_tickets
--    Vérifie l'éligibilité → insert atomique 1 ligne contest_entries
--    Source = 'practice' | 'subscription' | 'referral' | 'ritual' | 'shop' | 'donation'
-- ───────────────────────────────────────────────────────────────────────────
create or replace function kaia.consume_contest_tickets(
  p_contest_id uuid,
  p_user_id uuid,
  p_tickets int,
  p_source text
)
returns table(entry_id uuid, total_tickets int, applied boolean, reason text)
language plpgsql
security definer
as $$
declare
  v_contest record;
  v_now timestamptz := now();
  v_existing int;
  v_new_id uuid;
begin
  -- Garde-fous
  if p_tickets is null or p_tickets <= 0 or p_tickets > 100 then
    return query select null::uuid, 0, false, 'invalid_tickets'::text;
    return;
  end if;
  if p_source is null or p_source not in ('practice','subscription','referral','ritual','shop','donation','manual') then
    return query select null::uuid, 0, false, 'invalid_source'::text;
    return;
  end if;

  -- Concours actif ?
  select * into v_contest from kaia.contests where id = p_contest_id;
  if not found then
    return query select null::uuid, 0, false, 'contest_not_found'::text;
    return;
  end if;
  if v_contest.status not in ('upcoming', 'live') then
    return query select null::uuid, 0, false, 'contest_closed'::text;
    return;
  end if;
  if v_contest.starts_at > v_now or v_contest.ends_at < v_now then
    return query select null::uuid, 0, false, 'contest_window_invalid'::text;
    return;
  end if;

  -- Vérif quota (max 50 tickets/user/contest pour limiter l'abus)
  select coalesce(sum(tickets), 0) into v_existing
  from kaia.contest_entries
  where contest_id = p_contest_id and user_id = p_user_id;
  if v_existing + p_tickets > 50 then
    return query select null::uuid, v_existing, false, 'user_quota_exceeded'::text;
    return;
  end if;

  -- Insert
  insert into kaia.contest_entries (contest_id, user_id, tickets, source)
  values (p_contest_id, p_user_id, p_tickets, p_source)
  returning id into v_new_id;

  return query select v_new_id, (v_existing + p_tickets), true, 'ok'::text;
end;
$$;

revoke all on function kaia.consume_contest_tickets(uuid, uuid, int, text) from public;
grant execute on function kaia.consume_contest_tickets(uuid, uuid, int, text) to authenticated, service_role;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. RPC record_contest_winners — atomique + audit
--    Marque le concours 'completed', stocke winners + signature crypto
-- ───────────────────────────────────────────────────────────────────────────
create or replace function kaia.record_contest_winners(
  p_contest_id uuid,
  p_winners jsonb,
  p_signature text,
  p_ots text
)
returns table(applied boolean, reason text)
language plpgsql
security definer
as $$
declare
  v_status text;
begin
  if p_winners is null or jsonb_typeof(p_winners) != 'array' then
    return query select false, 'invalid_winners'::text;
    return;
  end if;
  if p_signature is null or length(p_signature) < 32 then
    return query select false, 'invalid_signature'::text;
    return;
  end if;

  select status into v_status from kaia.contests where id = p_contest_id for update;
  if not found then
    return query select false, 'contest_not_found'::text;
    return;
  end if;
  if v_status = 'completed' then
    return query select false, 'already_drawn'::text;
    return;
  end if;

  update kaia.contests
  set status = 'completed',
      winners = p_winners,
      proof_signature = p_signature,
      proof_timestamp_ots = nullif(p_ots, '')
  where id = p_contest_id;

  return query select true, 'ok'::text;
end;
$$;

revoke all on function kaia.record_contest_winners(uuid, jsonb, text, text) from public;
grant execute on function kaia.record_contest_winners(uuid, jsonb, text, text) to service_role;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. RLS — confirmation (idempotent ; déjà OK en 0001 mais on resécurise)
-- ───────────────────────────────────────────────────────────────────────────
alter table kaia.contest_entries enable row level security;

drop policy if exists "contest_entries_self_read" on kaia.contest_entries;
create policy "contest_entries_self_read" on kaia.contest_entries
  for select using (auth.uid() = user_id);

drop policy if exists "contest_entries_admin_all" on kaia.contest_entries;
create policy "contest_entries_admin_all" on kaia.contest_entries
  for all using (kaia.is_admin(auth.uid()));

-- Donations : insert via webhook service_role uniquement, lecture self
alter table kaia.donations enable row level security;

drop policy if exists "donations_self_read" on kaia.donations;
create policy "donations_self_read" on kaia.donations
  for select using (auth.uid() = user_id);

-- Purchases : lecture self, write service_role
alter table kaia.purchases enable row level security;

drop policy if exists "purchases_self_read" on kaia.purchases;
create policy "purchases_self_read" on kaia.purchases
  for select using (auth.uid() = user_id);

-- Mission completions : lecture self + insert self, admin all
alter table kaia.mission_completions enable row level security;

drop policy if exists "mission_completions_self_insert" on kaia.mission_completions;
create policy "mission_completions_self_insert" on kaia.mission_completions
  for insert with check (auth.uid() = user_id);
