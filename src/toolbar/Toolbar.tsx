import React, { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { BlockPalette } from './BlockPalette.tsx'
import type { ColourMode } from '@/types/canvas.ts'
import type { VisibilityLevel } from '@/types/block.ts'
import { saveFile, loadFile, loadMarkdownFile } from '@/file/persistence.ts'
import { parseMarkdown } from '@/file/markdownImport.ts'
import { downloadMarkdown } from '@/file/markdownExport.ts'
import type { SerializedState } from '@/store/index.ts'
import {
  Save,
  FolderOpen,
  PanelRight,
  Bookmark,
  LayoutGrid,
  FileDown,
  FileUp,
  Plus,
  Eye,
  ChevronDown,
} from 'lucide-react'

type Group = 'add' | 'view' | 'presets' | 'file'

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

  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [importingMd, setImportingMd] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showPresetInput, setShowPresetInput] = useState(false)

  const toggleGroup = (g: Group) => setActiveGroup((prev) => (prev === g ? null : g))

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
      if (loaded) loadState(loaded)
    } catch (e) {
      console.error('Load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleImportMarkdown = async () => {
    setImportingMd(true)
    try {
      const text = await loadMarkdownFile()
      if (text) loadState(parseMarkdown(text))
    } catch (e) {
      console.error('Markdown import failed:', e)
    } finally {
      setImportingMd(false)
    }
  }

  const handleExportMarkdown = () => {
    const state = getState.getState()
    const serialized: SerializedState = {
      blocks: state.blocks,
      connections: state.connections,
      threads: state.threads,
      taxonomy: state.taxonomy,
      progressModels: state.progressModels,
      canvas: state.canvas,
    }
    downloadMarkdown(serialized)
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return
    savePreset(presetName.trim())
    setPresetName('')
    setShowPresetInput(false)
  }

  return (
    <header className="flex flex-col bg-gray-900 border-b border-gray-700 flex-shrink-0">
      {/* ── Primary bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 h-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">R</span>
          </div>
          <span className="text-sm font-semibold text-white whitespace-nowrap">ResearchCanvas</span>
        </div>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        <GroupBtn label="Add" icon={<Plus size={12} />} active={activeGroup === 'add'} onClick={() => toggleGroup('add')} />
        <GroupBtn label="View" icon={<Eye size={12} />} active={activeGroup === 'view'} onClick={() => toggleGroup('view')} />
        <GroupBtn label="Presets" icon={<Bookmark size={12} />} active={activeGroup === 'presets'} onClick={() => toggleGroup('presets')} />
        <GroupBtn label="File" icon={<FolderOpen size={12} />} active={activeGroup === 'file'} onClick={() => toggleGroup('file')} />

        <div className="flex-1" />

        {/* Sidebar toggle — always visible */}
        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded transition-colors ${
            sidebarOpen ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Toggle sidebar"
        >
          <PanelRight size={15} />
        </button>
      </div>

      {/* ── Sub-bar ──────────────────────────────────────────────────────── */}
      {activeGroup && (
        <div className="flex items-center gap-2 px-4 h-10 border-t border-gray-800 bg-gray-900 overflow-x-auto">
          {activeGroup === 'add' && <BlockPalette />}

          {activeGroup === 'view' && (
            <>
              <span className="text-xs text-gray-500 whitespace-nowrap">Colour</span>
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

              <div className="w-px h-5 bg-gray-700 mx-1" />

              <span className="text-xs text-gray-500 whitespace-nowrap">Detail</span>
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

              <div className="w-px h-5 bg-gray-700 mx-1" />

              <button
                onClick={autoLayout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors whitespace-nowrap"
                title="Auto-layout blocks by level"
              >
                <LayoutGrid size={13} />
                Auto-layout
              </button>
            </>
          )}

          {activeGroup === 'presets' && (
            <>
              <PresetLoader />
              <div className="w-px h-5 bg-gray-700 mx-1" />
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
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded whitespace-nowrap"
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors whitespace-nowrap"
                >
                  <Bookmark size={13} />
                  Save current view
                </button>
              )}
            </>
          )}

          {activeGroup === 'file' && (
            <>
              <button
                onClick={handleImportMarkdown}
                disabled={importingMd}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Import from .md file"
              >
                <FileUp size={13} />
                {importingMd ? 'Importing...' : 'Import MD'}
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors whitespace-nowrap"
                title="Export as .md file"
              >
                <FileDown size={13} />
                Export MD
              </button>

              <div className="w-px h-5 bg-gray-700 mx-1" />

              <button
                onClick={handleLoad}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Load .rcvs file"
              >
                <FolderOpen size={13} />
                {loading ? 'Loading...' : 'Load .rcvs'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors whitespace-nowrap"
                title="Save .rcvs file"
              >
                <Save size={13} />
                {saving ? 'Saving...' : 'Save .rcvs'}
              </button>
            </>
          )}

          {/* Chevron to close sub-bar */}
          <div className="flex-1" />
          <button
            onClick={() => setActiveGroup(null)}
            className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
            title="Close"
          >
            <ChevronDown size={13} />
          </button>
        </div>
      )}
    </header>
  )
}

function GroupBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
        active
          ? 'bg-gray-700 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function PresetLoader() {
  const presets = useStore((s) => s.canvas.viewPresets)
  const loadPreset = useStore((s) => s.loadPreset)

  if (presets.length === 0) {
    return <span className="text-xs text-gray-600 italic">No saved presets</span>
  }

  return (
    <div className="flex items-center gap-1">
      {presets.map((p) => (
        <button
          key={p.id}
          onClick={() => loadPreset(p.id)}
          className="px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors whitespace-nowrap"
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}
