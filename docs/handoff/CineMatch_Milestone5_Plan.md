# CineMatch — Milestone 5 Final Product Plan
**Course:** DATA 433 · **Deadline:** Thu 5/14 @ 12:30 pm · **Author of plan:** Mathew Blevins
**Current state:** Working Streamlit MVP on Streamlit Community Cloud (TMDB API + TF-IDF + cosine similarity, dynamic corpus fallback).
**Target state:** Production-grade two-tier app (decoupled frontend + backend + managed Postgres), publicly deployed, hardened (no hardcoded keys, rate-limited, RLS-protected, XSS-defended), with a CLAUDE.md that lets Claude Code operate the repo without re-discovery.

---

## 0. Executive Summary

The Streamlit MVP satisfies "deployed and functional" but maxes out around the **Proficient (12-13/15)** band on the Deployment & Accessibility rubric because Streamlit Cloud doesn't show off architecture, cost-thinking, or security posture. To move into the **Exemplary (14-15/15)** band on Deployment, Technical Execution, and Sales Pitch simultaneously, the final product splits CineMatch into:

1. **Frontend** — Next.js 14 (App Router) + Tailwind + shadcn/ui on **Vercel** (free tier). Netflix-inspired dark UI, server components for the recommendation grid, client components for the search box and "Add to favorites" interactions.
2. **Backend** — **FastAPI** service on **Render** (free web service tier) that owns the ML pipeline, the TMDB key, and rate limiting. Reuses the exact `scikit-learn` TF-IDF + cosine-similarity code already written for the Streamlit app — no model rewrite.
3. **Data layer** — **Supabase** (free tier) for Postgres + Auth + Row-Level Security. Stores user accounts, favorites, search history, and a cached corpus of TMDB metadata.

The Streamlit app stays live as a **legacy/demo URL** linked from the README ("v1 prototype") so nothing regresses. The new stack is the headline deliverable.

**Why this stack is the right call for the rubric:**
- *Deployment*: public URL on a real CDN, env-var secrets, observability via Render/Vercel dashboards, and a clean cost analysis ($0/mo today, with itemized breakeven math).
- *Technical Execution*: separation of concerns, typed API contract, CI on push, reproducible local setup.
- *Data Quality & Ethics*: Supabase becomes the documented system of record for user-contributed data; TMDB attribution lives in the footer and README.
- *Sales Pitch*: a real architecture diagram and a security slide are far more credible than "we deployed a Streamlit script."

---

## 1. Architecture Overview

```
                   ┌─────────────────────────────┐
                   │        User Browser         │
                   │  (https://cinematch.app or  │
                   │   cinematch-xxx.vercel.app) │
                   └──────────────┬──────────────┘
                                  │ HTTPS
                                  │ (sanitized inputs only)
                  ┌───────────────▼──────────────┐
                  │  Next.js 14 on Vercel        │
                  │  - App Router (RSC + Client) │
                  │  - Tailwind + shadcn/ui      │
                  │  - Supabase Auth client SDK  │
                  │  - DOMPurify on render       │
                  └─────┬─────────────────┬──────┘
                        │                 │
        Bearer JWT (Supabase)             │ Anon SSR fetch
                        │                 │
        ┌───────────────▼─────┐    ┌──────▼──────────┐
        │ FastAPI on Render   │    │ Supabase        │
        │  - /recommend       │    │  - Postgres     │
        │  - /search          │    │  - Auth (email) │
        │  - /health          │    │  - RLS policies │
        │  - slowapi limits   │    │  - Edge runtime │
        │  - Pydantic schemas │    └──────┬──────────┘
        │  - TMDB key (env)   │           │
        └─────┬───────────────┘           │
              │ HTTPS                     │
              │ (Bearer: TMDB_API_KEY)    │
        ┌─────▼─────────┐                 │
        │ TMDB v3 API   │◄────────────────┘
        └───────────────┘   (server-side cache writes)
```

Key invariant: **the browser never sees the TMDB key**. Every TMDB call is proxied through FastAPI, which authenticates the user via the Supabase JWT, applies rate limits, and writes auditable rows to Postgres.

---

## 2. PART 1 — Frontend

