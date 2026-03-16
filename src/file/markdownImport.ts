import type { Block, BlockType, BlockStatus } from '@/types/block.ts'
import type { Connection } from '@/types/connection.ts'
import type { ProgressModel } from '@/types/progress.ts'
import type { SerializedState } from '@/store/index.ts'
import { genId } from '@/utils/idgen.ts'
import { defaultSize, defaultPhases } from '@/utils/blockDefaults.ts'

const VALID_TYPES = new Set<BlockType>([
  'program', 'project', 'subproject', 'publication', 'artefact',
  'threadhub', 'collaboration', 'annotation',
])

const VALID_STATUSES = new Set<BlockStatus>([
  'not-started', 'in-progress', 'completed', 'submitted', 'revision', 'planned',
])

interface Section {
  level: number
  type: BlockType
  title: string
  fields: Record<string, string>
}

function parseHeading(line: string): { level: number; type: BlockType; title: string } | null {
  const match = line.match(/^(#{1,3})\s+\[([^\]]+)\]\s+(.+)$/)
  if (!match) return null
  const level = match[1]!.length
  const typeStr = match[2]!.toLowerCase() as BlockType
  if (!VALID_TYPES.has(typeStr)) return null
  return { level, type: typeStr, title: match[3]!.trim() }
}

/**
 * Parses key: value pairs from block body lines.
 * Handles two forms:
 *   key: single value
 *   key:
 *   - item one
 *   - item two   →  joined with \n
 */
function parseBody(lines: string[]): Record<string, string> {
  const fields: Record<string, string> = {}
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!

    const listKeyMatch = line.match(/^(\w+):\s*$/)
    if (listKeyMatch) {
      const key = listKeyMatch[1]!
      const items: string[] = []
      i++
      while (i < lines.length && /^[-*]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^[-*]\s+/, '').trim())
        i++
      }
      if (items.length > 0) fields[key] = items.join('\n')
      continue
    }

    const kvMatch = line.match(/^(\w+):\s+(.+)$/)
    if (kvMatch) fields[kvMatch[1]!] = kvMatch[2]!.trim()
    i++
  }
  return fields
}

export function parseMarkdown(markdown: string): SerializedState {
  const lines = markdown.split('\n')
  const sections: Section[] = []

  let i = 0
  while (i < lines.length) {
    const heading = parseHeading(lines[i]!)
    if (heading) {
      const bodyLines: string[] = []
      i++
      while (i < lines.length && !parseHeading(lines[i]!)) {
        bodyLines.push(lines[i]!)
        i++
      }
      sections.push({ ...heading, fields: parseBody(bodyLines.filter((l) => l.trim() !== '')) })
    } else {
      i++
    }
  }

  const blocks: Record<string, Block> = {}
  const connections: Record<string, Connection> = {}
  const progressModels: Record<string, ProgressModel> = {}

  // Track last block id at each heading level to wire parent→child connections
  const levelStack: Array<{ level: number; id: string }> = []

  // Position: column per heading level, independent row counter per column
  const COL_X: Record<number, number> = { 1: 60, 2: 420, 3: 780 }
  const colY: Record<number, number> = {}

  for (const section of sections) {
    const id = genId()
    const { level, type, title, fields } = section
    const size = defaultSize(type)
    const x = COL_X[level] ?? 60 + (level - 1) * 360
    const y = (colY[level] ?? 80)
    colY[level] = y + size.height + 40

    const statusStr = fields['status']
    const status: BlockStatus = statusStr && VALID_STATUSES.has(statusStr as BlockStatus)
      ? (statusStr as BlockStatus)
      : 'not-started'

    const yearRaw = fields['year']
    const year = yearRaw ? parseInt(yearRaw) || undefined : undefined

    const block: Block = {
      id,
      type,
      title,
      description: fields['description'] ?? '',
      status,
      visibilityLevel: 2,
      position: { x, y },
      size,
      tagIds: [],
      threadIds: [],
      level: level - 1,          // heading 1→level 0, 2→level 1, 3→level 2
      rq: fields['rq'],
      contributions: fields['contributions'],
      venue: fields['venue'],
      year,
      doi: fields['doi'],
      authorRole: fields['authorRole'],
      artefactType: fields['artefactType'],
    }

    blocks[id] = block
    progressModels[id] = {
      blockId: id,
      phases: defaultPhases(type),
      currentPhaseIndex: 0,
    }

    // Pop stack entries at same or deeper level, then connect to parent
    while (levelStack.length > 0 && levelStack[levelStack.length - 1]!.level >= level) {
      levelStack.pop()
    }
    const parent = levelStack.at(-1)
    if (parent) {
      const connId = genId()
      connections[connId] = {
        id: connId,
        type: 'conceptual-link',
        sourceId: parent.id,
        targetId: id,
        label: '',
      }
    }

    levelStack.push({ level, id })
  }

  return {
    blocks,
    connections,
    threads: [],
    taxonomy: { domains: [], flavours: [], facets: [] },
    progressModels,
    canvas: {
      transform: { x: 40, y: 40, scale: 1 },
      globalVisibilityFloor: 0,
      colourMode: 'status',
      viewPresets: [],
    },
  }
}
