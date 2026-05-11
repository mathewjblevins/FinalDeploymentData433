'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { z } from 'zod'
import { searchMovies, type SearchResult } from '@/lib/api'
import SearchBar from '@/components/SearchBar'
import Link from 'next/link'

const querySchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{N}\s\-:'.,!?&]+$/u)

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(async (q: string) => {
    const parsed = querySchema.safeParse(q)
    if (!parsed.success) return

    setLoading(true)
    setError(null)
    try {
      const data = await searchMovies(parsed.data)
      setResults(data.results)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length >= 2) {
      debounceRef.current = setTimeout(() => handleSearch(q.trim()), 250)
    } else {
      setResults([])
    }
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl text-muted tracking-widest mb-8">Search</h1>

      <div className="max-w-2xl mb-8">
        <SearchBar
          value={query}
          onChange={handleChange}
          autoFocus
          placeholder="Search for a movie…"
        />
      </div>

      <div
        role="region"
        aria-live="polite"
        aria-label="Search results"
      >
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg aspect-[2/3] animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-400">{error}</p>}

        {!loading && results.length === 0 && query.length >= 2 && (
          <p className="text-muted">No results for &ldquo;{query}&rdquo;. Try a different title.</p>
        )}

        {!loading && results.length > 0 && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((movie) => (
              <li key={movie.movie_id}>
                <Link
                  href={`/recommend/${movie.movie_id}`}
                  className="block rounded-lg overflow-hidden bg-surface border border-white/5 hover:-translate-y-0.5 hover:scale-[1.02] transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={`${movie.title} poster`}
                      className="w-full aspect-[2/3] object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-surface flex items-center justify-center text-muted text-xs text-center p-2">
                      No image
                    </div>
                  )}
                  <div className="p-2">
                    <p className="font-medium text-sm truncate">{movie.title}</p>
                    <p className="text-muted text-xs">
                      {movie.release_date?.slice(0, 4) ?? 'N/A'} ·{' '}
                      {movie.vote_average.toFixed(1)}★
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
