'use client'

import { useState } from 'react'

const PRESET_SHELVES = [
  'Kids',
  'Fiction',
  'Sci-Fi',
  'Fantasy',
  'Non-Fiction',
  'Reference',
  'Cookbook',
]

export function ShelfSelector({
  value,
  onChange,
  existing = [],
}: {
  value: string[]
  onChange: (shelves: string[]) => void
  existing?: string[]
}) {
  const [custom, setCustom] = useState('')

  const suggestions = Array.from(new Set([...PRESET_SHELVES, ...existing]))
  const extras = value.filter((s) => !suggestions.includes(s))

  function toggle(s: string) {
    if (value.includes(s)) {
      onChange(value.filter((x) => x !== s))
    } else {
      onChange([...value, s])
    }
  }

  function addCustom() {
    const trimmed = custom.trim()
    if (!trimmed) return
    if (!value.includes(trimmed)) onChange([...value, trimmed])
    setCustom('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustom()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => {
          const active = value.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors min-h-[32px] ${
                active
                  ? 'bg-indigo text-parchment border-indigo'
                  : 'bg-white text-ink-soft border-line hover:border-indigo'
              }`}
            >
              {active ? '✓ ' : '+ '}
              {s}
            </button>
          )
        })}
        {extras.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className="text-xs font-medium rounded-full px-3 py-1.5 border bg-indigo text-parchment border-indigo min-h-[32px]"
          >
            ✓ {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom shelf..."
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="rounded-md border border-line bg-white text-sm font-medium px-3 py-2 min-h-[40px] hover:bg-parchment-soft disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}
