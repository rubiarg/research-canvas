import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { BlockPalette } from './BlockPalette.tsx'
import type { ColourMode } from '@/types/canvas.ts'
import type { VisibilityLevel } from '@/types/block.ts'
import { saveFile, loadFile } from '@/file/persistence.ts'
import type { SerializedState } from '@/store/index.ts'
import {
  Save,
  FolderOpen,
  PanelRight,
  Bookmark,
  LayoutGrid,
} from 'lucide-react'

const COLOUR_MODES: { value: ColourMode; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'threads', label: 'Threads' },
  { value: 'tags', label: 'Tags' },
]

const VISIBILITY_LEVELS: { value: VisibilityLevel; label: string }[] = [
  { value: 0, label: 'L0' },
  { value: 1, label: 'L1' },
  { value: 2, label: 'L2' },
  { value: 3, label: 'L3' },
]

export function Toolbar() {
  const colourMode = useStore((s) => s.canvas.colourMode)
  const setColourMode = useStore((s) => s.setColourMode)
  const globalVisibilityFloor = useStore((s) => s.canvas.globalVisibilityFloor)
  const setGlobalVisibility = useStore((s) => s.setGlobalVisibility)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen)
  const autoLayout = useStore((s) => s.autoLayout)
  const savePreset = useStore((s) => s.savePreset)
  const loadState = useStore((s) => s.loadState)
  const getState = useStore

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showPresetInput, setShowPresetInput] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const state = getState.getState()
      const serialized: SerializedState = {
        blocks: state.blocks,
        connections: state.connections,
        threads: state.threads,
        taxonomy: state.taxonomy,
        progressModels: state.progressModels,
        canvas: state.canvas,
      }
      await saveFile(serialized)
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = async () => {
    setLoading(true)
    try {
      const loaded = await loadFile()
      if (loaded) {
        loadState(loaded)
      }
    } catch (e) {
      console.error('Load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return
    savePreset(presetName.trim())
    setPresetName('')
    setShowPresetInput(false)
  }

  return (
    <header className="flex items-center gap-3 px-4 h-12 bg-gray-900 border-b border-gray-700 flex-shrink-0 overflow-x-auto">
      {/* App name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">R</span>
        </div>
        <span className="text-sm font-semibold text-white whitespace-nowrap">ResearchCanvas</span>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Block palette */}
      <BlockPalette />

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Colour mode */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-gray-500 mr-1 whitespace-nowrap">Colour</span>
        <div className="flex rounded border border-gray-700 overflow-hidden">
          {COLOUR_MODES.map((cm) => (
            <button
              key={cm.value}
              onClick={() => setColourMode(cm.value)}
              className={`px-2.5 py-1 text-xs transition-colors whitespace-nowrap ${
                colourMode === cm.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {cm.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Visibility level */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-gray-500 mr-1 whitespace-nowrap">Detail</span>
        <div className="flex rounded border border-gray-700 overflow-hidden">
          {VISIBILITY_LEVELS.map((vl) => (
            <button
              key={vl.value}
              onClick={() => setGlobalVisibility(vl.value)}
              className={`px-2 py-1 text-xs transition-colors ${
                globalVisibilityFloor === vl.value
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {vl.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Auto-layout */}
      <button
        onClick={autoLayout}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        title="Auto-layout blocks by level (floating and 'all levels' blocks stay put)"
      >
        <LayoutGrid size={13} />
        <span className="whitespace-nowrap">Auto-layout</span>
      </button>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Preset save */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {showPresetInput ? (
          <>
            <input
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 w-28"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset()
                if (e.key === 'Escape') setShowPresetInput(false)
              }}
              autoFocus
            />
            <button
              onClick={handleSavePreset}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded"
            >
              Save
            </button>
            <button
              onClick={() => setShowPresetInput(false)}
              className="px-2 py-1 text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowPresetInput(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Save view preset"
          >
            <Bookmark size={13} />
            <span className="whitespace-nowrap">Preset</span>
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* File I/O */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleLoad}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
          title="Load .rcvs file"
        >
          <FolderOpen size={13} />
          <span className="whitespace-nowrap">{loading ? 'Loading...' : 'Load'}</span>
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors"
          title="Save .rcvs file"
        >
          <Save size={13} />
          <span className="whitespace-nowrap">{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className={`p-1.5 rounded transition-colors flex-shrink-0 ${
          sidebarOpen ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="Toggle sidebar"
      >
        <PanelRight size={16} />
      </button>
    </header>
  )
}
