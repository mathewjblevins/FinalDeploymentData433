export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display text-4xl mb-8">About CineMatch</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Methodology</h2>
        <p className="text-muted leading-relaxed mb-4">
          CineMatch uses <strong>content-based filtering</strong>: movies are represented as
          TF-IDF vectors over a combined text field (overview + genres, with genres weighted 3×).
          Cosine similarity ranks candidates by semantic distance to the seed movie.
        </p>
        <p className="text-muted leading-relaxed">
          The model is built on top of Python&rsquo;s{' '}
          <code className="bg-surface px-1 rounded text-sm">scikit-learn</code>{' '}
          library and re-uses the same algorithm first validated in the Milestone 4 Streamlit
          prototype.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Data &amp; Ethics</h2>
        <p className="text-muted leading-relaxed mb-4">
          All movie metadata is sourced from the{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            TMDB API
          </a>{' '}
          under their non-commercial use terms. TMDB is not affiliated with or endorsed by
          CineMatch.
        </p>
        <p className="text-muted leading-relaxed">
          The corpus is weighted toward English-language, Hollywood-centric releases, which can
          introduce Western catalog bias. This is a known limitation; the roadmap includes
          expanding the seed corpus with international titles.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Limitations</h2>
        <ul className="text-muted list-disc list-inside space-y-1">
          <li>Recommendations are content-based only — no collaborative filtering yet.</li>
          <li>Cold-start delay (~8s) on Render free tier if the server has been idle.</li>
          <li>Results reflect TMDB&rsquo;s metadata quality; niche or older films may return poor matches.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Stack</h2>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted">
          {[
            ['Frontend', 'Next.js 14, Tailwind CSS, shadcn/ui, Supabase Auth'],
            ['Backend', 'FastAPI, scikit-learn, slowapi, httpx'],
            ['Data', 'Supabase Postgres + RLS, TMDB API'],
            ['Hosting', 'Vercel (frontend), Render (backend)'],
            ['Security', 'CSP headers, DOMPurify, JWT auth, RLS isolation'],
          ].map(([label, value]) => (
            <div key={label} className="bg-surface rounded p-3">
              <p className="text-white font-medium">{label}</p>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
