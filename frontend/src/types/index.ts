export type Locale = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'

export interface Preloadable<T> {
    data: T | null
    loading: boolean
    error: string | null
    loaded: boolean
}

export interface PaginatedResponse<T> {
    data: T[]
    count: number
    page: number
    pageSize: number
}

export interface ApiError {
    message: string
    status: number
    details?: Record<string, string[]>
}
