import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center rounded-full border border-transparent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-primary/10 text-primary ring-primary/20 dark:bg-primary/20',
        secondary:
          'bg-secondary text-secondary-foreground ring-border/60',
        outline: 'bg-transparent text-foreground ring-border',
        upcoming:
          'bg-blue-500/15 text-blue-300 ring-blue-500/30 dark:bg-blue-500/20 dark:text-blue-200',
        locked:
          'bg-orange-500/15 text-orange-300 ring-orange-500/30 dark:bg-orange-500/20 dark:text-orange-200',
        finished:
          'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
