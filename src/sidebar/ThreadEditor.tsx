import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { Plus, Trash2 } from 'lucide-react'

interface ThreadEditorProps {
  blockId: string
}

export function ThreadEditor({ blockId }: ThreadEditorProps) {
  const block = useStore((s) => s.blocks[blockId])
  const threads = useStore((s) => s.threads)
  const toggleBlockThread = useStore((s) => s.toggleBlockThread)
  const addThread = useStore((s) => s.addThread)
  const removeThread = useStore((s) => s.removeThread)

  const [newThreadName, setNewThreadName] = useState('')
  const [newThreadColour, setNewThreadColour] = useState('#6366f1')
  const [newThreadDesc, setNewThreadDesc] = useState('')

  if (!block) return null

  const memberThreadIds = block.threadIds ?? []

  const handleAddThread = () => {
    if (!newThreadName.trim()) return
    const id = addThread(newThreadName.trim(), newThreadColour, newThreadDesc.trim())
    // Auto-add current block to new thread
    toggleBlockThread(blockId, id)
    setNewThreadName('')
    setNewThreadColour('#6366f1')
    setNewThreadDesc('')
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Threads</h4>
        <div className="space-y-2">
          {threads.length === 0 && (
            <p className="text-xs text-gray-500">No threads yet. Create one below.</p>
          )}
          {threads.map((thread) => {
            const isMember = memberThreadIds.includes(thread.id)
            return (
              <div
                key={thread.id}
                className={`flex items-center gap-3 p-2 rounded border transition-colors ${
                  isMember
                    ? 'border-opacity-50 bg-opacity-10'
                    : 'border-gray-700 bg-gray-800'
                }`}
                style={
                  isMember
                    ? {
                        borderColor: thread.colour,
                        backgroundColor: thread.colour + '15',
                      }
                    : {}
                }
              >
                {/* Colour swatch */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: thread.colour }}
                />

                {/* Thread name + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">{thread.name}</div>
                  {thread.description && (
                    <div className="text-xs text-gray-500 truncate">{thread.description}</div>
                  )}
                  <div className="text-xs text-gray-600">{thread.memberBlockIds.length} blocks</div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => toggleBlockThread(blockId, thread.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    isMember ? 'bg-indigo-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                      isMember ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Delete thread */}
                <button
                  onClick={() => removeThread(thread.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Delete thread"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Create new thread */}
      <div className="border-t border-gray-700 pt-3 space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Thread</h4>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
            placeholder="Thread name..."
            value={newThreadName}
            onChange={(e) => setNewThreadName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddThread()
            }}
          />
          <input
            type="color"
            value={newThreadColour}
            onChange={(e) => setNewThreadColour(e.target.value)}
            className="w-9 h-9 rounded cursor-pointer border border-gray-700"
          />
        </div>
        <input
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
          placeholder="Description (optional)..."
          value={newThreadDesc}
          onChange={(e) => setNewThreadDesc(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddThread()
          }}
        />
        <button
          onClick={handleAddThread}
          disabled={!newThreadName.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          <Plus size={12} />
          Create Thread
        </button>
      </div>
    </div>
  )
}
