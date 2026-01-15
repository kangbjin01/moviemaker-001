import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Handle OAuth code exchange (PKCE flow)
  const { searchParams, origin, pathname } = request.nextUrl
  const code = searchParams.get('code')

  if (code && pathname === '/') {
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has an organization
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)

        if (!memberships || memberships.length === 0) {
          // New user, redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // Existing user, get their first org and project
        const { data: org } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', memberships[0].organization_id)
          .single()

        if (org?.slug) {
          const { data: project } = await supabase
            .from('projects')
            .select('slug')
            .eq('organization_id', memberships[0].organization_id)
            .limit(1)
            .single()

          if (project?.slug) {
            return NextResponse.redirect(`${origin}/${org.slug}/${project.slug}`)
          }
          return NextResponse.redirect(`${origin}/${org.slug}`)
        }
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }

    // Auth error, redirect to login
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  await supabase.auth.getUser()

  return response
}
