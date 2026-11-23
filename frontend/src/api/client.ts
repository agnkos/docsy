import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import type { RefreshResponse } from '../features/auth/types'
import { useAuthStore } from '../stores/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
})

// Refresh slightly early so a token never expires while the request is in flight
const EXPIRY_LEEWAY_MS = 30_000

const AUTH_URLS = ['/auth/refresh', '/auth/login', '/auth/logout']

const isAuthUrl = (url = '') => AUTH_URLS.some((authUrl) => url.includes(authUrl))

let refreshPromise: Promise<RefreshResponse> | null = null

export const refreshAccessToken = (): Promise<RefreshResponse> => {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<RefreshResponse>('/auth/refresh')
      .then((r) => {
        useAuthStore.getState().setAccessToken(r.data.accessToken, r.data.expiresIn)
        return r.data
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.request.use(async (config) => {
  if (isAuthUrl(config.url)) {
    return config
  }

  const { accessToken, accessTokenExpiresAt } = useAuthStore.getState()
  const isExpiringSoon =
    accessTokenExpiresAt !== null && accessTokenExpiresAt - Date.now() < EXPIRY_LEEWAY_MS

  // If the refresh fails, send the old token and let the 401 handler below log the user out
  const token =
    accessToken && isExpiringSoon
      ? await refreshAccessToken()
          .then((r) => r.accessToken)
          .catch(() => accessToken)
      : accessToken

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const url = originalRequest?.url ?? ''

    if (isAuthUrl(url)) {
      return Promise.reject(error)
    }

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const { accessToken: newAccessToken } = await refreshAccessToken()
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
      return apiClient(originalRequest)
    } catch (refreshError) {
      useAuthStore.getState().clearSession()
      window.location.href = '/'
      return Promise.reject(refreshError)
    }
  },
)
