import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import type { BlockStatus, BlockType, VisibilityLevel } from '@/types/block.ts'
import { PhaseEditor } from './PhaseEditor.tsx'
import { TagEditor } from './TagEditor.tsx'
import { ThreadEditor } from './ThreadEditor.tsx'
import { TracingPanel } from './TracingPanel.tsx'
import { Trash2, Link, Maximize2 } from 'lucide-react'

const TABS = ['Fields', 'Progress', 'Tags', 'Threads', 'Tracing'] as const
type Tab = (typeof TABS)[number]

const STATUS_OPTIONS: BlockStatus[] = [
  'not-started',
  'planned',
  'in-progress',
  'submitted',
  'revision',
  'completed',
]

const TYPE_OPTIONS: BlockType[] = [
  'program',
  'project',
  'subproject',
  'publication',
  'artefact',
  'threadhub',
  'collaboration',
  'annotation',
]

interface BlockEditorProps {
  blockId: string
}

export function BlockEditor({ blockId }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Fields')
  const block = useStore((s) => s.blocks[blockId])
  const updateBlock = useStore((s) => s.updateBlock)
  const removeBlock = useStore((s) => s.removeBlock)
  const resetBlockSize = useStore((s) => s.resetBlockSize)
  const clearSelection = useStore((s) => s.clearSelection)
  const setConnecting = useStore((s) => s.setConnecting)

  if (!block) return null

  const handleRemove = () => {
    removeBlock(blockId)
    clearSelection()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-700 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Fields' && (
          <FieldsTab
            block={block}
            onChange={(updates) => updateBlock(blockId, updates)}
          />
        )}
        {activeTab === 'Progress' && <PhaseEditor blockId={blockId} />}
        {activeTab === 'Tags' && <TagEditor blockId={blockId} />}
        {activeTab === 'Threads' && <ThreadEditor blockId={blockId} />}
        {activeTab === 'Tracing' && <TracingPanel blockId={blockId} />}
      </div>

      {/* Footer actions */}
      <div className="border-t border-gray-700 p-3 flex gap-2 flex-wrap">
        <button
          onClick={() => setConnecting(blockId)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
        >
          <Link size={12} />
          Connect
        </button>
        <button
          onClick={() => resetBlockSize(blockId)}
          title="Reset to default size (undoable)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded transition-colors"
        >
          <Maximize2 size={12} />
          Reset size
        </button>
        <button
          onClick={handleRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900 hover:bg-red-800 text-red-300 hover:text-white rounded transition-colors ml-auto"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  )
}

function FieldsTab({
  block,
  onChange,
}: {
  block: ReturnType<typeof useStore.getState>['blocks'][string]
  onChange: (updates: Partial<typeof block>) => void
}) {
  if (!block) return null

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500'
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1'
  const fieldClass = 'space-y-1 mb-3'

  return (
    <div className="space-y-1">
      <div className={fieldClass}>
        <label className={labelClass}>Title</label>
        <input
          className={inputClass}
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Description</label>
        <textarea
          className={`${inputClass} resize-none h-20`}
          value={block.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={fieldClass}>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={block.status}
            onChange={(e) => onChange({ status: e.target.value as BlockStatus })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Type</label>
          <select
            className={inputClass}
            value={block.type}
            onChange={(e) => onChange({ type: e.target.value as BlockType })}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Visibility Level</label>
        <select
          className={inputClass}
          value={block.visibilityLevel}
          onChange={(e) => onChange({ visibilityLevel: parseInt(e.target.value) as VisibilityLevel })}
        >
          {([0, 1, 2, 3] as VisibilityLevel[]).map((v) => (
            <option key={v} value={v}>
              L{v} {v === 0 ? '(Minimal)' : v === 1 ? '(Basic)' : v === 2 ? '(Standard)' : '(Full)'}
            </option>
          ))}
        </select>
      </div>

      {/* Research Question */}
      {['program', 'project', 'subproject'].includes(block.type) && (
        <div className={fieldClass}>
          <label className={labelClass}>Research Question</label>
          <textarea
            className={`${inputClass} resize-none h-16`}
            value={block.rq ?? ''}
            onChange={(e) => onChange({ rq: e.target.value })}
            placeholder="What is your core research question?"
          />
        </div>
      )}

      {/* Contributions */}
      {['project', 'subproject', 'publication'].includes(block.type) && (
        <div className={fieldClass}>
          <label className={labelClass}>Contributions</label>
          <textarea
            className={`${inputClass} resize-none h-16`}
            value={block.contributions ?? ''}
            onChange={(e) => onChange({ contributions: e.target.value })}
            placeholder="Key contributions of this work"
          />
        </div>
      )}

      {/* Publication fields */}
      {['publication', 'project'].includes(block.type) && (
        <div className={fieldClass}>
          <label className={labelClass}>Venue</label>
          <input
            className={inputClass}
            value={block.venue ?? ''}
            onChange={(e) => onChange({ venue: e.target.value })}
            placeholder="e.g. CHI 2026, DIS 2026"
          />
        </div>
      )}

      {block.type === 'publication' && (
        <>
          <div className={fieldClass}>
            <label className={labelClass}>Year</label>
            <input
              className={inputClass}
              type="number"
              value={block.year ?? ''}
              onChange={(e) => onChange({ year: parseInt(e.target.value) || undefined })}
              placeholder="Publication year"
            />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>DOI</label>
            <input
              className={inputClass}
              value={block.doi ?? ''}
              onChange={(e) => onChange({ doi: e.target.value })}
              placeholder="10.xxxx/xxxx"
            />
          </div>
        </>
      )}

      {/* Author role */}
      {['project', 'publication', 'collaboration'].includes(block.type) && (
        <div className={fieldClass}>
          <label className={labelClass}>Author Role</label>
          <input
            className={inputClass}
            value={block.authorRole ?? ''}
            onChange={(e) => onChange({ authorRole: e.target.value })}
            placeholder="e.g. First author, Lead researcher"
          />
        </div>
      )}

      {/* Artefact type */}
      {block.type === 'artefact' && (
        <div className={fieldClass}>
          <label className={labelClass}>Artefact Type</label>
          <input
            className={inputClass}
            value={block.artefactType ?? ''}
            onChange={(e) => onChange({ artefactType: e.target.value })}
            placeholder="e.g. Hardware prototype, Software tool, Dataset"
          />
        </div>
      )}

      {/* Layout level */}
      <div className={fieldClass}>
        <label className={labelClass}>Layout Level</label>
        <select
          className={inputClass}
          value={block.level === null || block.level === undefined ? '__float' : block.level === 'all' ? '__all' : String(block.level)}
          onChange={(e) => {
            const v = e.target.value
            onChange({ level: v === '__float' ? null : v === '__all' ? 'all' : parseInt(v) })
          }}
        >
          <option value="__float">Floating (no auto-layout)</option>
          <option value="__all">All levels</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={String(i)}>Level {i}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Used by Auto-layout to arrange blocks into columns</p>
      </div>
    </div>
  )
}
