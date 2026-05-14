import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/types/role'
import type { PermissionType, RoleType } from '@/types/role'

interface ProtectedRouteProps {
    children: React.ReactNode
    permission?: PermissionType
    redirectTo?: string
}

export function ProtectedRoute({ children, permission, redirectTo }: ProtectedRouteProps) {
    const { isAuthenticated, loading, user } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent dark:border-blue-400 dark:border-t-transparent" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (permission && user) {
        const userRole = user.role as RoleType
        if (!hasPermission(userRole, permission)) {
            return <Navigate to={redirectTo ?? '/dashboard'} replace />
        }
    }

    return <>{children}</>
}
