'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminAccessDenied() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function signOut() {
    setBusy(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <main className="adminwrap">
      <section className="adminlogin">
        <div className="kicker">Kya Scene Hai?</div>
        <h1>NO<br />ACCESS.</h1>
        <p>
          Your account is authenticated, but it does not have
          the admin role required for the Editorial Studio.
        </p>
        <p className="adminhint">
          If you should have access, ask the project administrator
          to verify your role in Supabase Auth App Metadata.
        </p>
        <button type="button" onClick={signOut} disabled={busy}>
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
        {message && <p className="adminmsg">{message}</p>}
      </section>
    </main>
  )
}
