import { getTrending } from '@/lib/api'
import RecommendationGrid from '@/components/RecommendationGrid'
import SearchBar from '@/components/SearchBar'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let trending = null
  try {
    const data = await getTrending()
    trending = data.movies
  } catch {
    // Gracefully degrade if backend is cold-starting
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <section className="text-center py-16 sm:py-24">
        <h1 className="font-display text-5xl sm:text-7xl text-accent tracking-widest mb-4">
          CINEMATCH
        </h1>
        <p className="text-muted text-sm sm:text-base uppercase tracking-widest mb-10">
          Content-Based Movie Recommendations
        </p>
        <div className="max-w-2xl mx-auto">
          <SearchBar autoFocus />
        </div>
      </section>

      {/* Trending */}
      {trending && trending.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-muted tracking-widest mb-6">
            Trending Now
          </h2>
          <RecommendationGrid movies={trending} />
        </section>
      )}

      {!trending && (
        <section className="text-center text-muted py-12">
          <p>Search for a movie above to get personalized recommendations.</p>
        </section>
      )}
    </div>
  )
}
