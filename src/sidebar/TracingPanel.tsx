import { useStore } from '@/store/index.ts'
import { runTrace } from '@/tracing/engine.ts'
import type { TraceMode } from '@/tracing/engine.ts'

interface TracingPanelProps {
  blockId: string
}

const TRACE_DESCRIPTIONS: Record<number, { label: string; description: string; colour: string }> = {
  1: {
    label: 'Trace 1 — Contributors',
    description: 'Highlight all blocks that contribute (directly or transitively) to this block via contribution-flow connections.',
    colour: '#6366f1',
  },
  2: {
    label: 'Trace 2 — Contribution Details',
    description: 'Annotate each incoming contribution-flow connection with what is contributed and to which field.',
    colour: '#ec4899',
  },
  3: {
    label: 'Trace 3 — Full Chain (Origins)',
    description: 'BFS upstream to find ultimate origin blocks — those with no incoming contribution-flow.',
    colour: '#f59e0b',
  },
  4: {
    label: 'Trace 4 — Downstream Impact',
    description: 'BFS downstream to find all terminal blocks this block eventually contributes to.',
    colour: '#22c55e',
  },
}

export function TracingPanel({ blockId }: TracingPanelProps) {
  const tracingSourceId = useStore((s) => s.selection.tracingSourceId)
  const activeTraces = useStore((s) => s.selection.activeTraces)
  const setTracingSource = useStore((s) => s.setTracingSource)
  const toggleTrace = useStore((s) => s.toggleTrace)
  const blocks = useStore((s) => s.blocks)
  const connections = useStore((s) => s.connections)

  const isTracingSource = tracingSourceId === blockId

  const handleSetSource = () => {
    if (isTracingSource) {
      setTracingSource(null)
    } else {
      setTracingSource(blockId)
    }
  }

  // Compute results for display
  const traceResult =
    isTracingSource && activeTraces.length > 0
      ? runTrace(blockId, activeTraces as TraceMode[], blocks, connections)
      : null

  return (
    <div className="space-y-4">
      {/* Set as tracing source */}
      <div>
        <button
          onClick={handleSetSource}
          className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
            isTracingSource
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
        >
          {isTracingSource ? '✓ Tracing from this block' : 'Set as Tracing Source'}
        </button>
        {!isTracingSource && (
          <p className="text-xs text-gray-500 mt-1">
            Set this block as the source to enable contribution tracing.
          </p>
        )}
      </div>

      {/* Trace mode toggles */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trace Modes</h4>
        {([1, 2, 3, 4] as TraceMode[]).map((mode) => {
          const info = TRACE_DESCRIPTIONS[mode]!
          const isActive = activeTraces.includes(mode)

          return (
            <div key={mode} className="rounded border border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleTrace(mode)}
                disabled={!isTracingSource}
                className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors ${
                  isActive && isTracingSource
                    ? 'bg-gray-700'
                    : 'bg-gray-800 hover:bg-gray-750'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                    isActive && isTracingSource
                      ? 'text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                  style={isActive && isTracingSource ? { backgroundColor: info.colour } : {}}
                >
                  {mode}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-200">{info.label}</div>
                </div>
                <div
                  className={`w-4 h-4 rounded border transition-colors ${
                    isActive && isTracingSource
                      ? 'border-0'
                      : 'border-gray-500'
                  }`}
                  style={isActive && isTracingSource ? { backgroundColor: info.colour } : {}}
                />
              </button>
              <p className="px-3 py-1.5 text-xs text-gray-500 bg-gray-850 border-t border-gray-700">
                {info.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Results summary */}
      {traceResult && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Results</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <div>
              Highlighted blocks:{' '}
              <span className="text-amber-400 font-medium">{traceResult.highlightedBlockIds.size}</span>
            </div>
            <div>
              Highlighted connections:{' '}
              <span className="text-amber-400 font-medium">{traceResult.highlightedConnectionIds.size}</span>
            </div>
            {traceResult.annotations.size > 0 && (
              <div>
                Annotations:{' '}
                <span className="text-amber-400 font-medium">{traceResult.annotations.size}</span>
              </div>
            )}
          </div>

          {/* Block list */}
          <div className="mt-2 space-y-1">
            {[...traceResult.highlightedBlockIds].map((id) => {
              const b = blocks[id]
              if (!b || id === blockId) return null
              return (
                <div key={id} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-gray-300 truncate">{b.title}</span>
                  <span className="text-gray-600 flex-shrink-0">{b.type}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isTracingSource && (
        <div className="text-xs text-gray-500 bg-gray-800 rounded p-3">
          Select this block as the tracing source, then enable one or more trace modes to visualise contribution flows on the canvas.
        </div>
      )}
    </div>
  )
}
