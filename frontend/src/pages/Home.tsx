import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

export function Home() {
    const { isAuthenticated } = useAuth()
    const { t } = useLocale()

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">{t('home.title')}</h1>
            <p className="mb-8 max-w-2xl text-lg text-gray-600">{t('home.description')}</p>
            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <Link
                        to="/dashboard"
                        className="rounded-md bg-blue-500 px-6 py-3 text-lg font-medium text-white hover:bg-blue-600"
                    >
                        {t('home.goToDashboard')}
                    </Link>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className="rounded-md bg-blue-500 px-6 py-3 text-lg font-medium text-white hover:bg-blue-600"
                        >
                            {t('auth.login')}
                        </Link>
                        <Link
                            to="/register"
                            className="rounded-md border border-gray-300 px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {t('auth.register')}
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
