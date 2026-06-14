import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Surface Supabase errors (e.g. expired OTP) to the next page
  const error     = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  if (error) {
    const dest = new URL(next, origin)
    dest.searchParams.set('error', error)
    if (errorDesc) dest.searchParams.set('error_description', errorDesc)
    return NextResponse.redirect(dest.toString())
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      const dest = new URL(next, origin)
      dest.searchParams.set('error', 'exchange_failed')
      dest.searchParams.set('error_description', exchangeError.message)
      return NextResponse.redirect(dest.toString())
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
