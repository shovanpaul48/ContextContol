/**
 * components/ChatMessage.jsx
 * ──────────────────────────
 * Renders a single chat message bubble.
 * User messages → right-aligned indigo bubble
 * Assistant messages → left-aligned gray bubble (Phase 2)
 */

import { useAuth } from '../context/AuthContext'

/**
 * Format a timestamp into a readable time string.
 * @param {string} isoString - ISO 8601 timestamp from backend
 */
function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ChatMessage({ message }) {
    const { user } = useAuth()
    const isUser = message.role === 'user'

    return (
        <div
            className={`flex items-end gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
        >
            {/* ── Avatar ──────────────────────────────────────────────────── */}
            <div className="flex-shrink-0">
                {isUser ? (
                    <img
                        src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4f46e5&color=fff`}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-600"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                        AI
                    </div>
                )}
            </div>

            {/* ── Bubble ──────────────────────────────────────────────────── */}
            <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser
                            ? 'bg-brand-600 text-white rounded-br-md'
                            : 'bg-surface-700 text-gray-100 rounded-bl-md'
                        }`}
                >
                    {message.content}
                </div>
                {/* Timestamp */}
                <span className="text-xs text-gray-600 px-1">
                    {formatTime(message.timestamp)}
                </span>
            </div>
        </div>
    )
}
