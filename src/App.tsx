import { useEffect, useRef } from 'react'
import { Toolbar } from './toolbar/Toolbar.tsx'
import { CanvasRoot } from './canvas/CanvasRoot.tsx'
import { Sidebar } from './sidebar/Sidebar.tsx'
import { useStore } from './store/index.ts'
import type { SerializedState } from './store/index.ts'
import { useHotkeys } from './hooks/useHotkeys.ts'

const LS_KEY = 'research-canvas-autosave'

function App() {
  useHotkeys()
  const loadState = useStore((s) => s.loadState)
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen)
  const hasLoadedRef = useRef(false)

  // Load from localStorage on first mount
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SerializedState
        if (parsed.blocks && parsed.connections) {
          loadState(parsed)
        }
      }
    } catch {
      // Ignore parse errors, start with demo data
    }
  }, [loadState])

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const state = useStore.getState()
        const serialized: SerializedState = {
          blocks: state.blocks,
          connections: state.connections,
          threads: state.threads,
          taxonomy: state.taxonomy,
          progressModels: state.progressModels,
          canvas: state.canvas,
        }
        localStorage.setItem(LS_KEY, JSON.stringify(serialized))
      } catch {
        // Storage might be full, ignore
      }
    }, 30_000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <CanvasRoot />
        {sidebarOpen && <Sidebar />}
      </div>
    </div>
  )
}

export default App
