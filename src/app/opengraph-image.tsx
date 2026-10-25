import { ImageResponse } from 'next/og'
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo'

export const alt = 'Kya Scene Hai? — Stories, Systems & Ideas'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background:
            'linear-gradient(135deg, #101827 0%, #172c45 55%, #245c67 100%)',
          color: '#f8fafc',
          display: 'flex',
          height: '100%',
          padding: '72px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              color: '#7de3c3',
              display: 'flex',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: 'uppercase',
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.1,
            }}
          >
            Stories, Systems
            <br />
            &amp; Ideas
          </div>
          <div
            style={{
              color: '#cbd5e1',
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.4,
              maxWidth: 850,
            }}
          >
            {DEFAULT_DESCRIPTION}
          </div>
          <div style={{ color: '#7de3c3', display: 'flex', fontSize: 22 }}>
            {SITE_URL.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
