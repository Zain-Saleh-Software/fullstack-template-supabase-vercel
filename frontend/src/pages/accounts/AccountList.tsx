import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccountsList, useDeleteAccount } from '@/hooks/useAccountsQuery'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { hasPermission } from '@/types/role'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'

const PAGE_SIZE = 20

export function AccountList() {
    const { t } = useLocale()
    const { user } = useAuth()
    const [page, setPage] = useState(1)
    const { data, isLoading, error } = useAccountsList({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    })
    const deleteAccount = useDeleteAccount()

    const accounts = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const canDelete = user ? hasPermission(user.role, 'account:delete') : false
    const canCreate = user ? hasPermission(user.role, 'account:create') : false
    const showActions = canDelete

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete account "${name}"?`)) {
            deleteAccount.mutate(id)
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('crm.accounts.title')}</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{t('crm.accounts.description')}</p>
                </div>
                {canCreate && (
                    <Link
                        to="/accounts/new"
                        className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {t('crm.accounts.create')}
                    </Link>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={4} />
                ) : error ? (
                    <div className="px-6 py-8 text-center text-red-500 dark:text-red-400">
                        Failed to load accounts. Please try again.
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        {t('crm.accounts.empty')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                        {t('crm.accounts.name')}
                                    </th>
                                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                        {t('crm.accounts.type')}
                                    </th>
                                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                        {t('crm.accounts.status')}
                                    </th>
                                    {showActions && (
                                        <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                            {t('crm.actions')}
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/accounts/${account.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                {account.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                {account.account_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs ${
                                                    account.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                            >
                                                {account.status}
                                            </span>
                                        </td>
                                        {showActions && (
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(account.id, account.name)}
                                                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    {t('crm.delete')}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    )
}
