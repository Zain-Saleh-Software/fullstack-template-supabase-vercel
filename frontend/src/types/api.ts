import type { AxiosRequestConfig } from 'axios'

export interface ApiConfig {
    baseURL: string
    timeout: number
    headers: Record<string, string>
}

export interface RequestOptions extends AxiosRequestConfig {
    skipAuth?: boolean
}
