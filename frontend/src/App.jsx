/**
 * App.jsx
 * ───────
 * Root application component.
 * Configures:
 *  - Google OAuth provider (wraps entire app)
 *  - Authentication context
 *  - React Router routes with simple auth-aware redirection
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'

// ── Protected Route ───────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth()
    return isAuthenticated ? children : <Navigate to="/" replace />
}

// ── Public Route (redirects authed users to chat) ─────────────────────────
function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth()
    return isAuthenticated ? <Navigate to="/chat" replace /> : children
}

// ── App Routes ────────────────────────────────────────────────────────────
function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />
                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

// ── Root App ──────────────────────────────────────────────────────────────
export default function App() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!googleClientId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-900 text-white p-8">
                <div className="glass-card p-8 max-w-md text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold mb-2">Configuration Missing</h1>
                    <p className="text-gray-400 text-sm">
                        <code className="bg-surface-600 px-2 py-1 rounded">VITE_GOOGLE_CLIENT_ID</code> is not set.
                        <br />Please create a <code className="bg-surface-600 px-2 py-1 rounded">.env</code> file in the frontend directory.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </GoogleOAuthProvider>
    )
}
