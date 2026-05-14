# CineMatch — Architecture

## Overview

CineMatch is a two-tier content-based movie recommendation system:

```
User Browser
     │ HTTPS
     ▼
Next.js 15 on Vercel (frontend/)
  - App Router (RSC + Client components)
  - Tailwind CSS + lucide-react
  - Supabase Auth (cookie-based SSR sessions)
  - DOMPurify (isomorphic) for HTML sanitization
     │                      │
Bearer JWT (Supabase)        │ Anon SSR fetch (revalidate: 3600)
     │                      │
     ▼                      ▼
FastAPI on Render        Supabase Postgres
  - /health               - favorites table (RLS)
  - /trending             - search_history table (RLS)
  - /search               - movie_cache table (public read)
  - /recommend (POST)     - Auth (email magic link)
  - /favorites CRUD
  - slowapi rate limits
  - Pydantic schemas
  - TMDB key (env only)
     │
     ▼
TMDB v3 API (server-side only; browser never sees the key)
```

## Key Invariants

1. **TMDB key lives only on Render**: it never reaches the browser.
2. **TF-IDF matrix is built lazily on first `/recommend` call**, not at import time. This keeps Render free-tier cold starts under 8s.
3. **Dynamic corpus fallback**: if a queried `movie_id` isn't in the preloaded corpus, `corpus.py::ensure_movie()` fetches it from TMDB, appends the row, and signals the model to rebuild. This is what makes searches feel complete despite a small preload set.
4. **CORS allowlist is exact**: production allows only the Vercel production URL and `cinematch-*.vercel.app` preview URLs.

## Component Responsibilities

### frontend/

| Component | Responsibility |
|---|---|
| `app/layout.tsx` | Dark theme, fonts, Header/Footer shell |
| `app/page.tsx` | Landing: trending row (RSC, cached 1h) |
| `app/search/page.tsx` | Client-side search with 250ms debounce |
| `app/recommend/[movieId]/page.tsx` | Server-rendered recommendation page |
| `app/library/page.tsx` | Authed-only favorites list |
| `components/MovieCard.tsx` | Poster + metadata card with sanitized title |
| `components/MovieHero.tsx` | Source movie detail with `safeHtml()` overview |
| `lib/sanitize.ts` | DOMPurify wrapper; only approved HTML render path |
| `lib/api.ts` | Typed fetcher to FastAPI; reads `NEXT_PUBLIC_API_URL` |
| `next.config.js` | CSP headers, HSTS, X-Frame-Options |

### backend/

| Module | Responsibility |
|---|---|
| `app/settings.py` | `pydantic-settings`: reads all secrets from env; fails loudly if missing |
| `app/ml/tmdb.py` | Async TMDB client with TTLCache (1h) |
| `app/ml/corpus.py` | In-memory movie DataFrame; lazy load + dynamic augmentation |
| `app/ml/model.py` | TF-IDF + cosine similarity; lazy matrix build |
| `app/routers/recommend.py` | POST /recommend with 60/min rate limit |
| `app/routers/search.py` | GET /search with 30/min rate limit |
| `app/routers/favorites.py` | Authed CRUD; Supabase client scoped to user JWT |
| `app/security.py` | JWT verification + `bleach` sanitization |

## Data Flow: Recommendation Request

```
1. Browser → GET /recommend/550
2. Next.js RSC → POST http://render-backend/recommend {movie_id:550, k:12}
3. FastAPI → checks corpus for movie_id 550
   3a. If found: score against TF-IDF matrix
   3b. If not found: fetch TMDB, append to corpus, rebuild matrix, score
4. Return ranked list → Next.js renders MovieCard grid
5. Page cached with revalidate:3600 (Vercel edge)
```

## Deployment Topology

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel Hobby | Root dir: `frontend/`, env vars in dashboard |
| Backend | Render free web service | Dockerfile, env vars in dashboard |
| Database | Supabase free | Migrations in `supabase/migrations/` |
| Rate limiting | Upstash Redis (free tier) | Optional; falls back to in-memory |
| Legacy v1 | Streamlit Community Cloud | `backend/legacy_streamlit_app.py` |
