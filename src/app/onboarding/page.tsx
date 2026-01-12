'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Loader2, ArrowRight, SkipForward } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Organization data
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')

  // Project data
  const [projectName, setProjectName] = useState('')

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Organization 이름 입력 핸들러 (영어, 숫자, 공백, 하이픈만 허용)
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 영어, 숫자, 공백, 하이픈만 허용
    const filtered = value.replace(/[^a-zA-Z0-9\s\-]/g, '')
    setOrgName(filtered)
    setOrgSlug(createSlug(filtered))
  }

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return

    // 영어로만 구성되어 있는지 확인
    if (!/^[a-zA-Z0-9\s\-]+$/.test(orgName)) {
      setError('Organization 이름은 영어, 숫자, 공백, 하이픈만 사용할 수 있습니다')
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('로그인이 필요합니다')
      setIsLoading(false)
      return
    }

    const slug = createSlug(orgName)

    // Create organization
    const { data: org, error: orgError } = await (supabase
      .from('organizations')
      .insert([{
        name: orgName,
        slug,
        owner_id: user.id,
      }] as any)
      .select()
      .single<{ id: string; name: string; slug: string }>())

    if (orgError) {
      if (orgError.message.includes('duplicate')) {
        setError('이미 존재하는 Organization 이름입니다')
      } else {
        setError(orgError.message)
      }
      setIsLoading(false)
      return
    }

    // Add user as owner member
    await supabase
      .from('organization_members')
      .insert([{
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
      }] as any)

    setOrgSlug(org.slug)
    setIsLoading(false)
    setStep(2)
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('로그인이 필요합니다')
      setIsLoading(false)
      return
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single<{ organization_id: string }>()

    if (!membership) {
      setError('Organization을 찾을 수 없습니다')
      setIsLoading(false)
      return
    }

    // Get organization slug
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', membership.organization_id)
      .single<{ slug: string }>()

    if (!org) {
      setError('Organization을 찾을 수 없습니다')
      setIsLoading(false)
      return
    }

    const projectSlug = createSlug(projectName)

    // Create project
    const { error: projectError } = await supabase
      .from('projects')
      .insert([{
        organization_id: membership.organization_id,
        name: projectName,
        slug: projectSlug,
        created_by: user.id,
      }] as any)

    if (projectError) {
      if (projectError.message.includes('duplicate')) {
        setError('이미 존재하는 프로젝트 이름입니다')
      } else {
        setError(projectError.message)
      }
      setIsLoading(false)
      return
    }

    // Redirect to project
    router.push(`/${org.slug}/${projectSlug}`)
  }

  const handleSkipProject = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single<{ organization_id: string }>()

    if (!membership) {
      router.push('/login')
      return
    }

    // Get organization slug
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', membership.organization_id)
      .single<{ slug: string }>()

    if (org) {
      router.push(`/${org.slug}`)
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Film className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>
            {step === 1 ? '워크스페이스 만들기' : '첫 번째 프로젝트 만들기'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? '팀을 위한 Organization을 만들어 시작하세요'
              : '첫 번째 영화 프로젝트를 만들어보세요'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization 이름</label>
                <Input
                  placeholder="My Production Company"
                  value={orgName}
                  onChange={handleOrgNameChange}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  영어, 숫자, 공백, 하이픈만 사용 가능합니다
                </p>
                {orgName && (
                  <p className="text-xs text-muted-foreground">
                    URL: /{createSlug(orgName)}
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                className="w-full"
                onClick={handleCreateOrg}
                disabled={!orgName.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                계속하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">프로젝트 이름</label>
                <Input
                  placeholder="나의 첫 번째 영화"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isLoading}
                />
                {projectName && (
                  <p className="text-xs text-muted-foreground">
                    URL: /{orgSlug}/{createSlug(projectName)}
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                className="w-full"
                onClick={handleCreateProject}
                disabled={!projectName.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                프로젝트 만들기
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleSkipProject}
                disabled={isLoading}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                나중에 만들기
              </Button>
            </div>
          )}

          {/* Progress indicator */}
          <div className="mt-6 flex justify-center gap-2">
            <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
