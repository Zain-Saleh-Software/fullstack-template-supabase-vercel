import api from './client'
import type { User } from '@/types/user'

export const usersApi = {
    list: async (): Promise<User[]> => {
        const response = await api.get<User[]>('/users')
        return response.data
    },

    getById: async (id: string): Promise<User> => {
        const response = await api.get<User>(`/users/${id}`)
        return response.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`)
    },
}
