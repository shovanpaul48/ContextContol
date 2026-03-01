/**
 * context/AuthContext.jsx
 * ───────────────────────
 * Global authentication state — user info + JWT.
 * Persists to localStorage so sessions survive page refresh.
 */

import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

/**
 * AuthProvider — wrap your app with this to enable authentication.
 * Reads initial state from localStorage so refresh doesn't log users out.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user')
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    /**
     * Call backend /auth/google with the Google ID token.
     * On success: persist token + user, update state.
     */
    const loginWithGoogle = useCallback(async (googleIdToken) => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await authApi.googleLogin(googleIdToken)

            // Persist to localStorage
            localStorage.setItem('access_token', data.access_token)
            localStorage.setItem('user', JSON.stringify(data.user))

            setUser(data.user)
        } catch (err) {
            console.error('Auth error:', err)
            console.error('Response:', err.response?.status, err.response?.data)
            const detail = err.response?.data?.detail
            const status = err.response?.status
            let message
            if (detail) {
                message = `${detail} (${status})`
            } else if (err.message) {
                message = `Connection error: ${err.message}`
            } else {
                message = 'Authentication failed. Please try again.'
            }
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Clear all auth state and localStorage.
     */
    const logout = useCallback(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setUser(null)
        setError(null)
    }, [])

    const isAuthenticated = Boolean(user)

    return (
        <AuthContext.Provider value={{ user, loading, error, isAuthenticated, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * useAuth — custom hook for consuming auth context.
 * Throws if used outside AuthProvider.
 */
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
