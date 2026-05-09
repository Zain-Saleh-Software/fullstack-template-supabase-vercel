import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { PermissionType, RoleType } from '@/types/role'
import { hasPermission } from '@/types/role'

interface PermissionGateProps {
    children: ReactNode
    permission: PermissionType
    fallback?: ReactNode
}

export function PermissionGate({ children, permission, fallback = null }: PermissionGateProps) {
    const { user } = useAuth()

    if (!user) return <>{fallback}</>

    const userRole = user.role as RoleType
    const allowed = hasPermission(userRole, permission)

    if (!allowed) return <>{fallback}</>

    return <>{children}</>
}
