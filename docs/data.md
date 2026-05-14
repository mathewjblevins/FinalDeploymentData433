# CineMatch — Data Documentation

## Data Source

**TMDB (The Movie Database) API v3**
- URL: https://api.themoviedb.org/3
- Terms: Non-commercial use permitted with attribution. TMDB is not affiliated with or endorsed by this project.
- Fields used: `id`, `title`, `overview`, `genre_ids`, `poster_path`, `vote_average`, `release_date`, `popularity`
- Attribution required: Footer + About page carry the TMDB logo and required attribution text.

### Why TMDB (not Kaggle)

The originally planned TMDB 5000 Movies dataset was removed from Kaggle following a DMCA takedown during Milestone 3. We pivoted to pulling data directly from the live TMDB API, which:
1. Avoids the IP issue entirely (licensed use)
2. Gives us real-time data rather than a 2017 snapshot
3. Enables the dynamic corpus fallback (key differentiator)

---

## Data Dictionary

### `movie_cache` table (Supabase)

| Column | Type | Description |
|---|---|---|
| `movie_id` | integer PK | TMDB movie ID |
| `payload` | jsonb | Full sanitized TMDB response |
| `fetched_at` | timestamptz | When this row was inserted/refreshed |

### `favorites` table (Supabase)

| Column | Type | Description |
|---|---|---|
| `user_id` | uuid | Foreign key to `auth.users` |
| `movie_id` | integer | TMDB movie ID |
| `title` | text | Movie title (sanitized at write time) |
| `poster_path` | text | TMDB poster path (e.g., `/abc.jpg`) |
| `added_at` | timestamptz | When the user saved the movie |

### `search_history` table (Supabase)

| Column | Type | Description |
|---|---|---|
| `id` | bigserial PK | Auto-increment |
| `user_id` | uuid | Foreign key to `auth.users` |
| `query` | text | Search string (max 200 chars; sanitized) |
| `searched_at` | timestamptz | When the search was made |

---

## Data Quality

### Strengths
- Real-time TMDB data with high accuracy for mainstream titles
- Text normalization via `bleach` strips HTML injection artifacts in TMDB overviews
- Genres are weighted 3× in the TF-IDF feature to improve genre-based similarity

### Limitations & Biases

1. **Western catalog bias:** TMDB's most popular/top-rated lists skew toward English-language Hollywood releases. Non-English films are underrepresented in the preloaded corpus.
2. **Overview quality variance:** Short overviews (taglines, placeholder text) produce poor TF-IDF features. Niche or older films are more likely to have thin metadata.
3. **Cold-start for obscure titles:** The dynamic corpus fallback fetches missing movies from TMDB on demand, but their recommendations may be lower quality because they're scored against a corpus that doesn't include other niche films.
4. **No collaborative signal:** Content-based only; user behavior patterns are ignored. A user who loves horror but searches for "The Notebook" will get romance recommendations, not horror.

### Planned improvements (v1.1)
- Seed corpus with curated international films (Korean, French, Indian cinema)
- Add keyword/cast enrichment to features
- Introduce a popularity-blending factor (e.g., `score * log(popularity)`) to surface well-known hidden gems

---

## DMCA / Copyright Notes

- We do not host or distribute any movie metadata statically. All data is fetched from TMDB at runtime under their API terms.
- Poster images are served via `image.tmdb.org` CDN with proper attribution; we do not cache images ourselves.
- User-generated data (favorites, search history) belongs to the user and is stored in a private RLS-protected table. We do not sell or share it.
