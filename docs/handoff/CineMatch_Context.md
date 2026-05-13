# CineMatch — Project Context (carried forward from Milestones 1–4)

## Owner & team
- **Owners** Mathew Blevins, Joseph Scheele, Tyler Johnson (Valparaiso University, Spring 2025, DATA 433).
- **Course requirement:** semester-long group project culminating in a deployed, marketable ML tool.

## Product
- **Name:** CineMatch.
- **What it is:** content-based movie recommendation system. Given a movie the user likes, return similar titles.
- **How it works today:**
  - Metadata pulled from the **TMDB API** (substituted for the TMDB 5000 Kaggle dataset after a DMCA takedown of that dataset).
  - **TF-IDF vectorization** over a combined text field (overview + genres + keywords + cast/crew snippets) using `scikit-learn`.
  - **Cosine similarity** for ranking; top-k returned.
  - **Dynamic corpus fallback:** if the queried movie isn't in the preloaded corpus, the app hits TMDB search, fetches the missing movie, appends it to the corpus, and rebuilds the similarity matrix on the fly. This is what makes the search feel complete despite a small preload set.

## Current deployment (v1, Milestone 4)
- **Frontend + app:** **Streamlit** with a Netflix-inspired dark UI.
- **Hosting:** **Streamlit Community Cloud** via GitHub.
- **Files shipped:** `app.py`, `requirements.txt`, `.streamlit/config.toml`, `README.md`, `.gitignore`, `contribution_log.md`, project zip.

## Hard-won lessons from prior milestones (do not relearn)
- **Streamlit Cloud build hangs** were caused by tightly pinned versions in `requirements.txt`. Removing pins so prebuilt wheels could be used resolved it. Pin only when a regression is observed.
- **Raw HTML via `st.markdown` glitched** the movie cards. Replacing with `st.image` + `st.caption` was the reliable path. (Carries forward as: prefer typed components over raw HTML wherever possible.)
- The dynamic corpus fallback (above) is load-bearing for UX. Don't refactor it away.
- Mathew explicitly chose to **skip popularity blending and keyword enrichment** to ship the MVP on time. These are open opportunities for v1.1 if scope allows.

## Working style & priorities
- **End-to-end execution preferred** with minimal back-and-forth. Mathew wants the agent to handle implementation fully, not coach him through it.
- **Time-pressured** — prioritize working output over polish or architectural perfection.
- **Pragmatic scoping under pressure** — cuts features to ship rather than missing the deadline.
- Keeps coursework strictly separate from outside research (a fire-department staffing optimization project) — do not conflate.

## Tools & resources already in place
- **Languages/frameworks:** Python, Streamlit, scikit-learn.
- **APIs:** TMDB Developer API (Mathew's own registered key — must move to env var, never commit).
- **Deployment:** Streamlit Community Cloud + GitHub (will be augmented, not replaced, for Milestone 5).
- **Presentation tooling:** `pptxgenjs` was used to generate the Milestone 3 deck — reuse for the Milestone 5 deck.
