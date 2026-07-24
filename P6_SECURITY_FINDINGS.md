# KAIA P6 Security Audit — 2026-07-25

## ✅ VALIDATIONS (Zod)

### Routes WITH validation
- ✅ `/api/luna/chat` — schema (message, mode, history)
- ✅ `/api/ads/create` — schema (title, body, ctaLabel, ctaUrl, placement, budgetTokens)
- ✅ `/api/ads/click` — schema (adId)
- ✅ `/api/terra-nova/create-node` — schema (lat, lng, meetingType)
- ✅ `/api/core/join` — schema (eventId)
- ✅ `/api/core/sync` — schema (eventId, dualSyncWith)
- ✅ `/api/cercles/join` — schema (circleId)
- ✅ `/api/cycle/journal` — schema (mood, energy, symptoms, flowIntensity, notes, date)

### Routes MISSING validation (fix required)
- ❌ `/api/terra-nova/exchange-graines` — NO body parse, rate-limited but accepts any POST
- ❌ `/api/influencer/link` (POST) — NO body validation (void request)
- ❌ `/api/auth/signout` — NO validation (acceptable, no body needed)
- ❌ `/api/setup/db` — admin setup route (acceptable)
- ❌ `/api/setup/stripe` — admin setup route (acceptable)
- ❌ `/api/admin/logout` — admin route (acceptable)

**Action**: Add Zod validation to `/api/terra-nova/exchange-graines` + `/api/influencer/link`.

---

## ✅ RATE LIMITING

### Routes WITH rate limiting
- ✅ `/api/terra-nova/create-node` — 5/day
- ✅ `/api/terra-nova/exchange-graines` — 10/hour
- ✅ `/api/core/join` — 30/hour
- ✅ `/api/core/sync` — 60/hour
- ✅ `/api/luna/chat` — custom DB rate limit (20/5min via luna_rate_limit table)

### Routes MISSING rate limiting (fix required)
- ❌ `/api/ads/click` — public, spammable (LOW priority, tracks clicks only)
- ❌ `/api/cercles/join` — authenticated but unlimited (MEDIUM priority)
- ❌ `/api/cycle/journal` — authenticated write, unlimited (MEDIUM priority)
- ❌ `/api/influencer/link` (POST) — idempotent but spammable (LOW priority, has DB collision retry limit)

**Action**: Add rate limits to `cercles/join` (10/hour) + `cycle/journal` (100/day).

---

## ✅ WEBHOOK SIGNATURE VERIFICATION

- ✅ `/api/stripe/webhook` — CORRECT verification via `stripe.webhooks.constructEvent(rawBody, signature, secret)`
  - ✅ Uses raw body (`.text()`)
  - ✅ Checks signature header
  - ✅ Returns 400 on signature failure
  - ✅ Handles all critical events: checkout.session.completed, subscription.*, invoice.payment_succeeded, charge.refunded

---

## ✅ ACCESSIBILITY (a11y)

### Landing page (`src/app/page.tsx`)
- ✅ Semantic HTML (h1, p, main)
- ✅ Links have descriptive text ("Commencer", "Déjà membre — Se connecter")
- ⚠️ MINOR: Logo icon has no aria-label (decorative, acceptable)

### Auth forms
- ✅ `LoginForm` — all inputs have labels via Input component
- ✅ `SignupForm` — all inputs have labels + placeholders
- ✅ Proper autocomplete attributes (email, password, name)
- ✅ Error messages accessible via error prop

**No critical a11y issues found.**

---

## ✅ ROBUSTNESS

- ✅ `/src/app/error.tsx` — EXISTS
- ✅ `/src/app/not-found.tsx` — EXISTS
- ✅ All checked API routes have try/catch blocks
- ✅ All return French error messages with status codes

---

## 🔧 FIXES TO APPLY

1. **Add Zod validation**:
   - `/api/terra-nova/exchange-graines` → Add empty body schema or reject body
   - `/api/influencer/link` (POST) → Add optional campaign schema

2. **Add rate limiting**:
   - `/api/cercles/join` → 10 joins/hour
   - `/api/cycle/journal` → 100 entries/day

3. **Optional (LOW priority)**:
   - `/api/ads/click` → 60/hour per user (prevent abuse)

---

## SUMMARY

| Dimension | Status |
|---|---|
| Zod validation | 🟡 8/10 routes validated (2 minor gaps) |
| Rate limiting | 🟡 5/8 sensitive routes limited (3 gaps) |
| Webhook signature | ✅ PERFECT |
| a11y | ✅ GOOD (no critical issues) |
| Robustness | ✅ PERFECT (error.tsx + not-found.tsx + try/catch) |

**Overall grade**: 🟢 GOOD — 2 medium-priority fixes required.
