import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Block, BlockType, VisibilityLevel } from '@/types/block.ts'
import type { Connection } from '@/types/connection.ts'
import type { Thread } from '@/types/thread.ts'
import type { TagTaxonomy } from '@/types/tag.ts'
import type { ProgressModel, Phase, Milestone } from '@/types/progress.ts'
import type { CanvasTransform, ColourMode, ViewPreset } from '@/types/canvas.ts'
import { genId } from '@/utils/idgen.ts'
import { defaultPhases, defaultSize } from '@/utils/blockDefaults.ts'

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  blocks: Record<string, Block>
  connections: Record<string, Connection>
  threads: Thread[]
  progressModels: Record<string, ProgressModel>
}

// ─── AppState type ──────────────────────────────────────────────────────────

export interface AppState {
  blocks: Record<string, Block>
  connections: Record<string, Connection>
  threads: Thread[]
  taxonomy: TagTaxonomy
  progressModels: Record<string, ProgressModel>
  canvas: {
    transform: CanvasTransform
    globalVisibilityFloor: VisibilityLevel
    colourMode: ColourMode
    viewPresets: ViewPreset[]
  }
  selection: {
    selectedIds: string[]
    tracingSourceId: string | null
    activeTraces: number[]
  }
  ui: {
    sidebarOpen: boolean
    connectingFrom: string | null
  }
  history: {
    past: HistoryEntry[]
    future: HistoryEntry[]
  }

  // Block actions
  addBlock: (type: BlockType, position?: { x: number; y: number }) => string
  updateBlock: (id: string, updates: Partial<Block>) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, x: number, y: number) => void
  commitMove: (id: string, x: number, y: number) => void

  // Connection actions
  addConnection: (conn: Omit<Connection, 'id'>) => string
  updateConnection: (id: string, updates: Partial<Connection>) => void
  removeConnection: (id: string) => void

  // Thread actions
  addThread: (name: string, colour: string, description?: string) => string
  updateThread: (id: string, updates: Partial<Thread>) => void
  removeThread: (id: string) => void
  toggleBlockThread: (blockId: string, threadId: string) => void

  // Tag taxonomy actions
  addDomain: (name: string, colour: string) => string
  updateDomain: (id: string, updates: { name?: string; colour?: string }) => void
  removeDomain: (id: string) => void
  addFlavour: (domainId: string, name: string) => string
  updateFlavour: (id: string, name: string) => void
  removeFlavour: (id: string) => void
  addFacet: (flavourId: string, name: string) => string
  removeFacet: (id: string) => void

  // Progress actions
  setProgressModel: (model: ProgressModel) => void
  updatePhaseIndex: (blockId: string, phaseIndex: number) => void
  toggleMilestone: (blockId: string, phaseId: string, milestoneId: string) => void
  addPhase: (blockId: string, name: string) => void
  removePhase: (blockId: string, phaseId: string) => void
  addMilestone: (blockId: string, phaseId: string, label: string) => void
  removeMilestone: (blockId: string, phaseId: string, milestoneId: string) => void
  updateMilestone: (blockId: string, phaseId: string, milestoneId: string, updates: Partial<Milestone>) => void
  updatePhase: (blockId: string, phaseId: string, updates: Partial<Phase>) => void

  // Canvas actions
  setTransform: (transform: CanvasTransform) => void
  setColourMode: (mode: ColourMode) => void
  setGlobalVisibility: (level: VisibilityLevel) => void
  savePreset: (name: string) => void
  loadPreset: (id: string) => void

  // Selection actions
  select: (id: string, multi?: boolean) => void
  deselect: (id: string) => void
  clearSelection: () => void
  setTracingSource: (id: string | null) => void
  toggleTrace: (mode: number) => void

  // UI actions
  toggleSidebar: () => void
  setConnecting: (blockId: string | null) => void

  resetBlockSize: (id: string) => void
  autoLayout: () => void

  // Undo/redo
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // File I/O
  loadState: (state: SerializedState) => void
}

// ─── Serialized state for file I/O ──────────────────────────────────────────

export interface SerializedState {
  blocks: Record<string, Block>
  connections: Record<string, Connection>
  threads: Thread[]
  taxonomy: TagTaxonomy
  progressModels: Record<string, ProgressModel>
  canvas: {
    transform: CanvasTransform
    globalVisibilityFloor: VisibilityLevel
    colourMode: ColourMode
    viewPresets: ViewPreset[]
  }
}