### 2.1 Stack & rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | RSC keeps the recommendation grid SEO-friendly and fast; tiny client bundle for the interactive bits. |
| Styling | **Tailwind CSS** | No custom CSS surface area for XSS via injected `<style>`; design system stays consistent. |
| Components | **shadcn/ui** + **lucide-react** icons | Accessible primitives (Radix under the hood) — gives you keyboard nav and ARIA labels for free. |
| Auth | **@supabase/ssr** | Handles cookie-based session for SSR; pairs with RLS automatically. |
| Sanitization | **isomorphic-dompurify** | Server- and client-safe HTML sanitizer for any TMDB-supplied text rendered as HTML. |
| Hosting | **Vercel** (free Hobby tier) | Edge CDN, automatic preview deploys per PR, generous free tier. |

### 2.2 Routes & components

```
app/
├── layout.tsx                 # Dark theme provider, font, Supabase server client
├── page.tsx                   # Landing: hero + trending row (RSC, cached 1h)
├── recommend/
│   └── [movieId]/page.tsx     # Server-rendered: poster + 12 similar titles
├── search/
│   └── page.tsx               # Client component, debounced TMDB search
├── library/
│   └── page.tsx               # Authed-only: user's saved favorites (RLS-gated)
├── login/page.tsx             # Supabase email magic-link
└── about/page.tsx             # Methodology, ethics, attribution
components/
├── MovieCard.tsx              # Poster + title + sanitized overview tooltip
├── RecommendationGrid.tsx     # Responsive grid, skeleton loaders
├── SearchBar.tsx              # Debounced (250ms), aria-live results
├── FavoriteButton.tsx         # Optimistic toggle, calls Supabase
└── Header.tsx / Footer.tsx    # Footer carries TMDB attribution per their TOS
lib/
├── supabase/{server,client}.ts
├── api.ts                     # Typed fetcher to FastAPI; reads NEXT_PUBLIC_API_URL
└── sanitize.ts                # DOMPurify wrapper with strict allowlist
```

### 2.3 UX & UI specification

**Visual language** — Netflix-inspired but distinct enough to read as ours:
- Background `#0B0B10` (near-black with a hint of blue). Surface `#16161E`. Accent `#E50914`-adjacent but desaturated to `#D9434C` to avoid trademark feel.
- Typography: **Inter** for UI, **DM Serif Display** for the wordmark. Tailwind's defaults plus `font-display`.
- Cards: 2:3 poster ratio, 8px radius, subtle 1px border `rgba(255,255,255,0.06)`, hover lift (`translate-y-[-2px]` + scale 1.02).
- Spacing: 8/16/24/40 grid. Container max-w `1280px`.

**Key flows:**

1. *First visit (anonymous)* → Landing shows a "Trending now" rail (cached on the server) and a giant search bar. Searching does not require login.
2. *Get recommendations* → User picks a movie from search → routed to `/recommend/[movieId]`. The page server-renders the source poster + 12 similar titles in a 4-column grid (2 col on mobile). Each card has a heart icon; clicking it prompts login if anonymous.
3. *Authenticated* → Header shows avatar + "Library" link. Library lists saved movies and lets the user click any of them to re-pivot the recommendations. Search history is shown in a collapsible side panel.
4. *Empty / error states* → Skeleton loaders for grids, friendly empty states with CTA, network error toast that retries with exponential backoff.

**Accessibility (concrete checklist):**
- All interactive elements reachable via Tab; visible focus ring (Tailwind `focus-visible:ring-2`).
- `aria-live="polite"` on the search results region.
- Color contrast ≥ 4.5:1 on all text (verified with Lighthouse in CI).
- Posters have `alt` text from TMDB, falling back to `"{title} poster"`.
- Respects `prefers-reduced-motion` (kills the hover transform).

**Mobile:** breakpoints `sm 640 / md 768 / lg 1024 / xl 1280`. Grid collapses 4→3→2 columns. Search bar becomes sticky at the top.

### 2.4 XSS defense (frontend layer)

Defense is layered — no single mechanism is the whole answer:

