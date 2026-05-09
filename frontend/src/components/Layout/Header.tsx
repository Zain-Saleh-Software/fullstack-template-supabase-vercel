import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

export const Header = memo(function Header() {
    const { user, isAuthenticated, logout } = useAuth()
    const { locale, setLocale, t } = useLocale()

    const toggleLocale = () => {
        setLocale(locale === 'en' ? 'ar' : 'en')
    }

    return (
        <header className="border-b border-gray-200 bg-white shadow-sm">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link to="/" className="text-xl font-bold text-gray-900">
                        {t('app.name')}
                    </Link>
                    <div className="hidden items-center gap-4 sm:flex">
                        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                            {t('nav.home')}
                        </Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                                {t('nav.dashboard')}
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleLocale}
                        className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                        aria-label={t('locale.toggle')}
                    >
                        {locale === 'en' ? 'AR' : 'EN'}
                    </button>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">{user?.full_name ?? user?.email}</span>
                            <button
                                onClick={logout}
                                className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
                            >
                                {t('auth.logout')}
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                        >
                            {t('auth.login')}
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    )
})
