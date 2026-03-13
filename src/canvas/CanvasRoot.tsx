import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Circle, Transformer } from 'react-konva'
import { useStore } from '@/store/index.ts'
import { BlockRenderer } from './BlockRenderer.tsx'
import { ConnectionLayer } from './ConnectionLayer.tsx'
import { STATUS_COLOURS, STATUS_ICONS, lightenColour } from '@/utils/colours.ts'
import type Konva from 'konva'

const MIN_SCALE = 0.1
const MAX_SCALE = 4
const GRID_SIZE = 40

function DotGrid({
  width,
  height,
  transform,
}: {
  width: number
  height: number
  transform: { x: number; y: number; scale: number }
}) {
  const dots: React.ReactElement[] = []
  const gridSize = GRID_SIZE * transform.scale
  const offsetX = transform.x % gridSize
  const offsetY = transform.y % gridSize
  const cols = Math.ceil(width / gridSize) + 2
  const rows = Math.ceil(height / gridSize) + 2

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <Circle
          key={`d-${r}-${c}`}
          x={offsetX + c * gridSize}
          y={offsetY + r * gridSize}
          radius={1.5}
          fill="#334155"
        />
      )
    }
  }
  return <>{dots}</>
}

export function CanvasRoot() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [isPanning, setIsPanning] = useState(false)
  const [isSpaceDown, setIsSpaceDown] = useState(false)
  const [rubberbandPos, setRubberbandPos] = useState<{ x: number; y: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)

  const transform = useStore((s) => s.canvas.transform)
  const setTransform = useStore((s) => s.setTransform)
  const blocks = useStore((s) => s.blocks)
  const clearSelection = useStore((s) => s.clearSelection)
  const selectedIds = useStore((s) => s.selection.selectedIds)
  const updateBlock = useStore((s) => s.updateBlock)
  const connectingFrom = useStore((s) => s.ui.connectingFrom)
  const setConnecting = useStore((s) => s.setConnecting)

  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map())
  const transformerRef = useRef<Konva.Transformer>(null)

  const handleNodeRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodeRefs.current.set(id, node)
    else nodeRefs.current.delete(id)
  }, [])

  // Attach Transformer to currently selected blocks
  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    const nodes = selectedIds
      .map((id) => nodeRefs.current.get(id))
      .filter((n): n is Konva.Group => !!n)
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds])

  const handleTransformEnd = useCallback(() => {
    const tr = transformerRef.current
    if (!tr) return
    tr.nodes().forEach((node) => {
      const id = node.id()
      if (!id) return
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      // node.width() returns 0 for a Group — read stored size instead
      const block = useStore.getState().blocks[id]
      if (!block) return
      const newW = Math.max(120, Math.round(block.size.width * scaleX))
      const newH = Math.max(60, Math.round(block.size.height * scaleY))
      node.scaleX(1)
      node.scaleY(1)
      updateBlock(id, {
        position: { x: node.x(), y: node.y() },
        size: { width: newW, height: newH },
      })
    })
  }, [updateBlock])

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight })
    })
    ro.observe(el)
    setSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Keyboard: space for pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        setIsSpaceDown(true)
      }
      if (e.code === 'Escape') {
        setConnecting(null)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false)
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [setConnecting])

  // Wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      const oldScale = transform.scale
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const zoomFactor = e.evt.deltaY < 0 ? 1.1 : 0.9
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale * zoomFactor))

      const mousePointTo = {
        x: (pointer.x - transform.x) / oldScale,
        y: (pointer.y - transform.y) / oldScale,
      }

      const newX = pointer.x - mousePointTo.x * newScale
      const newY = pointer.y - mousePointTo.y * newScale

      setTransform({ x: newX, y: newY, scale: newScale })
    },
    [transform, setTransform]
  )

  // Mouse down: pan on middle button, space+left, or left-click on empty canvas
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const isMiddle = e.evt.button === 1
      const isLeftSpace = e.evt.button === 0 && isSpaceDown
      const isLeftOnBackground =
        e.evt.button === 0 &&
        !connectingFrom &&
        (e.target === e.currentTarget || (e.target as Konva.Node).name() === 'background')

      if (isMiddle || isLeftSpace || isLeftOnBackground) {
        setIsPanning(true)
        lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY }
        e.evt.preventDefault()
      }
    },
    [isSpaceDown, connectingFrom]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Track position for rubber-band line when connecting
      if (connectingFrom) {
        const pos = stageRef.current?.getPointerPosition()
        if (pos) setRubberbandPos(pos)
      }
      if (!isPanning || !lastPointer.current) return
      const dx = e.evt.clientX - lastPointer.current.x
      const dy = e.evt.clientY - lastPointer.current.y
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY }
      setTransform({
        ...transform,
        x: transform.x + dx,
        y: transform.y + dy,
      })
    },
    [isPanning, transform, setTransform, connectingFrom]
  )

  // Clear rubber-band when not connecting
  useEffect(() => {
    if (!connectingFrom) setRubberbandPos(null)
  }, [connectingFrom])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    lastPointer.current = null
  }, [])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Click on empty canvas area
      if (e.target === e.currentTarget || e.target.name() === 'background') {
        if (connectingFrom) {
          setConnecting(null)
        } else {
          clearSelection()
        }
      }
    },
    [clearSelection, connectingFrom, setConnecting]
  )

  const blockIds = Object.keys(blocks)

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-gray-950"
      style={{ cursor: isPanning ? 'grabbing' : connectingFrom ? 'crosshair' : isSpaceDown ? 'grab' : 'grab' }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        style={{ display: 'block' }}
      >
        {/* Background dot grid layer (no transform) */}
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill="#030712"
            name="background"
          />
          <DotGrid width={size.width} height={size.height} transform={transform} />
        </Layer>

        {/* Main content layer with transform */}
        <Layer
          x={transform.x}
          y={transform.y}
          scaleX={transform.scale}
          scaleY={transform.scale}
        >
          {blockIds.map((id) => (
            <BlockRenderer key={id} blockId={id} onNodeRef={handleNodeRef} />
          ))}
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={false}
            borderStroke="#6366f1"
            borderStrokeWidth={1.5}
            anchorStroke="#6366f1"
            anchorFill="#fff"
            anchorSize={8}
            anchorCornerRadius={2}
            onTransformEnd={handleTransformEnd}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 120 || newBox.height < 60) return oldBox
              return newBox
            }}
          />
        </Layer>

        {/* Minimap layer */}
        <Layer listening={false}>
          <MinimapOverlay
            blocks={blocks}
            transform={transform}
            stageWidth={size.width}
            stageHeight={size.height}
          />
        </Layer>
      </Stage>

      {/* SVG Connection overlay */}
      <ConnectionLayer
        transform={transform}
        stageWidth={size.width}
        stageHeight={size.height}
        rubberbandPos={rubberbandPos}
      />

      {/* Colour legend overlay */}
      <ColourLegend />
    </div>
  )
}

