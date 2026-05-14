import type { RoleType } from './role'

export interface User {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: RoleType
    is_active: boolean
    created_at: string | null
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    email: string
    password: string
    full_name: string
}

export interface AuthResponse {
    access_token: string
    refresh_token: string
    token_type: string
    user: User
}

// Type guards for validating input types
export function ensureString(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined) {
        return null
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed === '' ? null : trimmed
    }
    if (typeof value === 'number') {
        return String(value)
    }
    if (typeof value === 'boolean') {
        throw new TypeError(`${fieldName} cannot be a boolean, received ${typeof value}`)
    }
    if (Array.isArray(value)) {
        throw new TypeError(`${fieldName} cannot be an array, received ${Array.isArray(value)}`)
    }
    if (typeof value === 'object') {
        throw new TypeError(`${fieldName} cannot be an object, received ${typeof value}`)
    }
    return String(value)
}

export function ensureEmail(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }
    const str = ensureString(value, 'email')
    if (!str) return null

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(str)) {
        throw new TypeError(`Invalid email format: ${str}`)
    }
    return str
}

// Validate LoginRequest
export function validateLoginRequest(data: unknown): LoginRequest {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError('LoginRequest must be an object')
    }

    const obj = data as Record<string, unknown>

    return {
        email: ensureEmail(obj.email)!,
        password: ensureString(obj.password, 'password')!,
    }
}

// Validate RegisterRequest
export function validateRegisterRequest(data: unknown): RegisterRequest {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError('RegisterRequest must be an object')
    }

    const obj = data as Record<string, unknown>

    const fullName = ensureString(obj.full_name, 'full_name')
    if (!fullName) {
        throw new TypeError('full_name is required')
    }
    return {
        email: ensureEmail(obj.email)!,
        password: ensureString(obj.password, 'password')!,
        full_name: fullName,
    }
}
