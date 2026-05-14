export type Locale = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'
export type Theme = 'light' | 'dark' | 'system'

export interface Preloadable<T> {
    data: T | null
    loading: boolean
    error: string | null
    loaded: boolean
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    limit: number
    offset: number
}

export interface ApiError {
    message: string
    status: number
    details?: Record<string, string[]>
}
