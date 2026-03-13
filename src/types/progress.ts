export interface Milestone {
  id: string
  label: string
  completed: boolean
}

export interface Phase {
  id: string
  name: string
  milestones: Milestone[]
}

export interface ProgressModel {
  blockId: string
  phases: Phase[]
  currentPhaseIndex: number
}
