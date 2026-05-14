import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

export function Dashboard() {
    const { user } = useAuth()
    const { t } = useLocale()

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {t('dashboard.welcome')}, {user?.full_name ?? user?.email}
                </p>
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
                <Link
                    to="/accounts"
                    className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                    {t('nav.accounts')}
                </Link>
                <Link
                    to="/contacts"
                    className="rounded-md bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                >
                    {t('nav.contacts')}
                </Link>
            </div>
        </div>
    )
}
