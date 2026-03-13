import { useStore } from '@/store/index.ts'
import type { ConnectionType } from '@/types/connection.ts'
import { Trash2 } from 'lucide-react'

interface ConnectionEditorProps {
  connectionId: string
}

const CONNECTION_TYPES: { value: ConnectionType; label: string; description: string }[] = [
  {
    value: 'dependency',
    label: 'Dependency',
    description: 'Block B depends on Block A (dashed line)',
  },
  {
    value: 'contribution-flow',
    label: 'Contribution Flow',
    description: 'Block A contributes output to Block B (solid arrow)',
  },
  {
    value: 'parallel-data',
    label: 'Parallel Data',
    description: 'Both blocks collect the same data type (dotted line)',
  },
  {
    value: 'conceptual-link',
    label: 'Conceptual Link',
    description: 'Loosely related conceptually (curved dashed)',
  },
]

export function ConnectionEditor({ connectionId }: ConnectionEditorProps) {
  const connection = useStore((s) => s.connections[connectionId])
  const updateConnection = useStore((s) => s.updateConnection)
  const removeConnection = useStore((s) => s.removeConnection)
  const clearSelection = useStore((s) => s.clearSelection)
  const blocks = useStore((s) => s.blocks)

  if (!connection) return null

  const sourceBlock = blocks[connection.sourceId]
  const targetBlock = blocks[connection.targetId]

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500'
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1'

  const handleRemove = () => {
    removeConnection(connectionId)
    clearSelection()
  }

  return (
    <div className="p-4 space-y-4">
      {/* Source → Target */}
      <div className="bg-gray-800 rounded p-3">
        <div className="text-xs text-gray-400 mb-1">Connection</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-200 truncate">{sourceBlock?.title ?? connection.sourceId}</span>
          <span className="text-gray-500">→</span>
          <span className="text-gray-200 truncate">{targetBlock?.title ?? connection.targetId}</span>
        </div>
      </div>

      {/* Connection type */}
      <div>
        <label className={labelClass}>Connection Type</label>
        <div className="space-y-1">
          {CONNECTION_TYPES.map((ct) => (
            <label
              key={ct.value}
              className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                connection.type === ct.value
                  ? 'border-indigo-500 bg-indigo-950'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="connectionType"
                value={ct.value}
                checked={connection.type === ct.value}
                onChange={() => updateConnection(connectionId, { type: ct.value })}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm text-gray-200">{ct.label}</div>
                <div className="text-xs text-gray-500">{ct.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className={labelClass}>Label</label>
        <input
          className={inputClass}
          value={connection.label}
          onChange={(e) => updateConnection(connectionId, { label: e.target.value })}
          placeholder="Connection label..."
        />
      </div>

      {/* Contribution Flow specific fields */}
      {connection.type === 'contribution-flow' && (
        <>
          <div>
            <label className={labelClass}>Contribution Name</label>
            <input
              className={inputClass}
              value={connection.contributionName ?? ''}
              onChange={(e) => updateConnection(connectionId, { contributionName: e.target.value })}
              placeholder="e.g. Touch trace taxonomy"
            />
            <p className="text-xs text-gray-500 mt-1">What is being contributed from source to target</p>
          </div>
          <div>
            <label className={labelClass}>Target Field</label>
            <input
              className={inputClass}
              value={connection.targetField ?? ''}
              onChange={(e) => updateConnection(connectionId, { targetField: e.target.value })}
              placeholder="e.g. evidence base, theoretical framing"
            />
            <p className="text-xs text-gray-500 mt-1">Which field in the target this contribution populates</p>
          </div>
        </>
      )}

      {/* Delete */}
      <div className="border-t border-gray-700 pt-3">
        <button
          onClick={handleRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900 hover:bg-red-800 text-red-300 hover:text-white rounded transition-colors"
        >
          <Trash2 size={12} />
          Delete Connection
        </button>
      </div>
    </div>
  )
}
