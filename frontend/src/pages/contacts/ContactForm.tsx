import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useContact, useCreateContact, useUpdateContact } from '@/hooks/useContactsQuery'
import { useAccountsList } from '@/hooks/useAccountsQuery'
import { useLocale } from '@/hooks/useLocale'
import {
    validateContactCreateData,
    validateContactUpdateData,
    validateString,
    validateEmail,
    validatePhoneNumber,
    type ValidationError,
} from '@/types/contact'

interface FormState {
    account_id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    mobile_phone: string
    mobile_phone_2: string
    job_title: string
    department: string
    is_primary: boolean
    owner_id: string
}

interface ErrorState {
    account_id?: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    mobile_phone?: string
    mobile_phone_2?: string
    job_title?: string
    department?: string
    is_primary?: string
    owner_id?: string
    general?: string
}

type FieldName = keyof FormState

function validateField(field: FieldName, value: string | boolean): string | null {
    switch (field) {
        case 'account_id':
            return value ? null : 'Please select an account'
        case 'first_name':
            return validateString(value, 'First name', true, 1, 100)
        case 'last_name':
            return validateString(value, 'Last name', true, 1, 100)
        case 'email':
            return validateEmail(value)
        case 'phone':
            return validatePhoneNumber(value)
        case 'mobile_phone':
            return validatePhoneNumber(value)
        case 'mobile_phone_2':
            return validatePhoneNumber(value)
        case 'job_title':
            return validateString(value, 'Job title', false, 0, 200)
        case 'department':
            return validateString(value, 'Department', false, 0, 100)
        case 'owner_id':
            return validateString(value, 'Owner ID', false, 1, 100)
        default:
            return null
    }
}

