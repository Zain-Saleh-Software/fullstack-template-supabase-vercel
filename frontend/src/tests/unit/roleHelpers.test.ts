import { describe, it, expect } from 'vitest'
import { hasPermission, hasRole, ROLE_PERMISSIONS } from '@/types/role'

describe('hasPermission', () => {
    it('admin has all permissions', () => {
        const allPermissions = Object.values(ROLE_PERMISSIONS).flat()
        const uniquePermissions = [...new Set(allPermissions)]
        for (const perm of uniquePermissions) {
            expect(hasPermission('admin', perm)).toBe(true)
        }
    })

    it('customer has limited permissions', () => {
        expect(hasPermission('customer', 'content:read')).toBe(true)
        expect(hasPermission('customer', 'user:create')).toBe(false)
        expect(hasPermission('customer', 'system:admin')).toBe(false)
        expect(hasPermission('customer', 'event:read')).toBe(false)
    })

    it('technician has technical permissions', () => {
        expect(hasPermission('technician', 'user:read')).toBe(true)
        expect(hasPermission('technician', 'event:read')).toBe(true)
        expect(hasPermission('technician', 'role:create')).toBe(false)
        expect(hasPermission('technician', 'system:admin')).toBe(false)
    })

    it('member has content permissions', () => {
        expect(hasPermission('member', 'content:read')).toBe(true)
        expect(hasPermission('member', 'content:create')).toBe(true)
        expect(hasPermission('member', 'content:update')).toBe(true)
        expect(hasPermission('member', 'content:delete')).toBe(false)
        expect(hasPermission('member', 'user:create')).toBe(false)
    })

    it('unknown role returns false', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(hasPermission('unknown' as any, 'content:read')).toBe(false)
    })
})

describe('hasRole', () => {
    it('admin has all roles', () => {
        expect(hasRole('admin', 'admin')).toBe(true)
        expect(hasRole('admin', 'technician')).toBe(true)
        expect(hasRole('admin', 'customer')).toBe(true)
    })

    it('customer does not have admin role', () => {
        expect(hasRole('customer', 'admin')).toBe(false)
    })

    it('technician has technician role', () => {
        expect(hasRole('technician', 'technician')).toBe(true)
    })

    it('technician does not have admin role', () => {
        expect(hasRole('technician', 'admin')).toBe(false)
    })

    it('member has member role', () => {
        expect(hasRole('member', 'member')).toBe(true)
    })
})

describe('ROLE_PERMISSIONS structure', () => {
    it('all roles have permissions defined', () => {
        const roles = ['admin', 'technician', 'member', 'customer']
        for (const role of roles) {
            expect(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]).toBeDefined()
            expect(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].length).toBeGreaterThan(0)
        }
    })

    it('admin has every unique permission', () => {
        const allPermissions = Object.values(ROLE_PERMISSIONS).flat()
        const uniquePermissions = [...new Set(allPermissions)]
        expect(ROLE_PERMISSIONS.admin.length).toBe(uniquePermissions.length)
    })

    it('no duplicate permissions within a role', () => {
        for (const [, perms] of Object.entries(ROLE_PERMISSIONS)) {
            expect(new Set(perms).size).toBe(perms.length)
        }
    })
})
