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
    full_name?: string
}

export interface AuthResponse {
    access_token: string
    refresh_token: string
    token_type: string
    user: User
}
