import api from './client'
import type { Contact, ContactCreate, ContactUpdate } from '@/types/contact'
import type { PaginatedResponse } from '@/types'

export const contactsApi = {
    list: async (params?: {
        account_id?: string
        owner_id?: string
        limit?: number
        offset?: number
    }): Promise<PaginatedResponse<Contact>> => {
        const response = await api.get<PaginatedResponse<Contact>>('/contacts', { params })
        return response.data
    },

    getById: async (id: string): Promise<Contact> => {
        const response = await api.get<Contact>(`/contacts/${id}`)
        return response.data
    },

    create: async (data: ContactCreate): Promise<Contact> => {
        const response = await api.post<Contact>('/contacts', data)
        return response.data
    },

    update: async (id: string, data: ContactUpdate): Promise<Contact> => {
        const response = await api.patch<Contact>(`/contacts/${id}`, data)
        return response.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/contacts/${id}`)
    },
}
