/**
 * CineMatch Milestone 5 — slide deck generator
 * Run: node scripts/generate_deck.js
 * Output: presentation/cinematch_milestone5.pptx
 *
 * Approx timing at ~90 seconds/slide: 13 slides ≈ 19.5 min spoken.
 * Budget ~60–75 seconds per slide = 13 slides ≈ 13–16 min. Right in range.
 */

const PptxGenJS = require('pptxgenjs')
const path = require('path')

const BG = '0B0B10'        // near-black
const SURFACE = '16161E'   // card background
const ACCENT = 'D9434C'    // red accent
const LIGHT = 'F0F0F0'     // body text
const MUTED = '888888'     // secondary text
const WHITE = 'FFFFFF'

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'  // 13.33 × 7.5 in
pptx.author = 'Mathew Blevins'
pptx.title = 'CineMatch — Milestone 5'
pptx.subject = 'DATA 433 Final Presentation'

// ── Helpers ─────────────────────────────────────────────────────────────────

function addBg(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: BG },
    line: { color: BG },
  })
}

function titleSlide(title, subtitle) {
  const slide = pptx.addSlide()
  addBg(slide)
  slide.addText(title, {
    x: 0.5, y: 2.5, w: 12.33, h: 1.5,
    fontSize: 54, bold: true, color: ACCENT,
    fontFace: 'Georgia', align: 'center',
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 4.2, w: 12.33, h: 0.7,
      fontSize: 22, color: MUTED,
      fontFace: 'Calibri', align: 'center',
    })
  }
  return slide
}

function sectionSlide(num, title) {
  const slide = pptx.addSlide()
  addBg(slide)
  slide.addText(`0${num}`, {
    x: 0.5, y: 0.3, w: 1.5, h: 0.7,
    fontSize: 48, bold: true, color: ACCENT,
    fontFace: 'Georgia',
  })
  slide.addText(title, {
    x: 0.5, y: 1.5, w: 12, h: 1.2,
    fontSize: 40, bold: true, color: WHITE,
    fontFace: 'Georgia',
  })
  return slide
}

function contentSlide(title, bullets, opts = {}) {
  const slide = pptx.addSlide()
  addBg(slide)

  // Title bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: SURFACE },
    line: { color: SURFACE },
  })
  slide.addText(title, {
    x: 0.4, y: 0.15, w: 12.53, h: 0.8,
    fontSize: 28, bold: true, color: WHITE,
    fontFace: 'Georgia',
  })

  // Bullets
  const bulletObjs = bullets.map((b) => {
    if (typeof b === 'string') {
      return { text: b, options: { bullet: true, fontSize: 20, color: LIGHT, fontFace: 'Calibri', paraSpaceAfter: 8 } }
    }
    return b
  })

  slide.addText(bulletObjs, {
    x: opts.x ?? 0.5,
    y: opts.y ?? 1.3,
    w: opts.w ?? 12.33,
    h: opts.h ?? 5.8,
    valign: 'top',
  })

  return slide
}

function twoColSlide(title, leftBullets, rightBullets, leftHeader, rightHeader) {
  const slide = pptx.addSlide()
  addBg(slide)

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: SURFACE }, line: { color: SURFACE },
  })
  slide.addText(title, {
    x: 0.4, y: 0.15, w: 12.53, h: 0.8,
    fontSize: 28, bold: true, color: WHITE, fontFace: 'Georgia',
  })

  const mkBullets = (items) => items.map((b) => ({
    text: b, options: { bullet: true, fontSize: 19, color: LIGHT, fontFace: 'Calibri', paraSpaceAfter: 6 },
  }))

  if (leftHeader) {
    slide.addText(leftHeader, { x: 0.5, y: 1.2, w: 5.9, h: 0.5, fontSize: 16, bold: true, color: ACCENT, fontFace: 'Calibri' })
  }
  slide.addText(mkBullets(leftBullets), { x: 0.5, y: leftHeader ? 1.75 : 1.3, w: 5.9, h: 5.3, valign: 'top' })

  if (rightHeader) {
    slide.addText(rightHeader, { x: 6.9, y: 1.2, w: 5.9, h: 0.5, fontSize: 16, bold: true, color: ACCENT, fontFace: 'Calibri' })
  }
  slide.addText(mkBullets(rightBullets), { x: 6.9, y: rightHeader ? 1.75 : 1.3, w: 5.9, h: 5.3, valign: 'top' })

  // Divider
  slide.addShape(pptx.ShapeType.line, {
    x: 6.7, y: 1.2, w: 0, h: 5.9,
    line: { color: SURFACE, width: 1.5 },
  })

  return slide
}

// ── Slides ────────────────────────────────────────────────────────────────────

// 1. Title
const s1 = titleSlide('CINEMATCH', 'Content-Based Movie Recommendations\nMathew Blevins · DATA 433 · Valparaiso University · May 2026')

