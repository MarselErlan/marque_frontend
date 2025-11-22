import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SparklesIconProps {
  className?: string
  strokeWidth?: number
}

export const SparklesIcon: React.FC<SparklesIconProps> = ({ className, strokeWidth = 1.5 }) => {
  return (
    <Sparkles
      className={cn("shrink-0", className)}
      strokeWidth={strokeWidth}
    />
  )
}
