-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ KAÏA V2 · Migration 0006 — New schema (cycle intelligence + AURORA)     ║
-- ║ Generated 2026-06-17                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Extend profiles for V2 ──────────────────────────────────────────────────
alter table kaia.profiles
  add column if not exists purity_level     text default 'aube' check (purity_level in ('aube','croissant','pleine','sagesse')),
  add column if not exists aurora_level     text default 'brume' check (aurora_level in ('brume','onde','aura','polaris')),
  add column if not exists stripe_connect_account_id text,
  add column if not exists prime_j1_at      timestamptz,
  add column if not exists prime_j30_at     timestamptz,
  add column if not exists prime_j60_at     timestamptz,
  add column if not exists luna_mode_prefs  jsonb default '{}',
  add column if not exists onboarding_completed boolean default false;

-- Extend plan constraint to include VITAE plans
alter table kaia.profiles drop constraint if exists profiles_plan_check;
alter table kaia.profiles add constraint profiles_plan_check
  check (plan in ('free','active','canceled','essentiel','infini','legende'));

-- ── Primes (Phase 1: J1=25€, J30=25€, J60=50€) ────────────────────────────
create table if not exists kaia.primes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  app_id              text not null default 'kaia',
  type                text not null check (type in ('j1','j30','j60')),
  amount_cents        int not null check (amount_cents > 0),
  stripe_transfer_id  text,
  paid_at             timestamptz,
  retraction_deadline_at timestamptz not null,
  created_at          timestamptz not null default now(),
  constraint primes_user_app_type_unique unique (user_id, app_id, type)
);
create index if not exists primes_user_idx on kaia.primes(user_id);
alter table kaia.primes enable row level security;
create policy "Users read own primes" on kaia.primes
  for select using (auth.uid() = user_id);
create policy "Service role manages primes" on kaia.primes
  for all using (auth.role() = 'service_role');

-- ── Cycles ──────────────────────────────────────────────────────────────────
create table if not exists kaia.cycles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  start_date        date not null,
  expected_duration int not null default 28,
  phase_detected    text check (phase_detected in ('menstruation','folliculaire','ovulation','lutéale')),
  notes_encrypted   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger cycles_updated_at before update on kaia.cycles
  for each row execute function kaia.set_updated_at();
create index if not exists cycles_user_idx on kaia.cycles(user_id, start_date desc);
alter table kaia.cycles enable row level security;
create policy "Users manage own cycles" on kaia.cycles
  for all using (auth.uid() = user_id);

-- ── Cycle journal ────────────────────────────────────────────────────────────
create table if not exists kaia.cycle_journal (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  cycle_id        uuid references kaia.cycles(id) on delete set null,
  entry_date      date not null,
  mood            int check (mood between 1 and 10),
  energy          int check (energy between 1 and 10),
  symptoms        text[] default '{}',
  flow_intensity  text check (flow_intensity in ('none','light','medium','heavy','spotting')),
  notes_encrypted text,
  created_at      timestamptz not null default now(),
  constraint cycle_journal_user_date_unique unique (user_id, entry_date)
);
create index if not exists cycle_journal_user_idx on kaia.cycle_journal(user_id, entry_date desc);
alter table kaia.cycle_journal enable row level security;
create policy "Users manage own journal" on kaia.cycle_journal
  for all using (auth.uid() = user_id);

-- ── Aurora sessions ──────────────────────────────────────────────────────────
create table if not exists kaia.aurora_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  variant       text not null check (variant in ('calm','focus','sleep','ignite','urgence')),
  phase_reached int check (phase_reached between 1 and 5),
  completed     boolean default false,
  duration_sec  int,
  tokens_earned int default 0,
  created_at    timestamptz not null default now()
);
create index if not exists aurora_sessions_user_idx on kaia.aurora_sessions(user_id, created_at desc);
alter table kaia.aurora_sessions enable row level security;
create policy "Users manage own aurora" on kaia.aurora_sessions
  for all using (auth.uid() = user_id);

