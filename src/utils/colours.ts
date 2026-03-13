import type { BlockStatus } from '@/types/block.ts'
import chroma from 'chroma-js'

export const STATUS_COLOURS: Record<
  BlockStatus,
  { bg: string; border: string; icon: string }
> = {
  'not-started': { bg: '#f1f5f9', border: '#94a3b8', icon: '#64748b' },
  'in-progress': { bg: '#e0f2fe', border: '#0ea5e9', icon: '#0284c7' },
  completed: { bg: '#dcfce7', border: '#22c55e', icon: '#16a34a' },
  submitted: { bg: '#fef3c7', border: '#f59e0b', icon: '#d97706' },
  revision: { bg: '#fce7f3', border: '#ec4899', icon: '#db2777' },
  planned: { bg: '#f5f3ff', border: '#8b5cf6', icon: '#7c3aed' },
}

export const STATUS_ICONS: Record<BlockStatus, string> = {
  'not-started': '○',
  'in-progress': '◑',
  completed: '●',
  submitted: '◆',
  revision: '↺',
  planned: '◇',
}

// Block type colours for borders/accents
export const BLOCK_TYPE_COLOURS: Record<string, string> = {
  program: '#6366f1',
  project: '#0ea5e9',
  subproject: '#06b6d4',
  publication: '#f59e0b',
  artefact: '#10b981',
  threadhub: '#a855f7',
  collaboration: '#f97316',
  annotation: '#94a3b8',
}

// Block type labels
export const BLOCK_TYPE_LABELS: Record<string, string> = {
  program: 'Program',
  project: 'Project',
  subproject: 'Sub-project',
  publication: 'Publication',
  artefact: 'Artefact',
  threadhub: 'Thread Hub',
  collaboration: 'Collaboration',
  annotation: 'Annotation',
}

/**
 * Generate n distinct categorical colours.
 */
export function categoricalColours(n: number): string[] {
  if (n <= 0) return []
  if (n === 1) return ['#6366f1']
  return chroma.scale('Set2').mode('lch').colors(n)
}

/**
 * Mix multiple hex colours into one using chroma-js.
 */
export function mixColours(colours: string[]): string {
  if (colours.length === 0) return '#e2e8f0'
  if (colours.length === 1) return colours[0]!
  try {
    return chroma.average(colours, 'lch').hex()
  } catch {
    return colours[0]!
  }
}

/**
 * Lighten a colour for use as background.
 */
export function lightenColour(hex: string, amount = 0.7): string {
  try {
    return chroma(hex).mix('white', amount).hex()
  } catch {
    return '#e2e8f0'
  }
}
