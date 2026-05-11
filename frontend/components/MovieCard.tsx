import Link from 'next/link'
import { plainText } from '@/lib/sanitize'
import type { MovieCard as MovieCardType } from '@/lib/api'

interface Props {
  movie: MovieCardType
  score?: number
}

export default function MovieCard({ movie, score }: Props) {
  const year = movie.release_date?.slice(0, 4) ?? 'N/A'
  const title = plainText(movie.title)
  const displayTitle = title.length > 28 ? title.slice(0, 26) + '…' : title

  return (
    <Link
      href={`/recommend/${movie.movie_id}`}
      className="block group rounded-lg overflow-hidden bg-surface border border-white/5 hover:-translate-y-0.5 hover:scale-[1.02] motion-safe:transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`${title} — get recommendations`}
    >
      {movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={`${title} poster`}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-full aspect-[2/3] bg-surface/60 flex items-center justify-center text-muted text-xs text-center p-2"
        >
          No image
        </div>
      )}
      <div className="p-2">
        {score !== undefined && (
          <span className="inline-block bg-accent text-white text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded mb-1 uppercase">
            {Math.round(score * 100)}% match
          </span>
        )}
        <p className="font-medium text-sm leading-snug">{displayTitle}</p>
        <p className="text-muted text-xs mt-0.5">
          {year} · {movie.vote_average.toFixed(1)}★
        </p>
      </div>
    </Link>
  )
}
