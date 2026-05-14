import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import type { RoleType } from '@/types/role'
import { hasPermission } from '@/types/role'
import { useUsersList, useDeleteUser } from '@/hooks/useUsersQuery'
import { useAccountsList, useCreateAccount, useDeleteAccount } from '@/hooks/useAccountsQuery'
import { useContactsList, useCreateContact, useDeleteContact } from '@/hooks/useContactsQuery'
import { useToast } from '@/components/ui/Toast'

export function Profile() {
    const { user } = useAuth()
    const { t } = useLocale()
    const { addToast } = useToast()

    const [accountForm, setAccountForm] = useState({ name: '', type: 'customer', status: 'active' })
    const [contactForm, setContactForm] = useState({ first_name: '', last_name: '', email: '', account_id: '' })
    const [showAccountForm, setShowAccountForm] = useState(false)
    const [showContactForm, setShowContactForm] = useState(false)

    const userRole = (user?.role || 'customer') as RoleType
    const canReadUsers = hasPermission(userRole, 'user:read')
    const canDeleteUsers = hasPermission(userRole, 'user:delete')
    const canCreateAccounts = hasPermission(userRole, 'account:create')
    const canDeleteAccounts = hasPermission(userRole, 'account:delete')
    const canCreateContacts = hasPermission(userRole, 'contact:create')
    const canDeleteContacts = hasPermission(userRole, 'contact:delete')

    const { data: users, isLoading: usersLoading } = useUsersList(canReadUsers)
    const { data: accountsData } = useAccountsList({ limit: 5 })
    const { data: contactsData } = useContactsList({ limit: 5 })

    const deleteUser = useDeleteUser()
    const createAccount = useCreateAccount()
    const deleteAccount = useDeleteAccount()
    const createContact = useCreateContact()
    const deleteContact = useDeleteContact()

    if (!user) return null

    const accounts = accountsData?.data || []
    const contacts = contactsData?.data || []

    const handleDeleteUser = (id: string, email: string) => {
        if (window.confirm(t('profile.confirmDeleteUser').replace('{email}', email))) {
            deleteUser.mutate(id)
        }
    }

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accountForm.name.trim()) return
        try {
            await createAccount.mutateAsync({
                name: accountForm.name,
                account_type: accountForm.type,
                status: accountForm.status,
            })
            addToast(t('profile.accountCreated'), 'success')
            setAccountForm({ name: '', type: 'customer', status: 'active' })
            setShowAccountForm(false)
        } catch {
            // error handled by mutation
        }
    }

    const handleDeleteAccount = (id: string, name: string) => {
        if (window.confirm(t('profile.confirmDeleteAccount').replace('{name}', name))) {
            deleteAccount.mutate(id)
        }
    }

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!contactForm.first_name.trim() || !contactForm.last_name.trim() || !contactForm.account_id) return
        try {
            await createContact.mutateAsync({
                account_id: contactForm.account_id,
                first_name: contactForm.first_name,
                last_name: contactForm.last_name,
                email: contactForm.email || undefined,
            })
            addToast(t('profile.contactCreated'), 'success')
            setContactForm({ first_name: '', last_name: '', email: '', account_id: '' })
            setShowContactForm(false)
        } catch {
            // error handled by mutation
        }
    }

    const handleDeleteContact = (id: string, name: string) => {
        if (window.confirm(t('profile.confirmDeleteContact').replace('{name}', name))) {
            deleteContact.mutate(id)
        }
    }

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>

            <div className="space-y-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <dl className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">{t('auth.fullName')}</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{user.full_name || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">{t('profile.email')}</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{user.email}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">{t('profile.role')}</dt>
                            <dd>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    {user.role}
                                </span>
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">{t('profile.status')}</dt>
                            <dd>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                        user.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}
                                >
                                    {user.is_active ? t('profile.active') : t('crm.no')}
                                </span>
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">{t('profile.memberSince')}</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        {t('profile.permissions')}
                    </h2>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('dashboard.active')}: {hasPermission(userRole, 'user:read') ? t('crm.yes') : t('crm.no')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('crm.accounts.create')}:{' '}
                            {hasPermission(userRole, 'account:create') ? t('crm.yes') : t('crm.no')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('crm.accounts.title')} {t('crm.delete')}:{' '}
                            {hasPermission(userRole, 'account:delete') ? t('crm.yes') : t('crm.no')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('crm.contacts.create')}:{' '}
                            {hasPermission(userRole, 'contact:create') ? t('crm.yes') : t('crm.no')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('crm.contacts.title')} {t('crm.delete')}:{' '}
                            {hasPermission(userRole, 'contact:delete') ? t('crm.yes') : t('crm.no')}
                        </p>
                    </div>
                </div>

                {canReadUsers && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            {t('profile.adminPanel')}
                        </h2>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            {t('profile.adminPanelDescription')}
                        </p>

                        {canDeleteUsers && (
                            <div className="mb-6">
                                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {t('profile.manageUsers')}
                                </h3>
                                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                                    {t('profile.manageUsersDescription')}
                                </p>
                                {usersLoading ? (
                                    <div className="space-y-2">
                                        <div className="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                                        <div className="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                                    </div>
                                ) : users && users.length > 0 ? (
                                    <div className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                                        {users.map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center justify-between px-3 py-2 text-sm"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {u.full_name || u.email}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {u.email} &middot; {u.role}
                                                    </p>
                                                </div>
                                                {u.id !== user.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                    >
                                                        {t('crm.delete')}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.noUsers')}</p>
                                )}
                            </div>
                        )}

                        {canCreateAccounts && (
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowAccountForm(!showAccountForm)}
                                    className="mb-3 rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    {showAccountForm ? t('crm.cancel') : t('profile.quickCreateAccount')}
                                </button>
                                {showAccountForm && (
                                    <form
                                        onSubmit={handleCreateAccount}
                                        className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50"
                                    >
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {t('profile.accountName')}
                                            </label>
                                            <input
                                                type="text"
                                                value={accountForm.name}
                                                onChange={(e) =>
                                                    setAccountForm({ ...accountForm, name: e.target.value })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    {t('crm.accounts.type')}
                                                </label>
                                                <select
                                                    value={accountForm.type}
                                                    onChange={(e) =>
                                                        setAccountForm({ ...accountForm, type: e.target.value })
                                                    }
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="partner">Partner</option>
                                                    <option value="vendor">Vendor</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    {t('crm.accounts.status')}
                                                </label>
                                                <select
                                                    value={accountForm.status}
                                                    onChange={(e) =>
                                                        setAccountForm({ ...accountForm, status: e.target.value })
                                                    }
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="lead">Lead</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={createAccount.isPending}
                                            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            {createAccount.isPending ? t('loading') : t('profile.createAccount')}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {canDeleteAccounts && accounts.length > 0 && (
                            <div className="mb-6">
                                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {t('profile.recentAccounts')}
                                </h3>
                                <div className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                                    {accounts.map((a) => (
                                        <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{a.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {a.account_type} &middot; {a.status}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAccount(a.id, a.name)}
                                                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                            >
                                                {t('crm.delete')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {canCreateContacts && (
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowContactForm(!showContactForm)}
                                    className="mb-3 rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    {showContactForm ? t('crm.cancel') : t('profile.quickCreateContact')}
                                </button>
                                {showContactForm && (
                                    <form
                                        onSubmit={handleCreateContact}
                                        className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50"
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.firstName')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={contactForm.first_name}
                                                    onChange={(e) =>
                                                        setContactForm({ ...contactForm, first_name: e.target.value })
                                                    }
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    {t('profile.lastName')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={contactForm.last_name}
                                                    onChange={(e) =>
                                                        setContactForm({ ...contactForm, last_name: e.target.value })
                                                    }
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {t('profile.email')}
                                            </label>
                                            <input
                                                type="email"
                                                value={contactForm.email}
                                                onChange={(e) =>
                                                    setContactForm({ ...contactForm, email: e.target.value })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {t('profile.selectAccount')}
                                            </label>
                                            <select
                                                value={contactForm.account_id}
                                                onChange={(e) =>
                                                    setContactForm({ ...contactForm, account_id: e.target.value })
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                                required
                                            >
                                                <option value="">-- {t('profile.selectAccount')} --</option>
                                                {accounts.map((a) => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={createContact.isPending}
                                            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            {createContact.isPending ? t('loading') : t('profile.createContact')}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {canDeleteContacts && contacts.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {t('profile.recentContacts')}
                                </h3>
                                <div className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                                    {contacts.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {c.full_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {c.email || c.job_title || ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteContact(c.id, c.full_name)}
                                                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                            >
                                                {t('crm.delete')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
