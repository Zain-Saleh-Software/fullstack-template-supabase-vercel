export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Fullstack Template'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
export const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en'
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    LOCALE: 'locale',
    USER: 'user',
} as const

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
} as const
