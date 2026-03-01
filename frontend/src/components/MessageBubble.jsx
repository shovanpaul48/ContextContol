/**
 * components/MessageBubble.jsx
 * ─────────────────────────────
 * Chat message bubble with full status system.
 *
 * Supports states:
 *   sending    → faded message with spinner
 *   sent       → normal message with timestamp
 *   error      → red-bordered message with retry button
 *   generating → typing dots animation
 */

import { useAuth } from '../context/AuthContext'

function formatTime(isoString) {
    if (!isoString) return ''
    return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })
}

/** Animated typing dots */
function TypingDots() {
    return (
        <div className="flex items-center gap-1.5 py-1">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-2 h-2 bg-brand-400 rounded-full"
                    style={{
                        animation: 'bounce 1.4s infinite ease-in-out',
                        animationDelay: `${i * 0.16}s`,
                    }}
                />
            ))}
            <span className="text-xs text-gray-500 ml-2 italic">Thinking...</span>
        </div>
    )
}

/** Status indicator icons */
function StatusIcon({ status }) {
    switch (status) {
        case 'sending':
            return (
                <svg className="w-3 h-3 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )
        case 'sent':
            return (
                <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )
        case 'error':
            return (
                <svg className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
            )
        default:
            return null
    }
}

export default function MessageBubble({ message, onRetry }) {
    const { user } = useAuth()
    const isUser = message.role === 'user'
    const isGenerating = message.status === 'generating'
    const isError = message.status === 'error'
    const isSending = message.status === 'sending'

    return (
        <div
            className={`
                flex items-end gap-3 transition-all duration-300 ease-out
                ${isUser ? 'flex-row-reverse' : 'flex-row'}
                ${isSending ? 'opacity-70' : 'opacity-100'}
            `}
            style={{
                animation: 'slideUp 0.3s ease-out',
            }}
        >
            {/* ── Avatar ──────────────────────────────────────────────── */}
            <div className="flex-shrink-0">
                {isUser ? (
                    <img
                        src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4f46e5&color=fff`}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-600"
                    />
                ) : (
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        ${isGenerating
                            ? 'bg-gradient-to-br from-brand-500 to-purple-600 animate-pulse'
                            : isError
                                ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                                : 'bg-gradient-to-br from-brand-500 to-purple-600'
                        }
                    `}>
                        AI
                    </div>
                )}
            </div>

            {/* ── Bubble ──────────────────────────────────────────────── */}
            <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`
                        px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                        transition-all duration-200
                        ${isUser
                            ? `bg-brand-600 text-white rounded-br-md ${isSending ? 'bg-brand-600/60' : ''}`
                            : isError
                                ? 'bg-red-500/10 border border-red-500/30 text-red-300 rounded-bl-md'
                                : 'bg-surface-700 text-gray-100 rounded-bl-md'
                        }
                    `}
                >
                    {isGenerating ? <TypingDots /> : message.content}
                </div>

                {/* ── Footer: timestamp + status + retry ──────────────── */}
                <div className="flex items-center gap-2 px-1">
                    {/* Timestamp */}
                    {!isGenerating && (message.created_at || message.timestamp) && (
                        <span className="text-xs text-gray-600">
                            {formatTime(message.created_at || message.timestamp)}
                        </span>
                    )}

                    {/* Status icon for user messages */}
                    {isUser && !isGenerating && (
                        <StatusIcon status={message.status || 'sent'} />
                    )}

                    {/* Retry button for errors */}
                    {isError && onRetry && (
                        <button
                            onClick={() => onRetry(message)}
                            className="
                                inline-flex items-center gap-1 text-xs text-red-400
                                hover:text-red-300 transition-colors ml-1
                                bg-red-500/10 hover:bg-red-500/20
                                px-2 py-0.5 rounded-md
                            "
                        >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Retry
                        </button>
                    )}

                    {/* Latency display */}
                    {message.latency_ms && message.status === 'sent' && !isUser && (
                        <span className="text-xs text-gray-700">
                            {message.latency_ms}ms
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
