'use client'

import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-lg bg-background-secondary border border-border flex items-center justify-center">
        <div className="w-5 h-5 bg-text-secondary/20 rounded animate-pulse" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-lg bg-background-secondary hover:bg-background-tertiary border border-border flex items-center justify-center transition-all duration-200 group"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        {/* Sun Icon (Light Mode) */}
        <Sun 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100 text-amber-500' 
              : 'opacity-0 -rotate-90 scale-75 text-text-secondary'
          }`}
        />
        
        {/* Moon Icon (Dark Mode) */}
        <Moon 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100 text-blue-400' 
              : 'opacity-0 rotate-90 scale-75 text-text-secondary'
          }`}
        />
      </div>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-active:opacity-20 bg-purple-primary transition-opacity duration-150" />
    </button>
  )
}