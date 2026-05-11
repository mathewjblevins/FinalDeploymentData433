const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface MovieCard {
  movie_id: number
  title: string
  overview: string
  genres: string
  poster_path: string | null
  poster_url: string | null
  vote_average: number
  release_date: string | null
  popularity: number
}

export interface SearchResult {
  movie_id: number
  title: string
  overview: string
  release_date: string | null
  poster_path: string | null
  poster_url: string | null
  vote_average: number
}

export interface RecommendResponse {
  source: MovieCard
  recommendations: MovieCard[]
  scores: number[]
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
}

export interface TrendingResponse {
  movies: MovieCard[]
}

export interface FavoriteOut {
  movie_id: number
  title: string
  poster_path: string | null
  added_at: string
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!resp.ok) {
    throw new Error(`API error ${resp.status}: ${await resp.text()}`)
  }
  return resp.json() as Promise<T>
}

export async function getTrending(): Promise<TrendingResponse> {
  return apiFetch<TrendingResponse>('/trending', { next: { revalidate: 3600 } })
}

export async function searchMovies(q: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q })
  return apiFetch<SearchResponse>(`/search?${params}`, { cache: 'no-store' })
}

export async function getRecommendations(
  movieId: number,
  k = 12
): Promise<RecommendResponse> {
  return apiFetch<RecommendResponse>('/recommend', {
    method: 'POST',
    body: JSON.stringify({ movie_id: movieId, k }),
    next: { revalidate: 3600 },
  })
}

export async function getFavorites(jwt: string): Promise<FavoriteOut[]> {
  const data = await apiFetch<{ favorites: FavoriteOut[] }>('/favorites', {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${jwt}` },
  })
  return data.favorites
}

export async function addFavorite(
  jwt: string,
  movieId: number,
  title: string,
  posterPath: string | null
): Promise<void> {
  await apiFetch('/favorites', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ movie_id: movieId, title, poster_path: posterPath }),
  })
}

export async function removeFavorite(jwt: string, movieId: number): Promise<void> {
  await apiFetch(`/favorites/${movieId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  })
}
