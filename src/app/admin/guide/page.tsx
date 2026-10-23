import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdminAccessDenied from '@/components/admin/AdminAccessDenied'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Writing guide',
  robots: { index: false, follow: false },
}

export default async function EditorialGuidePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect('/admin')
  if (user.app_metadata?.role !== 'admin') return <AdminAccessDenied />

  return (
    <div className="studio-shell studio-guide-shell">
      <header className="adminbar studio-topbar">
        <Link href="/admin" className="logo"><span>KYA SCENE HAI?</span></Link>
        <span className="studio-brand">EDITORIAL STUDIO · WRITING GUIDE</span>
        <div className="studio-top-actions">
          <Link href="/admin" className="secondary">Back to editor</Link>
          <Link href="/" className="secondary">View site</Link>
        </div>
      </header>

      <main className="studio-guide">
        <header className="studio-guide-intro">
          <span className="kicker">EDITOR-ONLY REFERENCE</span>
          <h1>Write a clear, useful article.</h1>
          <p>
            A practical checklist for shaping stories readers can follow, find, and share.
            Use these recommendations as guidance, not rigid rules.
          </p>
        </header>

        <nav className="studio-guide-toc" aria-label="Guide contents">
          <a href="#before-writing">Before writing</a>
          <a href="#structure">Structure the story</a>
          <a href="#search-sharing">Search and sharing</a>
          <a href="#links">Links and sources</a>
          <a href="#technical-follow-up">Technical follow-up</a>
        </nav>

        <div className="studio-guide-sections">
          <section className="studio-guide-card" id="before-writing">
            <span className="studio-guide-number">01</span>
            <div>
              <h2>Before writing</h2>
              <ul>
                <li>Decide what the reader should understand or be able to do after reading.</li>
                <li>Write a specific article title. Around 60 characters is a useful search-result target, not a strict limit.</li>
                <li>Write a concise description that accurately summarizes the article; aim for about 125 characters.</li>
                <li>Choose a representative hero image. For social previews, aim for 1200 × 630 pixels and a file smaller than 1 MB.</li>
              </ul>
            </div>
          </section>

          <section className="studio-guide-card" id="structure">
            <span className="studio-guide-number">02</span>
            <div>
              <h2>Structure the story</h2>
              <ul>
                <li>Keep one clear H1, and use its key subject naturally in the opening paragraphs. Avoid repeating keywords unnaturally.</li>
                <li>Use descriptive H2 and H3 headings to help readers scan and understand the argument.</li>
                <li>Make headings proportionate to the article. A recent audit flagged 37 headings in a 4,096-word article; review whether each heading adds useful structure rather than aiming for a fixed heading count.</li>
                <li>If a story is very long, split it into separate pages only when each part can stand on its own and the reader benefits from the division. Link the parts together.</li>
                <li>Keep headings and labels concise. An audit flagged a 97-character heading against its 70-character recommendation; shorten where clarity is preserved.</li>
              </ul>
            </div>
          </section>

          <section className="studio-guide-card" id="search-sharing">
            <span className="studio-guide-number">03</span>
            <div>
              <h2>Search and sharing</h2>
              <ul>
                <li>Use a page title that tells readers what the story covers. Around 60 characters is a practical target because search engines may truncate longer titles, but display length varies.</li>
                <li>Make the description useful on its own: explain the story’s value without promising more than the article delivers.</li>
                <li>Check the social preview image, title, and description before publishing.</li>
                <li>Prefer clear, specific wording over stuffing titles, headings, or descriptions with keywords.</li>
              </ul>
            </div>
          </section>

          <section className="studio-guide-card" id="links">
            <span className="studio-guide-number">04</span>
            <div>
              <h2>Links and sources</h2>
              <ul>
                <li>Use concise anchor text that tells readers what they will find when they follow a link.</li>
                <li>Link to relevant related stories on this site where they genuinely help the reader.</li>
                <li>Verify sources directly and add them in the editor’s Sources panel.</li>
                <li>Build external references by publishing useful, trustworthy work and sharing it with relevant people. Backlinks take time and are not a quick code-side fix.</li>
              </ul>
            </div>
          </section>

          <section className="studio-guide-card studio-guide-follow-up" id="technical-follow-up">
            <span className="studio-guide-number">05</span>
            <div>
              <h2>Technical follow-up for a future code task</h2>
              <p>These findings need site-level investigation; they are not writing requirements:</p>
              <ul>
                <li><strong>Apple touch icon:</strong> a dedicated Apple touch icon is now provided from the site artwork. Verify the deployed icon URL and how it appears when saved to an Apple device.</li>
                <li><strong>Response time:</strong> the audit measured about 2.66 seconds and recommended under 0.4 seconds. Measure server response consistently, then investigate backend queries, caching, and delivery before choosing a fix.</li>
                <li><strong>Backlinks:</strong> the audit reported one referring domain, one backlink, and one referring IP. Treat this as an ongoing editorial outreach and authority-building effort, not a code change or a reason to buy links.</li>
              </ul>
            </div>
          </section>
        </div>

        <p className="studio-guide-footer">
          SEO audit measurements are snapshots and recommendations, not guarantees. Prioritize accuracy, readability, and reader value.
        </p>
      </main>
    </div>
  )
}
