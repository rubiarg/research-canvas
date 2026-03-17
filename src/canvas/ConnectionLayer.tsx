import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/store/index.ts'
import type { Connection, ConnectionType } from '@/types/connection.ts'
import type { Block } from '@/types/block.ts'
import type { CanvasTransform } from '@/types/canvas.ts'
import { runTrace } from '@/tracing/engine.ts'

interface ConnectionLayerProps {
  transform: CanvasTransform
  stageWidth: number
  stageHeight: number
  rubberbandPos: { x: number; y: number } | null
}

interface Point {
  x: number
  y: number
}

type Edge = 'right' | 'left' | 'bottom' | 'top'

const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  'dependency': 'Dependency',
  'contribution-flow': 'Contribution Flow',
  'parallel-data': 'Parallel Data',
  'conceptual-link': 'Conceptual Link',
}

export function defaultLabel(type: ConnectionType): string {
  return CONNECTION_TYPE_LABELS[type] ?? type
}

function getBlockCentre(block: Block): Point {
  return {
    x: block.position.x + block.size.width / 2,
    y: block.position.y + block.size.height / 2,
  }
}

function getConnectionEndpoints(
  source: Block,
  target: Block
): { from: Point; to: Point; fromEdge: Edge; toEdge: Edge } {
  const sc = getBlockCentre(source)
  const tc = getBlockCentre(target)
  const dx = tc.x - sc.x
  const dy = tc.y - sc.y

  // Determine which edges to connect based on dominant direction
  let fromEdge: Edge, toEdge: Edge
  if (Math.abs(dx) >= Math.abs(dy)) {
    fromEdge = dx >= 0 ? 'right' : 'left'
    toEdge   = dx >= 0 ? 'left'  : 'right'
  } else {
    fromEdge = dy > 0 ? 'bottom' : 'top'
    toEdge   = dy > 0 ? 'top'    : 'bottom'
  }

  const from: Point = {
    x: sc.x + (fromEdge === 'right' ? source.size.width / 2 : fromEdge === 'left' ? -source.size.width / 2 : 0),
    y: sc.y + (fromEdge === 'bottom' ? source.size.height / 2 : fromEdge === 'top' ? -source.size.height / 2 : 0),
  }
  const to: Point = {
    x: tc.x + (toEdge === 'right' ? target.size.width / 2 : toEdge === 'left' ? -target.size.width / 2 : 0),
    y: tc.y + (toEdge === 'bottom' ? target.size.height / 2 : toEdge === 'top' ? -target.size.height / 2 : 0),
  }

  return { from, to, fromEdge, toEdge }
}

function edgeNormal(edge: Edge): Point {
  switch (edge) {
    case 'right':  return { x: 1,  y: 0 }
    case 'left':   return { x: -1, y: 0 }
    case 'bottom': return { x: 0,  y: 1 }
    case 'top':    return { x: 0,  y: -1 }
  }
}

// Compute a cubic bezier using edge normals for control points.
// This ensures arrows always exit/enter blocks cleanly regardless of angle.
function computePath(from: Point, to: Point, fromEdge: Edge, toEdge: Edge): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  // Minimum 60px offset to prevent curves that loop back inside blocks
  const cpLen = Math.max(60, dist * 0.45)

  const fn = edgeNormal(fromEdge)
  const tn = edgeNormal(toEdge)

  const cp1x = from.x + fn.x * cpLen
  const cp1y = from.y + fn.y * cpLen
  // toEdge normal points INTO the block; we want to pull control point OUT
  const cp2x = to.x + tn.x * cpLen
  const cp2y = to.y + tn.y * cpLen

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
}

interface ConnectionPathProps {
  connection: Connection
  blocks: Record<string, Block>
  isSelected: boolean
  isHighlighted: boolean
  dimmed: boolean
  annotation?: string
  onSelect: (id: string) => void
  onDoubleClick: (id: string, screenMid: Point) => void
  transform: CanvasTransform
}

