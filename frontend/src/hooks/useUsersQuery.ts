import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { useToast } from '@/components/ui/Toast'
import { acknowledgeUserChanges } from '@/hooks/useTableChanges'
import type { User } from '@/types/user'

const QUERY_KEY = ['users'] as const

export function useUsersList(enabled: boolean = true) {
    return useQuery<User[]>({
        queryKey: [...QUERY_KEY, 'list'],
        queryFn: () => usersApi.list(),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        enabled,
        retry: (failureCount, error) => {
            if ((error as { response?: { status?: number } })?.response?.status === 403) {
                return false
            }
            return failureCount < 1
        },
    })
}

export function useUser(id: string) {
    const queryClient = useQueryClient()
    return useQuery<User>({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => usersApi.getById(id),
        initialData: () => {
            const users = queryClient.getQueryData<User[]>(['users', 'list'])
            return users?.find((u) => u.id === id)
        },
        staleTime: 30_000,
    })
}

export function useDeleteUser() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()
    return useMutation({
        mutationFn: (id: string) => usersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            acknowledgeUserChanges()
            addToast('User deleted successfully.', 'success')
        },
        onError: () => addToast('Failed to delete user. You may not have permission.', 'error'),
    })
}
