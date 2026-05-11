import MovieCard from './MovieCard'
import type { MovieCard as MovieCardType } from '@/lib/api'

interface Props {
  movies: MovieCardType[]
  scores?: number[]
}

export default function RecommendationGrid({ movies, scores }: Props) {
  if (movies.length === 0) {
    return <p className="text-muted text-sm">No recommendations available.</p>
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {movies.map((movie, i) => (
        <li key={movie.movie_id}>
          <MovieCard movie={movie} score={scores?.[i]} />
        </li>
      ))}
    </ul>
  )
}