// ─── Demo data ───────────────────────────────────────────────────────────────

const DEMO_THREAD_IDS = {
  sensing: 'thread_sens',
  consent: 'thread_cons',
  hci: 'thread_hci_',
}

const DEMO_DOMAIN_IDS = {
  hci: 'dom_hci001',
  designResearch: 'dom_des001',
  ethics: 'dom_eth001',
}

const DEMO_FLAVOUR_IDS = {
  tangibleUX: 'fl_tang001',
  participatoryDesign: 'fl_part001',
  dataEthics: 'fl_deth001',
}

const DEMO_BLOCK_IDS = {
  program: 'blk_prog01',
  touchTales: 'blk_ttale',
  touchTraces: 'blk_ttrcs',
  blueprint: 'blk_bluep',
  sensor: 'blk_sensr',
  collab: 'blk_colb1',
  annotation: 'blk_annot',
}

function makeDemoProgressModels(): Record<string, ProgressModel> {
  const models: Record<string, ProgressModel> = {}

  // Program
  const programPhases = defaultPhases('program')
  programPhases[0]!.milestones.forEach((m) => { m.completed = true })
  programPhases[1]!.milestones[0]!.completed = true
  models[DEMO_BLOCK_IDS.program] = {
    blockId: DEMO_BLOCK_IDS.program,
    phases: programPhases,
    currentPhaseIndex: 1,
  }

  // TouchTales (completed project)
  const ttPhases = defaultPhases('project')
  ttPhases.forEach((p, idx) => {
    if (idx <= 6) {
      p.milestones.forEach((m) => { m.completed = true })
    }
  })
  models[DEMO_BLOCK_IDS.touchTales] = {
    blockId: DEMO_BLOCK_IDS.touchTales,
    phases: ttPhases,
    currentPhaseIndex: 7,
  }

  // TouchTraces (sub-project, data collection phase)
  const tracesPhases = defaultPhases('subproject')
  tracesPhases[0]!.milestones.forEach((m) => { m.completed = true })
  tracesPhases[1]!.milestones[0]!.completed = true
  models[DEMO_BLOCK_IDS.touchTraces] = {
    blockId: DEMO_BLOCK_IDS.touchTraces,
    phases: tracesPhases,
    currentPhaseIndex: 1,
  }

  // Blueprint publication (drafting)
  const bpPhases = defaultPhases('publication')
  bpPhases[0]!.milestones[0]!.completed = true
  models[DEMO_BLOCK_IDS.blueprint] = {
    blockId: DEMO_BLOCK_IDS.blueprint,
    phases: bpPhases,
    currentPhaseIndex: 0,
  }

  // Sensor artefact
  const sensorPhases = defaultPhases('artefact')
  sensorPhases[0]!.milestones.forEach((m) => { m.completed = true })
  sensorPhases[1]!.milestones[0]!.completed = true
  models[DEMO_BLOCK_IDS.sensor] = {
    blockId: DEMO_BLOCK_IDS.sensor,
    phases: sensorPhases,
    currentPhaseIndex: 1,
  }

  return models
}

