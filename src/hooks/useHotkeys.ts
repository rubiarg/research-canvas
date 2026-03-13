import { useEffect } from 'react'
import { useStore } from '@/store/index.ts'

/** Returns true if the event target is an editable element (input, textarea, etc.)
 *  so we don't fire canvas shortcuts while the user is typing. */
function isEditingText(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  const isEditable = (e.target as HTMLElement)?.isContentEditable
  return tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable
}

export function useHotkeys() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const removeBlock = useStore((s) => s.removeBlock)
  const removeConnection = useStore((s) => s.removeConnection)
  const clearSelection = useStore((s) => s.clearSelection)
  const setConnecting = useStore((s) => s.setConnecting)
  const toggleTrace = useStore((s) => s.toggleTrace)
  const select = useStore((s) => s.select)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

      // ── Undo / Redo ──────────────────────────────────────────────────────
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }

      // ── Skip the rest when typing in an input ───────────────────────────
      if (isEditingText(e)) return

      // ── Delete / Backspace — remove selected items ───────────────────────
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const { selection, blocks, connections } = useStore.getState()
        for (const id of selection.selectedIds) {
          if (blocks[id]) removeBlock(id)
          else if (connections[id]) removeConnection(id)
        }
        return
      }

      // ── Escape — clear selection, cancel connecting ──────────────────────
      if (e.key === 'Escape') {
        clearSelection()
        setConnecting(null)
        // Also clear all active traces
        const { selection } = useStore.getState()
        selection.activeTraces.forEach((t) => toggleTrace(t))
        return
      }

      // ── Select all blocks (Cmd/Ctrl+A) ───────────────────────────────────
      if (meta && e.key === 'a') {
        e.preventDefault()
        const { blocks } = useStore.getState()
        const ids = Object.keys(blocks)
        if (ids.length > 0) {
          select(ids[0]!)
          ids.slice(1).forEach((id) => select(id, true))
        }
        return
      }

      // ── Trace toggles 1-4 (only when a block is selected) ────────────────
      if (['1', '2', '3', '4'].includes(e.key)) {
        const { selection } = useStore.getState()
        if (selection.selectedIds.length > 0) {
          e.preventDefault()
          toggleTrace(parseInt(e.key))
        }
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, removeBlock, removeConnection, clearSelection, setConnecting, toggleTrace, select])
}
