-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  KAÏA — P8 Migration : Admin lockdown + IA Help + Newsletter             ║
-- ║  Idempotente · ré-applicable sans risque                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

set search_path = kaia, public;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Admin credentials (PIN bcrypt + TOTP secret)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists kaia.admin_credentials (
  user_id         uuid primary key references kaia.profiles(id) on delete cascade,
  pin_hash        text not null,
  totp_secret     text,
  totp_enabled    boolean not null default false,
  recovery_codes  text[] not null default array[]::text[],
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger admin_credentials_updated_at
  before update on kaia.admin_credentials
  for each row execute function kaia.set_updated_at();

alter table kaia.admin_credentials enable row level security;
drop policy if exists "admin_credentials_self" on kaia.admin_credentials;
create policy "admin_credentials_self" on kaia.admin_credentials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Admin sessions (cookie signé HttpOnly stocké côté serveur)
--    Permet de révoquer sans casser le JWT principal.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists kaia.admin_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  token_hash      text unique not null,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '8 hours'),
  revoked_at      timestamptz
);
create index if not exists admin_sessions_user_idx on kaia.admin_sessions(user_id, expires_at);
create index if not exists admin_sessions_token_idx on kaia.admin_sessions(token_hash) where revoked_at is null;

alter table kaia.admin_sessions enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. AI help threads (regroupement messages /ai-help)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists kaia.ai_help_threads (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  title           text,
  scope_violations int not null default 0,
  distress_flag   boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists ai_help_threads_user_idx on kaia.ai_help_threads(user_id, created_at desc);

create trigger ai_help_threads_updated_at
  before update on kaia.ai_help_threads
  for each row execute function kaia.set_updated_at();

alter table kaia.ai_help_threads enable row level security;
drop policy if exists "ai_help_threads_self" on kaia.ai_help_threads;
create policy "ai_help_threads_self" on kaia.ai_help_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Lien thread_id → ai_help_messages existant
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='kaia' and table_name='ai_help_messages' and column_name='thread_id'
  ) then
    alter table kaia.ai_help_messages add column thread_id uuid references kaia.ai_help_threads(id) on delete cascade;
    create index if not exists ai_help_messages_thread_idx2 on kaia.ai_help_messages(thread_id, created_at);
  end if;
end$$;

alter table kaia.ai_help_messages enable row level security;
drop policy if exists "ai_help_messages_self" on kaia.ai_help_messages;
create policy "ai_help_messages_self" on kaia.ai_help_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Newsletter subscriptions
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists kaia.newsletter_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references kaia.profiles(id) on delete cascade,
  email           text not null,
  locale          text not null default 'fr',
  status          text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed', 'bounced')),
  unsubscribe_token text unique not null,
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz,
  last_sent_at    timestamptz,
  unique (email)
);
create index if not exists newsletter_subscriptions_status_idx on kaia.newsletter_subscriptions(status, locale);

alter table kaia.newsletter_subscriptions enable row level security;
drop policy if exists "newsletter_self_read" on kaia.newsletter_subscriptions;
drop policy if exists "newsletter_self_update" on kaia.newsletter_subscriptions;
create policy "newsletter_self_read" on kaia.newsletter_subscriptions
  for select using (auth.uid() = user_id);
create policy "newsletter_self_update" on kaia.newsletter_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists kaia.newsletter_sends (
  id              uuid primary key default gen_random_uuid(),
  campaign_slug   text not null,
  email           text not null,
  locale          text not null,
  resend_id       text,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  bounced_at      timestamptz,
  sent_at         timestamptz not null default now()
);
create index if not exists newsletter_sends_campaign_idx on kaia.newsletter_sends(campaign_slug, sent_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Helper RPC : log_admin_audit
-- ───────────────────────────────────────────────────────────────────────────
create or replace function kaia.log_admin_audit(
  p_admin_user_id uuid,
  p_action text,
  p_target_table text default null,
  p_target_id uuid default null,
  p_before jsonb default null,
  p_after jsonb default null,
  p_ip inet default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into kaia.admin_audit_log (admin_user_id, action, target_table, target_id, before_value, after_value, ip_address)
  values (p_admin_user_id, p_action, p_target_table, p_target_id, p_before, p_after, p_ip)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function kaia.log_admin_audit(uuid, text, text, uuid, jsonb, jsonb, inet) from public;
grant execute on function kaia.log_admin_audit(uuid, text, text, uuid, jsonb, jsonb, inet) to service_role;
