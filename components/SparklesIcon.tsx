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
               Q18 6 24 12
               Q18 18 12 22
               Q6 18 0 12
               Q6 6 12 2 Z"
            fill="currentColor"
          />
          {/* внутренний ромб */}
          <path
            d="M12 7 L17 12 L12 17 L7 12 Z"
            fill="white"
          />
        </g>

        {/* большая искра (справа-снизу) */}
        <g transform="translate(13, 11) scale(1.1)">
          <path
            d="M12 2
               Q18 6 24 12
               Q18 18 12 22
               Q6 18 0 12
               Q6 6 12 2 Z"
            fill="currentColor"
          />
          <path
            d="M12 7 L17 12 L12 17 L7 12 Z"
            fill="white"
          />
        </g>
      </svg>
    )
  }
)

SparklesIcon.displayName = "SparklesIcon"
