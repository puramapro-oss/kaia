-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ KAÏA · Migration 0001 — Initial schema (P1 Foundation)                  ║
-- ║ Domain: kaia.purama.dev · Generated 2026-04-26                          ║
-- ║ Idempotent: re-runnable safely (CREATE IF NOT EXISTS where possible).   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ── Schema namespace ──────────────────────────────────────────────────────
create schema if not exists kaia;
grant usage on schema kaia to anon, authenticated, service_role;
alter default privileges in schema kaia grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema kaia grant select on tables to anon;

-- ── Helper: timestamp updater ─────────────────────────────────────────────
create or replace function kaia.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. profiles                                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  avatar_url      text,
  role            text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  plan            text not null default 'free' check (plan in ('free', 'active', 'canceled')),
  stripe_customer_id   text,
  stripe_subscription_id text,
  subscription_current_period_end timestamptz,
  trial_ends_at   timestamptz,
  -- KAÏA spécifique
  preferred_locale text not null default 'fr',
  daily_time_minutes int not null default 4,
  daily_questions int not null default 0,
  preferred_practices text[] default array[]::text[],
  preferred_goals text[] default array[]::text[],
  awakening_level int not null default 1,
  affirmations_seen int not null default 0,
  streak_days     int not null default 0,
  streak_last_at  date,
  xp              int not null default 0,
  level           int not null default 1,
  tutorial_completed boolean not null default false,
  onboarded_at    timestamptz,
  -- Multisensoriel toggles
  multisensorial_background_video boolean not null default true,
  multisensorial_haptics boolean not null default true,
  multisensorial_binaural boolean not null default false,
  multisensorial_cinematic boolean not null default true,
  -- Accessibilité toggles
  accessibility_high_contrast boolean not null default false,
  accessibility_dyslexia_font boolean not null default false,
  accessibility_audio_descriptions boolean not null default false,
  accessibility_reduced_motion boolean not null default false,
  accessibility_subtitles boolean not null default true,
  -- Wallet (€ + tokens)
  wallet_balance_eur numeric(10,2) not null default 0,
  wallet_iban     text,
  -- Referral
  referral_code   text unique,
  referred_by     uuid references kaia.profiles(id) on delete set null,
  -- Theme
  theme           text not null default 'dark' check (theme in ('dark', 'light', 'oled', 'auto')),
  notifs_enabled  boolean not null default true,
  -- Misc
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists profiles_email_idx on kaia.profiles(email);
create index if not exists profiles_stripe_customer_idx on kaia.profiles(stripe_customer_id);
create index if not exists profiles_referral_code_idx on kaia.profiles(referral_code);

drop trigger if exists profiles_set_updated_at on kaia.profiles;
create trigger profiles_set_updated_at before update on kaia.profiles
for each row execute function kaia.set_updated_at();

-- Auto-create profile + tokens on signup
create or replace function kaia.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = kaia, public as $$
declare
  v_email text;
  v_name  text;
  v_code  text;
begin
  v_email := lower(coalesce(new.email, ''));
  v_name  := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(v_email, '@', 1));
  v_code  := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into kaia.profiles (id, email, full_name, referral_code, role, plan)
  values (
    new.id,
    v_email,
    v_name,
    v_code,
    case when v_email in ('matiss.frasne@gmail.com', 'tissma@purama.dev') then 'super_admin' else 'user' end,
    case when v_email in ('matiss.frasne@gmail.com', 'tissma@purama.dev') then 'active' else 'free' end
  )
  on conflict (id) do nothing;

  insert into kaia.user_tokens (user_id, balance, lifetime_earned)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function kaia.handle_new_auth_user();

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. user_tokens + token_events                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.user_tokens (
  user_id         uuid primary key references kaia.profiles(id) on delete cascade,
  balance         int not null default 0 check (balance >= 0),
  lifetime_earned int not null default 0,
  lifetime_spent  int not null default 0,
  daily_earned    int not null default 0,
  daily_earned_at date,
  updated_at      timestamptz not null default now()
);
drop trigger if exists user_tokens_set_updated_at on kaia.user_tokens;
create trigger user_tokens_set_updated_at before update on kaia.user_tokens
for each row execute function kaia.set_updated_at();

