import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RoleGuard } from '@/components/rbac/RoleGuard'
import { buildUser } from '@/tests/factories/userFactory'
import { renderWithAuth } from '@/tests/helpers'

describe('RoleGuard', () => {
    it('renders children for matching role', () => {
        const admin = buildUser({ role: 'admin' })
        renderWithAuth(
            admin,
            <RoleGuard roles={['admin']}>
                <div>Admin Content</div>
            </RoleGuard>,
        )
        expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('renders children when user is admin (admin bypass)', () => {
        const admin = buildUser({ role: 'admin' })
        renderWithAuth(
            admin,
            <RoleGuard roles={['customer']}>
                <div>Admin Sees This</div>
            </RoleGuard>,
        )
        expect(screen.getByText('Admin Sees This')).toBeInTheDocument()
    })

    it('hides children for non-matching role', () => {
        const customer = buildUser({ role: 'customer' })
        renderWithAuth(
            customer,
            <RoleGuard roles={['admin']}>
                <div>Secret Admin Panel</div>
            </RoleGuard>,
        )
        expect(screen.queryByText('Secret Admin Panel')).not.toBeInTheDocument()
    })

    it('shows fallback when role does not match', () => {
        const customer = buildUser({ role: 'customer' })
        renderWithAuth(
            customer,
            <RoleGuard roles={['admin']} fallback={<div>Access Denied</div>}>
                <div>Secret Admin Panel</div>
            </RoleGuard>,
        )
        expect(screen.queryByText('Secret Admin Panel')).not.toBeInTheDocument()
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    it('renders nothing when no user', () => {
        renderWithAuth(
            null,
            <RoleGuard roles={['admin']}>
                <div>Secret Content</div>
            </RoleGuard>,
        )
        expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
    })
})
