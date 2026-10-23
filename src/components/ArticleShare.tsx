'use client'

import { useState } from 'react'

type Props = {
  title: string
  url: string
}

type ShareIconName = 'link' | 'whatsapp' | 'facebook' | 'linkedin' | 'x' | 'check' | 'share'

function ShareIcon({ name }: { name: ShareIconName }) {
  if (name === 'share') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
  }

  if (name === 'facebook') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M13.5 20v-7h2.4l.4-2.8h-2.8V8.4c0-.8.3-1.3 1.4-1.3h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v1.9H8v2.8h2.5v7h3Z" fill="var(--paper)" /></svg>
  }

  if (name === 'linkedin') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor" /><path d="M7 10v7m0-10v.1M11 17v-7h3v1c.5-.8 1.2-1.2 2.3-1.2 1.8 0 2.7 1.2 2.7 3.3V17h-3v-3.5c0-.9-.3-1.5-1.1-1.5s-1.2.6-1.2 1.5V17h-2.7Z" fill="var(--paper)" stroke="var(--paper)" strokeWidth=".4" /></svg>
  }

  if (name === 'x') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h4.7l4.4 6 5.2-6H21l-6.6 7.7L22 21h-4.7l-4.9-6.7L6.6 21H3l7-8.2L4 3Zm3.2 2 11.1 14h1.1L8.3 5H7.2Z" fill="currentColor" /></svg>
  }

  if (name === 'whatsapp') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 11.8a8.2 8.2 0 0 1-12.1 7.1L3 20l1.2-4.9a8.2 8.2 0 1 1 16-3.3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8.2 7.5c-.3.2-.7.8-.7 1.5 0 1.1.8 2.5 2.1 3.8 1.4 1.4 2.9 2 3.9 2 .7 0 1.3-.5 1.5-.9l.3-.8-2-.9-.7.9c-.1.2-.3.2-.6.1-.7-.3-1.8-1.1-2.4-2-.2-.2-.1-.4 0-.5l.6-.7-.9-2.1-.8-.4Z" fill="currentColor" /></svg>
  }

  if (name === 'check') {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" /><path d="m5.5 10.2 3 3 6-6.3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.8 14.2 4.4-4.4M8.1 16.8l-1.2 1.1a4 4 0 0 1-5.7-5.7l4.1-4.1a4 4 0 0 1 5.7 0m4.9-.9 1.2-1.1a4 4 0 0 1 5.7 5.7l-4.1 4.1a4 4 0 0 1-5.7 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function platformUrl(base: string, values: Record<string, string>) {
  const url = new URL(base)
  Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value))
  return url.toString()
}

export default function ArticleShare({ title, url }: Props) {
  const [status, setStatus] = useState('')

  async function copyLink() {
    if (!navigator.clipboard?.writeText) {
      setStatus('Copying is unavailable in this browser. You can copy the article address from the address bar.')
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setStatus('Article link copied.')
    } catch {
      setStatus('Could not copy the link. You can copy the article address from the address bar.')
    }
  }

  async function share() {
    if (!navigator.share) {
      await copyLink()
      return
    }

    try {
      await navigator.share({ title, url })
      setStatus('Share options opened.')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setStatus('Could not open sharing. Try copying the article link instead.')
    }
  }

  const encodedText = `${title} ${url}`

  return (
    <section className="article-share" aria-label="Share this article">
      <span className="article-share-label">SHARE THIS STORY</span>
      <div className="article-share-actions">
        <button className="article-share-copy" type="button" onClick={() => void copyLink()}>
          <ShareIcon name="link" />
          Copy link
        </button>
        {status && (
          <span className="article-share-status" role="status" aria-live="polite">
            {status === 'Article link copied.' && <ShareIcon name="check" />}
            {status}
          </span>
        )}
        <a
          className="article-share-platform"
          href={platformUrl('https://wa.me/', { text: encodedText })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp (opens in a new tab)"
        >
          <ShareIcon name="whatsapp" /><span>WhatsApp</span>
        </a>
        <a
          className="article-share-platform"
          href={platformUrl('https://www.facebook.com/sharer/sharer.php', { u: url })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook (opens in a new tab)"
        >
          <ShareIcon name="facebook" /><span>Facebook</span>
        </a>
        <a
          className="article-share-platform"
          href={platformUrl('https://www.linkedin.com/sharing/share-offsite/', { url })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn (opens in a new tab)"
        >
          <ShareIcon name="linkedin" /><span>LinkedIn</span>
        </a>
        <a
          className="article-share-platform"
          href={platformUrl('https://twitter.com/intent/tweet', { text: title, url })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (opens in a new tab)"
        >
          <ShareIcon name="x" /><span>X</span>
        </a>
        <button type="button" className="article-share-more" onClick={() => void share()} aria-label="Open more sharing options">
          <ShareIcon name="share" /><span>More</span>
        </button>
      </div>
    </section>
  )
}
