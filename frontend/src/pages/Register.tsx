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
    fullName: z.string().optional(),
    email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
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

    const onSubmit = async (data: RegisterFormValues) => {
        setError('')
        setLoading(true)

        try {
            await registerAuth({
                email: data.email,
                password: data.password,
                full_name: data.fullName || undefined,
            })
            navigate('/dashboard')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Registration failed'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">{t('auth.register')}</h1>

                {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />

                    <Button type="submit" loading={loading} className="w-full">
                        {t('auth.register')}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    {t('auth.hasAccount')}{' '}
                    <Link to="/login" className="text-blue-500 hover:text-blue-600">
                        {t('auth.login')}
                    </Link>
                </p>
            </div>
        </div>
    )
}
