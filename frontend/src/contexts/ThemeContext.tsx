import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Theme } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

interface ThemeContextType {
    theme: Theme
    resolvedTheme: 'light' | 'dark'
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getInitialTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) return saved
    return 'system'
}

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
    if (resolved === 'dark') {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme)

    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme

    useEffect(() => {
        applyTheme(resolvedTheme)
    }, [resolvedTheme])

    useEffect(() => {
        if (theme !== 'system') return

        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme(mq.matches ? 'dark' : 'light')
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [theme])

    const setTheme = useCallback((newTheme: Theme) => {
        localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        const next = resolvedTheme === 'dark' ? 'light' : 'dark'
        setTheme(next)
    }, [resolvedTheme, setTheme])

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
