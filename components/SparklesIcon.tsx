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
        {/* Smaller sparkle (top left) - four-pointed star with rounded bulbous points */}
        <path d="M6.5 2.5 C6.5 2.5 7 1.5 8 1.5 C9 1.5 9.5 2.5 9.5 2.5 C9.5 2.5 10.5 2 10.5 3 C10.5 4 9.5 4.5 9.5 4.5 C9.5 4.5 10 5.5 9 5.5 C8 5.5 7.5 4.5 7.5 4.5 C7.5 4.5 6.5 5 6.5 4 C6.5 3 7.5 2.5 7.5 2.5 C7.5 2.5 7 1.5 6.5 2.5 Z" />
        {/* Central diamond cutout for smaller sparkle */}
        <path d="M7.5 3.5 L8 3 L8.5 3.5 L8 4 L7.5 3.5 Z" fill="white" />
        
        {/* Larger sparkle (bottom right) - four-pointed star with rounded bulbous points */}
        <path d="M10 17 C10 17 12.5 12.5 17.5 10 C22.5 7.5 25 2.5 25 2.5 C25 2.5 22.5 -2.5 17.5 0 C12.5 2.5 10 7.5 10 7.5 C10 7.5 7.5 2.5 2.5 0 C-2.5 -2.5 -5 2.5 -5 2.5 C-5 2.5 -2.5 7.5 2.5 10 C7.5 12.5 10 17 10 17 Z" />
        {/* Central diamond cutout for larger sparkle */}
        <path d="M10 13.5 L11.5 12 L13 13.5 L11.5 15 L10 13.5 Z" fill="white" />
      </svg>
    )
  }
)

SparklesIcon.displayName = "SparklesIcon"

