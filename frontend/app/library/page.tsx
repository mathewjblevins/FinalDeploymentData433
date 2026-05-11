import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFavorites } from '@/lib/api'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?next=/library')
  }

  let favorites: Awaited<ReturnType<typeof getFavorites>> = []
  try {
    favorites = await getFavorites(session.access_token)
  } catch {
    // Handled below
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl text-muted tracking-widest mb-8">My Library</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="mb-4">No saved movies yet.</p>
          <Link
            href="/search"
            className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded text-sm font-medium transition-colors"
          >
            Find Movies
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favorites.map((fav) => (
            <li key={fav.movie_id}>
              <Link
                href={`/recommend/${fav.movie_id}`}
                className="block rounded-lg overflow-hidden bg-surface border border-white/5 hover:-translate-y-0.5 hover:scale-[1.02] transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-accent"
              >
                {fav.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${fav.poster_path}`}
                    alt={`${fav.title} poster`}
                    className="w-full aspect-[2/3] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-surface/60 flex items-center justify-center text-muted text-xs p-2 text-center">
                    No image
                  </div>
                )}
                <div className="p-2">
                  <p className="font-medium text-sm truncate">{fav.title}</p>
                  <p className="text-muted text-xs">
                    {new Date(fav.added_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
