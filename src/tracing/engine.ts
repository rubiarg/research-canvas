import type { Block } from '@/types/block.ts'
import type { Connection } from '@/types/connection.ts'

export type TraceMode = 1 | 2 | 3 | 4

export interface TraceResult {
  highlightedBlockIds: Set<string>
  highlightedConnectionIds: Set<string>
  annotations: Map<string, string> // connectionId -> label
}

function emptyResult(): TraceResult {
  return {
    highlightedBlockIds: new Set(),
    highlightedConnectionIds: new Set(),
    annotations: new Map(),
  }
}

/**
 * Trace 1: BFS upstream through contribution-flow connections.
 * Finds all blocks that feed into sourceId (directly or transitively).
 */
function traceUpstream(
  sourceId: string,
  connections: Record<string, Connection>,
  _blocks: Record<string, Block>
): { blockIds: Set<string>; connIds: Set<string> } {
  const blockIds = new Set<string>()
  const connIds = new Set<string>()
  const queue = [sourceId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    Object.values(connections).forEach((conn) => {
      if (
        conn.type === 'contribution-flow' &&
        conn.targetId === current &&
        !visited.has(conn.sourceId)
      ) {
        blockIds.add(conn.sourceId)
        connIds.add(conn.id)
        queue.push(conn.sourceId)
      }
    })
  }

  return { blockIds, connIds }
}

/**
 * Trace 4: BFS downstream through contribution-flow connections.
 * Finds all blocks that sourceId feeds into (directly or transitively).
 */
function traceDownstream(
  sourceId: string,
  connections: Record<string, Connection>,
  _blocks: Record<string, Block>
): { blockIds: Set<string>; connIds: Set<string> } {
  const blockIds = new Set<string>()
  const connIds = new Set<string>()
  const queue = [sourceId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    Object.values(connections).forEach((conn) => {
      if (
        conn.type === 'contribution-flow' &&
        conn.sourceId === current &&
        !visited.has(conn.targetId)
      ) {
        blockIds.add(conn.targetId)
        connIds.add(conn.id)
        queue.push(conn.targetId)
      }
    })
  }

  return { blockIds, connIds }
}

export function runTrace(
  sourceId: string,
  modes: TraceMode[],
  blocks: Record<string, Block>,
  connections: Record<string, Connection>
): TraceResult {
  const result = emptyResult()
  result.highlightedBlockIds.add(sourceId)

  for (const mode of modes) {
    if (mode === 1) {
      // Highlight all upstream contributors
      const { blockIds, connIds } = traceUpstream(sourceId, connections, blocks)
      blockIds.forEach((id) => result.highlightedBlockIds.add(id))
      connIds.forEach((id) => result.highlightedConnectionIds.add(id))
    }

    if (mode === 2) {
      // Annotate each contribution-flow connection entering source
      Object.values(connections).forEach((conn) => {
        if (conn.type === 'contribution-flow' && conn.targetId === sourceId) {
          const label = [
            conn.contributionName ? `"${conn.contributionName}"` : null,
            conn.targetField ? `→ ${conn.targetField}` : null,
          ]
            .filter(Boolean)
            .join(' ')
          result.annotations.set(conn.id, label || conn.label || 'contributes')
          result.highlightedConnectionIds.add(conn.id)
          result.highlightedBlockIds.add(conn.sourceId)
        }
      })
    }

    if (mode === 3) {
      // BFS upstream to ultimate origins (blocks with no incoming contribution-flow)
      const { blockIds, connIds } = traceUpstream(sourceId, connections, blocks)

      // Find ultimate origins: blocks in blockIds that have no incoming contribution-flow
      blockIds.forEach((blockId) => {
        const hasIncoming = Object.values(connections).some(
          (c) => c.type === 'contribution-flow' && c.targetId === blockId
        )
        if (!hasIncoming) {
          result.highlightedBlockIds.add(blockId)
        } else {
          result.highlightedBlockIds.add(blockId)
        }
      })
      connIds.forEach((id) => result.highlightedConnectionIds.add(id))
    }

    if (mode === 4) {
      // BFS downstream to terminal nodes (blocks with no outgoing contribution-flow)
      const { blockIds, connIds } = traceDownstream(sourceId, connections, blocks)
      blockIds.forEach((id) => result.highlightedBlockIds.add(id))
      connIds.forEach((id) => result.highlightedConnectionIds.add(id))
    }
  }

  return result
}
