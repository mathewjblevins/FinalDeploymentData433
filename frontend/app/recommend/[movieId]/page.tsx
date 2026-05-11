import { getRecommendations } from '@/lib/api'
import RecommendationGrid from '@/components/RecommendationGrid'
import MovieHero from '@/components/MovieHero'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ movieId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { movieId } = await params
  const id = Number(movieId)
  if (isNaN(id)) return { title: 'Not Found' }
  try {
    const data = await getRecommendations(id, 12)
    return { title: `${data.source.title} — CineMatch` }
  } catch {
    return { title: 'CineMatch Recommendations' }
  }
}

export default async function RecommendPage({ params }: Props) {
  const { movieId } = await params
  const id = Number(movieId)
  if (isNaN(id) || id <= 0) notFound()

  let data
  try {
    data = await getRecommendations(id, 12)
  } catch {
    notFound()
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-10">
      <MovieHero movie={data.source} />

      <hr className="border-white/10 my-10" />

      <h2 className="font-display text-2xl text-muted tracking-widest mb-6">
        Top Recommendations
      </h2>
      <RecommendationGrid movies={data.recommendations} scores={data.scores} />
    </div>
  )
}
