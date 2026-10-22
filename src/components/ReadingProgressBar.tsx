'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const article = document.getElementById('article-reading-content')
    if (!article) return

    let frame = 0
    const updateProgress = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const articleTop = article.getBoundingClientRect().top + window.scrollY
        const scrollableHeight = article.offsetHeight - window.innerHeight
        const nextProgress = scrollableHeight > 0
          ? (window.scrollY - articleTop) / scrollableHeight
          : window.scrollY >= articleTop ? 1 : 0

        setProgress(Math.round(Math.min(1, Math.max(0, nextProgress)) * 100))
      })
    }

    const resizeObserver = new ResizeObserver(updateProgress)
    resizeObserver.observe(article)
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    updateProgress()

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Article reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={`${progress}% read`}
    >
      <div className="reading-progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  )
}
