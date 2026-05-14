import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useCreateAccount, useUpdateAccount } from '@/hooks/useAccountsQuery'
import { useLocale } from '@/hooks/useLocale'
import { validateString } from '@/types/contact'

interface FormState {
    name: string
    account_type: string
    status: string
}

interface ErrorState {
    name?: string
    account_type?: string
    status?: string
    general?: string
}

type FieldName = keyof FormState

function validateField(field: FieldName, value: string): string | null {
    switch (field) {
        case 'name':
            return validateString(value, 'Name', true, 1, 200)
        case 'account_type':
            return value ? null : 'Account type is required'
        case 'status':
            return value ? null : 'Status is required'
        default:
            return null
    }
}

export function AccountForm() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t } = useLocale()
    const isEdit = !!id
    const { data: existing } = useAccount(id || '')
    const createAccount = useCreateAccount()
    const updateAccount = useUpdateAccount()

    const [form, setForm] = useState<FormState>({
        name: '',
        account_type: 'customer',
        status: 'active',
    })

    const [errors, setErrors] = useState<ErrorState>({})
    const [touched, setTouched] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (existing) {
            setForm({
                name: existing.name,
                account_type: existing.account_type,
                status: existing.status,
            })
        }
        setErrors({})
        setTouched(new Set())
    }, [existing])

    const validateAll = (): ErrorState => {
        const newErrors: ErrorState = {}
        const nameErr = validateField('name', form.name)
        if (nameErr) newErrors.name = nameErr
        const typeErr = validateField('account_type', form.account_type)
        if (typeErr) newErrors.account_type = typeErr
        const statusErr = validateField('status', form.status)
        if (statusErr) newErrors.status = statusErr
        return newErrors
    }

    const handleBlur = (field: FieldName) => {
        setTouched((prev) => new Set(prev).add(field))
        const error = validateField(field, form[field])
        setErrors((prev) => ({ ...prev, [field]: error ?? undefined }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const allFields = Object.keys(form) as FieldName[]
        setTouched(new Set(allFields))

        const validationErrors = validateAll()
        setErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
            return
        }

        try {
            if (isEdit) {
                await updateAccount.mutateAsync({ id: id!, data: form })
            } else {
                await createAccount.mutateAsync(form)
            }
            navigate('/accounts')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save account'
            setErrors({ general: errorMessage })
        }
    }

    const update = (field: FieldName, value: string) => {
        setForm((f) => ({ ...f, [field]: value }))
        if (touched.has(field)) {
            const error = validateField(field, value)
            setErrors((prev) => ({ ...prev, [field]: error ?? undefined }))
        }
    }

    const showError = (field: FieldName) => (touched.has(field) ? errors[field] : undefined)

    const inputClass = (field: FieldName) =>
        `mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
            showError(field)
                ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600'
        }`

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                {isEdit ? t('crm.accounts.edit') : t('crm.accounts.create')}
            </h1>
            {errors.general && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <p className="font-medium">{t('crm.errors.general')}</p>
                    <p className="mt-2 text-sm">{errors.general}</p>
                </div>
            )}
            <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('crm.accounts.name')}
                            <span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            required
                            value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            className={inputClass('name')}
                            placeholder="Enter account name"
                        />
                        {showError('name') && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('crm.accounts.type')}
                        </label>
                        <select
                            value={form.account_type}
                            onChange={(e) => update('account_type', e.target.value)}
                            onBlur={() => handleBlur('account_type')}
                            className={inputClass('account_type')}
                        >
                            <option value="customer">Customer</option>
                            <option value="prospect">Prospect</option>
                            <option value="vendor">Vendor</option>
                            <option value="partner">Partner</option>
                        </select>
                        {showError('account_type') && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.account_type}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('crm.accounts.status')}
                        </label>
                        <select
                            value={form.status}
                            onChange={(e) => update('status', e.target.value)}
                            onBlur={() => handleBlur('status')}
                            className={inputClass('status')}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                        </select>
                        {showError('status') && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/accounts')}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        {t('crm.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={createAccount.isPending || updateAccount.isPending}
                        className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {createAccount.isPending || updateAccount.isPending
                            ? t('crm.loading')
                            : isEdit
                              ? t('crm.save')
                              : t('crm.create')}
                    </button>
                </div>
            </form>
        </div>
    )
}
