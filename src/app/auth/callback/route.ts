import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has an organization, if not redirect to onboarding
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .returns<Array<{ organization_id: string }>>()

        if (!memberships || memberships.length === 0) {
          // New user, redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // Existing user, get their first org and project
        const { data: org } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', memberships[0].organization_id)
          .single<{ slug: string }>()

        if (org?.slug) {
          const { data: project } = await supabase
            .from('projects')
            .select('slug')
            .eq('organization_id', memberships[0].organization_id)
            .limit(1)
            .single<{ slug: string }>()

          if (project?.slug) {
            return NextResponse.redirect(`${origin}/${org.slug}/${project.slug}`)
          }
          return NextResponse.redirect(`${origin}/${org.slug}`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
