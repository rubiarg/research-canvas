import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Group, Rect, Text, Circle } from 'react-konva'
import { useStore } from '@/store/index.ts'
import { STATUS_COLOURS, STATUS_ICONS, BLOCK_TYPE_COLOURS, BLOCK_TYPE_LABELS, mixColours, lightenColour } from '@/utils/colours.ts'
import { computeProgress, currentPhaseName } from '@/utils/progress.ts'
import { runTrace } from '@/tracing/engine.ts'
import type { Block } from '@/types/block.ts'
import type Konva from 'konva'

interface BlockRendererProps {
  blockId: string
  onNodeRef?: (id: string, node: Konva.Group | null) => void
}

function useBlockColour(block: Block): { bg: string; border: string } {
  const colourMode = useStore((s) => s.canvas.colourMode)
  const threads = useStore((s) => s.threads)
  const taxonomy = useStore((s) => s.taxonomy)

  return useMemo(() => {
    if (colourMode === 'status') {
      const sc = STATUS_COLOURS[block.status]
      return { bg: sc.bg, border: sc.border }
    }

    if (colourMode === 'threads') {
      if (block.threadIds.length === 0) {
        return { bg: '#1e293b', border: '#334155' }
      }
      const colours = block.threadIds
        .map((tid) => threads.find((t) => t.id === tid)?.colour)
        .filter((c): c is string => !!c)
      const mixed = mixColours(colours)
      const bg = lightenColour(mixed, 0.6)
      return { bg, border: mixed }
    }

    if (colourMode === 'tags') {
      if (block.tagIds.length === 0) {
        return { bg: '#1e293b', border: '#334155' }
      }
      const domain = taxonomy.domains.find((d) => block.tagIds.includes(d.id))
      if (domain) {
        const bg = lightenColour(domain.colour, 0.65)
        return { bg, border: domain.colour }
      }
      return { bg: '#1e293b', border: '#334155' }
    }

    return { bg: '#1e293b', border: '#334155' }
  }, [block, colourMode, threads, taxonomy])
}

