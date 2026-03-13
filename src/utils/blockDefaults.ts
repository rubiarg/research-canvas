import type { BlockType } from '@/types/block.ts'
import type { Phase } from '@/types/progress.ts'
import { genId } from './idgen.ts'

function makePhase(name: string, milestoneLabels: string[]): Phase {
  return {
    id: genId(),
    name,
    milestones: milestoneLabels.map((label) => ({
      id: genId(),
      label,
      completed: false,
    })),
  }
}

export function defaultPhases(type: BlockType): Phase[] {
  switch (type) {
    case 'project':
      return [
        makePhase('Conception', ['Define RQ', 'Literature review', 'Feasibility check']),
        makePhase('Ethics & Planning', ['Ethics submission', 'Protocol approved', 'Timeline set']),
        makePhase('Data Collection', ['Pilot complete', 'Participants recruited', 'Data collected']),
        makePhase('Analysis', ['Coding complete', 'Themes identified', 'Analysis reviewed']),
        makePhase('Writing', ['Draft complete', 'Co-author review', 'Revisions done']),
        makePhase('Submission', ['Submitted to venue', 'Confirmation received']),
        makePhase('Revision', ['Reviews received', 'Revisions submitted']),
        makePhase('Published', ['Published online', 'DOI assigned']),
      ]
    case 'subproject':
      return [
        makePhase('Scoping', ['Objectives defined', 'Scope agreed']),
        makePhase('Implementation', ['Prototype built', 'Iteration complete']),
        makePhase('Evaluation', ['Evaluation run', 'Data analysed']),
        makePhase('Write-up', ['Draft complete', 'Final version ready']),
      ]
    case 'publication':
      return [
        makePhase('Drafting', ['Outline complete', 'First draft done', 'Figures ready']),
        makePhase('Internal Review', ['Co-author feedback', 'Revisions applied']),
        makePhase('Submitted', ['Submitted to venue']),
        makePhase('Under Review', ['Reviews received']),
        makePhase('Revision', ['Revision submitted']),
        makePhase('Accepted', ['Acceptance received']),
        makePhase('Published', ['DOI assigned', 'Published online']),
      ]
    case 'artefact':
      return [
        makePhase('Design', ['Requirements defined', 'Architecture sketched']),
        makePhase('Prototyping', ['First prototype', 'Iterated prototype']),
        makePhase('Testing', ['Testing complete', 'Bugs fixed']),
        makePhase('Documented', ['Documentation written', 'Examples added']),
        makePhase('Released', ['Published/released', 'Announced']),
      ]
    case 'program':
      return [
        makePhase('Framing', ['Program scope defined', 'RQ formulated']),
        makePhase('Active', ['Sub-projects launched']),
        makePhase('Integration', ['Synthesis in progress']),
        makePhase('Completion', ['Program complete', 'Outcomes documented']),
      ]
    default:
      return [
        makePhase('Planning', ['Define scope']),
        makePhase('Execution', ['Work in progress']),
        makePhase('Completion', ['Done']),
      ]
  }
}

export function defaultSize(type: BlockType): { width: number; height: number } {
  switch (type) {
    case 'program':
      return { width: 300, height: 200 }
    case 'project':
      return { width: 260, height: 180 }
    case 'subproject':
      return { width: 220, height: 160 }
    case 'publication':
      return { width: 240, height: 170 }
    case 'artefact':
      return { width: 220, height: 150 }
    case 'threadhub':
      return { width: 200, height: 140 }
    case 'collaboration':
      return { width: 240, height: 160 }
    case 'annotation':
      return { width: 200, height: 120 }
    default:
      return { width: 240, height: 160 }
  }
}
