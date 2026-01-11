import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        success: 'bg-[#10B981]/10 text-[#10B981]',
        warning: 'bg-[#F59E0B]/10 text-[#F59E0B]',
        error: 'bg-[#DC2626]/10 text-[#DC2626]',
        // Scene time badges
        morning: 'bg-[#F59E0B]/10 text-[#F59E0B]',
        day: 'bg-[#3B82F6]/10 text-[#3B82F6]',
        evening: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
        night: 'bg-[#1F2937]/10 text-[#1F2937]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
