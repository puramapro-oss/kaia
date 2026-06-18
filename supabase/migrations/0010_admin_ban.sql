-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ KAÏA · Migration 0010 — Admin: bannissement utilisateur (§20.3)           ║
-- ║ Generated 2026-06-18                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

alter table kaia.profiles
  add column if not exists banned_at     timestamptz,
  add column if not exists banned_reason text;

create index if not exists profiles_banned_idx on kaia.profiles(banned_at)
  where banned_at is not null;
