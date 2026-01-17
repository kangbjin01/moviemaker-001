'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  slug: string
  organization_id: string
}

interface ProjectContextType {
  project: Project | null
  projectId: string | null
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextType>({
  project: null,
  projectId: null,
  isLoading: true,
})

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

interface ProjectProviderProps {
  children: ReactNode
  projectSlug: string
}

export function ProjectProvider({ children, projectSlug }: ProjectProviderProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProject() {
      const { data } = await supabase
        .from('projects')
        .select('id, name, slug, organization_id')
        .eq('slug', projectSlug)
        .single<Project>()

      if (data) {
        setProject(data)
      }
      setIsLoading(false)
    }

    if (projectSlug) {
      fetchProject()
    }
  }, [projectSlug, supabase])

  return (
    <ProjectContext.Provider
      value={{
        project,
        projectId: project?.id ?? null,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}
