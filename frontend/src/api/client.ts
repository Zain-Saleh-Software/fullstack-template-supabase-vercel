import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiConfig } from '@/types/api'
import { STORAGE_KEYS } from '@/utils/constants'

const config: ApiConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
}

const api: AxiosInstance = axios.create(config)

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

let refreshPromise: Promise<{ data: { access_token: string; refresh_token: string } }> | null = null

api.interceptors.response.use(
    (response) => {
        const requestId = response.headers['x-request-id']
        if (requestId) {
            console.debug(`[API] Request ID: ${requestId}`)
        }
        return response
    },
    async (error) => {
        const originalRequest = error.config

        const isAuthEndpoint =
            originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
                if (!refreshToken) throw new Error('No refresh token')

                if (!refreshPromise) {
                    refreshPromise = axios
                        .post(`${config.baseURL}/auth/refresh`, { refresh_token: refreshToken })
                        .finally(() => {
                            refreshPromise = null
                        })
                }

                const { data } = await refreshPromise

                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token)
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)

                originalRequest.headers.Authorization = `Bearer ${data.access_token}`
                return api(originalRequest)
            } catch {
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
                window.location.href = '/login'
                return Promise.reject(error)
            }
        }

        if (!error.response && error.code === 'ERR_NETWORK') {
            originalRequest._retryCount = originalRequest._retryCount || 0
            if (originalRequest._retryCount < 3) {
                originalRequest._retryCount++
                await new Promise((resolve) =>
                    setTimeout(
                        resolve,
                        Math.min(1000 * Math.pow(2, originalRequest._retryCount), 10000) + Math.random() * 500,
                    ),
                )
                return api(originalRequest)
            }
        }

        // Enhance error with structured backend message and request ID if available
        if (error.response?.data?.error?.message) {
            error.message = error.response.data.error.message
            const reqId = error.response.headers?.['x-request-id']
            if (reqId) {
                error.message += ` (Request ID: ${reqId})`
            }
        } else if (error.response?.headers?.['x-request-id']) {
            error.message += ` (Request ID: ${error.response.headers['x-request-id']})`
        }

        return Promise.reject(error)
    },
)

export default api
