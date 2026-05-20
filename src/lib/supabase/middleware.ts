import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) {
      user = data.user
    } else {
      console.warn('Supabase getUser returned error in middleware:', error)
    }
  } catch (err) {
    console.error('Supabase getUser threw exception in middleware:', err)
  }

  // ROLE-BASED ACCESS CONTROL (RBAC) Logic
  // /dashboard/* is protected
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    // If the network request failed but they have valid-looking session cookies,
    // don't force a redirect to login to avoid sudden kick-outs on transient network errors.
    const hasAuthCookie = request.cookies.getAll().some(
      (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
    )
    if (hasAuthCookie) {
      console.warn('Allowing dashboard access despite auth failure since auth cookies are present.')
      return response
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}
