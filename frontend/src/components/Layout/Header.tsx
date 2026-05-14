import { memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const Header = memo(function Header() {
    const { user, isAuthenticated, logout } = useAuth()
    const { locale, setLocale, t } = useLocale()
    const { pathname } = useLocation()

    const toggleLocale = () => {
        setLocale(locale === 'en' ? 'ar' : 'en')
    }

    return (
        <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900/30">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('app.name')}
                    </Link>
                    <div className="hidden items-center gap-4 sm:flex">
                        <Link
                            to="/"
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            {t('nav.home')}
                        </Link>
                        {isAuthenticated && (
                            <Link
                                to="/dashboard"
                                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                {t('nav.dashboard')}
                            </Link>
                        )}
                        {isAuthenticated && (
                            <Link
                                to="/accounts"
                                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                {t('nav.accounts')}
                            </Link>
                        )}
                        {isAuthenticated && (
                            <Link
                                to="/contacts"
                                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                {t('nav.contacts')}
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />
                    <button
                        onClick={toggleLocale}
                        className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        aria-label={t('locale.toggle')}
                    >
                        {locale === 'en' ? 'AR' : 'EN'}
                    </button>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/profile"
                                className="text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                {user?.full_name ?? user?.email}
                            </Link>
                            <button
                                onClick={logout}
                                className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
                            >
                                {t('auth.logout')}
                            </button>
                        </div>
                    ) : (
                        <Link
                            to={pathname === '/login' ? '/register' : '/login'}
                            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                        >
                            {pathname === '/login' ? t('auth.register') : t('auth.login')}
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    )
})
