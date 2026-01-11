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
            현대적인 영상 제작 관리 시스템
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            시작하기
          </Link>
          <p className="text-xs text-muted-foreground">
            제작을 계획하고, 협업하고, 실행하세요
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 pt-8 text-left">
          <FeatureCard
            title="촬영 계획"
            description="엑셀보다 빠르게 촬영 일정을 작성하세요"
          />
          <FeatureCard
            title="실시간 동기화"
            description="팀과 즉시 협업하세요"
          />
          <FeatureCard
            title="자동 내보내기"
            description="클릭 한 번으로 PDF & Excel 생성"
          />
          <FeatureCard
            title="버전 관리"
            description="변경 사항을 추적하고 비교하세요"
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
