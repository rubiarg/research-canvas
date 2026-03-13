import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

export function ThreadsManager() {
  const threads = useStore((s) => s.threads)
  const addThread = useStore((s) => s.addThread)
  const updateThread = useStore((s) => s.updateThread)
  const removeThread = useStore((s) => s.removeThread)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editingColourId, setEditingColourId] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newColour, setNewColour] = useState('#6366f1')
  const [newDesc, setNewDesc] = useState('')

  const startEdit = (id: string, name: string, desc: string) => {
    setEditingId(id)
    setEditName(name)
    setEditDesc(desc)
  }

  const commitEdit = (id: string) => {
    if (!editName.trim()) { setEditingId(null); return }
    updateThread(id, { name: editName.trim(), description: editDesc.trim() })
    setEditingId(null)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    addThread(newName.trim(), newColour, newDesc.trim())
    setNewName('')
    setNewColour('#6366f1')
    setNewDesc('')
  }

  const inputCls = 'bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500'

  return (
    <div className="space-y-2">
      {threads.length === 0 && (
        <p className="text-xs text-gray-500">No threads defined yet.</p>
      )}

      {threads.map((thread) => (
        <div
          key={thread.id}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5"
        >
          {editingId === thread.id ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 cursor-pointer border border-gray-600"
                  style={{ backgroundColor: thread.colour }}
                  onClick={() => setEditingColourId(editingColourId === thread.id ? null : thread.id)}
                />
                {editingColourId === thread.id && (
                  <input
                    type="color"
                    value={thread.colour}
                    onChange={(e) => updateThread(thread.id, { colour: e.target.value })}
                    onBlur={() => setEditingColourId(null)}
                    className="w-7 h-7 cursor-pointer rounded"
                    autoFocus
                  />
                )}
                <input
                  className={`${inputCls} flex-1`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(thread.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  autoFocus
                  placeholder="Thread name"
                />
                <button onClick={() => commitEdit(thread.id)} className="text-green-400 hover:text-green-300"><Check size={11} /></button>
                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300"><X size={11} /></button>
              </div>
              <input
                className={`${inputCls} w-full`}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(thread.id) }}
                placeholder="Description (optional)"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-shrink-0">
                <div
                  className="w-4 h-4 rounded-full cursor-pointer border border-gray-600"
                  style={{ backgroundColor: thread.colour }}
                  onClick={() => setEditingColourId(editingColourId === thread.id ? null : thread.id)}
                  title="Click to change colour"
                />
                {editingColourId === thread.id && (
                  <input
                    type="color"
                    value={thread.colour}
                    onChange={(e) => updateThread(thread.id, { colour: e.target.value })}
                    onBlur={() => setEditingColourId(null)}
                    className="absolute top-5 left-0 w-8 h-8 cursor-pointer z-10"
                    autoFocus
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">{thread.name}</div>
                {thread.description && (
                  <div className="text-xs text-gray-500 truncate">{thread.description}</div>
                )}
                <div className="text-xs text-gray-600">{thread.memberBlockIds.length} blocks</div>
              </div>
              <button onClick={() => startEdit(thread.id, thread.name, thread.description)} className="text-gray-500 hover:text-gray-300" title="Rename"><Pencil size={11} /></button>
              <button onClick={() => removeThread(thread.id)} className="text-red-500 hover:text-red-400" title="Delete thread"><Trash2 size={11} /></button>
            </div>
          )}
        </div>
      ))}

      {/* Add new thread */}
      <div className="border-t border-gray-700 pt-2 space-y-1.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add Thread</p>
        <div className="flex gap-1.5">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Thread name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <input
            type="color"
            value={newColour}
            onChange={(e) => setNewColour(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-gray-700 p-0.5"
          />
        </div>
        <div className="flex gap-1.5">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Description (optional)…"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs rounded"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
