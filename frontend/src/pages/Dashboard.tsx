import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { useUsersList } from '@/hooks/useUsersQuery'
import { SkeletonTable } from '@/components/ui/Skeleton'

export function Dashboard() {
    const { user } = useAuth()
    const { t } = useLocale()
    const { data: users, isLoading, error } = useUsersList()

    if (isLoading) {
        return (
            <div>
                <div className="mb-8">
                    <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                    </div>
                    <SkeletonTable rows={5} cols={2} />
                </div>
            </div>
        )
    }
    if (error) return <div className="text-red-500">Error: {(error as Error).message}</div>

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                <p className="mt-1 text-gray-600">
                    {t('dashboard.welcome')}, {user?.full_name ?? user?.email}
                </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.users')}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {(users ?? []).map((u) => (
                        <div key={u.id} className="flex items-center justify-between px-6 py-4">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{u.full_name ?? u.email}</p>
                                <p className="text-sm text-gray-500">{u.email}</p>
                            </div>
                            <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                    u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                                role="status"
                            >
                                <span className="mr-1">{u.is_active ? '\u2713' : '\u2717'}</span>
                                {u.is_active ? t('dashboard.active') : t('dashboard.inactive')}
                            </span>
                        </div>
                    ))}
                    {(users ?? []).length === 0 && (
                        <p className="px-6 py-8 text-center text-gray-500">{t('dashboard.noUsers')}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
