'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root application error:', error.digest ?? 'No error digest available')
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f6f1e7', color: '#171717', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 24px' }}>
          <section style={{ width: '100%', maxWidth: 760 }}>
            <a href="/" style={{ display: 'inline-block', padding: '7px 10px', background: '#ffd83d', color: '#171717', fontWeight: 950, textDecoration: 'none', letterSpacing: '-.5px' }}>KYA SCENE HAI?</a>
            <p style={{ margin: '48px 0 12px', color: '#ef4d35', fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>Unexpected plot twist</p>
            <h1 style={{ maxWidth: 720, margin: 0, fontSize: 'clamp(48px, 10vw, 92px)', lineHeight: .9, letterSpacing: '-.065em' }}>THE WHOLE SCENE<br />HIT A SNAG.</h1>
            <p style={{ maxWidth: 540, margin: '24px 0', color: '#514c44', fontSize: 18, lineHeight: 1.6 }}>Something unexpected stopped the site from loading. You can try again, or head back and keep exploring India, explained visually.</p>
            <button onClick={() => reset()} style={{ cursor: 'pointer', border: '2px solid #171717', background: '#171717', color: '#fff', padding: '14px 20px', fontSize: 15, fontWeight: 900, boxShadow: '6px 6px 0 #ef4d35' }}>Try again ↻</button>
            <a href="/" style={{ display: 'inline-block', marginLeft: 22, color: '#171717', fontWeight: 900 }}>Back to homepage →</a>
            <p style={{ marginTop: 48, borderTop: '2px solid #171717', paddingTop: 18, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>KYA SCENE HAI? — INDIA, EXPLAINED.</p>
          </section>
        </main>
      </body>
    </html>
  )
}
