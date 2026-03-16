import type { Block } from '@/types/block.ts'
import type { SerializedState } from '@/store/index.ts'

const HEADING: Record<number, string> = { 0: '#', 1: '##', 2: '###' }

/**
 * Renders a string field that may contain multiple newline-separated items.
 * Single item → `key: value`
 * Multiple items → `key:\n- item\n- item`
 */
function renderField(key: string, value: string | undefined): string {
  if (!value?.trim()) return ''
  const items = value.split('\n').map((s) => s.trim()).filter(Boolean)
  if (items.length === 1) return `${key}: ${items[0]}`
  return `${key}:\n${items.map((s) => `- ${s}`).join('\n')}`
}

function blockToMarkdown(block: Block): string {
  const headingLevel = typeof block.level === 'number'
    ? Math.max(0, Math.min(2, block.level))
    : 1
  const hashes = HEADING[headingLevel] ?? '##'

  const lines: string[] = []
  lines.push(`${hashes} [${block.type}] ${block.title}`)
  if (block.description?.trim()) lines.push(`description: ${block.description.trim()}`)
  lines.push(`status: ${block.status}`)

  const rqLine = renderField('rq', block.rq)
  if (rqLine) lines.push(rqLine)

  const contribLine = renderField('contributions', block.contributions)
  if (contribLine) lines.push(contribLine)

  if (block.venue) lines.push(`venue: ${block.venue}`)
  if (block.year) lines.push(`year: ${block.year}`)
  if (block.doi) lines.push(`doi: ${block.doi}`)
  if (block.authorRole) lines.push(`authorRole: ${block.authorRole}`)
  if (block.artefactType) lines.push(`artefactType: ${block.artefactType}`)

  return lines.join('\n')
}

export function exportMarkdown(state: SerializedState): string {
  const blockList = Object.values(state.blocks)

  // Sort: by heading level (ascending), then by vertical position
  const sorted = [...blockList].sort((a, b) => {
    const la = typeof a.level === 'number' ? a.level : 99
    const lb = typeof b.level === 'number' ? b.level : 99
    if (la !== lb) return la - lb
    return (a.position?.y ?? 0) - (b.position?.y ?? 0)
  })

  return sorted.map(blockToMarkdown).join('\n\n') + '\n'
}

export function downloadMarkdown(state: SerializedState, filename = 'research-canvas.md'): void {
  const md = exportMarkdown(state)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
