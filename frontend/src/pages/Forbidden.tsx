import { Link } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'

export function Forbidden() {
    const { t } = useLocale()
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
                <h1 className="mb-4 text-6xl font-bold text-gray-300 dark:text-gray-600">403</h1>
                <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {t('errors.forbidden') || 'Access Denied'}
                </h2>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    {t('errors.forbiddenMessage') || 'You do not have permission to access this page.'}
                </p>
                <Link
                    to="/"
                    className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                    {t('errors.goHome') || 'Go Home'}
                </Link>
            </div>
        </div>
    )
}
