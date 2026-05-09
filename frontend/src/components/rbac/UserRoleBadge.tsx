import { useAuth } from '@/hooks/useAuth'
import type { RoleType } from '@/types/role'

const roleStyles: Record<RoleType, string> = {
    admin: 'bg-purple-100 text-purple-800',
    technician: 'bg-blue-100 text-blue-800',
    member: 'bg-green-100 text-green-800',
    customer: 'bg-gray-100 text-gray-800',
}

const roleLabels: Record<RoleType, string> = {
    admin: 'Admin',
    technician: 'Technician',
    member: 'Member',
    customer: 'Customer',
}

export function UserRoleBadge() {
    const { user } = useAuth()

    if (!user) return null

    const role = (user.role || 'customer') as RoleType
    const style = roleStyles[role] || roleStyles.customer
    const label = roleLabels[role] || user.role

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
            {label}
        </span>
    )
}
