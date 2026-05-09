export type RoleType = 'admin' | 'technician' | 'member' | 'customer'

export type PermissionType =
    | 'user:create'
    | 'user:read'
    | 'user:update'
    | 'user:delete'
    | 'role:create'
    | 'role:read'
    | 'role:update'
    | 'role:delete'
    | 'content:create'
    | 'content:read'
    | 'content:update'
    | 'content:delete'
    | 'system:read'
    | 'system:admin'
    | 'event:read'
    | 'event:export'

export const ROLE_PERMISSIONS: Record<RoleType, PermissionType[]> = {
    admin: [
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'role:create',
        'role:read',
        'role:update',
        'role:delete',
        'content:create',
        'content:read',
        'content:update',
        'content:delete',
        'system:read',
        'system:admin',
        'event:read',
        'event:export',
    ],
    technician: ['user:read', 'content:create', 'content:read', 'content:update', 'system:read', 'event:read'],
    member: ['content:read', 'content:create', 'content:update'],
    customer: ['content:read'],
}

export function hasPermission(role: RoleType, permission: PermissionType): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/** Checks if userRole equals requiredRole, with admin bypass (admin always returns true) */
export function hasRole(userRole: RoleType, requiredRole: RoleType): boolean {
    if (userRole === 'admin') return true
    return userRole === requiredRole
}
