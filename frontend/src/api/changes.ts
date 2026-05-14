import api from './client'

interface ChangeCheckResponse {
    has_changes: boolean
    tables: string[]
    checked_at: string
}

export const changesApi = {
    check: async (since: string): Promise<ChangeCheckResponse> => {
        const { data } = await api.get('/changes/check', { params: { since } })
        return data
    },
}
