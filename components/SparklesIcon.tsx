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
        viewBox="0 0 32 32"
        fill="currentColor"
        className={cn("shrink-0", className)}
        {...props}
      >
        {/* маленькая искра (слева-сверху) */}
        <g transform="translate(4, 2) scale(0.6)">
          {/* внешняя форма */}
          <path
            d="M12 2
               Q16 8 22 12
               Q16 16 12 22
               Q8 16 2 12
               Q8 8 12 2 Z"
            fill="currentColor"
          />
          {/* внутренний ромб */}
          <path
            d="M12 8 L16 12 L12 16 L8 12 Z"
            fill="white"
          />
        </g>

        {/* большая искра (справа-снизу) */}
        <g transform="translate(13, 11) scale(1.1)">
          <path
            d="M12 2
               Q16 8 22 12
               Q16 16 12 22
               Q8 16 2 12
               Q8 8 12 2 Z"
            fill="currentColor"
          />
          <path
            d="M12 8 L16 12 L12 16 L8 12 Z"
            fill="white"
          />
        </g>
      </svg>
    )
  }
)

SparklesIcon.displayName = "SparklesIcon"