-- ── Subconscient sessions (JAMAIS automatique) ───────────────────────────────
create table if not exists kaia.subconscient_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  consent_given       boolean not null default false,
  triggered_by_user   boolean not null default true,
  mode                text check (mode in ('nuit','jour')),
  completed_at        timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists subconscient_user_idx on kaia.subconscient_sessions(user_id);
alter table kaia.subconscient_sessions enable row level security;
create policy "Users manage own subconscient" on kaia.subconscient_sessions
  for all using (auth.uid() = user_id);

-- ── CORE Events ──────────────────────────────────────────────────────────────
create table if not exists kaia.core_events (
  id                      uuid primary key default gen_random_uuid(),
  creator_id              uuid references auth.users(id) on delete set null,
  type                    text not null check (type in ('now','24h','7days')),
  title                   text not null,
  description             text,
  starts_at               timestamptz not null,
  ends_at                 timestamptz,
  max_participants        int default 100,
  synchronization_moment_z timestamptz,
  animal_focus            boolean default false,
  trust_level             text default 'open' check (trust_level in ('open','member','premium')),
  auto_created_by_radar   boolean default false,
  world_radar_score       int check (world_radar_score between 0 and 100),
  status                  text default 'active' check (status in ('draft','active','completed','cancelled')),
  created_at              timestamptz not null default now()
);
create index if not exists core_events_starts_idx on kaia.core_events(starts_at, status);
create index if not exists core_events_type_idx on kaia.core_events(type, status);
alter table kaia.core_events enable row level security;
create policy "Anyone reads active events" on kaia.core_events
  for select using (status = 'active');
create policy "Authenticated creates events" on kaia.core_events
  for insert with check (auth.role() = 'authenticated');

-- ── CORE participations ──────────────────────────────────────────────────────
create table if not exists kaia.core_participations (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references kaia.core_events(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  joined_at           timestamptz not null default now(),
  moment_z_synced     boolean default false,
  dual_sync_with      uuid references auth.users(id) on delete set null,
  constraint core_participations_unique unique (event_id, user_id)
);
create index if not exists core_participations_event_idx on kaia.core_participations(event_id);
create index if not exists core_participations_user_idx on kaia.core_participations(user_id);
alter table kaia.core_participations enable row level security;
create policy "Users manage own participations" on kaia.core_participations
  for all using (auth.uid() = user_id);
create policy "Reads participation counts" on kaia.core_participations
  for select using (true);

-- ── AR Protocols (seed data) ─────────────────────────────────────────────────
create table if not exists kaia.ar_protocols (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  crisis_safe  boolean not null default true,
  target_types text[] default '{"soi"}',
  duration_sec int default 300,
  created_at   timestamptz not null default now()
);
alter table kaia.ar_protocols enable row level security;
create policy "Anyone reads protocols" on kaia.ar_protocols for select using (true);

-- ── AR Sessions ──────────────────────────────────────────────────────────────
create table if not exists kaia.ar_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  consent_given_at timestamptz not null,
  style            text not null check (style in ('A','B')),
  target_type      text check (target_type in ('soi','personne','animal','collectif')),
  protocol_id      uuid references kaia.ar_protocols(id),
  duration_sec     int,
  created_at       timestamptz not null default now()
);
create index if not exists ar_sessions_user_idx on kaia.ar_sessions(user_id, created_at desc);
alter table kaia.ar_sessions enable row level security;
create policy "Users manage own ar sessions" on kaia.ar_sessions
  for all using (auth.uid() = user_id);

-- ── Intention Circles ────────────────────────────────────────────────────────
create table if not exists kaia.intention_circles (
  id               uuid primary key default gen_random_uuid(),
  facilitator_id   uuid not null references auth.users(id) on delete cascade,
  theme            text not null,
  max_participants int default 12,
  audio_only       boolean default true,
  rotation_enabled boolean default true,
  guidage_mode     int check (guidage_mode between 1 and 8),
  livekit_room_name text,
  status           text default 'open' check (status in ('open','in_progress','closed')),
  created_at       timestamptz not null default now()
);
create index if not exists circles_status_idx on kaia.intention_circles(status, created_at desc);
alter table kaia.intention_circles enable row level security;
create policy "Anyone reads open circles" on kaia.intention_circles
  for select using (status in ('open','in_progress'));
