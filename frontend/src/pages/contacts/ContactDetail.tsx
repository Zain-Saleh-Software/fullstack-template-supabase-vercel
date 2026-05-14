import { useParams, Link } from 'react-router-dom'
import { useContact, useDeleteContact } from '@/hooks/useContactsQuery'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { hasPermission } from '@/types/role'
import { Skeleton } from '@/components/ui/Skeleton'

export function ContactDetail() {
    const { id } = useParams<{ id: string }>()
    const { t } = useLocale()
    const { user } = useAuth()
    const { data: contact, isLoading, error } = useContact(id!)
    const deleteContact = useDeleteContact()
    const canDelete = user ? hasPermission(user.role, 'contact:delete') : false
    const canUpdate = user ? hasPermission(user.role, 'contact:update') : false

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
                Failed to load contact details. Please try again.
            </div>
        )
    if (!contact) return <div className="text-gray-500 dark:text-gray-400">Contact not found</div>

    const handleDelete = () => {
        if (confirm(`Delete contact "${contact.full_name}"?`)) {
            deleteContact.mutate(contact.id)
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        to="/contacts"
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        &larr; {t('crm.contacts.title')}
                    </Link>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{contact.full_name}</h1>
                </div>
                <div className="flex gap-2">
                    {canUpdate && (
                        <Link
                            to={`/contacts/${id}/edit`}
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
                    {t('crm.contacts.details')}
                </h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.firstName')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.first_name}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.lastName')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.last_name}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.email')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.email || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.phone')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.phone || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.mobilePhone')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.mobile_phone || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.mobilePhone2')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.mobile_phone_2 || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.jobTitle')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.job_title || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.department')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.department || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('crm.contacts.isPrimary')}</dt>
                        <dd className="font-medium dark:text-gray-200">{contact.is_primary ? '\u2713' : '\u2717'}</dd>
                    </div>
                </dl>
            </div>
        </div>
    )
}