1. **Default to React's auto-escaping.** Render TMDB strings (title, overview, character names) as `{value}` — never via `dangerouslySetInnerHTML`. This kills 95% of XSS surface.
2. **DOMPurify allowlist** for the rare case overview text contains user-entered HTML (TMDB occasionally returns `<i>` tags). Wrapper in `lib/sanitize.ts`:
   ```ts
   import DOMPurify from 'isomorphic-dompurify';
   export const safeHtml = (raw: string) =>
     DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['i','em','b','strong','br'], ALLOWED_ATTR: [] });
   ```
3. **Strict Content-Security-Policy** via `next.config.js` headers:
   ```
   default-src 'self';
   img-src 'self' https://image.tmdb.org data:;
   script-src 'self' 'nonce-{NONCE}';
   style-src 'self' 'unsafe-inline';      // Tailwind needs this
   connect-src 'self' https://*.supabase.co https://api.cinematch.example;
   frame-ancestors 'none';
   base-uri 'self';
   form-action 'self';
   ```
4. **Input validation at the boundary.** Search input goes through a Zod schema (`z.string().min(1).max(120).regex(/^[\p{L}\p{N}\s\-:'.,!?&]+$/u)`) before it ever leaves the client.
5. **Cookies** — Supabase auth cookies are `HttpOnly`, `Secure`, `SameSite=Lax` (handled by `@supabase/ssr`).
6. **Trusted Types** (progressive enhancement) — set `Trusted-Types: 'cinematch-policy'` in dev to catch any drive-by sink usage during development.

### 2.5 Frontend deployment

- Connect the GitHub repo to Vercel; root directory `frontend/`.
- Env vars set in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon is safe to expose; RLS does the work).
  - `NEXT_PUBLIC_API_URL` → the Render backend URL.
- Preview deploys on every PR; Production deploys on push to `main`.
- Add a Vercel Web Analytics tag for the demo (free, privacy-friendly).

---

## 3. PART 2 — Backend

### 3.1 Stack & rationale

| Layer | Choice | Why |
|---|---|---|
| API | **FastAPI** (Python 3.11) | Reuses your existing `scikit-learn` code; Pydantic gives free input validation; OpenAPI docs are auto-generated for the rubric. |
| Server | **uvicorn** behind Render's reverse proxy | Render handles TLS, scaling, and zero-downtime deploys. |
| Rate limiting | **slowapi** (Limits + Redis-or-memory backend) | Per-IP and per-user limits with one decorator. |
| Auth | Verify Supabase JWTs via `python-jose` | Backend trusts only Supabase-signed tokens. |
| ML | Existing TF-IDF + cosine similarity (sklearn) | Same model the team already validated; no rebuild. |
| Caching | `cachetools` TTLCache for TMDB responses | Cuts TMDB call volume ~80%, helps stay inside their free quota. |
| Hosting | **Render** (free web service) | Free tier handles the load; spins down after 15 min idle (cold start ~10s — disclose in the cost slide). |

### 3.2 API surface

```
GET  /health                          → 200 {"ok": true, "version": "..."}
GET  /trending                        → 20 trending titles (cached 1h, public)
GET  /search?q=...                    → TMDB search proxy; sanitized + rate-limited
POST /recommend                       → body: {movie_id: int, k: 12}
                                        → returns ranked similar titles + scores
POST /favorites                       → AUTH; body: {movie_id} ; writes via Supabase
DELETE /favorites/{movie_id}          → AUTH
GET  /favorites                       → AUTH; returns user's saved movies
```

Every response shape is a Pydantic model — no untyped dicts cross the wire.

### 3.3 Project layout

```
backend/
├── app/
│   ├── main.py                # FastAPI app, CORS, middleware wiring
│   ├── deps.py                # get_current_user(), get_redis(), etc.
│   ├── settings.py            # pydantic-settings, reads env only
│   ├── limiter.py             # slowapi Limiter instance
│   ├── routers/
│   │   ├── recommend.py
│   │   ├── search.py
│   │   ├── favorites.py
│   │   └── health.py
│   ├── ml/
│   │   ├── model.py           # TF-IDF + cosine sim (lifted from app.py)
│   │   ├── corpus.py          # Loads + refreshes the in-memory corpus
│   │   └── tmdb.py            # Async httpx client, single source of TMDB calls
│   ├── schemas.py             # All Pydantic request/response models
│   └── security.py            # JWT verification, sanitization helpers
├── tests/                     # pytest, ≥80% coverage on routers + model
├── pyproject.toml             # uv / pip-tools
└── Dockerfile                 # multi-stage; final image < 250MB
```

