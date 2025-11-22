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
        {/* Using the SVG from the provided file - extracting sparkle paths */}
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" 
              fill="currentColor" 
              transform="translate(-5, -1) scale(0.35)" />
        
        {/* Larger sparkle (bottom right) - four-pointed star with rounded bulbous points */}
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" 
              fill="currentColor" 
              transform="translate(5, 13) scale(0.5)" />
      </svg>
    )
  }
)

SparklesIcon.displayName = "SparklesIcon"