export function BlockRenderer({ blockId, onNodeRef }: BlockRendererProps) {
  const block = useStore((s) => s.blocks[blockId])
  const progressModel = useStore((s) => s.progressModels[blockId])
  const threads = useStore((s) => s.threads)
  const taxonomy = useStore((s) => s.taxonomy)
  const selectedIds = useStore((s) => s.selection.selectedIds)
  const tracingSourceId = useStore((s) => s.selection.tracingSourceId)
  const activeTraces = useStore((s) => s.selection.activeTraces)
  const blocks = useStore((s) => s.blocks)
  const connections = useStore((s) => s.connections)
  const globalVisibilityFloor = useStore((s) => s.canvas.globalVisibilityFloor)
  const moveBlock = useStore((s) => s.moveBlock)
  const commitMove = useStore((s) => s.commitMove)
  const select = useStore((s) => s.select)
  const setConnecting = useStore((s) => s.setConnecting)
  const addConnection = useStore((s) => s.addConnection)
  const connectingFrom = useStore((s) => s.ui.connectingFrom)

  const groupRef = useRef<Konva.Group>(null)
  const isDragging = useRef(false)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  // Records the starting canvas positions of all selected blocks for multi-drag
  const multiDragStarts = useRef<Map<string, { x: number; y: number }>>(new Map())

  // Report node ref to parent (for Transformer attachment)
  useEffect(() => {
    onNodeRef?.(blockId, groupRef.current)
    return () => { onNodeRef?.(blockId, null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId])

  const { bg, border } = useBlockColour(block!)

  const isSelected = selectedIds.includes(blockId)

  // Compute trace highlighting
  const isTraceHighlighted = useMemo(() => {
    if (!tracingSourceId || activeTraces.length === 0) return false
    const result = runTrace(
      tracingSourceId,
      activeTraces as (1 | 2 | 3 | 4)[],
      blocks,
      connections
    )
    return result.highlightedBlockIds.has(blockId)
  }, [tracingSourceId, activeTraces, blocks, connections, blockId])

  const effectiveVisibility = Math.max(
    block?.visibilityLevel ?? 2,
    globalVisibilityFloor
  ) as 0 | 1 | 2 | 3

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      dragStartPos.current = { x: e.target.x(), y: e.target.y() }
      // Snapshot starting positions of all selected blocks for multi-drag
      const { selection: { selectedIds }, blocks: allBlocks } = useStore.getState()
      multiDragStarts.current.clear()
      for (const id of selectedIds) {
        if (allBlocks[id]) {
          multiDragStarts.current.set(id, { ...allBlocks[id]!.position })
        }
      }
    },
    []
  )

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      isDragging.current = true
      const newX = e.target.x()
      const newY = e.target.y()
      moveBlock(blockId, newX, newY)

      // Move all other selected blocks by the same delta
      const start = dragStartPos.current
      if (start && multiDragStarts.current.size > 1) {
        const dx = newX - start.x
        const dy = newY - start.y
        for (const [id, startPos] of multiDragStarts.current) {
          if (id !== blockId) {
            moveBlock(id, startPos.x + dx, startPos.y + dy)
          }
        }
      }
    },
    [blockId, moveBlock]
  )

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const x = e.target.x()
      const y = e.target.y()
      const start = dragStartPos.current
      if (!start || Math.abs(x - start.x) > 1 || Math.abs(y - start.y) > 1) {
        commitMove(blockId, x, y)
      }
      dragStartPos.current = null
      multiDragStarts.current.clear()
    },
    [blockId, commitMove]
  )

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDragging.current) {
        isDragging.current = false
        return
      }
      e.cancelBubble = true

      if (connectingFrom && connectingFrom !== blockId) {
        // Complete the connection
        addConnection({
          type: 'dependency',
          sourceId: connectingFrom,
          targetId: blockId,
          label: '',
        })
        setConnecting(null)
        return
      }

      select(blockId, e.evt.shiftKey)
    },
    [blockId, select, connectingFrom, addConnection, setConnecting]
  )

  if (!block) return null

  const { position, size } = block
  const w = size.width
  const h = size.height
  const typeColour = BLOCK_TYPE_COLOURS[block.type] ?? '#6366f1'
  const typeLabel = BLOCK_TYPE_LABELS[block.type] ?? block.type

  // Progress
  const progress = progressModel ? computeProgress(progressModel) : 0
  const phaseName = progressModel ? currentPhaseName(progressModel) : ''
  const phases = progressModel?.phases ?? []
  const currentPhaseIdx = progressModel?.currentPhaseIndex ?? 0

  // Thread colours for pips
  const threadColours = block.threadIds
    .map((tid) => threads.find((t) => t.id === tid)?.colour ?? '#94a3b8')
    .slice(0, 5)

  // Domain pips: for each domain the block is tagged with, find flavour symbol
  const FLAVOUR_SYMBOLS = ['●', '◆', '▲', '■', '◉', '✦']
  const domainPips = taxonomy.domains
    .filter((d) => block.tagIds.includes(d.id))
    .slice(0, 5)
    .map((d) => {
      const domainFlavours = taxonomy.flavours.filter((f) => f.domainId === d.id)
      const taggedFlavour = domainFlavours.find((f) => block.tagIds.includes(f.id))
      const flavourIdx = taggedFlavour ? domainFlavours.indexOf(taggedFlavour) : -1
      return {
        colour: d.colour,
        symbol: flavourIdx >= 0 ? (FLAVOUR_SYMBOLS[flavourIdx % FLAVOUR_SYMBOLS.length] ?? '') : '',
      }
    })

  const progressBarH = 5
  const contentH = h - progressBarH
  const padding = 10
  const isL0 = effectiveVisibility === 0
  const isL1Plus = effectiveVisibility >= 1
  const isL2Plus = effectiveVisibility >= 2
  const isL3Plus = effectiveVisibility >= 3

  // Dynamic layout: compute how much space is available for the middle content area
  // Fixed top: accent bar (4) + type label (18) + title (isL2:36, isL1:20) + status (12) + gap = ~70 or ~54
  const topFixed = isL2Plus ? 82 : 62
  // Fixed bottom: phase name (20) + tag pips (16) + gap = ~36
  const bottomFixed = 36
  // Clamp description height to available space so it never overflows
  const availableMiddle = Math.max(0, contentH - topFixed - bottomFixed)
  const descHeight = isL3Plus ? Math.min(30, availableMiddle) : Math.min(availableMiddle, 54)

  if (isL0) {
    // Minimal: tiny pill
    return (
      <Group
        ref={groupRef}
        id={blockId}
        x={position.x}
        y={position.y}
        draggable
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
      >
        <Rect
          width={120}
          height={32}
          fill={bg}
          stroke={isSelected ? '#6366f1' : border}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={6}
        />
        <Text
          x={6}
          y={8}
          text={block.title}
          fontSize={11}
          fill="#1e293b"
          width={108}
          ellipsis
          wrap="none"
        />
      </Group>
    )
  }

  // Determine opacity based on trace state
  const traceOpacity =
    tracingSourceId && activeTraces.length > 0
      ? isTraceHighlighted
        ? 1
        : 0.3
      : 1

  return (
    <Group
      ref={groupRef}
      id={blockId}
      x={position.x}
      y={position.y}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      opacity={traceOpacity}
      clipX={0}
      clipY={0}
      clipWidth={w}
      clipHeight={h}
    >
      {/* Main block body */}
      <Rect
        width={w}
        height={h}
        fill={bg}
        stroke={isSelected ? '#6366f1' : isTraceHighlighted ? '#f59e0b' : border}
        strokeWidth={isSelected ? 2.5 : isTraceHighlighted ? 2 : 1.5}
        cornerRadius={8}
        shadowBlur={isSelected ? 12 : 4}
        shadowColor={isSelected ? '#6366f1' : 'rgba(0,0,0,0.3)'}
        shadowOpacity={isSelected ? 0.5 : 0.2}
      />

      {/* Type accent bar at top */}
      <Rect
        x={0}
        y={0}
        width={w}
        height={4}
        fill={typeColour}
        cornerRadius={[8, 8, 0, 0]}
      />

      {/* Type label */}
      <Text
        x={padding}
        y={10}
        text={typeLabel.toUpperCase()}
        fontSize={8}
        letterSpacing={1}
        fill={typeColour}
        fontStyle="bold"
      />

      {/* Thread colour pips (top right area) */}
      {isL1Plus && threadColours.map((colour, i) => (
        <Circle
          key={`tp-${i}`}
          x={w - padding - i * 10}
          y={14}
          radius={4}
          fill={colour}
        />
      ))}

      {/* Title */}
      <Text
        x={padding}
        y={24}
        text={block.title}
        fontSize={13}
        fontStyle="bold"
        fill="#0f172a"
        width={w - padding * 2}
        ellipsis
        wrap={isL2Plus ? 'word' : 'none'}
        height={isL2Plus ? 36 : 20}
      />

      {/* Status icon + label */}
      {isL1Plus && (
        <>
          <Text
            x={padding}
            y={isL2Plus ? 66 : 50}
            text={`${STATUS_ICONS[block.status]} ${block.status}`}
            fontSize={10}
            fill={STATUS_COLOURS[block.status].icon}
          />
        </>
      )}

      {/* L2+: description */}
      {isL2Plus && descHeight > 0 && (
        <Text
          x={padding}
          y={82}
          text={block.description}
          fontSize={10}
          fill="#334155"
          width={w - padding * 2}
          height={descHeight}
          ellipsis
          wrap="word"
        />
      )}

      {/* L2+: phase name */}
      {isL2Plus && phaseName && (
        <Text
          x={padding}
          y={contentH - 28}
          text={`Phase: ${phaseName} · ${progress}%`}
          fontSize={9}
          fill="#475569"
          width={w - padding * 2}
          ellipsis
        />
      )}

      {/* L2+: tag pips with optional flavour symbol */}
      {isL2Plus && domainPips.map(({ colour, symbol }, i) => (
        <React.Fragment key={`tagpip-${i}`}>
          <Rect
            x={padding + i * 22}
            y={contentH - 18}
            width={18}
            height={12}
            fill={colour}
            cornerRadius={3}
            opacity={0.85}
          />
          {symbol && (
            <Text
              x={padding + i * 22}
              y={contentH - 18}
              width={18}
              height={12}
              text={symbol}
              fontSize={7}
              fill="white"
              align="center"
              verticalAlign="middle"
            />
          )}
        </React.Fragment>
      ))}

      {/* L3+: RQ text — placed just after description */}
      {isL3Plus && block.rq && descHeight > 0 && (
        <Text
          x={padding}
          y={Math.min(82 + descHeight + 4, contentH - bottomFixed)}
          text={`RQ: ${block.rq}`}
          fontSize={9}
          fill="#1e40af"
          fontStyle="italic"
          width={w - padding * 2}
          height={Math.max(0, contentH - bottomFixed - (82 + descHeight + 4))}
          ellipsis
          wrap="word"
        />
      )}

      {/* L3+: venue/year for publications */}
      {isL3Plus && block.venue && (
        <Text
          x={padding}
          y={Math.min(82 + descHeight + 28, contentH - bottomFixed)}
          text={`${block.venue}${block.year ? ` · ${block.year}` : ''}`}
          fontSize={9}
          fill="#6366f1"
          width={w - padding * 2}
          height={14}
          ellipsis
          wrap="none"
        />
      )}

      {/* Progress bar at bottom */}
      <ProgressBar
        x={0}
        y={contentH}
        width={w}
        height={progressBarH}
        phases={phases}
        currentPhaseIdx={currentPhaseIdx}
        progressModel={progressModel}
      />
    </Group>
  )
}

