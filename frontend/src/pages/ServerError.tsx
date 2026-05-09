import { Link } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'

export function ServerError() {
    const { t } = useLocale()
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
                <h1 className="mb-4 text-6xl font-bold text-gray-300">500</h1>
                <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                    {t('errors.serverError') || 'Server Error'}
                </h2>
                <p className="mb-6 text-gray-600">
                    {t('errors.serverErrorMessage') || 'Something went wrong on our end. Please try again later.'}
                </p>
                <Link to="/" className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                    {t('errors.goHome') || 'Go Home'}
                </Link>
            </div>
        </div>
    )
}
