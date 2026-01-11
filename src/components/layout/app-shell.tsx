'use client'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppShellProps {
  children: React.ReactNode
  org?: string
  project?: string
  title?: string
}

export function AppShell({ children, org, project, title }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <Topbar title={title} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar org={org} project={project} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
