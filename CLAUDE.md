# CLAUDE.md — CineMatch

You are working inside the CineMatch monorepo. This file is the source of truth for
how to operate in this codebase. Read it fully before any non-trivial change.

## What this is
Content-based movie recommender. Frontend (Next.js 14) calls a FastAPI backend
that wraps a TF-IDF + cosine similarity model over TMDB metadata. Supabase
provides Postgres, Auth, and Row-Level Security. Deployed on Vercel + Render.

## Repo layout
- `frontend/`  Next.js App Router app. TypeScript strict mode.
- `backend/`   FastAPI service. Python 3.11+. `uv` for deps.
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
6. **Don't pin every dep tightly** in `pyproject.toml` — Streamlit-cloud-style
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
