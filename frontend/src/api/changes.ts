import api from './client'

export interface ChangeCheckResponse {
    has_changes: boolean
    tables: string[]
}

export const changesApi = {
    check: async (since: string): Promise<ChangeCheckResponse> => {
        const response = await api.get<ChangeCheckResponse>('/changes/check', {
            params: { since },
        })
        return response.data
    },
}
