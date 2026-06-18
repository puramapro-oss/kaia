-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ KAÏA V2 · Migration 0008 — P7: Transmission Mères/Filles (espace partagé) ║
-- ║ Generated 2026-06-18                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Espace de transmission intergénérationnel ─────────────────────────────────
-- Créé par la fille (owner). Une invitée (mère) rejoint via un token de lien.
create table if not exists kaia.transmission_spaces (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  title        text not null default 'Notre transmission',
  invite_token text not null unique,
  -- Accès web sans compte autorisé pour l'invitée (réservé ≥ 50 ans côté app).
  guest_allowed boolean not null default false,
  -- Renseigné quand une invitée disposant d'un compte rejoint l'espace.
  guest_id     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists transmission_spaces_owner_idx on kaia.transmission_spaces(owner_id);
alter table kaia.transmission_spaces enable row level security;
-- Owner et invitée authentifiée voient/gèrent leur espace ; le serveur gère le reste
-- (accès invitée web sans compte = service_role validant le token).
create policy "Members read own transmission space" on kaia.transmission_spaces
  for select using (auth.uid() = owner_id or auth.uid() = guest_id);
create policy "Owner manages transmission space" on kaia.transmission_spaces
  for all using (auth.uid() = owner_id);
create policy "Service manages transmission spaces" on kaia.transmission_spaces
  for all using (auth.role() = 'service_role');

-- ── Entrées du journal commun ─────────────────────────────────────────────────
create table if not exists kaia.transmission_entries (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references kaia.transmission_spaces(id) on delete cascade,
  author_role text not null check (author_role in ('fille','mere')),
  -- author_id null = invitée web sans compte (entrée validée via token serveur).
  author_id   uuid references auth.users(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists transmission_entries_space_idx on kaia.transmission_entries(space_id, created_at desc);
alter table kaia.transmission_entries enable row level security;
create policy "Members read space entries" on kaia.transmission_entries
  for select using (
    exists (
      select 1 from kaia.transmission_spaces s
      where s.id = space_id and (auth.uid() = s.owner_id or auth.uid() = s.guest_id)
    )
  );
create policy "Members write own entries" on kaia.transmission_entries
  for insert with check (
    author_id is not null and auth.uid() = author_id and exists (
      select 1 from kaia.transmission_spaces s
      where s.id = space_id and (auth.uid() = s.owner_id or auth.uid() = s.guest_id)
    )
  );
create policy "Service manages space entries" on kaia.transmission_entries
  for all using (auth.role() = 'service_role');
