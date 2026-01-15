'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import {
  Film,
  Calendar,
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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

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

  const navigation = [
    {
      name: '대시보드',
      href: org && project ? `/${org}/${project}` : '/',
      icon: Home,
    },
    {
      name: '피플',
      href: org && project ? `/${org}/${project}/people` : '#',
      icon: Users,
    },
    {
      name: '일일촬영계획표',
      href: org && project ? `/${org}/${project}/shooting-days` : '#',
      icon: Calendar,
    },
    {
      name: '파일',
      href: org && project ? `/${org}/${project}/files` : '#',
      icon: FolderOpen,
    },
  ]

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
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-secondary font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
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