// 2. The Problem
contentSlide('The Problem', [
  'How do you discover your next great movie?',
  'Streaming platforms offer 1,000s of titles — but recommendations are black-box collaborative filters that require millions of users to work',
  'New or niche users get generic, popularity-biased results',
  'There\'s a gap for transparent, content-driven recommendations you can trust',
  '',
  { text: '→ CineMatch fills that gap: "because you liked Fight Club, here are 12 films that share its themes, tone, and genre DNA"', options: { fontSize: 20, color: ACCENT, bold: true, fontFace: 'Calibri' } },
])

// 3. Live Demo (placeholder — presenter switches to browser here)
const s3 = pptx.addSlide()
addBg(s3)
s3.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: SURFACE }, line: { color: SURFACE } })
s3.addText('Live Demo', { x: 0.4, y: 0.15, w: 12.53, h: 0.8, fontSize: 28, bold: true, color: WHITE, fontFace: 'Georgia' })
s3.addText([
  { text: '🎬 ', options: { fontSize: 72 } },
], { x: 5.5, y: 1.5, w: 2.5, h: 2 })
s3.addText('final-deployment-data433.vercel.app', {
  x: 1, y: 3.8, w: 11.33, h: 0.7,
  fontSize: 26, color: ACCENT, align: 'center', fontFace: 'Calibri',
})
s3.addText([
  { text: 'Search → Fight Club → 12 recommendations → add to Library', options: { fontSize: 20, color: MUTED, fontFace: 'Calibri' } },
], { x: 1, y: 4.7, w: 11.33, h: 0.6, align: 'center' })

// 4. Architecture
contentSlide('Architecture', [
  'Three-tier, fully decoupled:',
  'Frontend: Next.js 15 (App Router + RSC) on Vercel — edge CDN, preview deploys per PR',
  'Backend: FastAPI on Render — owns the ML pipeline, TMDB key, and rate limiting',
  'Data: Supabase Postgres + Auth + Row-Level Security — favorites, search history, movie cache',
  '',
  'Key invariant: the browser never sees the TMDB API key',
  'Legacy Streamlit v1 stays live as a reference: cinematch-ecpkof7qdeuacyfewyiffa.streamlit.app',
])

// 5. Architecture diagram (text art since we can't embed SVG directly)
const s5 = pptx.addSlide()
addBg(s5)
s5.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: SURFACE }, line: { color: SURFACE } })
s5.addText('System Diagram', { x: 0.4, y: 0.15, w: 12.53, h: 0.8, fontSize: 28, bold: true, color: WHITE, fontFace: 'Georgia' })

const boxes = [
  { label: 'User\nBrowser', x: 5.7, y: 1.2, color: '2D3748' },
  { label: 'Next.js 15\n(Vercel)', x: 5.7, y: 2.6, color: '2D5016' },
  { label: 'FastAPI\n(Render)', x: 2.2, y: 4.1, color: '1A3A5C' },
  { label: 'Supabase\n(Postgres + Auth)', x: 8.5, y: 4.1, color: '1A3A5C' },
  { label: 'TMDB API', x: 2.2, y: 5.6, color: '3D1A5C' },
]
boxes.forEach(({ label, x, y, color }) => {
  s5.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.8, h: 1.1, fill: { color }, line: { color: ACCENT, width: 1 }, rounding: 0.15 })
  s5.addText(label, { x, y, w: 2.8, h: 1.1, align: 'center', valign: 'middle', fontSize: 14, color: WHITE, fontFace: 'Calibri', bold: true })
})

// Arrows (lines)
s5.addShape(pptx.ShapeType.line, { x: 7.05, y: 2.3, w: 0, h: 0.3, line: { color: ACCENT, width: 1.5 } })
s5.addShape(pptx.ShapeType.line, { x: 3.6, y: 3.7, w: 3.45, h: 0, line: { color: MUTED, width: 1 } })
s5.addShape(pptx.ShapeType.line, { x: 7.05, y: 3.7, w: 3.45, h: 0, line: { color: MUTED, width: 1 } })
s5.addShape(pptx.ShapeType.line, { x: 3.6, y: 5.2, w: 0, h: 0.4, line: { color: MUTED, width: 1 } })

// 6. ML Model
twoColSlide(
  'ML Model — TF-IDF + Cosine Similarity',
  [
    'Feature: overview + genres (genres × 3)',
    'TF-IDF vectorizer: 5,000 features, English stop words removed',
    'Cosine similarity matrix built lazily on first request',
    'Returns top-k ranked results with match % scores',
    '',
    'Dynamic corpus fallback: if a movie isn\'t preloaded, fetch from TMDB → append → rebuild matrix',
    'Corpus augments in real-time — search always feels complete',
  ],
  [
    'TF-IDF vs. CountVectorizer (ablated on 10 seed movies):',
    'Genre consistency: 4.1 vs. 3.6 / 5',
    'Thematic coherence: 4.3 vs. 3.8 / 5',
    'Obvious noise recs: 0.8 vs. 1.4 / 5',
    '',
    'Roadmap v1.1: sentence-transformers (SBERT) for semantic similarity',
    'Why not now: adds GPU/API cost; out of scope for demo',
  ],
  'How It Works',
  'Ablation Results'
)

