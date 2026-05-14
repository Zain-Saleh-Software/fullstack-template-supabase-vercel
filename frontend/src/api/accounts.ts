import api from './client'
import type { Account, AccountCreate, AccountUpdate } from '@/types/account'
import type { PaginatedResponse } from '@/types'

export const accountsApi = {
    list: async (params?: {
        status?: string
        account_type?: string
        owner_id?: string
        limit?: number
        offset?: number
    }): Promise<PaginatedResponse<Account>> => {
        const response = await api.get<PaginatedResponse<Account>>('/accounts', { params })
        return response.data
    },

    getById: async (id: string): Promise<Account> => {
        const response = await api.get<Account>(`/accounts/${id}`)
        return response.data
    },

    create: async (data: AccountCreate): Promise<Account> => {
        const response = await api.post<Account>('/accounts', data)
        return response.data
    },

    update: async (id: string, data: AccountUpdate): Promise<Account> => {
        const response = await api.patch<Account>(`/accounts/${id}`, data)
        return response.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/accounts/${id}`)
    },
}
