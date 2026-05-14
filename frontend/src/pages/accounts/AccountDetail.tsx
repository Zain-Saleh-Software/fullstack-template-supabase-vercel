import { useParams, Link } from 'react-router-dom'
import { useAccount, useDeleteAccount } from '@/hooks/useAccountsQuery'
import { useContactsList } from '@/hooks/useContactsQuery'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { hasPermission } from '@/types/role'
import { Skeleton } from '@/components/ui/Skeleton'

export function AccountDetail() {
    const { id } = useParams<{ id: string }>()
    const { t } = useLocale()
    const { user } = useAuth()
    const { data: account, isLoading, error } = useAccount(id!)
    const { data: contactsData } = useContactsList({ account_id: id, limit: 10 })
    const deleteAccount = useDeleteAccount()
    const canDelete = user ? hasPermission(user.role, 'account:delete') : false
    const canUpdate = user ? hasPermission(user.role, 'account:update') : false
    const canCreateContact = user ? hasPermission(user.role, 'contact:create') : false

    if (isLoading)
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    if (error)
        return (
            <div className="text-red-500 dark:text-red-400" role="alert">
                Failed to load account details. Please try again.
            </div>
        )
    if (!account) return <div className="text-gray-500 dark:text-gray-400">Account not found</div>

    const handleDelete = () => {
        if (confirm(`Delete account "${account.name}"?`)) {
            deleteAccount.mutate(account.id)
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        to="/accounts"
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        &larr; {t('crm.accounts.title')}
                    </Link>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
                </div>
                <div className="flex gap-2">
                    {canUpdate && (
                        <Link
                            to={`/accounts/${id}/edit`}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            {t('crm.edit')}
                        </Link>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                        >
                            {t('crm.delete')}
                        </button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {t('crm.accounts.details')}
                </h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.accounts.name')}</dt>
                        <dd className="font-medium dark:text-gray-200">{account.name}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.accounts.type')}</dt>
                        <dd className="font-medium dark:text-gray-200">{account.account_type}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.accounts.status')}</dt>
                        <dd className="font-medium dark:text-gray-200">{account.status}</dd>
                    </div>
                </dl>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('crm.contacts.title')}</h2>
                </div>
                {contactsData?.data?.length ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {contactsData.data.map((c) => (
                            <div key={c.id} className="flex items-center justify-between px-6 py-3">
                                <Link
                                    to={`/contacts/${c.id}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    {c.full_name}
                                </Link>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{c.job_title || ''}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t('crm.contacts.empty')}</div>
                )}
                {canCreateContact && (
                    <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                        <Link
                            to={`/contacts/new?account_id=${id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            + {t('crm.contacts.create')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
