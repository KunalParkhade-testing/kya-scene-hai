'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep technical details out of the UI; the digest can help correlate server logs.
    console.error('Application route error:', error.digest ?? 'No error digest available')
  }, [error])

  return (
    <div className="site">
      <SiteHeader />
      <main className="error-page error-runtime">
        <div className="error-art" aria-hidden="true">
          <span className="error-sticker error-sticker-red">SCENE RUK GAYA</span>
          <div className="error-orb error-orb-red"><span>!</span></div>
          <span className="error-doodle error-doodle-one">…</span>
          <span className="error-doodle error-doodle-two">?</span>
        </div>
        <div className="error-copy">
          <p className="kicker">A little plot twist.</p>
          <h1>THAT DIDN’T<br />GO AS PLANNED.</h1>
          <p className="error-description">Something went wrong while loading this part of the site. Your curiosity is welcome to stay—try again, or head back to the homepage.</p>
          <div className="error-actions">
            <button className="btn error-button" onClick={() => reset()}>Try again ↻</button>
            <Link className="error-text-link" href="/">Go to homepage →</Link>
          </div>
          <p className="error-code">KYA SCENE HAI? <span>WE’LL GET THIS BACK ON TRACK.</span></p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
