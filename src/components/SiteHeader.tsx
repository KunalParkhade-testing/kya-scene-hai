'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const links = [
  ['Stories', '/#stories'],
  ['Topics', '/topics'],
  ['Archive', '/articles'],
  ['About', '/about'],
  ['Newsletter', '/#newsletter'],
]

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsDark(document.documentElement.dataset.theme === 'dark')
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        toggleRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function closeMenu() {
    setIsOpen(false)
  }

  function toggleTheme() {
    const nextTheme = isDark ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('ksh-theme', nextTheme)
    setIsDark(nextTheme === 'dark')
  }

  return (
    <nav className="site-nav" aria-label="Primary">
      <Link href="/" className="logo" onClick={closeMenu}>
        <span>KYA SCENE HAI?</span>
      </Link>
      <button
        ref={toggleRef}
        className={`mobile-menu-toggle${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-expanded={isOpen}
        aria-controls="site-navigation-links"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div
        className={`navlinks${isOpen ? ' is-open' : ''}`}
        id="site-navigation-links"
      >
        {links.map(([label, href]) => (
          <Link href={href} key={label} onClick={closeMenu}>
            {label}
          </Link>
        ))}
      </div>
      <button
        className="theme-toggle"
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        aria-pressed={isDark}
        onClick={toggleTheme}
      >
        <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
        <span className="theme-toggle-label">{isDark ? 'Light mode' : 'Dark mode'}</span>
      </button>
    </nav>
  )
}
