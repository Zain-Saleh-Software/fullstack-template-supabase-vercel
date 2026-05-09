import { useEffect, useState } from 'react'
import { useTableChanges } from '@/hooks/useTableChanges'
import { useLocale } from '@/hooks/useLocale'

export function UpdateBanner() {
    const { hasChanges, acknowledgeChanges, refresh } = useTableChanges()
    const { t } = useLocale()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (hasChanges) {
            setVisible(true)
        }
    }, [hasChanges])

    if (!visible) return null

    return (
        <div
            className="fixed left-0 right-0 top-0 z-50 animate-slide-down bg-blue-600 text-white shadow-lg"
            role="alert"
            aria-live="polite"
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    <span>{t('updates.available')}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        onClick={() => {
                            refresh()
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                        aria-label={t('updates.refresh')}
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        {t('updates.refresh')}
                    </button>
                    <button
                        onClick={() => {
                            acknowledgeChanges()
                            setVisible(false)
                        }}
                        className="inline-flex items-center rounded p-1.5 text-white/80 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                        aria-label={t('updates.dismiss')}
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
