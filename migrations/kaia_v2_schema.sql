-- KAÏA V2 Schema Migration
-- Run once via /api/setup/db (super_admin only)
-- Schema: kaia

CREATE SCHEMA IF NOT EXISTS kaia;

-- ── Profiles (base, may already exist from V1) ──
CREATE TABLE IF NOT EXISTS kaia.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'fr',
  plan_key TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  vitae_plan TEXT CHECK (vitae_plan IN ('essentiel', 'infini', 'legende')),
  vitae_multiplier INT DEFAULT 1,
  purity_level TEXT DEFAULT 'aube' CHECK (purity_level IN ('aube', 'croissant', 'pleine', 'sagesse')),
  aurora_level TEXT DEFAULT 'brume' CHECK (aurora_level IN ('brume', 'onde', 'aura', 'polaris')),
  karma_score INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_data JSONB,
  tutorial_completed BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES kaia.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Connect accounts (Stripe Connect Express) ──
CREATE TABLE IF NOT EXISTS kaia.connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Primes (Phase 1: J1=25€, J30=25€, J60=50€) ──
CREATE TABLE IF NOT EXISTS kaia.primes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('j1', 'j30', 'j60', 'referral_n1')),
  amount_cents INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'available', 'paid', 'reversed')),
  retraction_deadline TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Wallet ──
CREATE TABLE IF NOT EXISTS kaia.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prime', 'karma_reward', 'referral', 'withdrawal', 'reversal')),
  amount_cents INT NOT NULL,
  balance_after_cents INT NOT NULL,
  description TEXT,
  stripe_transfer_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Cycle entries (AES-256-GCM encrypted) ──
CREATE TABLE IF NOT EXISTS kaia.cycle_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  flow_level INT CHECK (flow_level BETWEEN 0 AND 5),
  symptoms TEXT[],
  mood INT CHECK (mood BETWEEN 1 AND 10),
  energy INT CHECK (energy BETWEEN 1 AND 10),
  sleep_hours NUMERIC(4,1),
  note_encrypted TEXT,
  phase TEXT CHECK (phase IN ('menstruel', 'folliculaire', 'ovulatoire', 'luteal')),
  cycle_day INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ── LUNA conversations ──
CREATE TABLE IF NOT EXISTS kaia.luna_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kaia.luna_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES kaia.luna_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INT,
  safety_filtered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── AURORA sessions ──
CREATE TABLE IF NOT EXISTS kaia.aurora_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('calm', 'focus', 'sleep', 'ignite')),
  duration_seconds INT,
  phases_completed INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Cercles d'Intention ──
CREATE TABLE IF NOT EXISTS kaia.cercles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  host_user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  guidance_mode TEXT DEFAULT 'silence',
  max_participants INT DEFAULT 12,
  is_public BOOLEAN DEFAULT true,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  livekit_room_name TEXT,
  rotation_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kaia.cercle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cercle_id UUID NOT NULL REFERENCES kaia.cercles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(cercle_id, user_id)
);

-- ── C.O.R.E. Events ──
CREATE TABLE IF NOT EXISTS kaia.core_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'now' CHECK (type IN ('now', '24h', '7days')),
  trust_gate_question TEXT,
  collective_energy_score NUMERIC(5,2),
  moment_z_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  participant_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kaia.core_event_joins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES kaia.core_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  trust_gate_passed BOOLEAN DEFAULT false,
  intention TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- ── KARMA games ──
CREATE TABLE IF NOT EXISTS kaia.karma_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  xp_reward INT DEFAULT 50,
  karma_category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kaia.karma_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES kaia.karma_games(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── TERRA NOVA (Graines) ──
CREATE TABLE IF NOT EXISTS kaia.terra_nova_graines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL DEFAULT 1,
  price_eur_cents INT NOT NULL DEFAULT 1,
  stripe_payment_id TEXT,
  kyc_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'redeemed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Onboarding answers ──
CREATE TABLE IF NOT EXISTS kaia.onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES kaia.profiles(id) ON DELETE CASCADE,
  prenom TEXT,
  locale TEXT DEFAULT 'fr',
  objectif TEXT,
  cycle_knowledge TEXT,
  sensibilites TEXT[],
  notifications_preference TEXT DEFAULT 'soir',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS policies ──
ALTER TABLE kaia.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.primes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.cycle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.luna_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.luna_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.aurora_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.cercles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.cercle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.core_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.core_event_joins ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.karma_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.karma_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.terra_nova_graines ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaia.onboarding_answers ENABLE ROW LEVEL SECURITY;

-- Self-access RLS
CREATE POLICY "users_own_profile" ON kaia.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_connect" ON kaia.connect_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_primes" ON kaia.primes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_wallet" ON kaia.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_cycles" ON kaia.cycle_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_luna_convs" ON kaia.luna_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_luna_msgs" ON kaia.luna_messages FOR ALL USING (
  auth.uid() = (SELECT user_id FROM kaia.luna_conversations WHERE id = conversation_id)
);
CREATE POLICY "users_own_aurora" ON kaia.aurora_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cercles_public_read" ON kaia.cercles FOR SELECT USING (is_public = true OR auth.uid() = host_user_id);
CREATE POLICY "cercles_host_manage" ON kaia.cercles FOR ALL USING (auth.uid() = host_user_id);
CREATE POLICY "cercle_participants_own" ON kaia.cercle_participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "core_events_public_read" ON kaia.core_events FOR SELECT USING (true);
CREATE POLICY "core_joins_own" ON kaia.core_event_joins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "karma_games_public_read" ON kaia.karma_games FOR SELECT USING (is_active = true);
CREATE POLICY "karma_sessions_own" ON kaia.karma_game_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "graines_own" ON kaia.terra_nova_graines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "onboarding_own" ON kaia.onboarding_answers FOR ALL USING (auth.uid() = user_id);

-- ── Auto-create profile trigger ──
CREATE OR REPLACE FUNCTION kaia.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ref_code TEXT;
BEGIN
  ref_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO kaia.profiles (id, email, referral_code, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    ref_code,
    NEW.email = 'matiss.frasne@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION kaia.handle_new_user();

-- ── updated_at triggers ──
CREATE OR REPLACE FUNCTION kaia.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON kaia.profiles FOR EACH ROW EXECUTE FUNCTION kaia.update_updated_at();
CREATE TRIGGER cycles_updated_at BEFORE UPDATE ON kaia.cycle_entries FOR EACH ROW EXECUTE FUNCTION kaia.update_updated_at();
CREATE TRIGGER luna_convs_updated_at BEFORE UPDATE ON kaia.luna_conversations FOR EACH ROW EXECUTE FUNCTION kaia.update_updated_at();
CREATE TRIGGER connect_accounts_updated_at BEFORE UPDATE ON kaia.connect_accounts FOR EACH ROW EXECUTE FUNCTION kaia.update_updated_at();