### 3.4 No hardcoded API key — secrets management

Three rules, enforced mechanically:

1. **All secrets read via `pydantic-settings`** from environment variables. `app/settings.py`:
   ```python
   from pydantic_settings import BaseSettings, SettingsConfigDict
   class Settings(BaseSettings):
       tmdb_api_key: str
       supabase_jwt_secret: str
       supabase_url: str
       allowed_origins: list[str] = ["http://localhost:3000"]
       redis_url: str | None = None
       model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
   settings = Settings()  # raises on missing required vars at boot
   ```
   The app **fails loudly on startup** if `TMDB_API_KEY` is missing — better than discovering it at first request.
2. **`.env` is gitignored**; `.env.example` is committed with placeholder values.
3. **Pre-commit hook** (`detect-secrets` or `gitleaks`) blocks commits containing things that look like API keys. Configured as a GitHub Action so CI also fails on a leaked secret in any PR.
4. **Render** dashboard stores the real values; `TMDB_API_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `REDIS_URL`. Vercel stores its own subset (only public-prefixed Supabase vars + `NEXT_PUBLIC_API_URL`).

### 3.5 Rate limiting

`slowapi` wired at app level + per-route overrides. Two dimensions:

```python
# app/limiter.py
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(
    key_func=lambda req: req.state.user_id or get_remote_address(req),
    storage_uri=settings.redis_url or "memory://",
    default_limits=["120/hour", "20/minute"],
)
```

Per-route overrides:
- `/search`: `30/minute` (TMDB-bound; protects their quota and ours)
- `/recommend`: `60/minute` (our compute, cheap)
- `/favorites` POST/DELETE: `30/minute` (per user)
- `/health`: unlimited

Middleware adds `X-RateLimit-*` headers on every response so the frontend can render a friendly "slow down" toast. Excess returns `429` with `Retry-After`.

For production, point `REDIS_URL` at **Upstash Redis** (free tier, 10k commands/day — ample). In dev, falls back to in-memory.

### 3.6 RLS (Row-Level Security) on Supabase

Schema (run as a SQL migration committed at `supabase/migrations/0001_init.sql`):

```sql
-- profiles is created automatically by Supabase auth
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id integer not null,
  title text not null,
  poster_path text,
  added_at timestamptz default now(),
  primary key (user_id, movie_id)
);

create table public.search_history (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null check (length(query) <= 200),
  searched_at timestamptz default now()
);

-- TMDB metadata cache shared across users — public read, service-role write
create table public.movie_cache (
  movie_id integer primary key,
  payload jsonb not null,
  fetched_at timestamptz default now()
);

alter table public.favorites       enable row level security;
alter table public.search_history  enable row level security;
alter table public.movie_cache     enable row level security;

-- Users see only their own rows
create policy "favorites: select own" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites: insert own" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites: delete own" on public.favorites
  for delete using (auth.uid() = user_id);

create policy "history: select own" on public.search_history
  for select using (auth.uid() = user_id);
create policy "history: insert own" on public.search_history
  for insert with check (auth.uid() = user_id);

