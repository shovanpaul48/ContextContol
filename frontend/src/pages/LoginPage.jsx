/**
 * pages/LoginPage.jsx
 * ───────────────────
 * Splash / login screen.
 * Uses @react-oauth/google GoogleLogin button component.
 * On success, calls AuthContext.loginWithGoogle() to exchange tokens.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const { isAuthenticated, loginWithGoogle, loading, error } = useAuth()
    const navigate = useNavigate()

    // Already logged in — redirect to chat
    useEffect(() => {
        if (isAuthenticated) navigate('/chat', { replace: true })
    }, [isAuthenticated, navigate])

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await loginWithGoogle(credentialResponse.credential)
            navigate('/chat', { replace: true })
        } catch {
            // Error already set in AuthContext
        }
    }

    const handleGoogleError = () => {
        console.error('Google Sign-In flow failed.')
    }

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center relative overflow-hidden">

            {/* ── Background glow effects ──────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] 
                        bg-brand-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] 
                        bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            {/* ── Login card ───────────────────────────────────────────── */}
            <div className="relative z-10 glass-card p-10 w-full max-w-md mx-4 animate-fade-in text-center">

                {/* Logo / Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 
                        flex items-center justify-center mx-auto mb-6 text-2xl shadow-lg shadow-brand-600/30">
                    💬
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-gray-400 text-sm mb-8">
                    Sign in with your Google account to start chatting.
                </p>

                {/* Error message */}
                {error && (
                    <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 
                          rounded-xl text-red-400 text-sm animate-fade-in text-left">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Google Login Button */}
                <div className="flex justify-center">
                    {loading ? (
                        <div className="flex items-center gap-3 text-gray-400 text-sm py-3">
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Authenticating...
                        </div>
                    ) : (
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            size="large"
                            text="signin_with"
                            useOneTap
                        />
                    )}
                </div>

                {/* Footer note */}
                <p className="text-xs text-gray-600 mt-8">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                    Your data is stored securely in Neon Postgres.
                </p>
            </div>
        </div>
    )
}
