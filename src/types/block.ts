export type BlockType =
  | 'program'
  | 'project'
  | 'subproject'
  | 'publication'
  | 'artefact'
  | 'threadhub'
  | 'collaboration'
  | 'annotation'

export type VisibilityLevel = 0 | 1 | 2 | 3

export type BlockStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'submitted'
  | 'revision'
  | 'planned'

export interface Block {
  id: string
  type: BlockType
  title: string
  description: string
  status: BlockStatus
  visibilityLevel: VisibilityLevel
  position: { x: number; y: number }
  size: { width: number; height: number }
  tagIds: string[]
  threadIds: string[]
  // layout level: number = specific level, 'all' = spans all levels, null = floating
  level?: number | 'all' | null
  // type-specific metadata
  venue?: string
  year?: number
  doi?: string
  authorRole?: string
  artefactType?: string
  rq?: string
  contributions?: string
  colour?: string
}
