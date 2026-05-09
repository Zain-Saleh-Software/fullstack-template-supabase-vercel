import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User, LoginRequest, RegisterRequest } from '@/types/user'
import { authApi } from '@/api/auth'
import api from '@/api/client'
import { STORAGE_KEYS } from '@/utils/constants'

interface AuthStateContextType {
    user: User | null
    loading: boolean
    isAuthenticated: boolean
}

interface AuthActionsContextType {
    login: (data: LoginRequest) => Promise<void>
    register: (data: RegisterRequest) => Promise<void>
    logout: () => void
    refreshUser: () => Promise<void>
}

export const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined)
export const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (!token) {
            setUser(null)
            setLoading(false)
            return
        }
        try {
            const userData = await authApi.me()
            setUser(userData)
        } catch {
            setUser(null)
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
            window.location.href = '/login'
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshUser()
    }, [refreshUser])

    const login = useCallback(async (data: LoginRequest) => {
        const response = await authApi.login(data)
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token)
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token)
        setUser(response.user)
    }, [])

    const register = useCallback(async (data: RegisterRequest) => {
        const response = await authApi.register(data)
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token)
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token)
        setUser(response.user)
    }, [])

    const logout = useCallback(() => {
        api.post('/auth/logout').catch(() => {})
        setUser(null)
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    }, [])

    const stateValue = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: !!user,
        }),
        [user, loading],
    )

    const actionsValue = useMemo(
        () => ({
            login,
            register,
            logout,
            refreshUser,
        }),
        [login, register, logout, refreshUser],
    )

    return (
        <AuthStateContext.Provider value={stateValue}>
            <AuthActionsContext.Provider value={actionsValue}>{children}</AuthActionsContext.Provider>
        </AuthStateContext.Provider>
    )
}
