import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderAuthButtons from './HeaderAuthButtons'

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-white/5">
      <div className="max-w-container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl text-accent tracking-widest focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          CINEMATCH
        </Link>

        <nav className="flex items-center gap-4 text-sm" aria-label="Main navigation">
          <Link
            href="/search"
            className="text-muted hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
          >
            Search
          </Link>
          {session && (
            <Link
              href="/library"
              className="text-muted hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
            >
              Library
            </Link>
          )}
          <Link
            href="/about"
            className="text-muted hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
          >
            About
          </Link>
          <HeaderAuthButtons session={!!session} />
        </nav>
      </div>
    </header>
  )
}
