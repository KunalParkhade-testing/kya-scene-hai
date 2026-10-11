import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseOrigin = 'https://vrwcnvihkocwnocnaxmr.supabase.co'

export async function updateSession(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} wss://vrwcnvihkocwnocnaxmr.supabase.co`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ')

  // Let Next.js discover the nonce during server rendering.
  // This is an internal request header, not an enforced browser policy.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Content-Security-Policy', csp)

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // Preserve updated Supabase cookies when forwarding the request.
          requestHeaders.set('cookie', request.cookies.toString())

          response = NextResponse.next({
            request: { headers: requestHeaders },
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getClaims()

  // Observe CSP violations without blocking resources yet.
  response.headers.set('Content-Security-Policy-Report-Only', csp)

  return response
}