create policy "Authenticated creates circles" on kaia.intention_circles
  for insert with check (auth.role() = 'authenticated' and auth.uid() = facilitator_id);

-- ── Circle participants ───────────────────────────────────────────────────────
create table if not exists kaia.circle_participants (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid not null references kaia.intention_circles(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  left_at    timestamptz,
  constraint circle_participants_unique unique (circle_id, user_id)
);
alter table kaia.circle_participants enable row level security;
create policy "Users manage own circle participation" on kaia.circle_participants
  for all using (auth.uid() = user_id);

-- ── Caregiver profiles ────────────────────────────────────────────────────────
create table if not exists kaia.caregiver_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  caregiver_for    uuid references auth.users(id) on delete set null,
  relationship     text,
  modules_unlocked text[] default '{}',
  created_at       timestamptz not null default now()
);
alter table kaia.caregiver_profiles enable row level security;
create policy "Users manage own caregiver profile" on kaia.caregiver_profiles
  for all using (auth.uid() = user_id);

-- ── KARMA games ──────────────────────────────────────────────────────────────
create table if not exists kaia.karma_games (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  category     text not null check (category in ('transversal','pilier','communautaire','special','v3')),
  title        text not null,
  description  text,
  tokens_reward int default 5,
  recurrence   text default 'daily' check (recurrence in ('once','daily','weekly','monthly')),
  active       boolean default true
);
alter table kaia.karma_games enable row level security;
create policy "Anyone reads active games" on kaia.karma_games
  for select using (active = true);

-- ── KARMA user progress ───────────────────────────────────────────────────────
create table if not exists kaia.karma_user_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  game_slug         text not null references kaia.karma_games(slug) on delete cascade,
  completions       int default 0,
  last_completed_at timestamptz,
  total_tokens      int default 0,
  constraint karma_progress_unique unique (user_id, game_slug)
);
create index if not exists karma_progress_user_idx on kaia.karma_user_progress(user_id);
alter table kaia.karma_user_progress enable row level security;
create policy "Users manage own karma" on kaia.karma_user_progress
  for all using (auth.uid() = user_id);

-- ── KARMA distributions ────────────────────────────────────────────────────────
create table if not exists kaia.karma_distributions (
  id                  uuid primary key default gen_random_uuid(),
  period_month        text not null unique,
  total_revenue_cents int not null default 0,
  users_pool_cents    int not null default 0,
  asso_pool_cents     int not null default 0,
  sasu_pool_cents     int not null default 0,
  status              text default 'pending' check (status in ('pending','processing','completed')),
  stripe_payout_ids   text[] default '{}',
  opentimestamps_receipt text,
  created_at          timestamptz not null default now()
);
alter table kaia.karma_distributions enable row level security;
create policy "Service manages distributions" on kaia.karma_distributions
  for all using (auth.role() = 'service_role');

-- ── KARMA user shares ─────────────────────────────────────────────────────────
create table if not exists kaia.karma_user_shares (
  id                uuid primary key default gen_random_uuid(),
  distribution_id   uuid not null references kaia.karma_distributions(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  share_amount_cents int not null default 0,
  stripe_transfer_id text,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);
alter table kaia.karma_user_shares enable row level security;
create policy "Users read own shares" on kaia.karma_user_shares
  for select using (auth.uid() = user_id);
create policy "Service manages shares" on kaia.karma_user_shares
  for all using (auth.role() = 'service_role');

-- ── TERRA NOVA nodes ──────────────────────────────────────────────────────────
create table if not exists kaia.terra_nova_nodes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  lat                 double precision not null,
  lng                 double precision not null,
  meeting_type        text,
  graines_exchanged   int default 0,
  kyc_verified        boolean default false,
  created_at          timestamptz not null default now()
);
create index if not exists terra_nova_location_idx on kaia.terra_nova_nodes(lat, lng);
alter table kaia.terra_nova_nodes enable row level security;
create policy "Users manage own nodes" on kaia.terra_nova_nodes
  for all using (auth.uid() = user_id);
