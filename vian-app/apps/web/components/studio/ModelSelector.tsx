'use client'

type ModelId = 'gpt-4o' | 'gpt-4-turbo' | 'claude-3-5-sonnet' | 'claude-3-opus'

interface ModelSelectorProps {
  value: ModelId
  onChange: (model: ModelId) => void
}

const MODELS: { id: ModelId; label: string; provider: string }[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
]

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ModelId)}
      className="bg-surface border border-border text-sm text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-accent cursor-pointer transition-colors hover:border-accent/50"
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label} ({m.provider})
        </option>
      ))}
    </select>
  )
}