export function ContactForm() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { t } = useLocale()
    const isEdit = !!id
    const { data: existing } = useContact(id || '')
    const createContact = useCreateContact()
    const updateContact = useUpdateContact()
    const { data: accountsData } = useAccountsList({ limit: 1000 })

    const accounts = accountsData?.data || []

    const [form, setForm] = useState<FormState>({
        account_id: searchParams.get('account_id') || '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile_phone: '',
        mobile_phone_2: '',
        job_title: '',
        department: '',
        is_primary: false,
        owner_id: '',
    })

    const [errors, setErrors] = useState<ErrorState>({})
    const [touched, setTouched] = useState<Set<string>>(new Set())

    const hasAccountContext = !!searchParams.get('account_id')

    useEffect(() => {
        if (existing) {
            setForm({
                account_id: existing.account_id,
                first_name: existing.first_name,
                last_name: existing.last_name,
                email: existing.email ?? '',
                phone: existing.phone ?? '',
                mobile_phone: existing.mobile_phone ?? '',
                mobile_phone_2: existing.mobile_phone_2 ?? '',
                job_title: existing.job_title ?? '',
                department: existing.department ?? '',
                is_primary: existing.is_primary,
                owner_id: existing.owner_id ?? '',
            })
        }
        setErrors({})
        setTouched(new Set())
    }, [existing])

    const validateAll = (): ErrorState => {
        const newErrors: ErrorState = {}
        const data = form as unknown as Record<string, unknown>
        const validator = isEdit ? validateContactUpdateData : validateContactCreateData
        const result = validator(data)
        if (result) {
            result.forEach((error: ValidationError) => {
                newErrors[error.field as keyof ErrorState] = error.message
            })
        }
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
                await updateContact.mutateAsync({ id: id!, data: form })
            } else {
                await createContact.mutateAsync(form)
            }
            navigate('/contacts')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save contact'
            setErrors({ general: errorMessage })
        }
    }

    const update = (field: FieldName, value: string | boolean) => {
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
                {isEdit ? t('crm.contacts.edit') : t('crm.contacts.create')}
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {isEdit || hasAccountContext ? (
                        <input type="hidden" name="account_id" value={form.account_id} />
                    ) : (
                        <div>
                            <label
                                htmlFor="account_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Account
                                <span className="ml-1 text-red-500">*</span>
                            </label>
                            <select
                                required
                                id="account_id"
                                value={form.account_id}
                                onChange={(e) => update('account_id', e.target.value)}
                                onBlur={() => handleBlur('account_id')}
                                className={inputClass('account_id')}
                            >
                                <option value="">-- Select Account --</option>
                                {accounts.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            {showError('account_id') && (
                                <p className="mt-1 text-sm text-red-600">{errors.account_id}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="first_name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            First Name
                            <span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            required
                            id="first_name"
                            type="text"
                            value={form.first_name}
                            onChange={(e) => update('first_name', e.target.value)}
                            onBlur={() => handleBlur('first_name')}
                            className={inputClass('first_name')}
                            placeholder="Enter first name"
                        />
                        {showError('first_name') && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                    </div>

                    <div>
                        <label
                            htmlFor="last_name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Last Name
                            <span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            required
                            id="last_name"
                            type="text"
                            value={form.last_name}
                            onChange={(e) => update('last_name', e.target.value)}
                            onBlur={() => handleBlur('last_name')}
                            className={inputClass('last_name')}
                            placeholder="Enter last name"
                        />
                        {showError('last_name') && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            className={inputClass('email')}
                            placeholder="Enter email address"
                        />
                        {showError('email') && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            onBlur={() => handleBlur('phone')}
                            className={inputClass('phone')}
                            placeholder="(XXX) XXX-XXXX"
                        />
                        {showError('phone') && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>

                    <div>
                        <label
                            htmlFor="mobile_phone"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Mobile Phone
                        </label>
                        <input
                            id="mobile_phone"
                            type="tel"
                            value={form.mobile_phone}
                            onChange={(e) => update('mobile_phone', e.target.value)}
                            onBlur={() => handleBlur('mobile_phone')}
                            className={inputClass('mobile_phone')}
                            placeholder="Mobile phone"
                        />
                        {showError('mobile_phone') && (
                            <p className="mt-1 text-sm text-red-600">{errors.mobile_phone}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="mobile_phone_2"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Mobile Phone 2
                        </label>
                        <input
                            id="mobile_phone_2"
                            type="tel"
                            value={form.mobile_phone_2}
                            onChange={(e) => update('mobile_phone_2', e.target.value)}
                            onBlur={() => handleBlur('mobile_phone_2')}
                            className={inputClass('mobile_phone_2')}
                            placeholder="Mobile phone 2"
                        />
                        {showError('mobile_phone_2') && (
                            <p className="mt-1 text-sm text-red-600">{errors.mobile_phone_2}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="job_title"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Job Title
                        </label>
                        <input
                            id="job_title"
                            type="text"
                            value={form.job_title}
                            onChange={(e) => update('job_title', e.target.value)}
                            onBlur={() => handleBlur('job_title')}
                            className={inputClass('job_title')}
                            placeholder="Job title"
                        />
                        {showError('job_title') && <p className="mt-1 text-sm text-red-600">{errors.job_title}</p>}
                    </div>

                    <div>
                        <label
                            htmlFor="department"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Department
                        </label>
                        <input
                            id="department"
                            type="text"
                            value={form.department}
                            onChange={(e) => update('department', e.target.value)}
                            onBlur={() => handleBlur('department')}
                            className={inputClass('department')}
                            placeholder="Department"
                        />
                        {showError('department') && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                    </div>

                    <div>
                        <label
                            htmlFor="owner_id"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Owner ID
                        </label>
                        <input
                            id="owner_id"
                            type="text"
                            value={form.owner_id}
                            onChange={(e) => update('owner_id', e.target.value)}
                            onBlur={() => handleBlur('owner_id')}
                            className={inputClass('owner_id')}
                            placeholder="Owner ID (optional)"
                        />
                        {showError('owner_id') && <p className="mt-1 text-sm text-red-600">{errors.owner_id}</p>}
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                        <input
                            id="is_primary"
                            type="checkbox"
                            checked={form.is_primary}
                            onChange={(e) => update('is_primary', e.target.checked)}
                            onBlur={() => handleBlur('is_primary')}
                            className={`rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 ${
                                errors.is_primary ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        <label
                            htmlFor="is_primary"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Is Primary Contact
                            {errors.is_primary && <span className="ml-1 text-red-500">*</span>}
                        </label>
                        {errors.is_primary && <p className="ml-6 text-sm text-red-600">{errors.is_primary}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/contacts')}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        {t('crm.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={createContact.isPending || updateContact.isPending}
                        className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {createContact.isPending || updateContact.isPending ? t('crm.loading') : t('crm.save')}
                    </button>
                </div>
            </form>
        </div>
    )
}
