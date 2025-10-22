"use client"

import { Sparkles } from 'lucide-react'

interface MannequinIconProps {
  className?: string
  size?: number
}

export const MannequinIcon = ({ className = "", size = 32 }: MannequinIconProps) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* 3D Mannequin SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Head */}
        <circle cx="12" cy="5" r="2.5" fill="currentColor" className="text-gray-700" />
        
        {/* Neck */}
        <rect x="11" y="7" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-gray-600" />
        
        {/* Body/Torso */}
        <path
          d="M9 8.5 C9 8.5 9 12 9 13.5 L10 18 L11.5 18 L11.5 22.5 L12.5 22.5 L12.5 18 L14 18 L15 13.5 C15 12 15 8.5 15 8.5 Z"
          fill="currentColor"
          className="text-gray-700"
        />
        
        {/* Shoulders - 3D effect */}
        <ellipse cx="9" cy="9" rx="1.5" ry="1" fill="currentColor" className="text-gray-600" />
        <ellipse cx="15" cy="9" rx="1.5" ry="1" fill="currentColor" className="text-gray-600" />
        
        {/* Arms */}
        <rect x="7" y="9" width="1.5" height="5" rx="0.75" fill="currentColor" className="text-gray-600" />
        <rect x="15.5" y="9" width="1.5" height="5" rx="0.75" fill="currentColor" className="text-gray-600" />
        
        {/* Legs */}
        <rect x="10" y="18" width="1.5" height="4.5" rx="0.75" fill="currentColor" className="text-gray-600" />
        <rect x="12.5" y="18" width="1.5" height="4.5" rx="0.75" fill="currentColor" className="text-gray-600" />
        
        {/* Base/Stand */}
        <ellipse cx="12" cy="23" rx="3" ry="0.5" fill="currentColor" className="text-gray-400" opacity="0.6" />
        
        {/* 3D Shading effects */}
        <circle cx="12" cy="5" r="2.5" fill="url(#headGradient)" />
        <path
          d="M9 8.5 C9 8.5 9 12 9 13.5 L10 18 L11.5 18 L11.5 22.5 L12.5 22.5 L12.5 18 L14 18 L15 13.5 C15 12 15 8.5 15 8.5 Z"
          fill="url(#bodyGradient)"
        />
        
        {/* Gradient Definitions for 3D effect */}
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(55, 65, 81, 0.4)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </linearGradient>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(55, 65, 81, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* AI Sparkle Effect */}
      <Sparkles 
        className="absolute -top-1 -right-1 w-3 h-3 text-brand animate-pulse" 
        fill="currentColor"
      />
      <Sparkles 
        className="absolute -top-0.5 right-1 w-2 h-2 text-yellow-400 animate-pulse" 
        fill="currentColor"
        style={{ animationDelay: '0.3s' }}
      />
    </div>
  )
}

// Alternative 3D Mannequin Icon (more detailed)
export const DetailedMannequinIcon = ({ className = "", size = 32 }: MannequinIconProps) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Head with 3D effect */}
        <circle cx="24" cy="10" r="5" fill="#4B5563" />
        <circle cx="24" cy="10" r="5" fill="url(#head3D)" />
        <circle cx="22.5" cy="9" r="1" fill="#E5E7EB" opacity="0.4" />
        
        {/* Neck */}
        <rect x="22" y="14" width="4" height="3" rx="1" fill="#6B7280" />
        
        {/* Upper Body/Chest */}
        <path
          d="M18 17 L18 24 C18 25 18.5 26 19.5 26.5 L20 36 L22 36 L22.5 44 L25.5 44 L26 36 L28 36 L28.5 26.5 C29.5 26 30 25 30 24 L30 17 Z"
          fill="#4B5563"
        />
        <path
          d="M18 17 L18 24 C18 25 18.5 26 19.5 26.5 L20 36 L22 36 L22.5 44 L25.5 44 L26 36 L28 36 L28.5 26.5 C29.5 26 30 25 30 24 L30 17 Z"
          fill="url(#body3D)"
        />
        
        {/* Shoulders - 3D spheres */}
        <circle cx="17.5" cy="18" r="2.5" fill="#6B7280" />
        <circle cx="17.5" cy="18" r="2.5" fill="url(#shoulder3D)" />
        <circle cx="30.5" cy="18" r="2.5" fill="#6B7280" />
        <circle cx="30.5" cy="18" r="2.5" fill="url(#shoulder3D)" />
        
        {/* Arms */}
        <rect x="14" y="18" width="3" height="10" rx="1.5" fill="#6B7280" />
        <rect x="31" y="18" width="3" height="10" rx="1.5" fill="#6B7280" />
        
        {/* Legs */}
        <rect x="20.5" y="36" width="3" height="9" rx="1.5" fill="#6B7280" />
        <rect x="24.5" y="36" width="3" height="9" rx="1.5" fill="#6B7280" />
        
        {/* Base/Platform */}
        <ellipse cx="24" cy="45.5" rx="8" ry="1.5" fill="#9CA3AF" opacity="0.6" />
        <rect x="22" y="44" width="4" height="2" fill="#6B7280" />
        
        {/* Gradient Definitions */}
        <defs>
          <radialGradient id="head3D" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.1)" />
          </radialGradient>
          <linearGradient id="body3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="50%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.2)" />
          </linearGradient>
          <radialGradient id="shoulder3D" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.2)" />
          </radialGradient>
        </defs>
      </svg>
      
      {/* AI Sparkles with animation */}
      <div className="absolute -top-1 -right-1 animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-brand" fill="currentColor" />
      </div>
      <div className="absolute top-0 right-1.5 animate-pulse" style={{ animationDelay: '0.5s' }}>
        <Sparkles className="w-2.5 h-2.5 text-yellow-400" fill="currentColor" />
      </div>
    </div>
  )
}

