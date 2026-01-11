import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Film Production OS
          </h1>
          <p className="text-secondary-foreground text-sm">
            Modern film production management
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
          <p className="text-xs text-muted-foreground">
            Plan, collaborate, and execute your productions
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 pt-8 text-left">
          <FeatureCard
            title="Shot Planning"
            description="Build shooting schedules faster than Excel"
          />
          <FeatureCard
            title="Real-time Sync"
            description="Collaborate with your team instantly"
          />
          <FeatureCard
            title="Auto Export"
            description="Generate PDF & Excel with one click"
          />
          <FeatureCard
            title="Version Control"
            description="Track changes with diff view"
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border p-4 transition-colors hover:bg-secondary">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
