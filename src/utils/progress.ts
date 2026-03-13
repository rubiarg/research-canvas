import type { ProgressModel } from '@/types/progress.ts'

/**
 * Returns 0-100 representing overall completion.
 * Completed phases count fully, current phase = fraction of milestones done,
 * future phases = 0.
 */
export function computeProgress(model: ProgressModel): number {
  const { phases, currentPhaseIndex } = model
  if (phases.length === 0) return 0

  let totalWeight = phases.length
  let completedWeight = 0

  phases.forEach((phase, idx) => {
    if (idx < currentPhaseIndex) {
      // Fully completed phase
      completedWeight += 1
    } else if (idx === currentPhaseIndex) {
      // Current phase: fraction of milestones done
      if (phase.milestones.length > 0) {
        const done = phase.milestones.filter((m) => m.completed).length
        completedWeight += done / phase.milestones.length
      }
    }
    // Future phases contribute 0
  })

  return Math.round((completedWeight / totalWeight) * 100)
}

/**
 * Returns the name of the current phase.
 */
export function currentPhaseName(model: ProgressModel): string {
  const { phases, currentPhaseIndex } = model
  if (phases.length === 0) return 'No phases'
  const idx = Math.min(currentPhaseIndex, phases.length - 1)
  return phases[idx]?.name ?? 'Unknown'
}
