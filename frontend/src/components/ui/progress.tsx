'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={clsx(
          'relative h-4 w-full overflow-hidden rounded-full bg-background-secondary',
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-purple-primary transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = 'Progress'