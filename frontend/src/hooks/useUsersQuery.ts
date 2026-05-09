import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import type { User } from '@/types/user'

export function useUsersList() {
    return useQuery<User[]>({
        queryKey: ['users', 'list'],
        queryFn: () => usersApi.list(),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
    })
}

export function useUser(id: string) {
    const queryClient = useQueryClient()
    return useQuery<User>({
        queryKey: ['users', id],
        queryFn: () => usersApi.getById(id),
        initialData: () => {
            const users = queryClient.getQueryData<User[]>(['users', 'list'])
            return users?.find((u) => u.id === id)
        },
        staleTime: 30_000,
    })
}
