/**
 * services/api.js
 * ───────────────
 * Centralised Axios instance.
 * - Uses environment-based backend URL
 * - Attaches JWT automatically
 * - Handles global 401 errors
 */

import axios from 'axios'

// 🔥 THIS IS THE IMPORTANT FIX
const API_BASE =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ───────────────────────────────────────
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// ── Response interceptor: handle global auth errors ───────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            window.location.href = '/'
        }
        return Promise.reject(error)
    }
)

// ── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
    googleLogin: (idToken) =>
        apiClient.post('/auth/google', { id_token: idToken }),
}

// ── Chat API ──────────────────────────────────────────────────────────────
export const chatApi = {
    sendMessage: (content) =>
        apiClient.post('/chat/message', { content }),

    getHistory: (limit = 100, offset = 0) =>
        apiClient.get('/chat/history', { params: { limit, offset } }),
}

export default apiClient