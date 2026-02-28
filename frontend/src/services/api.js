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
            window.location.href = '/'
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
     * Send a message and receive an LLM response.
     * @param {string}       content          - Message text
     * @param {string}       provider         - Provider key (e.g. "openrouter")
     * @param {string}       model            - Model slug
     * @param {string|null}  conversationId   - Existing conversation UUID (optional)
     */
    sendMessage: (content, provider = 'openrouter', model = 'mistralai/mistral-7b-instruct', conversationId = null) =>
        apiClient.post('/chat/message', {
            content,
            provider,
            model,
            ...(conversationId ? { conversation_id: conversationId } : {}),
        }),

    /**
     * Fetch paginated message history (legacy — all conversations).
     * @param {number} limit  - Max messages (default 100)
     * @param {number} offset - Pagination offset
     */
    getHistory: (limit = 100, offset = 0) =>
        apiClient.get('/chat/history', { params: { limit, offset } }),

    /**
     * Fetch available providers and their model lists.
     * Used to populate the ModelSelector dropdowns.
     */
    getProviders: () =>
        apiClient.get('/chat/providers'),
}

export default apiClient
