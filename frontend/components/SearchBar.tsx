'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'

const querySchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{N}\s\-:'.,!?&]+$/u)

interface Props {
  value?: string
  onChange?: (v: string) => void
  autoFocus?: boolean
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  autoFocus,
  placeholder = 'Try "The Dark Knight", "Inception", "Parasite"…',
}: Props) {
  const router = useRouter()
  const [internal, setInternal] = useState('')
  const controlled = value !== undefined

  const current = controlled ? value : internal
  const handleChange = (v: string) => {
    if (!controlled) setInternal(v)
    onChange?.(v)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = querySchema.safeParse(current.trim())
    if (parsed.success) {
      router.push(`/search?q=${encodeURIComponent(parsed.data)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex gap-2">
      <label htmlFor="search-input" className="sr-only">
        Search for a movie
      </label>
      <input
        id="search-input"
        type="search"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className="flex-1 bg-surface border border-white/10 rounded px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <button
        type="submit"
        className="bg-accent hover:bg-accent-hover text-white px-5 py-3 rounded text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white"
      >
        Search
      </button>
    </form>
  )
}
