import { useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import api from '@/api/client'
import { AuthStateContext } from '@/contexts/AuthContext'
import { useLocale } from '@/hooks/useLocale'
import { hasPermission } from '@/types/role'
import { STORAGE_KEYS } from '@/utils/constants'

interface AppPreloaderProps {
    children: ReactNode
}

export function AppPreloader({ children }: AppPreloaderProps) {
    const queryClient = useQueryClient()
    const [ready, setReady] = useState(false)
    const { t } = useLocale()
    const { user } = useContext(AuthStateContext) ?? { user: null }
    const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

    useEffect(() => {
        let cancelled = false
        const preload = async () => {
            try {
                const tasks: Promise<unknown>[] = []
                if (hasToken && user) {
                    if (hasPermission(user.role, 'user:read')) {
                        tasks.push(
                            queryClient.prefetchQuery({
                                queryKey: ['users', 'list'],
                                queryFn: () => usersApi.list(),
                                staleTime: 30_000,
                            }),
                        )
                    }
                    if (hasPermission(user.role, 'event:read')) {
                        tasks.push(
                            queryClient.prefetchQuery({
                                queryKey: ['events', 'list', { limit: 100 }],
                                queryFn: async () => {
                                    const { data } = await api.get('/events', { params: { limit: 100 } })
                                    return data
                                },
                                staleTime: 30_000,
                            }),
                        )
                    }
                }
                await Promise.allSettled(tasks)
            } finally {
                if (!cancelled) setReady(true)
            }
        }
        preload()
        return () => {
            cancelled = true
        }
    }, [queryClient, hasToken, user])

    if (!ready) {
        return (
            <div
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-gray-950"
                role="status"
                aria-label={t('loading.app')}
            >
                <div className="flex flex-col items-center gap-4">
                    <svg
                        className="h-10 w-10 animate-spin text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('loading.app')}</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
