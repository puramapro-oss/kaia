/**
 * Cashback boutique KAÏA — BRIEF §5.10.
 *  - 5 % du montant payé converti en tokens (1 token = 0,01 € → 5% en centimes ÷ 1)
 *  - 1 ticket / 100 tokens cashback (donc 1 ticket / 20 € dépensés)
 *
 * Module TS pur · testable · zéro I/O.
 */
export const SHOP_CASHBACK_PERCENT = 5;
export const SHOP_TOKENS_PER_TICKET = 100;

/**
 * @param amountCents montant payé Stripe (en centimes)
 * @returns { cashbackTokens, ticketsEarned }
 *
 * Cashback = floor(amount_cents * 5%) tokens (= centimes ÷ 20).
 * Ex : 1499 cents (14,99 €) → floor(1499 * 0.05) = 74 tokens · 0 ticket
 *      9990 cents (99,90 €) → floor(9990 * 0.05) = 499 tokens · 4 tickets (1 / 100 tokens)
 */
export function computeShopRewards(amountCents: number): {
  cashbackTokens: number;
  ticketsEarned: number;
} {
  const safe = Math.max(0, Math.floor(amountCents));
  const cashbackTokens = Math.floor((safe * SHOP_CASHBACK_PERCENT) / 100);
  const ticketsEarned = Math.floor(cashbackTokens / SHOP_TOKENS_PER_TICKET);
  return { cashbackTokens, ticketsEarned };
}
