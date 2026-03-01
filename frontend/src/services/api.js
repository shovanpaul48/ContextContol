/**
 * services/api.js
 * ───────────────
 * Centralised Axios instance with reliability improvements.
 *
 * Phase 3 additions:
 *   - Request timeout (35s — slightly above backend's 30s LLM timeout)
 *   - Conversation-scoped history fetching
 *   - Retry endpoint
 */

import axios from 'axios'

const API_BASE = '/api/v1'
const REQUEST_TIMEOUT = 35000  // 35s — backend has 30s LLM timeout

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT,
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
    /**
     * Send a message and receive an LLM response.
     */
    sendMessage: (content, provider = 'openrouter', model = 'mistralai/mistral-7b-instruct', conversationId = null) =>
        apiClient.post('/chat/message', {
            content,
            provider,
            model,
            ...(conversationId ? { conversation_id: conversationId } : {}),
        }),

    /**
     * Retry a failed message.
     */
    retryMessage: (content, provider, model, conversationId) =>
        apiClient.post('/chat/retry', {
            content,
            provider,
            model,
            conversation_id: conversationId,
        }),

    /**
     * Fetch message history.
     * @param {Object} opts
     * @param {string}  opts.conversationId - Filter by conversation (recommended)
     * @param {number}  opts.limit
     * @param {number}  opts.offset
     */
    getHistory: ({ conversationId = null, limit = 100, offset = 0 } = {}) =>
        apiClient.get('/chat/history', {
            params: {
                ...(conversationId ? { conversation_id: conversationId } : {}),
                limit,
                offset,
            },
        }),

    /**
     * Fetch available providers and their model lists.
     */
    getProviders: () =>
        apiClient.get('/chat/providers'),
}

export default apiClient
