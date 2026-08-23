-- 0011_stripe_webhook_idempotence.sql
-- Idempotent: re-runnable safely (CREATE IF NOT EXISTS).
-- Corrige un finding réel (distillation Fable exemplothèque, 2026-08-23, MANAS/apps/kaia.md) :
-- le webhook Stripe n'avait AUCUNE table d'idempotence event_id — risque de double-crédit
-- (primes/commissions) sur un replay/redelivery Stripe. Cf ~/purama/PIEGES.md §1.
create table if not exists kaia.stripe_events_processed (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

grant select, insert on kaia.stripe_events_processed to service_role;
