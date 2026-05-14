import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthStateContext, AuthActionsContext } from '@/contexts/AuthContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import type { User } from '@/types/user'
import type { ReactNode } from 'react'

const noopActions = {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
}

export function renderWithAuth(user: User | null, children: ReactNode) {
    return render(
        <MemoryRouter>
            <ThemeProvider>
                <AuthStateContext.Provider value={{ user, loading: false, isAuthenticated: !!user }}>
                    <AuthActionsContext.Provider value={noopActions}>
                        <LocaleProvider>{children}</LocaleProvider>
                    </AuthActionsContext.Provider>
                </AuthStateContext.Provider>
            </ThemeProvider>
        </MemoryRouter>,
    )
}

export function renderWithAllProviders(children: ReactNode) {
    return render(
        <MemoryRouter>
            <ThemeProvider>
                <AuthStateContext.Provider value={{ user: null, loading: false, isAuthenticated: false }}>
                    <AuthActionsContext.Provider value={noopActions}>
                        <LocaleProvider>{children}</LocaleProvider>
                    </AuthActionsContext.Provider>
                </AuthStateContext.Provider>
            </ThemeProvider>
        </MemoryRouter>,
    )
}
