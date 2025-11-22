import React from 'react'
import { cn } from '@/lib/utils'

interface SparklesIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  strokeWidth?: number
}

export const SparklesIcon = React.forwardRef<SVGSVGElement, SparklesIconProps>(
  ({ className, strokeWidth = 1.5, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn("shrink-0", className)}
        {...props}
      >
        {/* Smaller sparkle (top left) - four-pointed star like a plus rotated 45 degrees */}
        <path d="M8 4L8.5 3L9.5 3L10 4L9.5 5L8.5 5L8 4Z" />
        {/* Larger sparkle (bottom center) - four-pointed diamond star */}
        <path d="M12 20L14 15L19 13L14 11L12 6L10 11L5 13L10 15L12 20Z" />
      </svg>
    )
  }
)

SparklesIcon.displayName = "SparklesIcon"

