import type { Metadata } from 'next'
import './globals.css'
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo'

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: 'Kya Scene Hai',
  url: `${SITE_URL}/`,
}

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
  return (
    <html lang="en-IN">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
      </body>
    </html>
  )
}
