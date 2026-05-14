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
    | 'account:create'
    | 'account:read'
    | 'account:update'
    | 'account:delete'
    | 'contact:create'
    | 'contact:read'
    | 'contact:update'
    | 'contact:delete'

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
        'account:create',
        'account:read',
        'account:update',
        'account:delete',
        'contact:create',
        'contact:read',
        'contact:update',
        'contact:delete',
    ],
    technician: [
        'user:read',
        'content:create',
        'content:read',
        'content:update',
        'system:read',
        'event:read',
        'account:read',
        'account:create',
        'account:update',
        'contact:read',
        'contact:create',
        'contact:update',
    ],
    member: [
        'content:read',
        'content:create',
        'content:update',
        'account:read',
        'account:create',
        'account:update',
        'contact:read',
        'contact:create',
        'contact:update',
    ],
    customer: ['content:read', 'account:read', 'contact:read'],
}

export function hasPermission(role: RoleType, permission: PermissionType): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/** Checks if userRole equals requiredRole, with admin bypass (admin always returns true) */
export function hasRole(userRole: RoleType, requiredRole: RoleType): boolean {
    if (userRole === 'admin') return true
    return userRole === requiredRole
}