-- Movie cache: read-only for everyone (anon included), writes via service role
create policy "cache: read all" on public.movie_cache for select using (true);
-- No insert/update/delete policies → only service_role bypasses RLS
```

Validation step you will run before declaring this done: log in as User A, insert a favorite, then log in as User B and query `favorites` directly — must return zero rows. Document the test in `docs/security.md`.

### 3.7 XSS / injection defense (backend layer)

- **Pydantic models reject anything that isn't well-typed.** No string concatenation into responses.
- **TMDB strings sanitized server-side** with `bleach.clean(text, tags=[], attributes={})` before being persisted to `search_history` or returned to the client. Frontend re-sanitizes on render — defense in depth.
- **Parameterized queries only** (Supabase's SDK and SQLAlchemy never concatenate). Forbid raw `text()` SQL via a lint rule.
- **CORS allowlist** is exact origins, never `*`. Production allows only the Vercel production URL + preview URLs matching `https://cinematch-*.vercel.app`.
- **Security headers middleware** sets `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### 3.8 Backend deployment & observability

- **Dockerfile** → Render auto-builds on push to `main`. Health check path `/health`.
- **Env vars** set in Render dashboard (TMDB key, Supabase secrets, Redis URL).
- **Logs** stream to Render's built-in viewer; structured JSON via `structlog`.
- **Cost** at expected demo traffic: $0/mo. Document the breakeven math in the cost slide:
  - Vercel Hobby: free up to 100 GB bandwidth.
  - Render free web service: 750 hrs/mo (one always-on service fits).
  - Supabase free: 500 MB DB, 50k MAU.
  - Upstash Redis free: 10k commands/day.
  - TMDB API: free for non-commercial use with attribution.
  - First paid tier (~$30/mo total) hits at roughly 5k DAU — show this in the pitch as "the unit economics work."

---

## 4. PART 3 — `CLAUDE.md` (Claude Code optimization)

This file goes at the **repo root**. It's the single best leverage point for getting Claude Code to do the right thing without re-deriving context every session. Best practices applied: keep it under 200 lines, lead with conventions Claude must not violate, document non-obvious decisions, list exact commands, and mark the security rails so Claude doesn't accidentally regress them.

```markdown
# CLAUDE.md — CineMatch

You are working inside the CineMatch monorepo. This file is the source of truth for
how to operate in this codebase. Read it fully before any non-trivial change.

## What this is
Content-based movie recommender. Frontend (Next.js 14) calls a FastAPI backend
that wraps a TF-IDF + cosine similarity model over TMDB metadata. Supabase
provides Postgres, Auth, and Row-Level Security. Deployed on Vercel + Render.

## Repo layout
- `frontend/`  Next.js App Router app. TypeScript strict mode.
- `backend/`   FastAPI service. Python 3.11. `uv` for deps.
- `supabase/`  SQL migrations and seed data. Apply with `supabase db push`.
- `docs/`      Architecture, security, AI-usage attribution.
- `scripts/`   One-off ops scripts; never imported by the app.

## Rules you must not break
1. **No secrets in code.** Read every secret from env via `pydantic-settings`
   (backend) or `process.env` (frontend). If a value belongs in a `.env`, it
   belongs in `.env.example` too — with a placeholder.
2. **No bypassing RLS.** Backend uses the user's JWT for all reads. Service-role
   key is only used in the corpus-refresh script.
3. **No `dangerouslySetInnerHTML`** in frontend without a `safeHtml()` wrapper.
4. **No `eval`, `exec`, or raw SQL strings.** Parameterize everything.
5. **Don't widen CORS to `*`** in production config.
6. **Don't pin every dep tightly** in `requirements.txt` — Streamlit-cloud-style
   build hangs were the v1 lesson. Pin only when a regression is observed.

## Conventions
- Branches: `feat/*`, `fix/*`, `chore/*`. PRs squash-merge to `main`.
- Commits: Conventional Commits (`feat(api): add /trending`).
- TS: strict mode, no `any`, prefer `unknown` + narrow.
- Python: `ruff` + `mypy --strict` on `app/`. Tests in `pytest`.
- API contracts live in `backend/app/schemas.py`. The frontend types are
  generated from the OpenAPI doc with `openapi-typescript` (run `pnpm gen:api`).

## Commands
Frontend (run from `frontend/`):
- `pnpm dev` — local dev on :3000
- `pnpm build && pnpm start` — production build
- `pnpm test` — vitest
- `pnpm lint` — eslint + tsc --noEmit
- `pnpm gen:api` — regenerate types from backend OpenAPI

Backend (run from `backend/`):
- `uv run uvicorn app.main:app --reload` — local dev on :8000
- `uv run pytest` — tests
- `uv run ruff check .` — lint
- `uv run mypy app` — types

DB (run from repo root, requires Supabase CLI):
- `supabase start` — local Postgres + Studio
- `supabase db push` — apply migrations
- `supabase db reset` — wipe + reapply (dev only)

## Architecture notes Claude commonly gets wrong
- The TF-IDF matrix is built **lazily on first request**, not at module import,
  to keep cold-start under 8s on Render free tier. Don't move it back to import.
