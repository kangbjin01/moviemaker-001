'use client'

import { ProjectProvider } from '@/contexts/project-context'

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { org: string; project: string }
}) {
  return (
    <ProjectProvider projectSlug={params.project}>
      {children}
    </ProjectProvider>
  )
}
