// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Film, Plus, Loader2, FolderOpen, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  slug: string
  created_at: string
}

interface Organization {
  id: string
  name: string
  slug: string
}

export default function OrganizationHomePage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.org as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // Get organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', orgSlug)
        .single()

      if (!org) {
        router.push('/login')
        return
      }

      setOrganization(org)

      // Get projects
      const { data: projectList } = await supabase
        .from('projects')
        .select('id, name, slug, created_at')
        .eq('organization_id', org.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setProjects(projectList || [])
      setIsLoading(false)
    }

    fetchData()
  }, [orgSlug, supabase, router])

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !organization) return

    setIsCreating(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('로그인이 필요합니다')
      setIsCreating(false)
      return
    }

    const projectSlug = createSlug(newProjectName)

    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert([{
        organization_id: organization.id,
        name: newProjectName,
        slug: projectSlug,
        created_by: user.id,
      }] as any)
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      setIsCreating(false)
      return
    }

    setDialogOpen(false)
    setNewProjectName('')
    setIsCreating(false)

    // Navigate to new project
    router.push(`/${orgSlug}/${projectSlug}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Film className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{organization?.name}</h1>
                <p className="text-sm text-muted-foreground">프로젝트 관리</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  새 프로젝트
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 프로젝트 만들기</DialogTitle>
                  <DialogDescription>
                    새로운 영화 프로젝트를 시작하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">프로젝트 이름</label>
                    <Input
                      placeholder="예: 나의 첫 번째 영화"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      disabled={isCreating}
                    />
                    {newProjectName && (
                      <p className="text-xs text-muted-foreground">
                        URL: /{orgSlug}/{createSlug(newProjectName)}
                      </p>
                    )}
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isCreating}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    만들기
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>프로젝트가 없습니다</CardTitle>
              <CardDescription>
                첫 번째 프로젝트를 만들어서 시작하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                새 프로젝트 만들기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/${orgSlug}/${project.slug}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Film className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