- `/search` proxies TMDB; never call TMDB from the frontend.
- The corpus is **augmented at runtime** when a user queries a movie not in the
  preloaded set. Preserve this behavior — it's what makes search feel complete.
  Implementation: `app/ml/corpus.py::ensure_movie()`.
- Supabase JWT verification uses `SUPABASE_JWT_SECRET`, not the anon key.

## How to add a new feature (the standard loop)
1. Write or update the Pydantic schema in `backend/app/schemas.py`.
2. Implement the route in the appropriate `routers/` file with rate limit + auth.
3. Add a pytest covering the happy path + one auth failure + one validation failure.
4. Run `pnpm gen:api` from `frontend/` to refresh the typed client.
5. Build the UI behind a feature flag if it's user-facing.
6. Update `docs/api.md` if the public surface changed.

## Definition of done
- All tests green; `ruff` and `mypy` clean; `pnpm lint` clean.
- New env vars added to both `.env.example` and the Render/Vercel dashboards.
- If the change touches auth or DB, update `docs/security.md` and re-run the
  RLS isolation test (see `docs/security.md#rls-isolation-test`).
- If the change touches the public API, regenerate frontend types.

## Out of scope (for this milestone)
- Collaborative filtering (planned v2).
- Native mobile.
- Internationalization beyond TMDB's default `en-US`.