create table if not exists kaia.token_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  delta           int not null,
  reason          text not null,
  metadata        jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  created_at      timestamptz not null default now()
);
create index if not exists token_events_user_idx on kaia.token_events(user_id, created_at desc);
create index if not exists token_events_reason_idx on kaia.token_events(reason);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. practices + daily_routines + practice_sessions                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.practices (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  category        text not null check (category in ('meditation', 'breathing', 'mantra', 'mudra', 'movement', 'learning', 'reprogramming')),
  title           text not null,
  duration_seconds int not null check (duration_seconds between 30 and 1800),
  intensity       text not null default 'gentle' check (intensity in ('gentle', 'medium', 'strong')),
  goal_tags       text[] not null default array[]::text[],
  contraindications text[] not null default array[]::text[],
  steps           jsonb not null default '[]'::jsonb,
  i18n            jsonb not null default '{}'::jsonb,
  audio_assets    jsonb not null default '{}'::jsonb,
  premium_only    boolean not null default false,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists practices_category_idx on kaia.practices(category);
create index if not exists practices_active_idx on kaia.practices(active) where active = true;

drop trigger if exists practices_set_updated_at on kaia.practices;
create trigger practices_set_updated_at before update on kaia.practices
for each row execute function kaia.set_updated_at();

create table if not exists kaia.daily_routines (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  routine_date    date not null default current_date,
  practices       jsonb not null default '[]'::jsonb,
  pulse_stress    int check (pulse_stress between 1 and 5),
  pulse_energy    int check (pulse_energy between 1 and 5),
  pulse_mood      int check (pulse_mood between 1 and 5),
  total_seconds   int not null default 0,
  generated_by_ai boolean not null default false,
  ai_model        text,
  created_at      timestamptz not null default now(),
  unique(user_id, routine_date)
);
create index if not exists daily_routines_user_date_idx on kaia.daily_routines(user_id, routine_date desc);

create table if not exists kaia.practice_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  practice_id     uuid references kaia.practices(id) on delete set null,
  routine_id      uuid references kaia.daily_routines(id) on delete set null,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  duration_seconds int not null default 0,
  pre_state       jsonb,
  post_state      jsonb,
  tokens_earned   int not null default 0,
  status          text not null default 'started' check (status in ('started', 'completed', 'abandoned'))
);
create index if not exists practice_sessions_user_idx on kaia.practice_sessions(user_id, started_at desc);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. Impact (personal + collective + map)                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.user_impact (
  user_id         uuid primary key references kaia.profiles(id) on delete cascade,
  trees_planted   int not null default 0,
  waste_collected_kg numeric(10,2) not null default 0,
  people_helped   int not null default 0,
  water_saved_l   numeric(10,2) not null default 0,
  euros_redistributed numeric(10,2) not null default 0,
  total_co2_avoided_kg numeric(10,2) not null default 0,
  updated_at      timestamptz not null default now()
);
drop trigger if exists user_impact_set_updated_at on kaia.user_impact;
create trigger user_impact_set_updated_at before update on kaia.user_impact
for each row execute function kaia.set_updated_at();

create table if not exists kaia.global_impact (
  id              int primary key default 1,
  trees_planted   int not null default 0,
  waste_collected_kg numeric(12,2) not null default 0,
  people_helped   int not null default 0,
  water_saved_l   numeric(12,2) not null default 0,
  euros_redistributed numeric(12,2) not null default 0,
  routines_completed int not null default 0,
  active_users_30d int not null default 0,
  computed_at     timestamptz not null default now(),
  constraint global_impact_singleton check (id = 1)
);
insert into kaia.global_impact (id) values (1) on conflict (id) do nothing;

create table if not exists kaia.impact_locations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references kaia.profiles(id) on delete set null,
  kind            text not null check (kind in ('tree', 'waste', 'help', 'water', 'donation', 'mission')),
  amount          numeric(10,2) not null default 1,
  lat             numeric(9,6) not null,
  lng             numeric(9,6) not null,
  country_code    text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists impact_locations_kind_idx on kaia.impact_locations(kind);
create index if not exists impact_locations_recent_idx on kaia.impact_locations(created_at desc);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. Community + groups                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.community_posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  content         text not null check (length(content) <= 280),
  media_url       text,
  media_kind      text check (media_kind in ('image', 'video')),
  reactions_count int not null default 0,
  comments_count  int not null default 0,
  ai_moderation_status text not null default 'pending' check (ai_moderation_status in ('pending', 'approved', 'flagged', 'rejected')),
  ai_moderation_reasons text[] not null default array[]::text[],
  flagged_by_user_count int not null default 0,
  hidden          boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists community_posts_recent_idx on kaia.community_posts(created_at desc) where hidden = false;
create index if not exists community_posts_user_idx on kaia.community_posts(user_id);

