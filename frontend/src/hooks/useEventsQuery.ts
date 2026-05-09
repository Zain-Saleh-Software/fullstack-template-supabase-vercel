import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'

interface EventItem {
    id: string
    event_type: string
    entity_type: string
    entity_id: string | null
    actor_id: string | null
    severity: string
    created_at: string | null
}

export function useEventsList(params?: {
    entity_type?: string
    event_type?: string
    actor_id?: string
    limit?: number
}) {
    return useQuery<{ events: EventItem[]; total: number }>({
        queryKey: ['events', 'list', params],
        queryFn: async () => {
            const { data } = await api.get('/events', { params })
            return data
        },
        staleTime: 30_000,
    })
}
