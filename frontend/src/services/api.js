/**
 * services/api.js
 * ───────────────
 * Centralised Axios instance.
 * - Base URL points to FastAPI via Vite's dev proxy
 * - Automatically attaches JWT from localStorage on every request
 * - Handles 401 by clearing auth state
 */

import axios from 'axios'

const API_BASE = '/api/v1'

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
            // Token expired or invalid — clear local auth state
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            window.location.href = '/'  // Redirect to login
        }
        return Promise.reject(error)
    }
)

// ── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
    /**
     * Exchange Google ID token for backend JWT.
     * @param {string} idToken - Google ID token from @react-oauth/google
     */
    googleLogin: (idToken) =>
        apiClient.post('/auth/google', { id_token: idToken }),
}

// ── Chat API ──────────────────────────────────────────────────────────────
export const chatApi = {
    /**
     * Post a new message to the chat.
     * @param {string} content - Message text
     */
    sendMessage: (content) =>
        apiClient.post('/chat/message', { content }),

    /**
     * Fetch paginated message history.
     * @param {number} limit - Max messages (default 100)
     * @param {number} offset - Pagination offset (default 0)
     */
    getHistory: (limit = 100, offset = 0) =>
        apiClient.get('/chat/history', { params: { limit, offset } }),
}

export default apiClient
