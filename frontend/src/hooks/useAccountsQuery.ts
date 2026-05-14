import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/api/accounts'
import { useToast } from '@/components/ui/Toast'
import { acknowledgeUserChanges } from '@/hooks/useTableChanges'
import type { AccountCreate, AccountUpdate } from '@/types/account'

const QUERY_KEY = ['accounts'] as const

export function useAccountsList(params?: { status?: string; account_type?: string; limit?: number; offset?: number }) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'list', params],
        queryFn: () => accountsApi.list(params),
        staleTime: 30_000,
    })
}

export function useAccount(id: string) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => accountsApi.getById(id),
        enabled: !!id,
        staleTime: 30_000,
    })
}

export function useCreateAccount() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    return useMutation({
        mutationFn: (data: AccountCreate) => accountsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            acknowledgeUserChanges()
        },
        onError: () => addToast('Failed to create account. You may not have permission.', 'error'),
    })
}

export function useUpdateAccount() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: AccountUpdate }) => accountsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            acknowledgeUserChanges()
        },
        onError: () => addToast('Failed to update account. You may not have permission.', 'error'),
    })
}

export function useDeleteAccount() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    return useMutation({
        mutationFn: (id: string) => accountsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            acknowledgeUserChanges()
        },
        onError: () => addToast('Failed to delete. You may not have permission.', 'error'),
    })
}
