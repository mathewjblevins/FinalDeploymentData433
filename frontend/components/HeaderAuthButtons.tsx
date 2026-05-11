'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  session: boolean
}

export default function HeaderAuthButtons({ session }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (session) {
    return (
      <button
        onClick={signOut}
        className="text-muted hover:text-white transition-colors text-sm focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
      >
        Sign out
      </button>
    )
  }

  return (
    <Link
      href="/login"
      className="bg-accent hover:bg-accent-hover text-white text-sm px-3 py-1.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-white"
    >
      Sign in
    </Link>
  )
}
