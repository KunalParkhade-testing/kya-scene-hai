
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BODY_BYTES = 8 * 1024

function redirectToHome(request: Request, status: string) {
  return NextResponse.redirect(
    new URL(`/?newsletter=${status}#newsletter`, request.url),
    303,
  )
}

async function readLimitedBody(request: Request): Promise<Uint8Array> {
  const contentLength = request.headers.get('content-length')

  if (
    contentLength !== null &&
    Number.isFinite(Number(contentLength)) &&
    Number(contentLength) > MAX_BODY_BYTES
  ) {
    throw new Error('Request body too large')
  }

  if (!request.body) return new Uint8Array()

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength

      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new Error('Request body too large')
      }

      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0

  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return body
}

export async function POST(request: Request) {
  let form: FormData

  try {
    const body = await readLimitedBody(request)
    const contentType = request.headers.get('content-type')

    if (!contentType) {
      return redirectToHome(request, 'error')
    }

    const safeBody = new ArrayBuffer(body.byteLength)
    new Uint8Array(safeBody).set(body)

    form = await new Response(safeBody, {
      headers: { 'content-type': contentType },
    }).formData()
  } catch {
    return redirectToHome(request, 'error')
  }

  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (email.length > 254 || !emailPattern.test(email)) {
    return redirectToHome(request, 'error')
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })

    if (!error) return redirectToHome(request, 'success')

    // A unique-constraint violation means the address is already subscribed.
    if (error.code === '23505') {
      return redirectToHome(request, 'exists')
    }

    console.error('Newsletter subscription failed:', error.code)
    return redirectToHome(request, 'error')
  } catch {
    console.error('Newsletter subscription route failed')
    return redirectToHome(request, 'error')
  }
}