create policy "Anyone sees nodes" on kaia.terra_nova_nodes
  for select using (true);

-- ── Graines wallet ────────────────────────────────────────────────────────────
create table if not exists kaia.graines_wallet (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  balance_graines     int not null default 0 check (balance_graines >= 0),
  total_earned        int not null default 0,
  kyc_required_at     timestamptz,
  kyc_completed_at    timestamptz,
  updated_at          timestamptz not null default now()
);
alter table kaia.graines_wallet enable row level security;
create policy "Users manage own graines" on kaia.graines_wallet
  for all using (auth.uid() = user_id);

-- ── Missions catalogue ────────────────────────────────────────────────────────
create table if not exists kaia.missions (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  description     text,
  tokens_reward   int default 10,
  graines_reward  int default 0,
  civic_count     int default 0,
  type            text not null check (type in ('solo','civique','communautaire')),
  max_completions int default 1,
  active          boolean default true
);
alter table kaia.missions enable row level security;
create policy "Anyone reads active missions" on kaia.missions
  for select using (active = true);

-- ── Mission completions ────────────────────────────────────────────────────────
create table if not exists kaia.mission_completions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mission_id  uuid not null references kaia.missions(id) on delete cascade,
  proof_url   text,
  status      text default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists mission_completions_user_idx on kaia.mission_completions(user_id);
create index if not exists mission_completions_pending_idx on kaia.mission_completions(status) where status = 'pending';
alter table kaia.mission_completions enable row level security;
create policy "Users manage own completions" on kaia.mission_completions
  for all using (auth.uid() = user_id);
create policy "Service reads all completions" on kaia.mission_completions
  for select using (auth.role() = 'service_role');

-- ── Enable realtime for CORE events ──────────────────────────────────────────
alter publication supabase_realtime add table kaia.core_events;
alter publication supabase_realtime add table kaia.core_participations;
alter publication supabase_realtime add table kaia.intention_circles;

-- ── Seed: AR protocols (10 crisis-safe) ──────────────────────────────────────
insert into kaia.ar_protocols (slug, name, description, crisis_safe, target_types, duration_sec)
values
  ('calme-interieur', 'Calme Intérieur', 'Ancrage dans le moment présent', true, '{"soi"}', 300),
  ('liberer-tension', 'Libérer la Tension', 'Relâchement des tensions physiques', true, '{"soi"}', 420),
  ('energie-cycle', 'Énergie Cyclique', 'Harmonisation avec votre phase', true, '{"soi"}', 360),
  ('connexion-nature', 'Connexion Nature', 'Se reconnecter à la terre et aux éléments', true, '{"soi","collectif"}', 480),
  ('guerison-coeur', 'Guérison du Cœur', 'Compassion et auto-soin émotionnel', true, '{"soi"}', 600),
  ('lumiere-douce', 'Lumière Douce', 'Bain de lumière régénérateur', true, '{"soi","personne"}', 300),
  ('bouclier-energie', 'Bouclier Énergétique', 'Protection et ressourcement', true, '{"soi"}', 360),
  ('flux-vital', 'Flux Vital', 'Rééquilibrage des flux énergétiques', true, '{"soi","personne"}', 540),
  ('animal-guide', 'Animal Guide', 'Connexion avec votre animal totem', true, '{"animal"}', 420),
  ('cercle-sacre', 'Cercle Sacré', 'Intention collective synchronisée', true, '{"collectif"}', 900)
on conflict (slug) do nothing;

-- ── Trigger: auto-create graines_wallet on user create ────────────────────────
create or replace function kaia.handle_new_user_v2()
returns trigger language plpgsql security definer as $$
begin
  insert into kaia.graines_wallet (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_v2 on kaia.profiles;
create trigger on_auth_user_created_v2
  after insert on kaia.profiles
  for each row execute function kaia.handle_new_user_v2();
