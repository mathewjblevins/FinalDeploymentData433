import type { MovieCard } from '@/lib/api'
import { safeHtml } from '@/lib/sanitize'

interface Props {
  movie: MovieCard
}

export default function MovieHero({ movie }: Props) {
  const year = movie.release_date?.slice(0, 4) ?? 'N/A'
  const safeOverview = safeHtml(movie.overview)

  return (
    <section aria-label={`${movie.title} details`} className="flex flex-col sm:flex-row gap-8">
      {movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={`${movie.title} poster`}
          className="w-40 sm:w-56 rounded-lg object-cover flex-shrink-0 self-start"
        />
      ) : (
        <div className="w-40 sm:w-56 aspect-[2/3] rounded-lg bg-surface flex items-center justify-center text-muted text-sm flex-shrink-0">
          No image
        </div>
      )}

      <div className="flex-1">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">
          {movie.title}{' '}
          <span className="text-muted font-sans text-xl">({year})</span>
        </h1>
        <p className="text-muted text-sm mb-1">
          {'★'.repeat(Math.round(movie.vote_average / 2))}{' '}
          {movie.vote_average.toFixed(1)}/10
        </p>
        {movie.genres && (
          <p className="text-muted text-sm mb-4">{movie.genres}</p>
        )}
        {/* eslint-disable no-restricted-syntax */}
        {/* safeHtml() sanitizes before this point — only approved usage site */}
        <p
          className="text-sm leading-relaxed text-white/80"
          dangerouslySetInnerHTML={{ __html: safeOverview }}
        />
        {/* eslint-enable no-restricted-syntax */}
      </div>
    </section>
  )
}
