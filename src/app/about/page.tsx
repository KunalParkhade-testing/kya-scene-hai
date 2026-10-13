import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function About() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="article">
        <div className="kicker">About Kya Scene Hai?</div>
        <h1>THERE'S MORE<br />TO THE SCENE.</h1>
        <p className="lede">Curious about what’s happening — and why? You’re in the right place.</p>
        <article className="prose">
          <p>Kya Scene Hai? is a curiosity-driven editorial publication exploring the stories, systems, culture and ideas that shape the world around us. India is our home ground, not our limit.</p>
          <p>We look beyond what happened to understand how things work, how they came to be, and why they matter. That might mean unpacking a public system, tracing the history behind a tradition, exploring a scientific idea, or following a question somewhere unexpected.</p>
          <p>Our stories can take the form of articles, videos, explainers and whatever format best serves the idea. The format may change; the purpose stays the same: help you see the bigger picture without making the subject needlessly complicated.</p>
          <h2>How we approach a story</h2>
          <p><strong>Start with a real question.</strong> Follow curiosity beyond the obvious answer.</p>
          <p><strong>Give it context.</strong> Connect the events, history, incentives and systems that help explain what we see.</p>
          <p><strong>Follow the evidence.</strong> Prefer facts over assumptions, acknowledge uncertainty, and treat credible disagreements fairly.</p>
          <p><strong>Make complexity understandable.</strong> Be approachable without talking down to the reader, and clear without flattening the truth.</p>
          <h2>The editorial rule</h2>
          <p>Don’t make people feel silly for not knowing. Give them the context to understand — and a better question to ask next.</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
