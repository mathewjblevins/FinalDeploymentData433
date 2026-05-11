'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    })
    setStatus(error ? 'error' : 'sent')
  }

  if (status === 'sent') {
    return (
      <div className="text-center">
        <p className="text-lg mb-2">Check your email</p>
        <p className="text-muted text-sm">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-surface border border-white/10 rounded px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white py-2 rounded text-sm font-medium transition-colors"
      >
        {status === 'loading' ? 'Sending…' : 'Send Magic Link'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
      )}
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="max-w-container mx-auto px-4 py-20 flex justify-center">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-center mb-2">Sign In</h1>
        <p className="text-muted text-sm text-center mb-8">
          We&apos;ll email you a magic link — no password needed.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="text-muted text-xs text-center mt-6">
          <Link href="/" className="underline hover:text-white">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
