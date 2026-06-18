-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ KAÏA · Migration 0009 — ADS internes §17 (users promeuvent leurs trucs)   ║
-- ║ Generated 2026-06-18                                                       ║
-- ║ Étend kaia.user_ads (table créée en 0001) : propriété user + budget tokens ║
-- ║ + statut de modération + placement.                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

alter table kaia.user_ads
  add column if not exists user_id          uuid references auth.users(id) on delete cascade,
  add column if not exists budget_tokens    int not null default 0,
  add column if not exists spent_tokens     int not null default 0,
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  add column if not exists placement        text not null default 'feed'
    check (placement in ('feed', 'home'));

create index if not exists user_ads_owner_idx on kaia.user_ads(user_id);
create index if not exists user_ads_serve_idx on kaia.user_ads(placement, active, moderation_status)
  where active and moderation_status = 'approved';

-- RLS : l'owner gère ses annonces ; tout le monde lit les annonces servables ;
-- le service role gère le reste (modération, compteurs de serve/click).
alter table kaia.user_ads enable row level security;
create policy "Owner manages own ads" on kaia.user_ads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Anyone reads servable ads" on kaia.user_ads
  for select using (active and moderation_status = 'approved');
create policy "Service manages ads" on kaia.user_ads
  for all using (auth.role() = 'service_role');