const DEMO_BLOCKS: Record<string, Block> = {
  [DEMO_BLOCK_IDS.program]: {
    id: DEMO_BLOCK_IDS.program,
    type: 'program',
    title: 'PhD Thesis: Touch & Consent',
    description: 'Exploring embodied interaction and relational consent in tangible computing systems',
    status: 'in-progress',
    visibilityLevel: 2,
    position: { x: 60, y: 80 },
    size: { width: 300, height: 200 },
    tagIds: [DEMO_DOMAIN_IDS.hci],
    threadIds: [DEMO_THREAD_IDS.hci],
    rq: 'How can tangible systems embody relational consent in everyday contexts?',
    contributions: 'Conceptual framework for consent-aware tangible computing',
  },
  [DEMO_BLOCK_IDS.touchTales]: {
    id: DEMO_BLOCK_IDS.touchTales,
    type: 'project',
    title: 'TouchTales',
    description: 'Tangible storytelling system for co-located families exploring physical narrative objects',
    status: 'completed',
    visibilityLevel: 2,
    position: { x: 500, y: 60 },
    size: { width: 260, height: 180 },
    tagIds: [DEMO_DOMAIN_IDS.hci, DEMO_DOMAIN_IDS.designResearch],
    threadIds: [DEMO_THREAD_IDS.sensing, DEMO_THREAD_IDS.hci],
    venue: 'CHI 2023',
    year: 2023,
    authorRole: 'Lead researcher',
    rq: 'How do families use tangible objects to co-construct narratives?',
    contributions: 'Design patterns for tangible narrative objects; Field study insights',
  },
  [DEMO_BLOCK_IDS.touchTraces]: {
    id: DEMO_BLOCK_IDS.touchTraces,
    type: 'subproject',
    title: 'TouchTraces',
    description: 'Capturing and replaying touch interactions as meaningful data traces in shared spaces',
    status: 'in-progress',
    visibilityLevel: 2,
    position: { x: 500, y: 340 },
    size: { width: 240, height: 170 },
    tagIds: [DEMO_DOMAIN_IDS.hci, DEMO_DOMAIN_IDS.ethics],
    threadIds: [DEMO_THREAD_IDS.sensing, DEMO_THREAD_IDS.consent],
    rq: 'What forms of touch trace data support meaningful reflection?',
    contributions: 'Touch trace taxonomy; Replay interaction patterns',
  },
  [DEMO_BLOCK_IDS.blueprint]: {
    id: DEMO_BLOCK_IDS.blueprint,
    type: 'publication',
    title: 'Blueprint — Relational Consent',
    description: 'A conceptual framework paper proposing relational consent as a design principle for data-intimate systems',
    status: 'in-progress',
    visibilityLevel: 2,
    position: { x: 860, y: 200 },
    size: { width: 260, height: 180 },
    tagIds: [DEMO_DOMAIN_IDS.ethics, DEMO_DOMAIN_IDS.hci],
    threadIds: [DEMO_THREAD_IDS.consent],
    venue: 'DIS 2026',
    year: 2026,
    authorRole: 'First author',
    doi: '',
    contributions: 'Relational consent framework; Design implications',
  },
  [DEMO_BLOCK_IDS.sensor]: {
    id: DEMO_BLOCK_IDS.sensor,
    type: 'artefact',
    title: 'LLShear Sensor',
    description: 'Low-latency shear force sensor module for detecting directional touch gestures on soft surfaces',
    status: 'in-progress',
    visibilityLevel: 2,
    position: { x: 860, y: 460 },
    size: { width: 240, height: 160 },
    tagIds: [DEMO_DOMAIN_IDS.hci],
    threadIds: [DEMO_THREAD_IDS.sensing],
    artefactType: 'Hardware prototype',
    contributions: 'Novel sensing mechanism; Open-source firmware',
  },
  [DEMO_BLOCK_IDS.collab]: {
    id: DEMO_BLOCK_IDS.collab,
    type: 'collaboration',
    title: 'Industry Partner: FableLab',
    description: 'Collaboration with FableLab studio for co-design of tangible story objects and field deployments',
    status: 'in-progress',
    visibilityLevel: 1,
    position: { x: 200, y: 400 },
    size: { width: 240, height: 150 },
    tagIds: [DEMO_DOMAIN_IDS.designResearch],
    threadIds: [DEMO_THREAD_IDS.hci],
    authorRole: 'PI',
    contributions: 'Field deployment support; Co-design facilitation',
  },
  [DEMO_BLOCK_IDS.annotation]: {
    id: DEMO_BLOCK_IDS.annotation,
    type: 'annotation',
    title: 'Note: Ethics approval pending',
    description: 'IRB submission in progress. Anticipate 6-week turnaround. Affects TouchTraces timeline.',
    status: 'planned',
    visibilityLevel: 1,
    position: { x: 200, y: 620 },
    size: { width: 220, height: 120 },
    tagIds: [DEMO_DOMAIN_IDS.ethics],
    threadIds: [],
  },
}

