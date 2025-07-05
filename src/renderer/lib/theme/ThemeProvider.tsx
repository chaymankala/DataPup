import { createContext, useEffect, useState, ReactNode } from 'react'
import { Theme as RadixTheme } from '@radix-ui/themes'
import { Theme, ThemeContextValue } from './types'
import { themes, defaultTheme } from './themes'

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'datapup-theme'

interface ThemeProviderProps {
  children: ReactNode
  defaultThemeId?: string
}

export function ThemeProvider({ children, defaultThemeId }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Try to load from localStorage
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedThemeId) {
      const savedTheme = themes.find((t) => t.id === savedThemeId)
      if (savedTheme) return savedTheme
    }

    // Try to use provided default
    if (defaultThemeId) {
      const providedTheme = themes.find((t) => t.id === defaultThemeId)
      if (providedTheme) return providedTheme
    }

    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return themes.find((t) => t.id === 'light') || defaultTheme
    }

    return defaultTheme
  })

  useEffect(() => {
    // Save theme preference
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme.id)
  }, [currentTheme])

  const setTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
    }
  }

  const contextValue: ThemeContextValue = {
    theme: currentTheme,
    setTheme,
    themes
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <RadixTheme
        appearance={currentTheme.appearance}
        accentColor={currentTheme.accentColor}
        grayColor={currentTheme.grayColor}
        radius={currentTheme.radius}
        scaling={currentTheme.scaling}
      >
        {children}
      </RadixTheme>
    </ThemeContext.Provider>
  )
}