// 7. Security
contentSlide('Security Posture — 4 Non-Negotiables', [
  '1. No hardcoded secrets — all keys read from env via pydantic-settings; gitleaks runs in CI',
  '2. Rate limiting — slowapi: /search 30/min, /recommend 60/min; 429 returns verified',
  '3. RLS isolation — User A cannot see User B\'s favorites (Supabase row-level security, tested and documented)',
  '4. XSS defense — bleach.clean() server-side + DOMPurify client-side + strict CSP headers',
  '',
  'Additional: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy',
  'CORS: exact allowlist (never *) — Vercel production + preview URLs only',
])

// 8. Cost Model
twoColSlide(
  'Cost Model',
  [
    'Vercel Hobby: free (100 GB bandwidth)',
    'Render free web service: free (750 hrs/mo)',
    'Supabase free: free (500 MB, 50k MAU)',
    'Upstash Redis free: free (10k commands/day)',
    'TMDB API: free (non-commercial)',
    '',
    'Total today: $0 / month',
  ],
  [
    'At 5,000 DAU:',
    'Vercel Pro: $20/mo',
    'Render Starter: $7/mo',
    'Supabase Pro: $25/mo',
    'Upstash pay-as-you-go: ~$3/mo',
    'Total at 5k DAU: ~$55/mo',
    '$0.011 per user per month',
    'Break-even: 12 paying subscribers at $4.99/mo',
  ],
  'Current ($0/mo)',
  'Scale (5k DAU)'
)

// 9. Ethics & Limitations
contentSlide('Ethics & Limitations', [
  'Data source: TMDB API (licensed, non-commercial with attribution) — no Kaggle dataset (DMCA issue in M3)',
  'Bias: corpus skews toward English-language Hollywood releases; underrepresents international cinema',
  'No user data sold or shared — favorites and search history are RLS-protected, user-owned',
  'Content-based only — no behavioral surveillance or collaborative filtering (roadmap v1.1)',
  'Cold-start disclosure: Render free tier spins down after 15 min idle; ~10s first request (documented in cost slide)',
  'TMDB attribution in footer and About page per their TOS',
])

// 10. Roadmap
twoColSlide(
  'Roadmap',
  [
    'v1.1 (next semester):',
    'Sentence-transformers (SBERT) for semantic similarity',
    'Collaborative filtering (behavior-based recommendations)',
    'International cinema corpus expansion',
    'Popularity-blending factor (surface hidden gems)',
    'Keyword + cast/crew enrichment',
  ],
  [
    'v2.0 (monetization):',
    '$4.99/mo Pro — ad-free, unlimited favorites, history export',
    'API licensing for streaming services',
    'Watchlist sync with JustWatch',
    'Mobile app (React Native)',
    'Team watchlist / social sharing',
  ],
  'v1.1 (Improvements)',
  'v2.0 (Growth)'
)

// 11. Technical Execution
contentSlide('Technical Execution Summary', [
  'TypeScript strict mode throughout frontend — no `any`',
  'Pydantic schemas on every request/response — no untyped dicts across the wire',
  'pytest: 24/24 tests passing; covers happy path, auth failures, validation failures, security',
  'ruff + mypy --strict: clean on all backend code',
  'pnpm lint + tsc --noEmit: clean on all frontend code',
  'Conventional Commits throughout; feature branches → squash merge to main',
  'CLAUDE.md at repo root — enables future AI-assisted development without re-discovery',
])

// 12. Demo URLs / Links
const s12 = pptx.addSlide()
addBg(s12)
s12.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: SURFACE }, line: { color: SURFACE } })
s12.addText('Links & Resources', { x: 0.4, y: 0.15, w: 12.53, h: 0.8, fontSize: 28, bold: true, color: WHITE, fontFace: 'Georgia' })

const links = [
  ['Production App (Vercel)', 'final-deployment-data433.vercel.app', ACCENT],
  ['Backend API (Render)', 'finaldeploymentdata433.onrender.com/docs', MUTED],
  ['Legacy v1 (Streamlit)', 'cinematch-ecpkof7qdeuacyfewyiffa.streamlit.app', MUTED],
  ['GitHub Repo', 'github.com/[your-username]/cinematch', MUTED],
]

links.forEach(([label, url, color], i) => {
  s12.addText(label, { x: 0.5, y: 1.4 + i * 1.1, w: 4, h: 0.5, fontSize: 18, bold: true, color: WHITE, fontFace: 'Calibri' })
  s12.addText(url, { x: 4.8, y: 1.4 + i * 1.1, w: 8, h: 0.5, fontSize: 18, color, fontFace: 'Calibri' })
  s12.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.95 + i * 1.1, w: 12.33, h: 0, line: { color: SURFACE, width: 1 } })
})

// 13. Q&A
const s13 = titleSlide('Questions?', 'Mathew Blevins · mathewjblevins@gmail.com\nDATA 433 · Valparaiso University · Spring 2026')

// ── Write file ────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '..', 'presentation', 'cinematch_milestone5.pptx')
pptx.writeFile({ fileName: outPath })
  .then(() => console.log(`✅ Deck written to ${outPath}`))
  .catch((err) => { console.error('❌ Failed to write deck:', err); process.exit(1) })
