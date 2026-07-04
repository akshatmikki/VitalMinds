import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/chat', '/dashboard', '/journal', '/habits',
  '/health', '/community', '/profile', '/reports',
]

const AUTH_PREFIXES = ['/login', '/onboarding', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage  = AUTH_PREFIXES.some(p => pathname.startsWith(p))

  // Fast path — neither protected nor auth page, skip Supabase entirely
  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getSession (cookie-only, no network round-trip) for redirect decisions.
  // Full token validation happens in server components via getUser().
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isAuthPage && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  // Exclude static files, images, API routes, and auth callback from middleware
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-|sw.js|manifest.json|api/|auth/).*)'],
}
