import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useContactsList, useDeleteContact } from '@/hooks/useContactsQuery'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { hasPermission } from '@/types/role'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'

const PAGE_SIZE = 20

export function ContactList() {
    const { t } = useLocale()
    const { user } = useAuth()
    const [page, setPage] = useState(1)
    const { data, isLoading, error } = useContactsList({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    })
    const deleteContact = useDeleteContact()

    const contacts = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const canDelete = user ? hasPermission(user.role, 'contact:delete') : false
    const canCreate = user ? hasPermission(user.role, 'contact:create') : false
    const showActions = canDelete

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete contact "${name}"?`)) {
            deleteContact.mutate(id)
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('crm.contacts.title')}</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{t('crm.contacts.description')}</p>
                </div>
                {canCreate && (
                    <Link
                        to="/contacts/new"
                        className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {t('crm.contacts.create')}
                    </Link>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={5} />
                ) : error ? (
                    <div className="px-6 py-8 text-center text-red-500 dark:text-red-400">
                        Failed to load contacts. Please try again.
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        {t('crm.contacts.empty')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                        {t('crm.contacts.name')}
                                    </th>
                                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                        {t('crm.contacts.email')}
                                    </th>
                                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                        {t('crm.contacts.jobTitle')}
                                    </th>
                                    <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                        {t('crm.contacts.phone')}
                                    </th>
                                    {showActions && (
                                        <th className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300">
                                            {t('crm.actions')}
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/contacts/${contact.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                {contact.full_name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {contact.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {contact.job_title || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {contact.phone || '-'}
                                        </td>
                                        {showActions && (
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(contact.id, contact.full_name)}
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