create table if not exists kaia.community_comments (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references kaia.community_posts(id) on delete cascade,
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  content         text not null check (length(content) <= 280),
  ai_moderation_status text not null default 'pending',
  hidden          boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists community_comments_post_idx on kaia.community_comments(post_id, created_at);

create table if not exists kaia.practice_groups (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  description     text,
  capacity        int not null default 12,
  meet_url        text,
  schedule_cron   text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists kaia.group_memberships (
  group_id        uuid not null references kaia.practice_groups(id) on delete cascade,
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  role            text not null default 'member' check (role in ('member', 'captain')),
  joined_at       timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. Weekly rituals                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.weekly_rituals (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  theme           text not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  i18n            jsonb not null default '{}'::jsonb,
  audio_assets    jsonb not null default '{}'::jsonb,
  participants_count int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists weekly_rituals_active_idx on kaia.weekly_rituals(starts_at, ends_at);

create table if not exists kaia.ritual_participations (
  id              uuid primary key default gen_random_uuid(),
  ritual_id       uuid not null references kaia.weekly_rituals(id) on delete cascade,
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  tokens_earned   int not null default 0,
  unique (ritual_id, user_id)
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  7. Contests + tickets                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.contests (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  kind            text not null check (kind in ('weekly', 'monthly', 'yearly', 'special')),
  title           text not null,
  description     text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  draw_at         timestamptz not null,
  pool_amount     numeric(12,2) not null default 0,
  status          text not null default 'upcoming' check (status in ('upcoming', 'live', 'drawing', 'completed', 'canceled')),
  winners         jsonb not null default '[]'::jsonb,
  proof_signature text,
  proof_timestamp_ots text,
  created_at      timestamptz not null default now()
);
create index if not exists contests_status_idx on kaia.contests(status, starts_at);

create table if not exists kaia.contest_entries (
  id              uuid primary key default gen_random_uuid(),
  contest_id      uuid not null references kaia.contests(id) on delete cascade,
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  tickets         int not null default 1 check (tickets > 0),
  source          text not null,
  created_at      timestamptz not null default now()
);
create index if not exists contest_entries_unique_idx on kaia.contest_entries(contest_id, user_id);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  8. Influencer program                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.influencer_applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  socials         jsonb not null default '{}'::jsonb,
  audience_size   int,
  pitch           text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at     timestamptz,
  reviewed_by     uuid references kaia.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique(user_id)
);

create table if not exists kaia.influencer_links (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  code            text unique not null,
  campaign        text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists influencer_links_code_idx on kaia.influencer_links(code);

create table if not exists kaia.influencer_conversions (
  id              uuid primary key default gen_random_uuid(),
  link_id         uuid not null references kaia.influencer_links(id) on delete cascade,
  referred_user_id uuid references kaia.profiles(id) on delete set null,
  stripe_invoice_id text,
  amount_cents    int not null,
  commission_cents int not null,
  kind            text not null default 'first_payment' check (kind in ('first_payment', 'recurring')),
  status          text not null default 'pending' check (status in ('pending', 'paid', 'reversed')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists influencer_conversions_link_idx on kaia.influencer_conversions(link_id, created_at desc);

create table if not exists kaia.influencer_payouts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  amount_cents    int not null,
  status          text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  iban            text,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  9. User referrals                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references kaia.profiles(id) on delete cascade,
  referred_user_id uuid not null references kaia.profiles(id) on delete cascade,
  status          text not null default 'pending' check (status in ('pending', 'active', 'expired')),
  first_payment_at timestamptz,
  total_commission_cents int not null default 0,
  created_at      timestamptz not null default now(),
  unique (referred_user_id)
);
create index if not exists referrals_referrer_idx on kaia.referrals(referrer_user_id);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 10. Donations + shop + missions                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.donations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references kaia.profiles(id) on delete set null,
  cause           text not null,
  amount_cents    int not null check (amount_cents > 0),
  stripe_payment_intent text,
  status          text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  receipt_url     text,
  tokens_credited int not null default 0,
  tickets_credited int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists donations_user_idx on kaia.donations(user_id, created_at desc);

create table if not exists kaia.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  kind            text not null check (kind in ('digital', 'physical')),
  title           text not null,
  description     text,
  price_cents     int not null check (price_cents >= 0),
  stripe_price_id text,
  inventory       int,
  active          boolean not null default true,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create table if not exists kaia.purchases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  product_id      uuid not null references kaia.products(id) on delete restrict,
  amount_cents    int not null,
  cashback_tokens int not null default 0,
  tickets_credited int not null default 0,
  stripe_session_id text,
  status          text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'refunded')),
  created_at      timestamptz not null default now()
);
create index if not exists purchases_user_idx on kaia.purchases(user_id, created_at desc);

create table if not exists kaia.missions (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  kind            text not null check (kind in ('solo', 'humanitarian', 'marketing', 'collaborative')),
  title           text not null,
  description     text,
  reward_tokens   int not null default 0,
  reward_cents    int not null default 0,
  reward_funder_kind text not null default 'kaia' check (reward_funder_kind in ('kaia', 'partner', 'sponsor')),
  proof_kind      text not null check (proof_kind in ('photo', 'gps', 'qr', 'api', 'ai')),
  max_completions int,
  active          boolean not null default true,
  i18n            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create table if not exists kaia.mission_completions (
  id              uuid primary key default gen_random_uuid(),
  mission_id      uuid not null references kaia.missions(id) on delete cascade,
  user_id         uuid not null references kaia.profiles(id) on delete cascade,
  proof_url       text,
  proof_gps       jsonb,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ai_confidence   numeric(3,2),
  reviewed_by     uuid references kaia.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  reward_paid_at  timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists mission_completions_user_idx on kaia.mission_completions(user_id, created_at desc);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 11. User-served ads (sponsors éthiques)                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.user_ads (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  body            text,
  cta_label       text,
  cta_url         text not null,
  start_at        timestamptz,
  end_at          timestamptz,
  audience        jsonb not null default '{}'::jsonb,
  served_count    int not null default 0,
  click_count     int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 12. AI help messages (chatbot SAV + Q&A)                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.ai_help_messages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references kaia.profiles(id) on delete set null,
  thread_id       uuid not null,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  redacted        boolean not null default false,
  safety_flags    text[] not null default array[]::text[],
  created_at      timestamptz not null default now()
);
create index if not exists ai_help_messages_thread_idx on kaia.ai_help_messages(thread_id, created_at);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 13. Admin audit log                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create table if not exists kaia.admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  admin_user_id   uuid not null references kaia.profiles(id) on delete restrict,
  action          text not null,
  target_kind     text,
  target_id       uuid,
  payload         jsonb not null default '{}'::jsonb,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);
create index if not exists admin_audit_admin_idx on kaia.admin_audit_log(admin_user_id, created_at desc);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ RLS — Row Level Security policies                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Helper: is admin
create or replace function kaia.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists(select 1 from kaia.profiles p where p.id = uid and p.role in ('admin', 'super_admin'));
$$;

-- profiles
alter table kaia.profiles enable row level security;
drop policy if exists "profiles_self_read" on kaia.profiles;
drop policy if exists "profiles_self_update" on kaia.profiles;
drop policy if exists "profiles_admin_all" on kaia.profiles;
create policy "profiles_self_read" on kaia.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on kaia.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_all" on kaia.profiles for all using (kaia.is_admin(auth.uid()));

-- user_tokens
alter table kaia.user_tokens enable row level security;
drop policy if exists "user_tokens_self_read" on kaia.user_tokens;
create policy "user_tokens_self_read" on kaia.user_tokens for select using (auth.uid() = user_id);

-- token_events (read-only for users, writes service-role)
alter table kaia.token_events enable row level security;
drop policy if exists "token_events_self_read" on kaia.token_events;
create policy "token_events_self_read" on kaia.token_events for select using (auth.uid() = user_id);

-- practices (public read, admin write)
alter table kaia.practices enable row level security;
drop policy if exists "practices_public_read" on kaia.practices;
drop policy if exists "practices_admin_write" on kaia.practices;
create policy "practices_public_read" on kaia.practices for select using (active = true);
create policy "practices_admin_write" on kaia.practices for all using (kaia.is_admin(auth.uid())) with check (kaia.is_admin(auth.uid()));

-- daily_routines + practice_sessions (self only)
alter table kaia.daily_routines enable row level security;
drop policy if exists "daily_routines_self" on kaia.daily_routines;
create policy "daily_routines_self" on kaia.daily_routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table kaia.practice_sessions enable row level security;
drop policy if exists "practice_sessions_self" on kaia.practice_sessions;
create policy "practice_sessions_self" on kaia.practice_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- impact: self read self impact, public aggregates
alter table kaia.user_impact enable row level security;
drop policy if exists "user_impact_self" on kaia.user_impact;
create policy "user_impact_self" on kaia.user_impact for select using (auth.uid() = user_id);

alter table kaia.global_impact enable row level security;
drop policy if exists "global_impact_public_read" on kaia.global_impact;
create policy "global_impact_public_read" on kaia.global_impact for select using (true);

alter table kaia.impact_locations enable row level security;
drop policy if exists "impact_locations_public_read" on kaia.impact_locations;
drop policy if exists "impact_locations_self_insert" on kaia.impact_locations;
create policy "impact_locations_public_read" on kaia.impact_locations for select using (true);
create policy "impact_locations_self_insert" on kaia.impact_locations for insert with check (auth.uid() = user_id);

-- community
alter table kaia.community_posts enable row level security;
drop policy if exists "community_posts_public_read" on kaia.community_posts;
drop policy if exists "community_posts_self_insert" on kaia.community_posts;
drop policy if exists "community_posts_self_update" on kaia.community_posts;
drop policy if exists "community_posts_admin_all" on kaia.community_posts;
create policy "community_posts_public_read" on kaia.community_posts for select using (hidden = false);
create policy "community_posts_self_insert" on kaia.community_posts for insert with check (auth.uid() = user_id);
create policy "community_posts_self_update" on kaia.community_posts for update using (auth.uid() = user_id);
create policy "community_posts_admin_all" on kaia.community_posts for all using (kaia.is_admin(auth.uid()));

alter table kaia.community_comments enable row level security;
drop policy if exists "community_comments_public_read" on kaia.community_comments;
drop policy if exists "community_comments_self_insert" on kaia.community_comments;
create policy "community_comments_public_read" on kaia.community_comments for select using (hidden = false);
create policy "community_comments_self_insert" on kaia.community_comments for insert with check (auth.uid() = user_id);

-- groups
alter table kaia.practice_groups enable row level security;
drop policy if exists "practice_groups_public_read" on kaia.practice_groups;
create policy "practice_groups_public_read" on kaia.practice_groups for select using (active = true);

alter table kaia.group_memberships enable row level security;
drop policy if exists "group_memberships_self" on kaia.group_memberships;
create policy "group_memberships_self" on kaia.group_memberships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- weekly rituals
alter table kaia.weekly_rituals enable row level security;
drop policy if exists "weekly_rituals_public_read" on kaia.weekly_rituals;
create policy "weekly_rituals_public_read" on kaia.weekly_rituals for select using (true);

alter table kaia.ritual_participations enable row level security;
drop policy if exists "ritual_participations_self" on kaia.ritual_participations;
create policy "ritual_participations_self" on kaia.ritual_participations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- contests + entries
alter table kaia.contests enable row level security;
drop policy if exists "contests_public_read" on kaia.contests;
create policy "contests_public_read" on kaia.contests for select using (true);

alter table kaia.contest_entries enable row level security;
drop policy if exists "contest_entries_self" on kaia.contest_entries;
create policy "contest_entries_self" on kaia.contest_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- influencer
alter table kaia.influencer_applications enable row level security;
drop policy if exists "influencer_applications_self" on kaia.influencer_applications;
drop policy if exists "influencer_applications_admin" on kaia.influencer_applications;
create policy "influencer_applications_self" on kaia.influencer_applications for select using (auth.uid() = user_id);
create policy "influencer_applications_admin" on kaia.influencer_applications for all using (kaia.is_admin(auth.uid()));

alter table kaia.influencer_links enable row level security;
drop policy if exists "influencer_links_public_read" on kaia.influencer_links;
drop policy if exists "influencer_links_self_write" on kaia.influencer_links;
create policy "influencer_links_public_read" on kaia.influencer_links for select using (active = true);
create policy "influencer_links_self_write" on kaia.influencer_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table kaia.influencer_conversions enable row level security;
drop policy if exists "influencer_conversions_self_read" on kaia.influencer_conversions;
create policy "influencer_conversions_self_read" on kaia.influencer_conversions for select using (
  exists(select 1 from kaia.influencer_links l where l.id = link_id and l.user_id = auth.uid())
);

alter table kaia.influencer_payouts enable row level security;
drop policy if exists "influencer_payouts_self_read" on kaia.influencer_payouts;
create policy "influencer_payouts_self_read" on kaia.influencer_payouts for select using (auth.uid() = user_id);

-- referrals
alter table kaia.referrals enable row level security;
drop policy if exists "referrals_self_read" on kaia.referrals;
create policy "referrals_self_read" on kaia.referrals for select using (auth.uid() in (referrer_user_id, referred_user_id));

-- donations
alter table kaia.donations enable row level security;
drop policy if exists "donations_self_read" on kaia.donations;
drop policy if exists "donations_self_insert" on kaia.donations;
create policy "donations_self_read" on kaia.donations for select using (auth.uid() = user_id);
create policy "donations_self_insert" on kaia.donations for insert with check (auth.uid() = user_id);

-- shop
alter table kaia.products enable row level security;
drop policy if exists "products_public_read" on kaia.products;
create policy "products_public_read" on kaia.products for select using (active = true);

alter table kaia.purchases enable row level security;
drop policy if exists "purchases_self" on kaia.purchases;
create policy "purchases_self" on kaia.purchases for select using (auth.uid() = user_id);

-- missions
alter table kaia.missions enable row level security;
drop policy if exists "missions_public_read" on kaia.missions;
create policy "missions_public_read" on kaia.missions for select using (active = true);

alter table kaia.mission_completions enable row level security;
drop policy if exists "mission_completions_self" on kaia.mission_completions;
drop policy if exists "mission_completions_admin" on kaia.mission_completions;
create policy "mission_completions_self" on kaia.mission_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mission_completions_admin" on kaia.mission_completions for all using (kaia.is_admin(auth.uid()));

-- user_ads (public read)
alter table kaia.user_ads enable row level security;
drop policy if exists "user_ads_public_read" on kaia.user_ads;
create policy "user_ads_public_read" on kaia.user_ads for select using (active = true);

-- ai_help_messages (self read)
alter table kaia.ai_help_messages enable row level security;
drop policy if exists "ai_help_messages_self" on kaia.ai_help_messages;
create policy "ai_help_messages_self" on kaia.ai_help_messages for select using (auth.uid() = user_id);

-- admin_audit_log (admin only)
alter table kaia.admin_audit_log enable row level security;
drop policy if exists "admin_audit_log_admin" on kaia.admin_audit_log;
create policy "admin_audit_log_admin" on kaia.admin_audit_log for all using (kaia.is_admin(auth.uid()));

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ PostgREST exposure — `kaia` schema must be in PGRST_DB_SCHEMAS env var  ║
-- ║ (configured in /opt/supabase/docker/.env on the VPS).                    ║
-- ║ JS clients use `db: { schema: 'kaia' }` so `from('profiles')` resolves   ║
-- ║ to `kaia.profiles` automatically — no public-schema views needed.       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Token earn helper (atomic) — called by API route                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
create or replace function kaia.apply_token_event(
  p_user_id uuid,
  p_delta int,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb,
  p_idempotency_key text default null,
  p_daily_cap int default 200
)
returns table(new_balance int, applied boolean, reason text) language plpgsql security definer as $$
declare
  v_today date := current_date;
  v_daily_earned int;
begin
  -- idempotency
  if p_idempotency_key is not null then
    perform 1 from kaia.token_events where idempotency_key = p_idempotency_key;
    if found then
      return query select t.balance, false, 'idempotent_replay'::text from kaia.user_tokens t where t.user_id = p_user_id;
      return;
    end if;
  end if;

  insert into kaia.user_tokens (user_id, balance, lifetime_earned, lifetime_spent, daily_earned, daily_earned_at)
  values (p_user_id, 0, 0, 0, 0, v_today)
  on conflict (user_id) do nothing;

  if p_delta > 0 then
    select case when daily_earned_at = v_today then daily_earned else 0 end
      into v_daily_earned from kaia.user_tokens where user_id = p_user_id for update;
    if v_daily_earned + p_delta > p_daily_cap then
      return query select t.balance, false, 'daily_cap_reached'::text from kaia.user_tokens t where t.user_id = p_user_id;
      return;
    end if;
  end if;

  update kaia.user_tokens set
    balance = greatest(0, balance + p_delta),
    lifetime_earned = lifetime_earned + greatest(0, p_delta),
    lifetime_spent  = lifetime_spent  + greatest(0, -p_delta),
    daily_earned    = case when daily_earned_at = v_today then daily_earned + greatest(0, p_delta) else greatest(0, p_delta) end,
    daily_earned_at = v_today,
    updated_at      = now()
  where user_id = p_user_id;

  insert into kaia.token_events (user_id, delta, reason, metadata, idempotency_key)
  values (p_user_id, p_delta, p_reason, p_metadata, p_idempotency_key);

  return query select t.balance, true, 'ok'::text from kaia.user_tokens t where t.user_id = p_user_id;
end;
$$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ END                                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
