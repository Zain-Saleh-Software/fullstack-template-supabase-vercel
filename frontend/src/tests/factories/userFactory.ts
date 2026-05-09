import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types/user'
import type { RoleType } from '@/types/role'

export function buildUser(overrides: Partial<User> = {}): User {
    const id = crypto.randomUUID()
    return {
        id,
        email: `user_${id.slice(0, 8)}@test.com`,
        full_name: `Test User ${id.slice(0, 8)}`,
        avatar_url: null,
        role: 'customer',
        is_active: true,
        created_at: new Date().toISOString(),
        ...overrides,
    }
}

export function buildAdmin(overrides: Partial<User> = {}): User {
    return buildUser({ role: 'admin', ...overrides })
}

export function buildTechnician(overrides: Partial<User> = {}): User {
    return buildUser({ role: 'technician', ...overrides })
}

export function buildMember(overrides: Partial<User> = {}): User {
    return buildUser({ role: 'member', ...overrides })
}

export function buildCustomer(overrides: Partial<User> = {}): User {
    return buildUser({ role: 'customer', ...overrides })
}

export function buildAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
    return {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        user: buildUser(),
        ...overrides,
    }
}

export function buildLoginRequest(overrides: Partial<LoginRequest> = {}): LoginRequest {
    return {
        email: 'test@example.com',
        password: 'TestPass123!',
        ...overrides,
    }
}

export function buildRegisterRequest(overrides: Partial<RegisterRequest> = {}): RegisterRequest {
    return {
        email: 'newuser@example.com',
        password: 'NewPass123!',
        full_name: 'New User',
        ...overrides,
    }
}

export function createUsersByRole(counts: Partial<Record<RoleType, number>> = {}): User[] {
    const builders: Record<RoleType, () => User> = {
        admin: buildAdmin,
        technician: buildTechnician,
        member: buildMember,
        customer: buildCustomer,
    }
    const users: User[] = []
    for (const [role, count] of Object.entries(counts)) {
        const builder = builders[role as RoleType]
        for (let i = 0; i < (count as number); i++) {
            users.push(builder())
        }
    }
    return users
}
