'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'border-transparent bg-purple-primary text-white hover:bg-purple-hover',
      secondary: 'border-transparent bg-background-secondary text-text-secondary hover:bg-background-tertiary',
      destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
      outline: 'text-text-primary border-border hover:bg-background-secondary'
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'