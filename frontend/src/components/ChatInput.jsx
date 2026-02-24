/**
 * components/ChatInput.jsx
 * ────────────────────────
 * Message input bar fixed at the bottom of the chat.
 * - Auto-resizing textarea (Shift+Enter for newlines, Enter to send)
 * - Disabled + loading state while sending
 * - Character count warning
 */

import { useState, useRef, useCallback } from 'react'

const MAX_CHARS = 10000

export default function ChatInput({ onSend, disabled }) {
    const [value, setValue] = useState('')
    const [charWarning, setCharWarning] = useState(false)
    const textareaRef = useRef(null)

    const handleChange = (e) => {
        const text = e.target.value
        setValue(text)
        setCharWarning(text.length > MAX_CHARS * 0.9)   // Warn at 90%

        // Auto-resize textarea
        const ta = textareaRef.current
        if (ta) {
            ta.style.height = 'auto'
            ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
        }
    }

    const handleSend = useCallback(() => {
        const trimmed = value.trim()
        if (!trimmed || disabled || trimmed.length > MAX_CHARS) return
        onSend(trimmed)
        setValue('')
        // Reset height
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }, [value, disabled, onSend])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const remaining = MAX_CHARS - value.length

    return (
        <div className="border-t border-surface-600 bg-surface-800/80 backdrop-blur-lg p-4">
            <div className="max-w-3xl mx-auto">
                {/* Character warning */}
                {charWarning && (
                    <p className={`text-xs mb-2 text-right ${remaining < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {remaining < 0 ? `${Math.abs(remaining)} chars over limit` : `${remaining} chars remaining`}
                    </p>
                )}

                <div className="flex items-end gap-3 glass-card p-3">
                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        id="chat-input"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Shift+Enter for new line)"
                        rows={1}
                        disabled={disabled}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm 
                       resize-none focus:outline-none leading-relaxed min-h-[24px] max-h-[200px]
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {/* Send button */}
                    <button
                        id="send-message-btn"
                        onClick={handleSend}
                        disabled={disabled || !value.trim() || remaining < 0}
                        aria-label="Send message"
                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-700
                       disabled:bg-surface-600 disabled:cursor-not-allowed
                       active:scale-95 transition-all duration-150
                       flex items-center justify-center group"
                    >
                        {disabled ? (
                            /* Loading spinner */
                            <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            /* Send icon */
                            <svg className="w-4 h-4 text-white group-disabled:text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        )}
                    </button>
                </div>

                <p className="text-xs text-gray-600 text-center mt-2">
                    Press <kbd className="bg-surface-600 px-1 rounded text-xs">Enter</kbd> to send
                    &nbsp;·&nbsp;
                    <kbd className="bg-surface-600 px-1 rounded text-xs">Shift+Enter</kbd> for new line
                </p>
            </div>
        </div>
    )
}
