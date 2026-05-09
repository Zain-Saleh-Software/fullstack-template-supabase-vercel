import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PermissionGate } from '@/components/rbac/PermissionGate'
import { buildUser } from '@/tests/factories/userFactory'
import { renderWithAuth } from '@/tests/helpers'

describe('PermissionGate', () => {
    it('renders children when user has permission', () => {
        const admin = buildUser({ role: 'admin' })
        renderWithAuth(
            admin,
            <PermissionGate permission="user:create">
                <div>Create User Button</div>
            </PermissionGate>,
        )
        expect(screen.getByText('Create User Button')).toBeInTheDocument()
    })

    it('hides children when user lacks permission', () => {
        const customer = buildUser({ role: 'customer' })
        renderWithAuth(
            customer,
            <PermissionGate permission="user:delete">
                <div>Delete User Button</div>
            </PermissionGate>,
        )
        expect(screen.queryByText('Delete User Button')).not.toBeInTheDocument()
    })

    it('shows fallback when user lacks permission', () => {
        const customer = buildUser({ role: 'customer' })
        renderWithAuth(
            customer,
            <PermissionGate permission="user:delete" fallback={<span>No Access</span>}>
                <div>Delete Button</div>
            </PermissionGate>,
        )
        expect(screen.getByText('No Access')).toBeInTheDocument()
        expect(screen.queryByText('Delete Button')).not.toBeInTheDocument()
    })

    it('renders nothing when no user', () => {
        renderWithAuth(
            null,
            <PermissionGate permission="content:read">
                <div>Content</div>
            </PermissionGate>,
        )
        expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    it('customer can see content:read', () => {
        const customer = buildUser({ role: 'customer' })
        renderWithAuth(
            customer,
            <PermissionGate permission="content:read">
                <div>Readable Content</div>
            </PermissionGate>,
        )
        expect(screen.getByText('Readable Content')).toBeInTheDocument()
    })
})
