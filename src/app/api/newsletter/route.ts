import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function redirectToHome(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/?newsletter=${status}#newsletter`, request.url), 303)
}

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
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
    if (error.code === '23505') return redirectToHome(request, 'exists')

    console.error('Newsletter subscription failed:', error.code, error.message)
    return redirectToHome(request, 'error')
  } catch (error) {
    console.error('Newsletter subscription route failed:', error)
    return redirectToHome(request, 'error')
  }
}
