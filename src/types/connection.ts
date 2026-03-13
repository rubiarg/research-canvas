export type ConnectionType =
  | 'dependency'
  | 'contribution-flow'
  | 'parallel-data'
  | 'conceptual-link'

export interface Connection {
  id: string
  type: ConnectionType
  sourceId: string
  targetId: string
  label: string
  // For contribution-flow only:
  contributionName?: string
  targetField?: string
}
