import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi } from '@/api/contacts'
import { useToast } from '@/components/ui/Toast'
import { acknowledgeUserChanges } from '@/hooks/useTableChanges'
import type { ContactCreate, ContactUpdate } from '@/types/contact'

const QUERY_KEY = ['contacts'] as const

export function useContactsList(params?: { account_id?: string; limit?: number; offset?: number }) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'list', params],
        queryFn: () => contactsApi.list(params),
        staleTime: 30_000,
    })
}

export function useContact(id: string) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => contactsApi.getById(id),
        enabled: !!id,
        staleTime: 30_000,
    })
}

export function useCreateContact() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    return useMutation({
        mutationFn: (data: ContactCreate) => contactsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            acknowledgeUserChanges()
        },
        onError: () => addToast('Failed to create contact. You may not have permission.', 'error'),
    })
}

export function useUpdateContact() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ContactUpdate }) => contactsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            acknowledgeUserChanges()
        },
        onError: () => addToast('Failed to update contact. You may not have permission.', 'error'),
    })
}

export function useDeleteContact() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    return useMutation({
        mutationFn: (id: string) => contactsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            acknowledgeUserChanges()
        },
        onError: () => addToast('Failed to delete. You may not have permission.', 'error'),
    })
}
