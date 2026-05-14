import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const registerSchema = z.object({
    fullName: z.string().min(1, { message: 'Full name is required' }),
    email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
    password: z.string().min(15, { message: 'Password must be at least 15 characters' }),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function Register() {
    const { register: registerAuth } = useAuth()
    const { t } = useLocale()
    const navigate = useNavigate()

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { fullName: '', email: '', password: '' },
    })

    const getFriendlyMessage = (err: unknown): string => {
        if (!(err instanceof Error)) return 'An unexpected error occurred. Please try again.'
        const msg = err.message.toLowerCase()
        if (msg.includes('network error') || msg.includes('econnrefused') || msg.includes('network'))
            return 'Unable to connect to the server. Please check your internet connection or try again later.'
        if (msg.includes('422') || msg.includes('unprocessable'))
            return msg.includes('15') || msg.includes('password')
                ? 'Password must be at least 15 characters.'
                : 'Invalid input. Please check your information and try again.'
        if (msg.includes('409') || msg.includes('already registered'))
            return 'This email is already registered. Please log in instead.'
        if (msg.includes('429') || msg.includes('too many requests'))
            return 'Too many registration attempts. Please wait a moment and try again.'
        if (msg.includes('500') || msg.includes('internal server'))
            return 'The server encountered an error. Please try again later.'
        return err.message || 'Registration failed. Please try again.'
    }

    const onSubmit = async (data: RegisterFormValues) => {
        setError('')
        setLoading(true)

        try {
            await registerAuth({
                email: data.email,
                password: data.password,
                full_name: data.fullName,
            })
            navigate('/dashboard')
        } catch (err: unknown) {
            setError(getFriendlyMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800 dark:shadow-gray-900/30">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
                    {t('auth.register')}
                </h1>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label={t('auth.fullName')}
                        type="text"
                        {...register('fullName')}
                        error={!!errors.fullName}
                        helperText={errors.fullName?.message}
                        placeholder="John Doe"
                        autoComplete="name"
                    />

                    <Input
                        label={t('auth.email')}
                        type="email"
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        placeholder="you@example.com"
                        autoComplete="email"
                    />

                    <Input
                        label={t('auth.password')}
                        type="password"
                        {...register('password')}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        placeholder="•••••••••••••••"
                        autoComplete="new-password"
                    />

                    <Button type="submit" loading={loading} className="w-full">
                        {t('auth.register')}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.hasAccount')}{' '}
                    <Link
                        to="/login"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        {t('auth.login')}
                    </Link>
                </p>
            </div>
        </div>
    )
}
