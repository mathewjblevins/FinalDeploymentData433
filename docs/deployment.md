# CineMatch — Deployment Guide

## Architecture Summary

| Service | Platform | URL pattern |
|---|---|---|
| Frontend | Vercel Hobby | [final-deployment-data433.vercel.app](https://final-deployment-data433.vercel.app/) |
| Backend | Render free web service | [finaldeploymentdata433.onrender.com](https://finaldeploymentdata433.onrender.com) |
| Database | Supabase free tier | https://api.themoviedb.org/3 |
| Legacy v1 | Streamlit Community Cloud | https://cinematch-ecpkof7qdeuacyfewyiffa.streamlit.app |

---

## Backend — Render

### First deploy

1. Push the repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect repo.
3. Set:
   - **Root directory:** `backend`
   - **Runtime:** Docker
   - **Health check path:** `/health`
4. Add environment variables in the Render dashboard:

| Key | Value |
|---|---|
| `TMDB_API_KEY` | Your TMDB developer API key |
| `SUPABASE_URL` | From Supabase Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | From Supabase Settings → API → anon key |
| `SUPABASE_JWT_SECRET` | From Supabase Settings → API → JWT Settings |
| `REDIS_URL` | Upstash Redis URL (optional; leave blank to use in-memory) |
| `ALLOWED_ORIGINS` | `["https://your-app.vercel.app","https://cinematch-*.vercel.app"]` |
| `ENVIRONMENT` | `production` |

5. Deploy. First build takes ~3 min. Subsequent deploys auto-trigger on push to `main`.

### Cold start note

Render free tier spins down after 15 minutes of inactivity. Cold start takes ~10s. To avoid a dead demo, hit `/health` from a Vercel cron 60s before presenting:

```json
// vercel.json  (add to frontend root)
{
  "crons": [{
    "path": "/api/warmup",
    "schedule": "*/14 * * * *"
  }]
}
```

`frontend/app/api/warmup/route.ts` — makes a `GET` to `${NEXT_PUBLIC_API_URL}/health`.

---

## Frontend — Vercel

### First deploy

1. Go to [vercel.com](https://vercel.com) → **New Project** → import the GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variables:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose) |
| `NEXT_PUBLIC_API_URL` | Render backend URL (no trailing slash) |

4. Deploy. Preview deploys auto-generate on every PR.

---

## Database — Supabase

### First setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Install [Supabase CLI](https://supabase.com/docs/guides/cli).
3. From the repo root:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   supabase db push
   ```
4. Verify tables exist in Supabase Studio → Table Editor.

### Migrations

All schema changes go in `supabase/migrations/` as numbered SQL files. Apply with `supabase db push`.

---

## Local Development

```bash
# Backend
cd backend
cp .env.example .env   # fill in real values
python -m uv venv .venv
python -m uv pip install -e ".[dev]"
.venv/Scripts/activate  # or source .venv/bin/activate on Mac/Linux
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
cp .env.example .env.local  # fill in values
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`. Backend at `http://localhost:8000`.

---

## CI / Continuous Deployment

GitHub Actions (`.github/workflows/ci.yml`) runs on every push:

1. `uv run ruff check app/` — Python lint
2. `uv run mypy app` — Python types
3. `uv run pytest --cov=app --cov-report=xml` — tests + coverage
4. `gitleaks detect --source . --redact` — secret scan

Vercel and Render auto-deploy on push to `main`. Preview deploys on PRs.