function ConnectionPath({
  connection, blocks, isSelected, isHighlighted, dimmed,
  annotation, onSelect, onDoubleClick, transform,
}: ConnectionPathProps) {
  const source = blocks[connection.sourceId]
  const target = blocks[connection.targetId]
  if (!source || !target) return null

  const { from, to, fromEdge, toEdge } = getConnectionEndpoints(source, target)
  const pathD = computePath(from, to, fromEdge, toEdge)
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  const screenMid = {
    x: mid.x * transform.scale + transform.x,
    y: mid.y * transform.scale + transform.y,
  }

  const connTypeStyles: Record<string, { stroke: string; strokeWidth: number; strokeDasharray: string; markerEnd: string }> = {
    dependency:          { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '6 4',  markerEnd: 'url(#arrow-open)' },
    'contribution-flow': { stroke: '#6366f1', strokeWidth: 2.5, strokeDasharray: 'none', markerEnd: 'url(#arrow-filled)' },
    'parallel-data':     { stroke: '#06b6d4', strokeWidth: 1.5, strokeDasharray: '2 4',  markerEnd: 'none' },
    'conceptual-link':   { stroke: '#94a3b8', strokeWidth: 1,   strokeDasharray: '8 4',  markerEnd: 'none' },
  }

  const style = connTypeStyles[connection.type] ?? connTypeStyles['dependency']!
  const stroke = isSelected || isHighlighted ? '#f59e0b' : style.stroke
  const strokeWidth = isSelected ? style.strokeWidth + 1 : style.strokeWidth
  const opacity = dimmed ? 0.2 : 1

  return (
    <g opacity={opacity}>
      {/* Invisible wide hit area */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onClick={(e) => { e.stopPropagation(); onSelect(connection.id) }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(connection.id, screenMid) }}
      />
      <path
        d={pathD}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={style.strokeDasharray === 'none' ? undefined : style.strokeDasharray}
        fill="none"
        markerEnd={style.markerEnd === 'none' ? undefined : style.markerEnd}
        pointerEvents="none"
      />
      {connection.label && (
        <text x={mid.x} y={mid.y - 6} textAnchor="middle" fontSize={9}
          fill={isSelected ? '#f59e0b' : '#94a3b8'}
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {connection.label}
        </text>
      )}
      {annotation && (
        <text x={mid.x} y={mid.y + 14} textAnchor="middle" fontSize={9} fill="#f59e0b"
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {annotation}
        </text>
      )}
    </g>
  )
}

const CONNECTION_TYPE_OPTIONS: { value: ConnectionType; label: string }[] = [
  { value: 'dependency',        label: 'Dependency' },
  { value: 'contribution-flow', label: 'Contribution Flow' },
  { value: 'parallel-data',     label: 'Parallel Data' },
  { value: 'conceptual-link',   label: 'Conceptual Link' },
]

