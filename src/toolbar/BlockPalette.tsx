import React from 'react'
import { useStore } from '@/store/index.ts'
import type { BlockType } from '@/types/block.ts'
import { BLOCK_TYPE_COLOURS, BLOCK_TYPE_LABELS } from '@/utils/colours.ts'
import {
  Layers,
  FolderOpen,
  GitBranch,
  BookOpen,
  Box,
  Network,
  Users,
  MessageSquare,
} from 'lucide-react'

const BLOCK_TYPES: { type: BlockType; icon: React.ReactElement }[] = [
  { type: 'program', icon: <Layers size={14} /> },
  { type: 'project', icon: <FolderOpen size={14} /> },
  { type: 'subproject', icon: <GitBranch size={14} /> },
  { type: 'publication', icon: <BookOpen size={14} /> },
  { type: 'artefact', icon: <Box size={14} /> },
  { type: 'threadhub', icon: <Network size={14} /> },
  { type: 'collaboration', icon: <Users size={14} /> },
  { type: 'annotation', icon: <MessageSquare size={14} /> },
]

export function BlockPalette() {
  const addBlock = useStore((s) => s.addBlock)
  const select = useStore((s) => s.select)

  const handleAdd = (type: BlockType) => {
    const id = addBlock(type)
    select(id)
  }

  return (
    <div className="flex items-center gap-1">
      {BLOCK_TYPES.map(({ type, icon }) => {
        const colour = BLOCK_TYPE_COLOURS[type] ?? '#6366f1'
        const label = BLOCK_TYPE_LABELS[type] ?? type

        return (
          <button
            key={type}
            onClick={() => handleAdd(type)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors group"
            title={`Add ${label}`}
          >
            <span style={{ color: colour }}>{icon}</span>
            <span className="text-[9px] leading-none">{label.split('-')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}
