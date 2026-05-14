# CineMatch

**CineMatch** is a content-based movie recommendation engine. Tell it a movie you love and it returns 12 similar titles ranked by semantic similarity using TF-IDF vectorization over TMDB metadata. No behavioral tracking, no black-box collaborative filter: the recommendation logic is fully explainable.

> Built for DATA 433 (Machine Learning & Data Mining) at Valparaiso University, Spring 2026.

---

## Live URLs

| Service | URL |
|---|---|
| **Frontend (production)** | [final-deployment-data433.vercel.app](https://final-deployment-data433.vercel.app/) |
| **Backend API** | [finaldeploymentdata433.onrender.com](https://finaldeploymentdata433.onrender.com) |
| **Legacy v1 (Streamlit)** | [cinematch-ecpkof7qdeuacyfewyiffa.streamlit.app](https://cinematch-ecpkof7qdeuacyfewyiffa.streamlit.app/) |
| **Slide deck** | [presentation/cinematch_milestone5.pptx](presentation/cinematch_milestone5.pptx) |

---

## Local Setup (5 commands)

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/cinematch.git && cd cinematch

# Backend
cd backend && cp .env.example .env   # fill in TMDB_API_KEY + Supabase vars
python -m uv pip install -e ".[dev]" && uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend && cp .env.example .env.local   # fill in Supabase + API URL
pnpm install && pnpm dev
```

App runs at **http://localhost:3000** · Backend at **http://localhost:8000** · API docs at **http://localhost:8000/docs**

---

## How It Works

1. **Data:** Movie metadata fetched live from the [TMDB API](https://www.themoviedb.org) (overview, genres, ratings, posters).
2. **Vectorization:** TF-IDF over a combined text field (overview + genres × 3 weighting).
3. **Similarity:** Cosine similarity matrix built lazily on first request (keeps cold start < 8s).
4. **Dynamic fallback:** If you search a movie not in the preloaded corpus, it's fetched from TMDB, appended, and the matrix rebuilds, so search always feels complete.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS, lucide-react |
| Auth | Supabase email magic-link, `@supabase/ssr` |
| Backend | FastAPI, uvicorn, pydantic-settings |
| ML | scikit-learn (TF-IDF + cosine similarity) |
| Rate limiting | slowapi, Upstash Redis |
| Database | Supabase Postgres with Row-Level Security |
| Frontend host | Vercel Hobby |
| Backend host | Render free web service |

---

## Security

- No hardcoded secrets: all keys read from environment variables
- Rate limiting: 30 req/min on search, 60 req/min on recommendations
- RLS: User A cannot read User B's favorites (verified and documented in [docs/security.md](docs/security.md))
- XSS defense: CSP headers + DOMPurify + bleach server-side sanitization

---

## Documentation

- [Architecture](docs/architecture.md)
- [Security](docs/security.md)
- [Deployment](docs/deployment.md)
- [Cost model](docs/cost.md)
- [Data & Ethics](docs/data.md)
- [Model documentation](docs/model.md)
- [AI usage attribution](docs/ai-usage.md)

---

## Attribution

This product uses the [TMDB API](https://www.themoviedb.org) but is not endorsed or certified by TMDB.

---

## License

MIT. See [LICENSE](LICENSE).
