import { memo } from 'react'
import { useLocale } from '@/hooks/useLocale'

export const Footer = memo(function Footer() {
    const { t } = useLocale()
    const year = new Date().getFullYear()

    return (
        <footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {year} {t('app.name')}. {t('footer.rights')}
                    </p>
                    <div className="flex items-center gap-4">
                        <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            {t('footer.privacy')}
                        </button>
                        <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            {t('footer.terms')}
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    )
})
