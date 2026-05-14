import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const loginSchema = z.object({
    email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function Login() {
    const { login } = useAuth()
    const { t } = useLocale()
    const navigate = useNavigate()
    const location = useLocation()

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

    const getFriendlyMessage = (err: unknown): string => {
        if (!(err instanceof Error)) return 'An unexpected error occurred. Please try again.'
        const msg = err.message.toLowerCase()
        if (msg.includes('network error') || msg.includes('econnrefused') || msg.includes('network'))
            return 'Unable to connect to the server. Please check your internet connection or try again later.'
        if (msg.includes('invalid host header') || msg.includes('host header'))
            return 'Unable to connect to the server. Please try again later.'
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid credentials'))
            return 'Invalid email or password. Please try again.'
        if (msg.includes('429') || msg.includes('too many requests'))
            return 'Too many login attempts. Please wait a moment and try again.'
        if (msg.includes('500') || msg.includes('internal server'))
            return 'The server encountered an error. Please try again later.'
        return err.message || 'Login failed. Please try again.'
    }

    const onSubmit = async (data: LoginFormValues) => {
        setError('')
        setLoading(true)

        try {
            await login(data)
            navigate(from, { replace: true })
        } catch (err: unknown) {
            setError(getFriendlyMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800 dark:shadow-gray-900/30">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">{t('auth.login')}</h1>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />

                    <Button type="submit" loading={loading} className="w-full">
                        {t('auth.login')}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.noAccount')}{' '}
                    <Link
                        to="/register"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        {t('auth.register')}
                    </Link>
                </p>
            </div>
        </div>
    )
}
