import React from 'react'
import { cn } from '@/lib/utils'

interface SparklesIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
  strokeWidth?: number
}

export const SparklesIcon = React.forwardRef<HTMLImageElement, SparklesIconProps>(
  ({ className, strokeWidth = 1.5, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src="/images/image.svg"
        alt="Sparkles"
        className={cn("shrink-0", className)}
        {...props}
      />
    )
  }
)

SparklesIcon.displayName = "SparklesIcon"
