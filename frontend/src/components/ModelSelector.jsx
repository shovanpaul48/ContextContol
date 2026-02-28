/**
 * components/ModelSelector.jsx
 * ─────────────────────────────
 * Provider + Model picker dropdowns for the chat header.
 *
 * Props:
 *   providers         - array of ProviderInfo objects from GET /chat/providers
 *   selectedProvider  - currently selected provider id string
 *   selectedModel     - currently selected model slug string
 *   onProviderChange  - (providerId: string) => void
 *   onModelChange     - (modelSlug: string) => void
 *   disabled          - true while a message is being sent
 */

export default function ModelSelector({
    providers = [],
    selectedProvider,
    selectedModel,
    onProviderChange,
    onModelChange,
    disabled = false,
}) {
    const currentProvider = providers.find((p) => p.id === selectedProvider)
    const availableModels = currentProvider?.models ?? []

    const handleProviderChange = (e) => {
        const newProvider = e.target.value
        onProviderChange(newProvider)
        // Auto-select the first available model for that provider
        const newProviderObj = providers.find((p) => p.id === newProvider)
        if (newProviderObj?.models?.length > 0) {
            onModelChange(newProviderObj.models[0])
        }
    }

    const handleModelChange = (e) => {
        onModelChange(e.target.value)
    }

    /** Pretty display name for a model slug */
    function formatModelName(slug) {
        // "mistralai/mistral-7b-instruct" → "Mistral 7B Instruct"
        const parts = slug.split('/')
        const name = parts[parts.length - 1]
        return name
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
    }

    return (
        <div className="flex items-center gap-2 flex-wrap" id="model-selector">
            {/* Provider dropdown */}
            <div className="relative">
                <label htmlFor="provider-select" className="sr-only">Provider</label>
                <select
                    id="provider-select"
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    disabled={disabled}
                    className="
                        appearance-none bg-surface-700 border border-surface-500
                        text-white text-xs rounded-lg px-3 py-1.5 pr-7
                        focus:outline-none focus:ring-1 focus:ring-brand-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        cursor-pointer transition-colors hover:border-surface-400
                    "
                >
                    {providers.map((p) => (
                        <option
                            key={p.id}
                            value={p.id}
                            disabled={!p.available}
                        >
                            {p.label}{!p.available ? ' (soon)' : ''}
                        </option>
                    ))}
                </select>
                {/* Chevron icon */}
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    ▾
                </span>
            </div>

            {/* Separator */}
            <span className="text-gray-600 text-xs hidden sm:inline">/</span>

            {/* Model dropdown */}
            <div className="relative">
                <label htmlFor="model-select" className="sr-only">Model</label>
                <select
                    id="model-select"
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={disabled || availableModels.length === 0}
                    className="
                        appearance-none bg-surface-700 border border-surface-500
                        text-white text-xs rounded-lg px-3 py-1.5 pr-7
                        focus:outline-none focus:ring-1 focus:ring-brand-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        cursor-pointer transition-colors hover:border-surface-400
                        max-w-[180px]
                    "
                >
                    {availableModels.length === 0 ? (
                        <option value="">No models available</option>
                    ) : (
                        availableModels.map((m) => (
                            <option key={m} value={m} title={m}>
                                {formatModelName(m)}
                            </option>
                        ))
                    )}
                </select>
                {/* Chevron icon */}
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    ▾
                </span>
            </div>

            {/* Active model badge */}
            {currentProvider?.available && (
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    Live
                </span>
            )}
        </div>
    )
}
