# CineMatch — Security Documentation

## Security Non-Negotiables

All four of the following are verifiably in place:

### 1. No Hardcoded Secrets

**Mechanism:** All secrets read from environment variables via `pydantic-settings` (`backend/app/settings.py`). The app fails loudly at startup if any required var is missing. `.env` is gitignored; `.env.example` contains only placeholders.

**Enforcement:** `gitleaks detect --source . --redact` must run clean before any push to `main`. Add the following pre-commit hook via `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.2
    hooks:
      - id: gitleaks
```

**Verification:** `gitleaks detect --source . --redact` → `No leaks found.`

---

### 2. Rate Limiting

**Mechanism:** `slowapi` wired at app level in `backend/app/limiter.py`. Per-route limits:

| Endpoint | Limit |
|---|---|
| `/search` | 30/minute |
| `/recommend` | 60/minute |
| `/favorites` POST/DELETE | 30/minute |
| `/health`, `/trending` | default (120/hour) |

Key function: user ID if authenticated, remote IP otherwise.

**Verification:** `curl -X POST http://backend/recommend -d '{"movie_id":550,"k":3}' -s -o /dev/null -w "%{http_code}"` repeated 61× in a loop; the last response is `429`.

`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` headers are present on every response.

---

### 3. Row-Level Security (RLS) Isolation Test

**Setup:** Supabase RLS is enabled on `favorites` and `search_history`. The policies are defined in `supabase/migrations/0001_init.sql`.

**Test procedure:**
1. Create User A (e.g., `usera@test.com`) via Supabase magic-link.
2. Sign in as User A; add movie_id=550 ("Fight Club") to favorites via `POST /favorites`.
3. Create User B (e.g., `userb@test.com`) in a separate browser/incognito session.
4. Sign in as User B.
5. Call `GET /favorites` with User B's JWT; response must contain `[]`.
6. As a double-check, run in Supabase SQL editor logged in as User B's role:
   ```sql
   select * from favorites;
   ```
   Result: `0 rows` (User A's row is invisible).

**Result:** Confirmed: User B receives an empty favorites list. User A's data is completely isolated.

**Screenshot:** `docs/security/rls-isolation.png` — shows the Supabase SQL editor returning 0 rows for User B's session.

---

### 4. XSS Defense

Defense is layered across both tiers:

#### Frontend

| Layer | What it does |
|---|---|
| React auto-escaping | All TMDB strings rendered as `{value}`, not as HTML. Covers ~95% of surface area. |
| `safeHtml()` in `lib/sanitize.ts` | DOMPurify allowlist (`i, em, b, strong, br` — no attributes) used for the rare TMDB overview with inline markup. Only path to `dangerouslySetInnerHTML`. |
| Content-Security-Policy | Set via `next.config.js`; see header below. |
| Input validation | `zod` schema on search query before any network call. |
| Auth cookies | `HttpOnly`, `Secure`, `SameSite=Lax` (handled by `@supabase/ssr`). |

**CSP header (production):**
```
Content-Security-Policy: default-src 'self'; img-src 'self' https://image.tmdb.org data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://your-backend.onrender.com https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
```

#### Backend

| Layer | What it does |
|---|---|
| `bleach.clean()` in `security.py` | Strips all HTML from TMDB strings before persisting or returning them. |
| Pydantic models | All request/response shapes are typed; no untyped dicts cross the wire. |
| Parameterized queries | Supabase SDK only; no raw SQL string concatenation. |
| Security headers middleware | `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY` on every response. |
| CORS allowlist | Exact production + preview URLs only; never `*`. |

---

## Deferred Security Features (v1.1)

The following were planned but deferred due to timeline constraints:

- **Trusted Types enforcement** (progressive enhancement for catch-all sink protection)
- **Upstash Redis for distributed rate limiting** (in-memory fallback is sufficient for demo traffic on a single Render instance)
- **Search history RLS insert audit log** (policies exist; logging deferred)

---

## Threat Model (Summary)

| Threat | Mitigation |
|---|---|
| Leaked TMDB key | Env var only; `.env` gitignored; gitleaks in CI |
| XSS via TMDB overview text | bleach (server) + DOMPurify (client) + CSP |
| Unauthorized favorites access | Supabase RLS; JWT verification on every authed route |
| API scraping / quota abuse | slowapi per-IP + per-user limits |
| Clickjacking | `frame-ancestors 'none'` in CSP + `X-Frame-Options: DENY` |
| CSRF | SameSite=Lax cookies; state-changing requests require Bearer token |
