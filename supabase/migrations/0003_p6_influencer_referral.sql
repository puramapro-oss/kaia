-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ KAÏA · Migration 0003 — P6 Influencer + Referral extensions              ║
-- ║ Domain: kaia.purama.dev · Generated 2026-04-27                           ║
-- ║ Idempotent: re-runnable safely (ALTER IF NOT EXISTS, CREATE IF NOT EX..) ║
-- ║                                                                          ║
-- ║ Ajoute :                                                                 ║
-- ║  - colonnes promo + commission% sur influencer_links                     ║
-- ║  - colonnes period + breakdown + treezor_transaction_id sur _payouts     ║
-- ║  - table influencer_link_clicks (analytics anonymisée)                   ║
-- ║  - table referral_commissions (commissions parrain particulier)          ║
-- ║  - RPC kaia.create_influencer_link (génère code unique)                  ║
-- ║                                                                          ║
-- ║ BRIEF §9.3 + §10 : 50% premier paiement / 10% récurrent / 5% shop        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── 1. influencer_links : ajout colonnes promo + commission ──────────────
alter table kaia.influencer_links
  add column if not exists promo_active_until timestamptz,
  add column if not exists promo_discount_percent int not null default 50,
  add column if not exists base_commission_first int not null default 50,
  add column if not exists lifetime_commission int not null default 10,
  add column if not exists custom_landing_url text;

-- ── 2. influencer_payouts : ajout period + breakdown + treezor stub ──────
alter table kaia.influencer_payouts
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists breakdown jsonb not null default '{}'::jsonb,
  add column if not exists treezor_transaction_id text,
  add column if not exists notes text;

-- ── 3. influencer_link_clicks : analytics anonymisée 30j ─────────────────
create table if not exists kaia.influencer_link_clicks (
  id              uuid primary key default gen_random_uuid(),
  link_id         uuid not null references kaia.influencer_links(id) on delete cascade,
  ip_hash         text,                                  -- sha256(ip + salt)
  ua_hash         text,                                  -- sha256(user-agent)
  country_code    text,                                  -- ISO-3166 (optionnel via header)
  referer         text,
  created_at      timestamptz not null default now()
);
create index if not exists influencer_link_clicks_link_idx
  on kaia.influencer_link_clicks(link_id, created_at desc);

-- ── 4. referral_commissions : commissions parrain particulier ────────────
create table if not exists kaia.referral_commissions (
  id              uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references kaia.profiles(id) on delete cascade,
  referred_user_id uuid not null references kaia.profiles(id) on delete cascade,
  source          text not null check (source in ('subscription_first', 'subscription_recurring', 'shop_purchase')),
  amount_cents    int not null,
  commission_cents int not null,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  status          text not null default 'pending' check (status in ('pending', 'paid', 'reversed')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists referral_commissions_referrer_idx
  on kaia.referral_commissions(referrer_user_id, created_at desc);
create index if not exists referral_commissions_referred_idx
  on kaia.referral_commissions(referred_user_id);
create unique index if not exists referral_commissions_invoice_idx
  on kaia.referral_commissions(stripe_invoice_id) where stripe_invoice_id is not null;

-- ── 5. RPC : create_influencer_link (code unique slugifié) ───────────────
create or replace function kaia.create_influencer_link(
  p_user_id uuid,
  p_campaign text default null
)
returns table(id uuid, code text) language plpgsql security definer as $$
declare
  v_full_name text;
  v_base text;
  v_code text;
  v_attempt int := 0;
  v_link_id uuid;
begin
  select full_name into v_full_name from kaia.profiles where profiles.id = p_user_id;
  if v_full_name is null then
    raise exception 'profile_not_found';
  end if;

  -- normalise base : minuscules ascii sans caractères spéciaux, max 12
  v_base := lower(regexp_replace(unaccent(v_full_name), '[^a-zA-Z0-9]', '', 'g'));
  v_base := substring(v_base from 1 for 12);
  if length(v_base) < 3 then
    v_base := 'kaia' || substring(replace(p_user_id::text, '-', '') from 1 for 4);
  end if;

  -- tente jusqu'à 8 fois avec suffix random
  loop
    v_attempt := v_attempt + 1;
    v_code := upper(v_base || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));

    begin
      insert into kaia.influencer_links (user_id, code, campaign)
      values (p_user_id, v_code, p_campaign)
      returning influencer_links.id into v_link_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 8 then
        raise exception 'code_collision_max_attempts';
      end if;
    end;
  end loop;

  return query select v_link_id, v_code;
end;
$$;

-- helper unaccent : créer extension si manquante (fallback regex sans accents)
create extension if not exists unaccent;

-- ── 6. RLS pour les nouvelles tables ─────────────────────────────────────

-- influencer_link_clicks : insert public (tracking), select via owner du link
alter table kaia.influencer_link_clicks enable row level security;
drop policy if exists "influencer_clicks_insert_anon" on kaia.influencer_link_clicks;
drop policy if exists "influencer_clicks_owner_read" on kaia.influencer_link_clicks;
drop policy if exists "influencer_clicks_admin_all" on kaia.influencer_link_clicks;
create policy "influencer_clicks_insert_anon" on kaia.influencer_link_clicks
  for insert to anon, authenticated with check (true);
create policy "influencer_clicks_owner_read" on kaia.influencer_link_clicks
  for select using (
    exists(select 1 from kaia.influencer_links l
           where l.id = link_id and l.user_id = auth.uid())
  );
create policy "influencer_clicks_admin_all" on kaia.influencer_link_clicks
  for all using (kaia.is_admin(auth.uid()));

-- referral_commissions : referrer peut lire ses commissions
alter table kaia.referral_commissions enable row level security;
drop policy if exists "referral_commissions_referrer_read" on kaia.referral_commissions;
drop policy if exists "referral_commissions_admin_all" on kaia.referral_commissions;
create policy "referral_commissions_referrer_read" on kaia.referral_commissions
  for select using (auth.uid() = referrer_user_id);
create policy "referral_commissions_admin_all" on kaia.referral_commissions
  for all using (kaia.is_admin(auth.uid()));

-- ── 7. realtime publication (optionnel) ──────────────────────────────────
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    -- Rajoute referral_commissions au realtime si pas déjà
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'kaia'
        and tablename = 'referral_commissions'
    ) then
      execute 'alter publication supabase_realtime add table kaia.referral_commissions';
    end if;
  end if;
exception when others then
  -- Ignore : la publication peut ne pas exister sur certaines instances
  null;
end$$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ END migration 0003                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
