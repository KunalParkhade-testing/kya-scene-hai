import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function NotFound() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="error-page error-not-found">
        <div className="error-art" aria-hidden="true">
          <span className="error-sticker">OOPS!</span>
          <div className="error-orb"><span>404</span></div>
          <span className="error-doodle error-doodle-one">?</span>
          <span className="error-doodle error-doodle-two">!</span>
        </div>
        <div className="error-copy">
          <p className="kicker">Wrong turn, curious human.</p>
          <h1>THIS SCENE<br />DOESN’T EXIST.</h1>
          <p className="error-description">The page may have moved, the link may be old, or this scene was never part of the story. Let’s get you back to something worth exploring.</p>
          <div className="error-actions">
            <Link className="btn" href="/">Back to homepage →</Link>
            <Link className="error-text-link" href="/articles">Browse all stories ↗</Link>
          </div>
          <p className="error-code">ERROR CODE <strong>404</strong> <span>PAGE NOT FOUND</span></p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
