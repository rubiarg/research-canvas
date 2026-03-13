import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { BlockEditor } from './BlockEditor.tsx'
import { ConnectionEditor } from './ConnectionEditor.tsx'
import { TaxonomyManager } from './TaxonomyManager.tsx'
import { ThreadsManager } from './ThreadsManager.tsx'
import { BlocksManager } from './BlocksManager.tsx'
import { X, Layers, Clock, Tag, GitBranch, LayoutList } from 'lucide-react'

const CANVAS_TABS = ['Blocks', 'Threads', 'Tags', 'Views'] as const
type CanvasTab = (typeof CANVAS_TABS)[number]

export function Sidebar() {
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const selectedIds = useStore((s) => s.selection.selectedIds)
  const blocks = useStore((s) => s.blocks)
  const connections = useStore((s) => s.connections)
  const viewPresets = useStore((s) => s.canvas.viewPresets)
  const loadPreset = useStore((s) => s.loadPreset)
  const transform = useStore((s) => s.canvas.transform)
  const colourMode = useStore((s) => s.canvas.colourMode)

  const [canvasTab, setCanvasTab] = useState<CanvasTab>('Blocks')

  if (!sidebarOpen) return null

  const firstSelected = selectedIds[0]
  const isBlock = firstSelected ? !!blocks[firstSelected] : false
  const isConnection = firstSelected ? !!connections[firstSelected] : false

  return (
    <aside
      className="w-80 flex-shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden"
      style={{ height: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-200">
          {isBlock
            ? `Block: ${blocks[firstSelected!]?.title ?? ''}`
            : isConnection
            ? 'Connection'
            : 'Canvas'}
        </span>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isBlock && firstSelected ? (
          <BlockEditor blockId={firstSelected} />
        ) : isConnection && firstSelected ? (
          <ConnectionEditor connectionId={firstSelected} />
        ) : (
          <CanvasPanel
            activeTab={canvasTab}
            onTabChange={setCanvasTab}
            viewPresets={viewPresets}
            loadPreset={loadPreset}
            transform={transform}
            colourMode={colourMode}
          />
        )}
      </div>
    </aside>
  )
}

function CanvasPanel({
  activeTab,
  onTabChange,
  viewPresets,
  loadPreset,
  transform,
  colourMode,
}: {
  activeTab: CanvasTab
  onTabChange: (t: CanvasTab) => void
  viewPresets: { id: string; name: string }[]
  loadPreset: (id: string) => void
  transform: { x: number; y: number; scale: number }
  colourMode: string
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        {CANVAS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Blocks' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <LayoutList size={14} className="text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Blocks</h3>
            </div>
            <BlocksManager />
          </div>
        )}

        {activeTab === 'Threads' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch size={14} className="text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Research Threads</h3>
            </div>
            <ThreadsManager />
          </div>
        )}

        {activeTab === 'Tags' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tag Taxonomy</h3>
            </div>
            <TaxonomyManager />
          </div>
        )}

        {activeTab === 'Views' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={14} className="text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">View Presets</h3>
              </div>
              {viewPresets.length === 0 ? (
                <p className="text-xs text-gray-500">No presets saved. Use the toolbar to save presets.</p>
              ) : (
                <div className="space-y-1">
                  {viewPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => loadPreset(preset.id)}
                      className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Canvas Info</h3>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <div>Zoom: {Math.round(transform.scale * 100)}%</div>
                <div>Pan: ({Math.round(transform.x)}, {Math.round(transform.y)})</div>
                <div>Colour Mode: {colourMode}</div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-400">Pan:</strong> Middle-mouse or Space + drag<br />
                <strong className="text-gray-400">Zoom:</strong> Scroll wheel<br />
                <strong className="text-gray-400">Select:</strong> Click block<br />
                <strong className="text-gray-400">Multi-select:</strong> Shift + click<br />
                <strong className="text-gray-400">Connect:</strong> Use Connect button then click target
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
