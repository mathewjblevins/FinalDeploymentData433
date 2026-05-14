# CineMatch: Contribution Log

Honest, commit-by-commit record of who did what. Per course policy, individual scores reflect individual contributions.

Note: Tyler Johnson and Joseph Scheele are listed as teammates on the course roster but made no verified contributions to this codebase across any milestone.

---

## Milestone 1: Project Proposal

| Date | Contributor | Contribution |
|---|---|---|
| Jan 2026 | Mathew Blevins, Joseph Scheele, Tyler Johnson | Project concept, TMDB API research, proposal write-up, submission |

---

## Milestone 2: Data Pipeline

| Date | Contributor | Contribution |
|---|---|---|
| Feb 2026 | Mathew Blevins | TMDB API integration, pandas data pipeline, initial TF-IDF prototype |
| Feb 2026 | Mathew Blevins | Pivot from Kaggle TMDB dataset to live TMDB API after DMCA takedown |

---

## Milestone 3: Modeling & Deck

| Date | Contributor | Contribution |
|---|---|---|
| Mar 2026 | Mathew Blevins | TF-IDF + cosine similarity model, ablation vs. CountVectorizer, pptxgenjs deck |
| Mar 2026 | Mathew Blevins | Genres x3 weighting feature engineering |

---

## Milestone 4: Streamlit Deployment

| Date | Contributor | Contribution |
|---|---|---|
| Apr 2026 | Mathew Blevins | Streamlit app (`app.py`), Netflix-inspired UI, dynamic corpus fallback, Streamlit Cloud deployment |
| Apr 2026 | Mathew Blevins | Resolved build hang caused by tightly pinned `requirements.txt`; moved to loose pins |

---

## Milestone 5: Final Product (May 2026)

| Date | Contributor | Contribution |
|---|---|---|
| 2026-05-10 | Mathew Blevins | Initialized git repo, directory skeleton, `.gitignore`, `CLAUDE.md` |
| 2026-05-10 | Mathew Blevins | Moved legacy `app.py` to `backend/legacy_streamlit_app.py` |
| 2026-05-10 | Mathew Blevins | Built FastAPI backend: `settings.py`, `schemas.py`, `security.py`, `deps.py`, `limiter.py` |
| 2026-05-10 | Mathew Blevins | Ported ML pipeline to `backend/app/ml/` (tmdb.py, corpus.py, model.py) preserving dynamic corpus fallback |
| 2026-05-10 | Mathew Blevins | Implemented all API routers: `/health`, `/trending`, `/search`, `/recommend`, `/favorites` |
| 2026-05-10 | Mathew Blevins | Wrote Supabase SQL migrations with RLS policies (`supabase/migrations/0001_init.sql`) |
| 2026-05-10 | Mathew Blevins | Wrote backend Dockerfile (multi-stage, <250 MB) and `pyproject.toml` |
| 2026-05-10 | Mathew Blevins | Wrote pytest test suite: 24/24 tests passing; ruff + mypy clean |
| 2026-05-11 | Mathew Blevins | Scaffolded Next.js 15 frontend: `package.json`, `tsconfig.json`, Tailwind config |
| 2026-05-11 | Mathew Blevins | Built all frontend pages: landing, search, recommend/[movieId], library, login, about |
| 2026-05-11 | Mathew Blevins | Built all frontend components: Header, Footer, SearchBar, MovieCard, MovieHero, RecommendationGrid |
| 2026-05-11 | Mathew Blevins | Wired CSP headers via `next.config.js`; implemented `lib/sanitize.ts` (DOMPurify wrapper) |
| 2026-05-11 | Mathew Blevins | Wrote all docs: architecture, security, deployment, cost, data, model, ai-usage |
| 2026-05-11 | Mathew Blevins | Generated 13-slide pptxgenjs deck (`presentation/cinematch_milestone5.pptx`) |
| 2026-05-11 | Mathew Blevins | Wrote README and this contribution log |
| 2026-05-11 | Mathew Blevins | Pushed repo to GitHub (`mathewjblevins/FinalDeploymentData433`) |
| 2026-05-11 | Mathew Blevins | Deployed backend to Render (`finaldeploymentdata433.onrender.com`); resolved pydantic-settings ALLOWED_ORIGINS parse error and Dockerfile path issue |
| 2026-05-11 | Mathew Blevins | Deployed frontend to Vercel (`final-deployment-data433.vercel.app`); fixed Next.js 15 async params, force-dynamic pages, ESLint block disable, replaced isomorphic-dompurify with server-safe sanitizer |
| 2026-05-11 | Mathew Blevins | Applied Supabase migrations; wired production env vars across Render + Vercel |