export function ConnectionLayer({ transform, stageWidth, stageHeight, rubberbandPos }: ConnectionLayerProps) {
  const connections = useStore((s) => s.connections)
  const blocks = useStore((s) => s.blocks)
  const selectedIds = useStore((s) => s.selection.selectedIds)
  const tracingSourceId = useStore((s) => s.selection.tracingSourceId)
  const activeTraces = useStore((s) => s.selection.activeTraces)
  const select = useStore((s) => s.select)
  const updateConnection = useStore((s) => s.updateConnection)
  const connectingFrom = useStore((s) => s.ui.connectingFrom)

  const [editingConnId, setEditingConnId] = useState<string | null>(null)
  const [editPos, setEditPos] = useState<Point>({ x: 0, y: 0 })
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<ConnectionType>('dependency')
  const [editSourceId, setEditSourceId] = useState('')
  const [editTargetId, setEditTargetId] = useState('')
  const labelInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingConnId && labelInputRef.current) {
      labelInputRef.current.focus()
      labelInputRef.current.select()
    }
  }, [editingConnId])

  const handleDoubleClickConn = useCallback((id: string, screenMid: Point) => {
    const conn = useStore.getState().connections[id]
    if (!conn) return
    setEditingConnId(id)
    setEditPos(screenMid)
    setEditLabel(conn.label ?? '')
    setEditType(conn.type)
    setEditSourceId(conn.sourceId)
    setEditTargetId(conn.targetId)
  }, [])

  const commitEdit = useCallback(() => {
    if (!editingConnId) return
    updateConnection(editingConnId, {
      label: editLabel,
      type: editType,
      sourceId: editSourceId,
      targetId: editTargetId,
    })
    setEditingConnId(null)
  }, [editingConnId, editLabel, editType, editSourceId, editTargetId, updateConnection])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditingConnId(null) }
  }, [commitEdit])

  // Keep editType in sync so the Default button produces the right label
  const handleTypeChange = (t: ConnectionType) => {
    setEditType(t)
  }

  const traceResult = useMemo(() => {
    if (!tracingSourceId || activeTraces.length === 0) return null
    return runTrace(tracingSourceId, activeTraces as (1 | 2 | 3 | 4)[], blocks, connections)
  }, [tracingSourceId, activeTraces, blocks, connections])

  const connList = Object.values(connections)
  const hasActiveTracing = tracingSourceId && activeTraces.length > 0

  const sourceBlock = connectingFrom ? blocks[connectingFrom] : null
  const sourceScreenPos = sourceBlock
    ? {
        x: (sourceBlock.position.x + sourceBlock.size.width / 2) * transform.scale + transform.x,
        y: (sourceBlock.position.y + sourceBlock.size.height / 2) * transform.scale + transform.y,
      }
    : null

  const blockList = Object.values(blocks).sort((a, b) => a.title.localeCompare(b.title))
  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500'

  return (
    <>
      {/* SVG always pointer-events:none; hit paths override with pointer-events:stroke */}
      <svg
        style={{
          position: 'absolute', top: 0, left: 0,
          width: stageWidth, height: stageHeight,
          pointerEvents: 'none', overflow: 'visible',
        }}
      >
        <defs>
          <marker id="arrow-open" viewBox="0 0 10 10" refX={9} refY={5}
            markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="#64748b" strokeWidth={1.5} />
          </marker>
          <marker id="arrow-filled" viewBox="0 0 10 10" refX={9} refY={5}
            markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {connList.map((conn) => {
            const isSelected = selectedIds.includes(conn.id)
            const isHighlighted = traceResult?.highlightedConnectionIds.has(conn.id) ?? false
            const dimmed = hasActiveTracing ? !isHighlighted && !isSelected : false
            const annotation = traceResult?.annotations.get(conn.id)
            return (
              <ConnectionPath
                key={conn.id}
                connection={conn}
                blocks={blocks}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                dimmed={dimmed}
                annotation={annotation}
                transform={transform}
                onSelect={(id) => select(id)}
                onDoubleClick={handleDoubleClickConn}
              />
            )
          })}
        </g>

        {/* Rubber-band line while connecting */}
        {connectingFrom && sourceScreenPos && rubberbandPos && (
          <line
            x1={sourceScreenPos.x} y1={sourceScreenPos.y}
            x2={rubberbandPos.x} y2={rubberbandPos.y}
            stroke="#6366f1" strokeWidth={2} strokeDasharray="6 4"
            pointerEvents="none"
          />
        )}
      </svg>

      {/* Floating connection editor — opens on double-click */}
      {editingConnId && (
        <div
          style={{
            position: 'absolute',
            left: editPos.x,
            top: editPos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            background: '#1e293b',
            border: '1.5px solid #6366f1',
            borderRadius: '8px',
            padding: '10px 12px',
            minWidth: '240px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '7px',
          }}
          onKeyDown={handleEditKeyDown}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>Edit Connection</div>

          {/* Label with Default button */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
              <button
                onClick={() => setEditLabel(defaultLabel(editType))}
                style={{ fontSize: '9px', color: '#6366f1', cursor: 'pointer', background: 'none', border: 'none', padding: '0 2px' }}
                title="Reset to default label"
              >
                Default
              </button>
            </div>
            <input
              ref={labelInputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Connection description…"
              className={inputCls}
            />
          </div>

          <div>
            <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
            <select
              value={editType}
              onChange={(e) => handleTypeChange(e.target.value as ConnectionType)}
              className={inputCls}
            >
              {CONNECTION_TYPE_OPTIONS.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From → To</span>
              <button
                onClick={() => { const s = editSourceId; setEditSourceId(editTargetId); setEditTargetId(s) }}
                style={{ fontSize: '9px', color: '#6366f1', cursor: 'pointer', background: 'none', border: 'none', padding: '0 2px' }}
                title="Reverse direction"
              >
                ⇄ Reverse
              </button>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <select value={editSourceId} onChange={(e) => setEditSourceId(e.target.value)}
                className={inputCls} style={{ flex: 1, minWidth: 0 }}>
                {blockList.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <span style={{ color: '#64748b', fontSize: '12px', flexShrink: 0 }}>→</span>
              <select value={editTargetId} onChange={(e) => setEditTargetId(e.target.value)}
                className={inputCls} style={{ flex: 1, minWidth: 0 }}>
                {blockList.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditingConnId(null)}
              style={{ fontSize: '11px', color: '#64748b', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 6px' }}>
              Cancel
            </button>
            <button onClick={commitEdit}
              style={{ fontSize: '11px', color: 'white', cursor: 'pointer', background: '#6366f1', border: 'none', borderRadius: '4px', padding: '3px 10px' }}>
              Save
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', color: '#475569' }}>Enter to save · Esc to cancel</div>
        </div>
      )}
    </>
  )
}