function MinimapOverlay({
  blocks,
  transform,
  stageWidth,
  stageHeight,
}: {
  blocks: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }>
  transform: { x: number; y: number; scale: number }
  stageWidth: number
  stageHeight: number
}) {
  const mmWidth = 160
  const mmHeight = 100
  const mmX = stageWidth - mmWidth - 16
  const mmY = stageHeight - mmHeight - 16
  const padding = 10

  const allBlocks = Object.values(blocks)
  if (allBlocks.length === 0) return null

  const minX = Math.min(...allBlocks.map((b) => b.position.x))
  const minY = Math.min(...allBlocks.map((b) => b.position.y))
  const maxX = Math.max(...allBlocks.map((b) => b.position.x + b.size.width))
  const maxY = Math.max(...allBlocks.map((b) => b.position.y + b.size.height))

  const contentW = maxX - minX || 1
  const contentH = maxY - minY || 1
  const scaleX = (mmWidth - padding * 2) / contentW
  const scaleY = (mmHeight - padding * 2) / contentH
  const mmScale = Math.min(scaleX, scaleY, 0.1)

  // Viewport indicator
  const vpX = (-transform.x / transform.scale - minX) * mmScale + padding
  const vpY = (-transform.y / transform.scale - minY) * mmScale + padding
  const vpW = (stageWidth / transform.scale) * mmScale
  const vpH = (stageHeight / transform.scale) * mmScale

  return (
    <>
      {/* Minimap background */}
      <Rect
        x={mmX}
        y={mmY}
        width={mmWidth}
        height={mmHeight}
        fill="#0f172a"
        stroke="#334155"
        strokeWidth={1}
        cornerRadius={6}
        opacity={0.9}
      />
      {/* Block dots */}
      {allBlocks.map((b, i) => (
        <Rect
          key={i}
          x={mmX + (b.position.x - minX) * mmScale + padding}
          y={mmY + (b.position.y - minY) * mmScale + padding}
          width={Math.max(2, b.size.width * mmScale)}
          height={Math.max(2, b.size.height * mmScale)}
          fill="#475569"
          cornerRadius={1}
        />
      ))}
      {/* Viewport rectangle */}
      <Rect
        x={mmX + vpX}
        y={mmY + vpY}
        width={Math.max(4, vpW)}
        height={Math.max(4, vpH)}
        stroke="#6366f1"
        strokeWidth={1.5}
        fill="transparent"
        cornerRadius={2}
      />
    </>
  )
}

