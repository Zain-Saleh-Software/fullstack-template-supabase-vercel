import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { RoleType } from '@/types/role'

interface RoleGuardProps {
    children: ReactNode
    roles: RoleType[]
    fallback?: ReactNode
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
    const { user } = useAuth()

    if (!user) return <>{fallback}</>

    const userRole = user.role as RoleType
    const hasAccess = userRole === 'admin' || roles.includes(userRole)

    if (!hasAccess) return <>{fallback}</>

    return <>{children}</>
}
