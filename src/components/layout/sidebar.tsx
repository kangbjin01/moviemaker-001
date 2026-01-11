'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Film,
  Calendar,
  Users,
  MapPin,
  FileText,
  Settings,
  Home,
  ChevronDown,
} from 'lucide-react'

interface SidebarProps {
  org?: string
  project?: string
}

export function Sidebar({ org, project }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Home',
      href: org && project ? `/${org}/${project}` : '/',
      icon: Home,
    },
    {
      name: 'Shooting Days',
      href: org && project ? `/${org}/${project}/shooting-days` : '#',
      icon: Calendar,
    },
    {
      name: 'Scenes',
      href: org && project ? `/${org}/${project}/scenes` : '#',
      icon: FileText,
    },
    {
      name: 'People',
      href: org && project ? `/${org}/${project}/people` : '#',
      icon: Users,
    },
    {
      name: 'Locations',
      href: org && project ? `/${org}/${project}/locations` : '#',
      icon: MapPin,
    },
  ]

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      {/* Project Selector */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-secondary">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Film className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="flex-1 truncate text-sm font-medium">
            {project || 'Select Project'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
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
          Settings
        </Link>
      </div>
    </aside>
  )
}