const DEMO_CONNECTIONS = {
  c1: {
    id: 'conn_c001',
    type: 'dependency' as const,
    sourceId: DEMO_BLOCK_IDS.touchTales,
    targetId: DEMO_BLOCK_IDS.blueprint,
    label: 'Informs framework',
    contributionName: 'Design patterns',
    targetField: 'conceptual basis',
  },
  c2: {
    id: 'conn_c002',
    type: 'contribution-flow' as const,
    sourceId: DEMO_BLOCK_IDS.touchTraces,
    targetId: DEMO_BLOCK_IDS.blueprint,
    label: 'Contributes empirical data',
    contributionName: 'Touch trace taxonomy',
    targetField: 'evidence base',
  },
  c3: {
    id: 'conn_c003',
    type: 'contribution-flow' as const,
    sourceId: DEMO_BLOCK_IDS.sensor,
    targetId: DEMO_BLOCK_IDS.touchTraces,
    label: 'Enables data collection',
    contributionName: 'Shear force data',
    targetField: 'data collection instrument',
  },
  c4: {
    id: 'conn_c004',
    type: 'parallel-data' as const,
    sourceId: DEMO_BLOCK_IDS.touchTales,
    targetId: DEMO_BLOCK_IDS.touchTraces,
    label: 'Parallel field data',
  },
  c5: {
    id: 'conn_c005',
    type: 'conceptual-link' as const,
    sourceId: DEMO_BLOCK_IDS.program,
    targetId: DEMO_BLOCK_IDS.touchTales,
    label: 'Encompasses',
  },
  c6: {
    id: 'conn_c006',
    type: 'conceptual-link' as const,
    sourceId: DEMO_BLOCK_IDS.program,
    targetId: DEMO_BLOCK_IDS.touchTraces,
    label: 'Encompasses',
  },
  c7: {
    id: 'conn_c007',
    type: 'dependency' as const,
    sourceId: DEMO_BLOCK_IDS.collab,
    targetId: DEMO_BLOCK_IDS.touchTales,
    label: 'Supported deployment',
  },
}

// ─── Store ───────────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  blocks: DEMO_BLOCKS,
  connections: {
    [DEMO_CONNECTIONS.c1.id]: DEMO_CONNECTIONS.c1,
    [DEMO_CONNECTIONS.c2.id]: DEMO_CONNECTIONS.c2,
    [DEMO_CONNECTIONS.c3.id]: DEMO_CONNECTIONS.c3,
    [DEMO_CONNECTIONS.c4.id]: DEMO_CONNECTIONS.c4,
    [DEMO_CONNECTIONS.c5.id]: DEMO_CONNECTIONS.c5,
    [DEMO_CONNECTIONS.c6.id]: DEMO_CONNECTIONS.c6,
    [DEMO_CONNECTIONS.c7.id]: DEMO_CONNECTIONS.c7,
  },
  threads: [
    {
      id: DEMO_THREAD_IDS.sensing,
      name: 'Sensing & Interaction',
      colour: '#0ea5e9',
      description: 'Research strand around novel sensing approaches for touch and gesture',
      memberBlockIds: [DEMO_BLOCK_IDS.touchTales, DEMO_BLOCK_IDS.touchTraces, DEMO_BLOCK_IDS.sensor],
    },
    {
      id: DEMO_THREAD_IDS.consent,
      name: 'Consent & Ethics',
      colour: '#ec4899',
      description: 'Research strand exploring ethical frameworks and relational consent',
      memberBlockIds: [DEMO_BLOCK_IDS.touchTraces, DEMO_BLOCK_IDS.blueprint],
    },
    {
      id: DEMO_THREAD_IDS.hci,
      name: 'HCI Fundamentals',
      colour: '#8b5cf6',
      description: 'Grounding in HCI theory and practice',
      memberBlockIds: [DEMO_BLOCK_IDS.program, DEMO_BLOCK_IDS.touchTales, DEMO_BLOCK_IDS.collab],
    },
  ],
  taxonomy: {
    domains: [
      { id: DEMO_DOMAIN_IDS.hci, name: 'HCI', colour: '#6366f1' },
      { id: DEMO_DOMAIN_IDS.designResearch, name: 'Design Research', colour: '#f59e0b' },
      { id: DEMO_DOMAIN_IDS.ethics, name: 'Ethics', colour: '#ec4899' },
    ],
    flavours: [
      { id: DEMO_FLAVOUR_IDS.tangibleUX, domainId: DEMO_DOMAIN_IDS.hci, name: 'Tangible UX' },
      { id: DEMO_FLAVOUR_IDS.participatoryDesign, domainId: DEMO_DOMAIN_IDS.designResearch, name: 'Participatory Design' },
      { id: DEMO_FLAVOUR_IDS.dataEthics, domainId: DEMO_DOMAIN_IDS.ethics, name: 'Data Ethics' },
    ],
    facets: [
      { id: 'fc_tang001', flavourId: DEMO_FLAVOUR_IDS.tangibleUX, name: 'Physical Computing' },
      { id: 'fc_part001', flavourId: DEMO_FLAVOUR_IDS.participatoryDesign, name: 'Co-design' },
      { id: 'fc_deth001', flavourId: DEMO_FLAVOUR_IDS.dataEthics, name: 'Informed Consent' },
    ],
  } as TagTaxonomy,
  progressModels: makeDemoProgressModels(),
  canvas: {
    transform: { x: 40, y: 40, scale: 1 },
    globalVisibilityFloor: 0 as VisibilityLevel,
    colourMode: 'status' as ColourMode,
    viewPresets: [
      {
        id: 'preset_overview',
        name: 'Overview',
        transform: { x: 40, y: 40, scale: 0.8 },
        globalVisibilityFloor: 1 as const,
        colourMode: 'status' as const,
      },
      {
        id: 'preset_detail',
        name: 'Detail View',
        transform: { x: 40, y: 40, scale: 1.2 },
        globalVisibilityFloor: 3 as const,
        colourMode: 'status' as const,
      },
    ] as ViewPreset[],
  },
  selection: {
    selectedIds: [] as string[],
    tracingSourceId: null as string | null,
    activeTraces: [] as number[],
  },
  ui: {
    sidebarOpen: true,
    connectingFrom: null as string | null,
  },
  history: {
    past: [] as HistoryEntry[],
    future: [] as HistoryEntry[],
  },
}