const STATUS_LABELS: Record<string, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  submitted: 'Submitted',
  revision: 'Revision',
  planned: 'Planned',
}

const FLAVOUR_SYMBOLS = ['●', '◆', '▲', '■', '◉', '✦']

function ColourLegend() {
  const [visible, setVisible] = useState(true)
  const colourMode = useStore((s) => s.canvas.colourMode)
  const threads = useStore((s) => s.threads)
  const taxonomy = useStore((s) => s.taxonomy)

  const title =
    colourMode === 'status' ? 'Status' :
    colourMode === 'threads' ? 'Threads' :
    'Tags'

  let rows: { colour: string; label: string; symbol?: string }[] = []

  if (colourMode === 'status') {
    rows = Object.entries(STATUS_COLOURS).map(([status, sc]) => ({
      colour: sc.border,
      label: `${STATUS_ICONS[status as keyof typeof STATUS_ICONS]} ${STATUS_LABELS[status] ?? status}`,
    }))
  } else if (colourMode === 'threads') {
    if (threads.length === 0) {
      rows = [{ colour: '#334155', label: 'No threads defined' }]
    } else {
      rows = threads.map((t) => ({ colour: t.colour, label: t.name }))
    }
  } else if (colourMode === 'tags') {
    if (taxonomy.domains.length === 0) {
      rows = [{ colour: '#334155', label: 'No domains defined' }]
    } else {
      // Domain rows, then indented flavour rows with symbols
      for (const d of taxonomy.domains) {
        rows.push({ colour: d.colour, label: d.name })
        const flavours = taxonomy.flavours.filter((f) => f.domainId === d.id)
        flavours.forEach((f, fi) => {
          rows.push({
            colour: d.colour,
            label: `  ${f.name}`,
            symbol: FLAVOUR_SYMBOLS[fi % FLAVOUR_SYMBOLS.length],
          })
        })
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0,
        pointerEvents: 'auto',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: visible ? '6px 6px 0 0' : '6px',
          color: '#94a3b8',
          fontSize: '10px',
          fontFamily: 'inherit',
          padding: '3px 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '8px' }}>{visible ? '▼' : '▶'}</span>
        Legend · {title}
      </button>

      {/* Legend panel */}
      {visible && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid #334155',
            borderTop: 'none',
            borderRadius: '0 6px 6px 6px',
            padding: '8px 10px',
            minWidth: '140px',
            maxWidth: '200px',
            backdropFilter: 'blur(4px)',
          }}
        >
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                marginBottom: i < rows.length - 1 ? '5px' : 0,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: row.symbol ? row.colour : lightenColour(row.colour, 0.6),
                  border: row.symbol ? 'none' : `2px solid ${row.colour}`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: row.symbol ? 0.85 : 1,
                }}
              >
                {row.symbol && (
                  <span style={{ fontSize: '7px', color: 'white', lineHeight: 1 }}>{row.symbol}</span>
                )}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '155px',
                  fontFamily: 'inherit',
                }}
              >
                {row.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
