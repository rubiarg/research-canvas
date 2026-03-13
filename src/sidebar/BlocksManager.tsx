import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import type { BlockStatus } from '@/types/block.ts'
import { BLOCK_TYPE_COLOURS, BLOCK_TYPE_LABELS, STATUS_COLOURS, STATUS_ICONS } from '@/utils/colours.ts'
import { Pencil, Check, X } from 'lucide-react'

const STATUS_OPTIONS: BlockStatus[] = [
  'not-started', 'planned', 'in-progress', 'submitted', 'revision', 'completed',
]

export function BlocksManager() {
  const blocks = useStore((s) => s.blocks)
  const updateBlock = useStore((s) => s.updateBlock)
  const select = useStore((s) => s.select)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [search, setSearch] = useState('')

  const blockList = Object.values(blocks)
    .filter((b) => b.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title))

  const startEdit = (id: string, title: string) => {
    setEditingId(id)
    setEditTitle(title)
  }

  const commitEdit = (id: string) => {
    if (editTitle.trim()) updateBlock(id, { title: editTitle.trim() })
    setEditingId(null)
  }

  if (blockList.length === 0 && !search) {
    return <p className="text-xs text-gray-500">No blocks on canvas yet.</p>
  }

  return (
    <div className="space-y-1.5">
      {/* Search */}
      <input
        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
        placeholder="Filter blocks…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {blockList.length === 0 && (
        <p className="text-xs text-gray-500">No matches.</p>
      )}

      {blockList.map((block) => {
        const typeColour = BLOCK_TYPE_COLOURS[block.type] ?? '#6366f1'
        const typeLabel = BLOCK_TYPE_LABELS[block.type] ?? block.type
        const sc = STATUS_COLOURS[block.status]

        return (
          <div
            key={block.id}
            className="rounded border border-gray-700 bg-gray-800"
            style={{ borderLeft: `3px solid ${typeColour}` }}
          >
            {/* Title row */}
            <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-1">
              {editingId === block.id ? (
                <>
                  <input
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(block.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                  />
                  <button onClick={() => commitEdit(block.id)} className="text-green-400 hover:text-green-300"><Check size={11} /></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300"><X size={11} /></button>
                </>
              ) : (
                <>
                  <button
                    className="flex-1 text-left text-xs font-medium text-gray-200 hover:text-white truncate"
                    onClick={() => select(block.id)}
                    title="Select block on canvas"
                  >
                    {block.title}
                  </button>
                  <button onClick={() => startEdit(block.id, block.title)} className="text-gray-500 hover:text-gray-300 flex-shrink-0"><Pencil size={10} /></button>
                </>
              )}
            </div>

            {/* Type + Status row */}
            <div className="flex items-center gap-1.5 px-2 pb-1.5">
              <span className="text-xs font-medium" style={{ color: typeColour }}>{typeLabel}</span>
              <span className="text-gray-600 text-xs">·</span>
              <select
                className="flex-1 text-xs rounded px-1 py-0.5 border focus:outline-none focus:border-indigo-500"
                style={{
                  background: sc.bg,
                  color: sc.icon,
                  borderColor: sc.border,
                }}
                value={block.status}
                onChange={(e) => updateBlock(block.id, { status: e.target.value as BlockStatus })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} style={{ background: '#1e293b', color: '#e2e8f0' }}>
                    {STATUS_ICONS[s]} {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )
      })}
    </div>
  )
}