export const useStore = create<AppState>()(
  immer((set, get) => ({
    ...INITIAL_STATE,

    // ── History ────────────────────────────────────────────────────────────

    pushHistory: () => {
      set((state) => {
        const entry: HistoryEntry = {
          blocks: JSON.parse(JSON.stringify(state.blocks)),
          connections: JSON.parse(JSON.stringify(state.connections)),
          threads: JSON.parse(JSON.stringify(state.threads)),
          progressModels: JSON.parse(JSON.stringify(state.progressModels)),
        }
        state.history.past.push(entry)
        if (state.history.past.length > 50) {
          state.history.past.splice(0, state.history.past.length - 50)
        }
        state.history.future = []
      })
    },

    undo: () => {
      const { history, blocks, connections, threads, progressModels } = get()
      if (history.past.length === 0) return
      const prev = history.past[history.past.length - 1]!
      set((state) => {
        state.history.future.push({
          blocks: JSON.parse(JSON.stringify(blocks)),
          connections: JSON.parse(JSON.stringify(connections)),
          threads: JSON.parse(JSON.stringify(threads)),
          progressModels: JSON.parse(JSON.stringify(progressModels)),
        })
        state.history.past.pop()
        state.blocks = prev.blocks
        state.connections = prev.connections
        state.threads = prev.threads
        state.progressModels = prev.progressModels
        state.selection.selectedIds = []
      })
    },

    redo: () => {
      const { history, blocks, connections, threads, progressModels } = get()
      if (history.future.length === 0) return
      const next = history.future[history.future.length - 1]!
      set((state) => {
        state.history.past.push({
          blocks: JSON.parse(JSON.stringify(blocks)),
          connections: JSON.parse(JSON.stringify(connections)),
          threads: JSON.parse(JSON.stringify(threads)),
          progressModels: JSON.parse(JSON.stringify(progressModels)),
        })
        state.history.future.pop()
        state.blocks = next.blocks
        state.connections = next.connections
        state.threads = next.threads
        state.progressModels = next.progressModels
        state.selection.selectedIds = []
      })
    },

    // ── Block actions ──────────────────────────────────────────────────────

    addBlock: (type: BlockType, position?: { x: number; y: number }) => {
      get().pushHistory()
      const id = genId()
      const transform = get().canvas.transform
      const blockCount = Object.keys(get().blocks).length
      const defaultPos = position ?? {
        x: (-transform.x + 200 + blockCount * 20) / transform.scale,
        y: (-transform.y + 200 + blockCount * 20) / transform.scale,
      }
      const size = defaultSize(type)

      const newBlock: Block = {
        id,
        type,
        title: `New ${type}`,
        description: '',
        status: 'not-started',
        visibilityLevel: 2,
        position: defaultPos,
        size,
        tagIds: [],
        threadIds: [],
      }

      set((state) => {
        state.blocks[id] = newBlock
      })

      // Create default progress model
      const phases = defaultPhases(type)
      const model: ProgressModel = {
        blockId: id,
        phases,
        currentPhaseIndex: 0,
      }
      set((state) => {
        state.progressModels[id] = model
      })

      return id
    },

    updateBlock: (id: string, updates: Partial<Block>) => {
      set((state) => {
        if (state.blocks[id]) {
          Object.assign(state.blocks[id]!, updates)
        }
      })
    },

    removeBlock: (id: string) => {
      get().pushHistory()
      set((state) => {
        delete state.blocks[id]
        delete state.progressModels[id]
        // Remove connections involving this block
        Object.keys(state.connections).forEach((connId) => {
          const conn = state.connections[connId]!
          if (conn.sourceId === id || conn.targetId === id) {
            delete state.connections[connId]
          }
        })
        // Remove from threads
        state.threads.forEach((t) => {
          t.memberBlockIds = t.memberBlockIds.filter((bid) => bid !== id)
        })
        // Remove from selection
        state.selection.selectedIds = state.selection.selectedIds.filter((sid) => sid !== id)
        if (state.selection.tracingSourceId === id) {
          state.selection.tracingSourceId = null
        }
      })
    },

    moveBlock: (id: string, x: number, y: number) => {
      set((state) => {
        if (state.blocks[id]) {
          state.blocks[id]!.position = { x, y }
        }
      })
    },

    // Commits a move to history (call on drag end, not on every drag event)
    commitMove: (id: string, x: number, y: number) => {
      get().pushHistory()
      set((state) => {
        if (state.blocks[id]) {
          state.blocks[id]!.position = { x, y }
        }
      })
    },

    resetBlockSize: (id: string) => {
      get().pushHistory()
      set((state) => {
        const block = state.blocks[id]
        if (block) {
          block.size = defaultSize(block.type)
        }
      })
    },

    autoLayout: () => {
      const blockList = Object.values(get().blocks)
      // Group blocks by numeric level
      const levelGroups = new Map<number, typeof blockList>()
      for (const block of blockList) {
        if (typeof block.level === 'number') {
          const arr = levelGroups.get(block.level) ?? []
          arr.push(block)
          levelGroups.set(block.level, arr)
        }
      }
      if (levelGroups.size === 0) return
      get().pushHistory()
      set((state) => {
        const levels = [...levelGroups.keys()].sort((a, b) => a - b)
        const COLUMN_GAP = 60
        const ROW_GAP = 30
        const START_X = 60
        const START_Y = 60
        let currentX = START_X
        for (const level of levels) {
          const blocks = levelGroups.get(level)!
          const maxWidth = Math.max(...blocks.map((b) => b.size.width))
          let currentY = START_Y
          for (const block of blocks) {
            state.blocks[block.id]!.position = { x: currentX, y: currentY }
            currentY += block.size.height + ROW_GAP
          }
          currentX += maxWidth + COLUMN_GAP
        }
      })
    },

    // ── Connection actions ─────────────────────────────────────────────────

    addConnection: (conn: Omit<Connection, 'id'>) => {
      get().pushHistory()
      const id = genId()
      set((state) => {
        state.connections[id] = { id, ...conn }
      })
      return id
    },

    updateConnection: (id: string, updates: Partial<Connection>) => {
      set((state) => {
        if (state.connections[id]) {
          Object.assign(state.connections[id]!, updates)
        }
      })
    },

    removeConnection: (id: string) => {
      get().pushHistory()
      set((state) => {
        delete state.connections[id]
        state.selection.selectedIds = state.selection.selectedIds.filter((sid) => sid !== id)
      })
    },

    // ── Thread actions ─────────────────────────────────────────────────────

    addThread: (name: string, colour: string, description = '') => {
      const id = genId()
      set((state) => {
        state.threads.push({ id, name, colour, description, memberBlockIds: [] })
      })
      return id
    },

    updateThread: (id: string, updates: Partial<Thread>) => {
      set((state) => {
        const t = state.threads.find((th) => th.id === id)
        if (t) Object.assign(t, updates)
      })
    },

    removeThread: (id: string) => {
      set((state) => {
        state.threads = state.threads.filter((t) => t.id !== id)
        Object.values(state.blocks).forEach((b) => {
          b.threadIds = b.threadIds.filter((tid) => tid !== id)
        })
      })
    },

    toggleBlockThread: (blockId: string, threadId: string) => {
      set((state) => {
        const block = state.blocks[blockId]
        const thread = state.threads.find((t) => t.id === threadId)
        if (!block || !thread) return

        const inBlock = block.threadIds.includes(threadId)
        if (inBlock) {
          block.threadIds = block.threadIds.filter((id) => id !== threadId)
          thread.memberBlockIds = thread.memberBlockIds.filter((id) => id !== blockId)
        } else {
          block.threadIds.push(threadId)
          thread.memberBlockIds.push(blockId)
        }
      })
    },

    // ── Tag taxonomy actions ───────────────────────────────────────────────

    addDomain: (name: string, colour: string) => {
      const id = genId()
      set((state) => {
        state.taxonomy.domains.push({ id, name, colour })
      })
      return id
    },

    updateDomain: (id: string, updates: { name?: string; colour?: string }) => {
      set((state) => {
        const d = state.taxonomy.domains.find((x) => x.id === id)
        if (d) Object.assign(d, updates)
      })
    },

    removeDomain: (id: string) => {
      set((state) => {
        const flavourIds = state.taxonomy.flavours
          .filter((f) => f.domainId === id)
          .map((f) => f.id)
        const facetIds = state.taxonomy.facets
          .filter((fc) => flavourIds.includes(fc.flavourId))
          .map((fc) => fc.id)
        const removeIds = new Set([id, ...flavourIds, ...facetIds])
        state.taxonomy.domains = state.taxonomy.domains.filter((d) => d.id !== id)
        state.taxonomy.flavours = state.taxonomy.flavours.filter((f) => f.domainId !== id)
        state.taxonomy.facets = state.taxonomy.facets.filter((fc) => !facetIds.includes(fc.id))
        Object.values(state.blocks).forEach((b) => {
          b.tagIds = b.tagIds.filter((tid) => !removeIds.has(tid))
        })
      })
    },

    addFlavour: (domainId: string, name: string) => {
      const id = genId()
      set((state) => {
        state.taxonomy.flavours.push({ id, domainId, name })
      })
      return id
    },

    updateFlavour: (id: string, name: string) => {
      set((state) => {
        const f = state.taxonomy.flavours.find((x) => x.id === id)
        if (f) f.name = name
      })
    },

    removeFlavour: (id: string) => {
      set((state) => {
        const facetIds = state.taxonomy.facets
          .filter((fc) => fc.flavourId === id)
          .map((fc) => fc.id)
        const removeIds = new Set([id, ...facetIds])
        state.taxonomy.flavours = state.taxonomy.flavours.filter((f) => f.id !== id)
        state.taxonomy.facets = state.taxonomy.facets.filter((fc) => fc.flavourId !== id)
        Object.values(state.blocks).forEach((b) => {
          b.tagIds = b.tagIds.filter((tid) => !removeIds.has(tid))
        })
      })
    },

    addFacet: (flavourId: string, name: string) => {
      const id = genId()
      set((state) => {
        state.taxonomy.facets.push({ id, flavourId, name })
      })
      return id
    },

    removeFacet: (id: string) => {
      set((state) => {
        state.taxonomy.facets = state.taxonomy.facets.filter((fc) => fc.id !== id)
        Object.values(state.blocks).forEach((b) => {
          b.tagIds = b.tagIds.filter((tid) => tid !== id)
        })
      })
    },

    // ── Progress actions ───────────────────────────────────────────────────

    setProgressModel: (model: ProgressModel) => {
      set((state) => {
        state.progressModels[model.blockId] = model
      })
    },

    updatePhaseIndex: (blockId: string, phaseIndex: number) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (m) {
          m.currentPhaseIndex = Math.max(0, Math.min(phaseIndex, m.phases.length - 1))
        }
      })
    },

    toggleMilestone: (blockId: string, phaseId: string, milestoneId: string) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (!m) return
        const phase = m.phases.find((p) => p.id === phaseId)
        if (!phase) return
        const milestone = phase.milestones.find((ms) => ms.id === milestoneId)
        if (milestone) {
          milestone.completed = !milestone.completed
        }
      })
    },

    addPhase: (blockId: string, name: string) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (m) {
          m.phases.push({ id: genId(), name, milestones: [] })
        }
      })
    },

    removePhase: (blockId: string, phaseId: string) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (m) {
          const idx = m.phases.findIndex((p) => p.id === phaseId)
          if (idx !== -1) {
            m.phases.splice(idx, 1)
            if (m.currentPhaseIndex >= m.phases.length) {
              m.currentPhaseIndex = Math.max(0, m.phases.length - 1)
            }
          }
        }
      })
    },

    addMilestone: (blockId: string, phaseId: string, label: string) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (!m) return
        const phase = m.phases.find((p) => p.id === phaseId)
        if (phase) {
          phase.milestones.push({ id: genId(), label, completed: false })
        }
      })
    },

    removeMilestone: (blockId: string, phaseId: string, milestoneId: string) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (!m) return
        const phase = m.phases.find((p) => p.id === phaseId)
        if (phase) {
          phase.milestones = phase.milestones.filter((ms) => ms.id !== milestoneId)
        }
      })
    },

    updateMilestone: (blockId: string, phaseId: string, milestoneId: string, updates: Partial<Milestone>) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (!m) return
        const phase = m.phases.find((p) => p.id === phaseId)
        if (!phase) return
        const ms = phase.milestones.find((ms) => ms.id === milestoneId)
        if (ms) Object.assign(ms, updates)
      })
    },

    updatePhase: (blockId: string, phaseId: string, updates: Partial<Phase>) => {
      set((state) => {
        const m = state.progressModels[blockId]
        if (!m) return
        const phase = m.phases.find((p) => p.id === phaseId)
        if (phase) Object.assign(phase, updates)
      })
    },

    // ── Canvas actions ─────────────────────────────────────────────────────

    setTransform: (transform: CanvasTransform) => {
      set((state) => {
        state.canvas.transform = transform
      })
    },

    setColourMode: (mode: ColourMode) => {
      set((state) => {
        state.canvas.colourMode = mode
      })
    },

    setGlobalVisibility: (level: VisibilityLevel) => {
      set((state) => {
        state.canvas.globalVisibilityFloor = level
      })
    },

    savePreset: (name: string) => {
      const id = genId()
      const { transform, globalVisibilityFloor, colourMode } = get().canvas
      set((state) => {
        state.canvas.viewPresets.push({
          id,
          name,
          transform: { ...transform },
          globalVisibilityFloor,
          colourMode,
        })
      })
    },

    loadPreset: (id: string) => {
      const preset = get().canvas.viewPresets.find((p) => p.id === id)
      if (!preset) return
      set((state) => {
        state.canvas.transform = { ...preset.transform }
        state.canvas.globalVisibilityFloor = preset.globalVisibilityFloor
        state.canvas.colourMode = preset.colourMode
      })
    },

    // ── Selection actions ──────────────────────────────────────────────────

    select: (id: string, multi = false) => {
      set((state) => {
        if (multi) {
          if (!state.selection.selectedIds.includes(id)) {
            state.selection.selectedIds.push(id)
          }
        } else {
          state.selection.selectedIds = [id]
        }
      })
    },

    deselect: (id: string) => {
      set((state) => {
        state.selection.selectedIds = state.selection.selectedIds.filter((sid) => sid !== id)
      })
    },

    clearSelection: () => {
      set((state) => {
        state.selection.selectedIds = []
      })
    },

    setTracingSource: (id: string | null) => {
      set((state) => {
        state.selection.tracingSourceId = id
      })
    },

    toggleTrace: (mode: number) => {
      set((state) => {
        const idx = state.selection.activeTraces.indexOf(mode)
        if (idx !== -1) {
          state.selection.activeTraces.splice(idx, 1)
        } else {
          state.selection.activeTraces.push(mode)
        }
      })
    },

    // ── UI actions ─────────────────────────────────────────────────────────

    toggleSidebar: () => {
      set((state) => {
        state.ui.sidebarOpen = !state.ui.sidebarOpen
      })
    },

    setConnecting: (blockId: string | null) => {
      set((state) => {
        state.ui.connectingFrom = blockId
      })
    },

    // ── File I/O ───────────────────────────────────────────────────────────

    loadState: (s: SerializedState) => {
      set((state) => {
        state.blocks = s.blocks
        state.connections = s.connections
        state.threads = s.threads
        state.taxonomy = s.taxonomy
        state.progressModels = s.progressModels
        state.canvas = s.canvas
        state.selection = { selectedIds: [], tracingSourceId: null, activeTraces: [] }
        state.ui = { sidebarOpen: true, connectingFrom: null }
        state.history = { past: [], future: [] }
      })
    },
  }))
)