interface ProgressBarProps {
  x: number
  y: number
  width: number
  height: number
  phases: { id: string; milestones: { completed: boolean }[] }[]
  currentPhaseIdx: number
  progressModel: { currentPhaseIndex: number; phases: { milestones: { completed: boolean }[] }[] } | undefined
}

function ProgressBar({ x, y, width, height, phases, currentPhaseIdx, progressModel }: ProgressBarProps) {
  if (phases.length === 0) return null

  const segWidth = width / phases.length

  return (
    <>
      {phases.map((phase, idx) => {
        let fill = '#e2e8f0' // future
        if (idx < currentPhaseIdx) {
          fill = '#22c55e' // completed
        } else if (idx === currentPhaseIdx) {
          // current phase: partial fill
          const milestones = progressModel?.phases[idx]?.milestones ?? []
          const done = milestones.filter((m) => m.completed).length
          const ratio = milestones.length > 0 ? done / milestones.length : 0
          // We show a gradient-like effect by coloring the segment proportionally
          fill = ratio > 0.5 ? '#86efac' : ratio > 0 ? '#bbf7d0' : '#e2e8f0'
        }

        return (
          <Rect
            key={phase.id}
            x={x + idx * segWidth}
            y={y}
            width={segWidth - 1}
            height={height}
            fill={fill}
            cornerRadius={idx === 0 ? [0, 0, 0, 8] : idx === phases.length - 1 ? [0, 0, 8, 0] : 0}
          />
        )
      })}
    </>
  )
}
