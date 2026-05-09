import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Locale, Direction } from '@/types'

interface LocaleContextType {
    locale: Locale
    direction: Direction
    setLocale: (locale: Locale) => void
    t: (key: string) => string
}

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const localeMap: Record<Locale, Direction> = {
    en: 'ltr',
    ar: 'rtl',
}

async function loadMessages(locale: Locale): Promise<Record<string, string>> {
    try {
        const messages = await import(`@/i18n/${locale}.json`)
        return messages.default
    } catch {
        return {}
    }
}

function getInitialLocale(): Locale {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && (saved === 'en' || saved === 'ar')) return saved
    return (import.meta.env.VITE_DEFAULT_LOCALE as Locale) || 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
    const [messages, setMessages] = useState<Record<string, string>>({})

    useEffect(() => {
        const controller = new AbortController()
        loadMessages(locale).then((msgs) => {
            if (!controller.signal.aborted) {
                setMessages(msgs)
            }
        })
        document.documentElement.lang = locale
        document.documentElement.dir = localeMap[locale]
        localStorage.setItem('locale', locale)
        return () => controller.abort()
    }, [locale])

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale)
    }, [])

    const direction: Direction = localeMap[locale]

    const t = useCallback(
        (key: string): string => {
            return messages[key] || key
        },
        [messages],
    )

    return (
        <LocaleContext.Provider value={{ locale, direction, setLocale, t }}>
            <div dir={direction} lang={locale}>
                {children}
            </div>
        </LocaleContext.Provider>
    )
}
