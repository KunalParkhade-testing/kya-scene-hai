import type { Metadata } from 'next'
import './globals.css'
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Kya Scene Hai? — Stories, Systems & Ideas',
    template: '%s | Kya Scene Hai?',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Kya Scene Hai? — Stories, Systems & Ideas',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kya Scene Hai? — Stories, Systems & Ideas',
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-IN"><body>{children}</body></html>
}