## AI usage attribution
This project used Claude (Anthropic) for code generation and review. Document
each Claude-assisted change in `docs/ai-usage.md` with: what was generated,
who reviewed it, what was modified before merge.
```

Why this CLAUDE.md works:
- The "Rules you must not break" section is the first thing Claude reads after the intro — high primacy.
- "Architecture notes Claude commonly gets wrong" pre-empts the foot-guns (e.g., the lazy TF-IDF build is exactly the kind of thing a fresh agent would refactor "for cleanliness" and break cold starts).
- Exact commands prevent Claude from inventing `npm test` when the project uses `pnpm`.
- A "Definition of done" gives the agent a stop condition so it doesn't keep editing.

Optional companion files Claude Code respects:
- `.claude/commands/` for slash-commands like `/migrate-add` or `/refresh-corpus`.
- `frontend/CLAUDE.md` and `backend/CLAUDE.md` as scoped overrides if the directories grow.

---

## 5. PART 4 — Execution Timeline (5/10 → 5/14)

You have ~96 hours. Tight but doable because the model code already exists.

| When | Block | Output |
|---|---|---|
| **Sun 5/10 PM** | Repo split: create `frontend/`, `backend/`, `supabase/`. Move `app.py` model logic into `backend/app/ml/`. Write `CLAUDE.md`. Commit. | Repo skeleton + CLAUDE.md on `main`. |
| **Mon 5/11 AM** | Backend: settings, schemas, `/health`, `/trending`, `/search`, `/recommend`. Local run + smoke tests. | Working FastAPI on `localhost:8000`. |
| **Mon 5/11 PM** | Supabase project created. Migrations written + applied. RLS isolation test passes locally. Render deploy of backend. | Public backend URL responding. |
| **Tue 5/12 AM** | Frontend scaffold (Next.js + Tailwind + shadcn/ui). Landing + search + recommend pages wired to backend. Vercel preview deploy. | Public frontend URL responding. |
| **Tue 5/12 PM** | Auth flow (Supabase magic link). Library + favorites. RLS validated end-to-end. Rate limit headers verified in Network tab. | Authed flow demoable. |
| **Wed 5/13 AM** | Polish pass: skeletons, error states, mobile breakpoints, accessibility audit (Lighthouse ≥ 95). CSP headers shipped. | Production-quality UX. |
| **Wed 5/13 PM** | Docs sprint: README, `docs/architecture.md`, `docs/security.md`, `docs/cost.md`, `docs/ai-usage.md`. Individual contribution log updated. | Repo doc-complete. |
| **Thu 5/14 AM** | Slide deck (10–15 min): problem → demo → architecture → security → cost → ethics → roadmap. Dry run with timer. | Deck + delivery. |
| **Thu 5/14 12:30 pm** | Submit. | ✅ |

**Buffer rule:** if you're behind on Tue 5/12 PM, cut Library + favorites and present as anonymous-only. Auth + RLS becomes a documented "ready in v1.1" with the migrations and policies committed but unused. You still get the rubric points for thoughtful security thinking.

---

## 6. PART 5 — Deliverables Checklist (mapped to rubric)

| Rubric item (pts) | Deliverable | Where it lives |
|---|---|---|
| Data Quality & Ethics (15) | Attribution footer; `docs/data.md` (TMDB terms, DMCA story, bias notes on TMDB's Western catalog skew); Supabase data dictionary | `docs/data.md`, app footer |
| Model Development (20) | `docs/model.md`: TF-IDF rationale, comparison vs. count-vectorizer baseline, cosine vs. Euclidean ablation, k-tuning notes | `docs/model.md`, `backend/notebooks/eval.ipynb` |
| Deployment & Accessibility (15) | Public Vercel URL + Render URL; `docs/deployment.md`; `docs/cost.md` with breakeven math | README badges, `docs/` |
| Technical Execution (15) | Clean repo, CI green, 80%+ test coverage on backend, typed frontend client, CLAUDE.md | GitHub Actions, repo root |
| Team Presentation (15) | 10–15 min deck (`pptxgenjs`), live demo, Q&A prep doc | `presentation/` folder |
| Individual Contribution (30) | Updated `contribution_log.md`; commit history is yours; peer eval submitted | repo root, course portal |

---

## 7. PART 6 — Risk Register & Fallbacks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Render cold start kills demo | High | Medium | Hit `/health` from a Vercel cron 60s before the demo to warm it. Mention "free-tier cold start" in the cost slide as deliberate. |
| Supabase auth mis-config blocks login during demo | Medium | High | Have a screen-recorded fallback demo of the authed flow as a fail-safe slide. |
| TMDB rate limit during demo | Low | High | Pre-warm `movie_cache` for the titles you'll demo. Add a `scripts/seed_demo_cache.py`. |
| Vercel CSP blocks Tailwind in prod but not dev | Medium | Medium | Test the production build (`pnpm build && pnpm start`) at least once on Wed 5/13 AM. |
| Time slip past Tue 5/12 PM | Medium | High | Apply the buffer rule (drop auth/favorites, present anonymous-only). |
| Teammates show up late asking to commit | Medium | Low | Keep `contribution_log.md` honest. Per the rubric, individual scores can diverge — peer evals will reflect this. |

---

## 8. Three architectural alternatives you could substitute (and why I didn't)

Per your instruction to consider multiple perspectives:

1. **Keep Streamlit, add a small FastAPI service for the TMDB proxy + Supabase for state.**
   *Pros:* fastest path; no UI rewrite. *Cons:* Streamlit doesn't render a CSP-protected, accessible UI well; the rubric's "professional interface" line is hard to hit. *Verdict:* viable fallback if Mon 5/11 goes sideways.

2. **Single Next.js app with API routes, no separate FastAPI.** Run sklearn via a Python sidecar on Vercel? You can't — Vercel functions are JS/Edge only. You'd need to port TF-IDF to JS (`natural` package) and lose model parity. *Verdict:* rejected — model integrity matters more than architectural minimalism.

3. **Replace TF-IDF with a hosted embedding model (OpenAI, Voyage, or `sentence-transformers` on HuggingFace).** Better recommendations, especially on plot semantics. *Pros:* model story upgrades from "Proficient" to "Exemplary." *Cons:* introduces a paid API key + latency. *Verdict:* mention as a "v1.1 roadmap" in the deck — earns Exemplary points on Model Development without risking the timeline.

---

## 9. The first three commands to run right now

```bash
# 1. Create the new structure inside your existing repo
mkdir -p frontend backend supabase docs scripts presentation
git mv app.py backend/legacy_streamlit_app.py    # keep history; freeze v1
git mv requirements.txt backend/legacy_requirements.txt

# 2. Drop the CLAUDE.md from this plan into the repo root
$EDITOR CLAUDE.md     # paste the block from PART 3 above

# 3. Hand the repo + CLAUDE.md to Claude Code and have it scaffold backend/ first
```

From there, Claude Code has enough structure to take over implementation while you focus on the deck and the contribution log.
