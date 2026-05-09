import { useContext } from 'react'
import { AuthStateContext, AuthActionsContext } from '@/contexts/AuthContext'

export function useAuth() {
    const state = useContext(AuthStateContext)
    const actions = useContext(AuthActionsContext)
    if (!state || !actions) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return { ...state, ...actions }
}
