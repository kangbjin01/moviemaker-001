'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { getGroupedModules, phaseLabels } from '@/modules'
import type { ProductionPhase } from '@/lib/modules/module-types'
import {
  Film,
  Users,
  Settings,
  Home,
  ChevronDown,
  FolderOpen,
  Check,
  Plus,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  slug: string
}

interface SidebarProps {
  org?: string
  project?: string
}

export function Sidebar({ org, project }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectName, setCurrentProjectName] = useState<string>('')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      if (!org) return

      // Get organization
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', org)
        .single<{ id: string }>()

      if (!orgData) return

      // Get projects
      const { data: projectList } = await supabase
        .from('projects')
        .select('id, name, slug')
        .eq('organization_id', orgData.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .returns<Project[]>()

      setProjects(projectList || [])

      // Set current project name
      const current = projectList?.find(p => p.slug === project)
      if (current) {
        setCurrentProjectName(current.name)
      }
    }

    fetchProjects()
  }, [org, project, supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProjectSelect = (projectSlug: string) => {
    setIsOpen(false)
    router.push(`/${org}/${projectSlug}`)
  }

  // 그룹화된 모듈
  const groupedModules = getGroupedModules()

  // 표시할 단계 순서
  const phaseOrder: ProductionPhase[] = ['master', 'pre', 'production', 'post']

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      {/* Project Selector Dropdown */}
      <div className="relative flex h-14 items-center border-b border-border px-4" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-secondary"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Film className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="flex-1 truncate text-sm font-medium">
            {currentProjectName || project || 'Select Project'}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-lg border border-border bg-background shadow-lg">
            <div className="max-h-64 overflow-y-auto p-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProjectSelect(p.slug)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-secondary",
                    p.slug === project && "bg-secondary"
                  )}
                >
                  <Film className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-left">{p.name}</span>
                  {p.slug === project && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            {/* Divider + All Projects Link */}
            <div className="border-t border-border p-1">
              <Link
                href={org ? `/${org}` : '/'}
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>모든 프로젝트 보기</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* 대시보드 */}
        <Link
          href={org && project ? `/${org}/${project}` : '/'}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === `/${org}/${project}`
              ? 'bg-secondary font-medium text-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <Home className="h-4 w-4" />
          대시보드
        </Link>

        {/* 피플 */}
        <Link
          href={org && project ? `/${org}/${project}/people` : '#'}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === `/${org}/${project}/people`
              ? 'bg-secondary font-medium text-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <Users className="h-4 w-4" />
          피플
        </Link>

        {/* 파일 */}
        <Link
          href={org && project ? `/${org}/${project}/files` : '#'}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === `/${org}/${project}/files`
              ? 'bg-secondary font-medium text-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <FolderOpen className="h-4 w-4" />
          파일
        </Link>

        {/* 단계별 모듈 그룹 */}
        {phaseOrder.map((phase) => {
          const modules = groupedModules[phase]
          if (modules.length === 0) return null

          const isCollapsed = collapsedSections[phase]

          return (
            <div key={phase} className="mt-4">
              <button
                onClick={() => toggleSection(phase)}
                className="flex w-full items-center justify-between px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>{phaseLabels[phase]}</span>
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  isCollapsed && "-rotate-90"
                )} />
              </button>
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {modules.map((module) => {
                    const href = org && project ? `/${org}/${project}${module.basePath}` : '#'
                    const isActive = pathname === href
                    return (
                      <Link
                        key={module.id}
                        href={href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-secondary font-medium text-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <module.icon className="h-4 w-4" />
                        {module.shortName}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-border p-2">
        <Link
          href={org && project ? `/${org}/${project}/settings` : '#'}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          설정
        </Link>
      </div>
    </aside>
  )
}
