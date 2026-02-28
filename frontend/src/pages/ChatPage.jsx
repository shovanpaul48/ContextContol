/**
 * pages/ChatPage.jsx
 * ──────────────────
 * Main authenticated chat interface — Phase 2.
 *
 * New features vs Phase 1:
 *  - Fetches provider/model registry from backend on mount
 *  - ModelSelector in header — choose provider + model
 *  - Sends provider/model/conversation_id with every message
 *  - Receives and displays real LLM assistant responses
 *  - Tracks conversation_id for context continuity
 *  - "New Chat" button resets conversation
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { chatApi } from '../services/api'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import ModelSelector from '../components/ModelSelector'

// ── Default selection (must match model_registry.py defaults) ─────────────────
const DEFAULT_PROVIDER = 'openrouter'
const DEFAULT_MODEL = 'mistralai/mistral-7b-instruct'

export default function ChatPage() {
    const { user, logout, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    // ── Chat state ────────────────────────────────────────────────────────
    const [messages, setMessages] = useState([])
    const [isSending, setIsSending] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // ── Conversation state ────────────────────────────────────────────────
    const [conversationId, setConversationId] = useState(null)

    // ── Model selector state ──────────────────────────────────────────────
    const [providers, setProviders] = useState([])
    const [selectedProvider, setSelectedProvider] = useState(DEFAULT_PROVIDER)
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)

    const bottomRef = useRef(null)

    // ── Auth guard ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) navigate('/', { replace: true })
    }, [isAuthenticated, navigate])

    // ── Load provider/model registry ──────────────────────────────────────
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const { data } = await chatApi.getProviders()
                setProviders(data)
                // Set default to first available provider's first model
                const firstAvailable = data.find((p) => p.available && p.models.length > 0)
                if (firstAvailable) {
                    setSelectedProvider(firstAvailable.id)
                    setSelectedModel(firstAvailable.models[0])
                }
            } catch (err) {
                console.error('Failed to load providers:', err)
                // Fall back to hardcoded defaults — chat still works
            }
        }
        if (isAuthenticated) fetchProviders()
    }, [isAuthenticated])

    // ── Fetch chat history on mount ───────────────────────────────────────
    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const { data } = await chatApi.getHistory()
                setMessages(data.messages || [])
            } catch (err) {
                setError('Failed to load chat history. Please refresh.')
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
        if (isAuthenticated) fetchHistory()
    }, [isAuthenticated])

    // ── Auto-scroll ───────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── Send message ──────────────────────────────────────────────────────
    const handleSend = useCallback(async (content) => {
        // Optimistic: show user message immediately
        const tempUserId = `temp-user-${Date.now()}`
        const optimisticUserMsg = {
            id: tempUserId,
            user_id: user?.id,
            content,
            role: 'user',
            timestamp: new Date().toISOString(),
        }
        // Optimistic: show typing indicator for assistant
        const tempAssistantId = `temp-assistant-${Date.now()}`
        const typingMsg = {
            id: tempAssistantId,
            user_id: null,
            content: '…',
            role: 'assistant',
            timestamp: new Date().toISOString(),
            isTyping: true,
        }

        setMessages((prev) => [...prev, optimisticUserMsg, typingMsg])
        setIsSending(true)
        setError(null)

        try {
            const { data } = await chatApi.sendMessage(
                content,
                selectedProvider,
                selectedModel,
                conversationId,
            )

            // Lock conversation ID for the rest of this session
            if (!conversationId) {
                setConversationId(data.conversation_id)
            }

            // Replace optimistic messages with real ones from server
            setMessages((prev) =>
                prev
                    .map((m) => {
                        if (m.id === tempUserId) {
                            return {
                                ...m,
                                id: data.user_message_id,
                            }
                        }
                        if (m.id === tempAssistantId) {
                            return {
                                id: data.assistant_message_id,
                                user_id: null,
                                content: data.assistant_message,
                                role: 'assistant',
                                timestamp: new Date().toISOString(),
                            }
                        }
                        return m
                    })
            )
        } catch (err) {
            // Remove both optimistic messages on failure
            setMessages((prev) =>
                prev.filter((m) => m.id !== tempUserId && m.id !== tempAssistantId)
            )
            const detail = err.response?.data?.detail || 'Failed to get a response. Please try again.'
            setError(detail)
        } finally {
            setIsSending(false)
        }
    }, [user, selectedProvider, selectedModel, conversationId])

    // ── New chat ──────────────────────────────────────────────────────────
    const handleNewChat = () => {
        setMessages([])
        setConversationId(null)
        setError(null)
    }

    const handleLogout = () => {
        logout()
        navigate('/', { replace: true })
    }

    return (
        <div className="h-screen flex bg-surface-900 overflow-hidden">

            {/* ── Sidebar ──────────────────────────────────────────────────────── */}
            <aside
                className={`flex-shrink-0 w-64 bg-surface-800 border-r border-surface-600 
                    flex flex-col transition-all duration-300 
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    fixed md:relative h-full z-20`}
            >
                {/* App Brand */}
                <div className="p-4 border-b border-surface-600">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 
                            flex items-center justify-center text-sm">💬</div>
                        <span className="font-semibold text-white text-sm">ContextControl</span>
                    </div>
                </div>

                {/* New Chat */}
                <div className="p-4 border-b border-surface-600">
                    <button
                        id="new-chat-btn"
                        onClick={handleNewChat}
                        className="btn-ghost w-full justify-start text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                    </button>
                </div>

                {/* Active conversation info */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Current Session</p>
                    <div className="space-y-1">
                        {conversationId ? (
                            <div className="btn-ghost w-full justify-start text-sm truncate bg-white/5 cursor-default">
                                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                                Active conversation
                            </div>
                        ) : (
                            <div className="btn-ghost w-full justify-start text-sm truncate bg-white/5 cursor-default text-gray-500">
                                No active conversation
                            </div>
                        )}
                    </div>

                    {/* Model info in sidebar */}
                    {selectedProvider && selectedModel && (
                        <div className="mt-4 p-3 rounded-lg bg-surface-700/50 border border-surface-600">
                            <p className="text-xs text-gray-500 mb-1">Current Model</p>
                            <p className="text-xs text-brand-400 font-medium truncate">{selectedModel}</p>
                            <p className="text-xs text-gray-600 mt-0.5 capitalize">{selectedProvider}</p>
                        </div>
                    )}
                </div>

                {/* User profile + logout */}
                <div className="p-4 border-t border-surface-600 glass-card m-3">
                    <div className="flex items-center gap-3 mb-3">
                        <img
                            src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4f46e5&color=fff`}
                            alt={user?.name}
                            className="w-9 h-9 rounded-full ring-2 ring-brand-600"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="btn-ghost w-full justify-center text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ── Mobile sidebar overlay ─────────────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Main Chat Area ─────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-surface-600 bg-surface-800/50 backdrop-blur-sm flex-shrink-0 gap-3">
                    {/* Mobile menu toggle */}
                    <button
                        id="sidebar-toggle-btn"
                        className="md:hidden btn-ghost p-2 flex-shrink-0"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Model Selector (center) */}
                    <div className="flex-1 flex justify-center">
                        <ModelSelector
                            providers={providers}
                            selectedProvider={selectedProvider}
                            selectedModel={selectedModel}
                            onProviderChange={setSelectedProvider}
                            onModelChange={setSelectedModel}
                            disabled={isSending}
                        />
                    </div>

                    {/* Message count */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isSending && (
                            <span className="text-xs text-brand-400 animate-pulse-soft hidden sm:inline">● Thinking...</span>
                        )}
                        <span className="text-xs text-gray-500">
                            {messages.length} message{messages.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </header>

                {/* ── Message list ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

                        {/* Loading skeleton */}
                        {isLoading && (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-8 h-8 rounded-full bg-surface-600 flex-shrink-0" />
                                        <div className={`h-10 rounded-2xl bg-surface-600 ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error banner */}
                        {error && !isLoading && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in">
                                ⚠️ {error}
                                <button
                                    className="ml-3 underline text-red-300 hover:text-red-200"
                                    onClick={() => setError(null)}
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {!isLoading && messages.length === 0 && !error && (
                            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 
                                flex items-center justify-center text-3xl mb-4 border border-white/10">
                                    💬
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">Start a conversation</h2>
                                <p className="text-gray-500 text-sm max-w-xs mb-4">
                                    Select a model above and send a message. Your conversation context is maintained throughout the session.
                                </p>
                                {selectedModel && (
                                    <span className="text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
                                        Ready: {selectedModel.split('/').pop()}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Messages */}
                        {!isLoading && messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}

                        {/* Auto-scroll anchor */}
                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Input bar */}
                <ChatInput onSend={handleSend} disabled={isSending || isLoading} />
            </main>
        </div>
    )
}
