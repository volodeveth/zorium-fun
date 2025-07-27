export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'zorium-theme'
export const DEFAULT_THEME: Theme = 'dark'

/**
 * Safely get theme from localStorage with validation
 */
export function getStoredTheme(): Theme {
  try {
    if (typeof window === 'undefined') return DEFAULT_THEME
    
    // Try localStorage first
    let stored = localStorage.getItem(THEME_STORAGE_KEY)
    
    // If localStorage fails, try sessionStorage as fallback
    if (!stored) {
      stored = sessionStorage.getItem(THEME_STORAGE_KEY)
    }
    
    // Validate stored theme
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    
    return DEFAULT_THEME
  } catch (error) {
    console.warn('Failed to read theme from storage:', error)
    return DEFAULT_THEME
  }
}

/**
 * Safely save theme to localStorage and sessionStorage
 */
export function saveTheme(theme: Theme): void {
  try {
    if (typeof window === 'undefined') return
    
    // Save to both localStorage and sessionStorage for redundancy
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    sessionStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Failed to save theme to storage:', error)
    
    // Try sessionStorage as fallback if localStorage fails
    try {
      sessionStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (sessionError) {
      console.warn('Failed to save theme to sessionStorage:', sessionError)
    }
  }
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}

/**
 * Initialize theme on page load (for use in layout script)
 */
export function initializeTheme(): string {
  try {
    if (typeof window === 'undefined') return DEFAULT_THEME
    
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    const isValidTheme = stored === 'light' || stored === 'dark'
    const theme = isValidTheme ? stored : DEFAULT_THEME
    
    return theme
  } catch (error) {
    return DEFAULT_THEME
  }
}