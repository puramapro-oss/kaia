-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ KAÏA V2 · Migration 0007 — P5: notifications + prefs + graines ledger     ║
-- ║ Generated 2026-06-18                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Notifications (file d'attente + log) ──────────────────────────────────────
create table if not exists kaia.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in (
                  'cycle_phase','aurora_daily','core_now','circle_match',
                  'karma_game','luna_daily','prime_milestone')),
  title         text not null,
  body          text not null,
  status        text not null default 'queued' check (status in ('queued','sent','failed')),
  scheduled_for timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_idx on kaia.notifications(user_id, created_at desc);
create index if not exists notifications_queued_idx on kaia.notifications(status) where status = 'queued';
alter table kaia.notifications enable row level security;
create policy "Users read own notifications" on kaia.notifications
  for select using (auth.uid() = user_id);
create policy "Service manages notifications" on kaia.notifications
  for all using (auth.role() = 'service_role');

-- ── Préférences de notification (opt-out granulaire par type) ──────────────────
create table if not exists kaia.notification_prefs (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  opted_out   text[] not null default '{}',
  push_token  text,
  updated_at  timestamptz not null default now()
);
alter table kaia.notification_prefs enable row level security;
create policy "Users manage own notif prefs" on kaia.notification_prefs
  for all using (auth.uid() = user_id);

-- ── Graines : grand livre des transactions ─────────────────────────────────────
create table if not exists kaia.graines_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  delta         int not null,
  reason        text not null,
  balance_after int not null,
  created_at    timestamptz not null default now()
);
create index if not exists graines_tx_user_idx on kaia.graines_transactions(user_id, created_at desc);
alter table kaia.graines_transactions enable row level security;
create policy "Users read own graines tx" on kaia.graines_transactions
  for select using (auth.uid() = user_id);
create policy "Service manages graines tx" on kaia.graines_transactions
  for all using (auth.role() = 'service_role');

-- ── Caregiver : 1 profil aidant par utilisatrice (requis pour upsert) ─────────
alter table kaia.caregiver_profiles
  add constraint caregiver_profiles_user_unique unique (user_id);
