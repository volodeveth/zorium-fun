'use client'

import { useState, useEffect } from 'react'
import { Theme, getStoredTheme, saveTheme, applyTheme } from '@/lib/utils/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Get stored theme or default to dark
    const initialTheme = getStoredTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)
    
    // Listen for storage changes (theme changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zorium-theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue)
        applyTheme(e.newValue)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
    saveTheme(newTheme)
  }

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    saveTheme(newTheme)
  }

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    mounted,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }
}