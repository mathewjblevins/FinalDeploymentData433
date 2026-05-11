export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-6 mt-12">
      <div className="max-w-container mx-auto px-4 sm:px-6 text-center text-muted text-xs space-y-1">
        <p>
          This product uses the{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            TMDB API
          </a>{' '}
          but is not endorsed or certified by TMDB.
        </p>
        <p>CineMatch · DATA 433 · Valparaiso University · Spring 2026</p>
      </div>
    </footer>
  )
}
