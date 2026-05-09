import api from './client'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/user'

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data)
        return response.data
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data)
        return response.data
    },

    refresh: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/refresh', {
            refresh_token: refreshToken,
        })
        return response.data
    },

    me: async () => {
        const response = await api.get('/auth/me')
        return response.data
    },
}
