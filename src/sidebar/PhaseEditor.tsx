import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { computeProgress, currentPhaseName } from '@/utils/progress.ts'
import { Check, ChevronDown, ChevronRight, Plus, X } from 'lucide-react'

interface PhaseEditorProps {
  blockId: string
}

export function PhaseEditor({ blockId }: PhaseEditorProps) {
  const progressModel = useStore((s) => s.progressModels[blockId])
  const updatePhaseIndex = useStore((s) => s.updatePhaseIndex)
  const toggleMilestone = useStore((s) => s.toggleMilestone)
  const addPhase = useStore((s) => s.addPhase)
  const removePhase = useStore((s) => s.removePhase)
  const addMilestone = useStore((s) => s.addMilestone)
  const removeMilestone = useStore((s) => s.removeMilestone)

  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newMilestoneLabels, setNewMilestoneLabels] = useState<Record<string, string>>({})

  if (!progressModel) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No progress model for this block.
      </div>
    )
  }

  const progress = computeProgress(progressModel)
  const phaseName = currentPhaseName(progressModel)
  const { phases, currentPhaseIndex } = progressModel

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return
    addPhase(blockId, newPhaseName.trim())
    setNewPhaseName('')
  }

  const handleAddMilestone = (phaseId: string) => {
    const label = newMilestoneLabels[phaseId]?.trim()
    if (!label) return
    addMilestone(blockId, phaseId, label)
    setNewMilestoneLabels((prev) => ({ ...prev, [phaseId]: '' }))
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Overall Progress</span>
          <span className="text-xs font-bold text-indigo-400">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500">Current: {phaseName}</div>
      </div>

      {/* Phases list */}
      <div className="space-y-1">
        {phases.map((phase, idx) => {
          const isCurrent = idx === currentPhaseIndex
          const isPast = idx < currentPhaseIndex
          const isExpanded = expandedPhase === phase.id

          const doneCount = phase.milestones.filter((m) => m.completed).length
          const totalCount = phase.milestones.length

          return (
            <div
              key={phase.id}
              className={`rounded border transition-colors ${
                isCurrent
                  ? 'border-indigo-500 bg-indigo-950'
                  : isPast
                  ? 'border-green-800 bg-green-950'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                {/* Phase status indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer ${
                    isPast
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-indigo-500'
                      : 'bg-gray-600'
                  }`}
                  onClick={() => updatePhaseIndex(blockId, idx)}
                  title="Set as current phase"
                >
                  {isPast && <Check size={10} className="text-white" />}
                  {isCurrent && <span className="text-white text-xs font-bold">{idx + 1}</span>}
                  {!isPast && !isCurrent && <span className="text-gray-300 text-xs">{idx + 1}</span>}
                </div>

                <span
                  className={`text-sm flex-1 cursor-pointer ${
                    isCurrent ? 'text-indigo-200 font-medium' : isPast ? 'text-green-300' : 'text-gray-300'
                  }`}
                  onClick={() => updatePhaseIndex(blockId, idx)}
                >
                  {phase.name}
                </span>

                {totalCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {doneCount}/{totalCount}
                  </span>
                )}

                <button
                  onClick={() =>
                    setExpandedPhase(isExpanded ? null : phase.id)
                  }
                  className="text-gray-500 hover:text-gray-200 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <button
                  onClick={() => removePhase(blockId, phase.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Milestones */}
              {isExpanded && (
                <div className="px-3 pb-2 space-y-1 border-t border-gray-700 mt-1 pt-2">
                  {phase.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleMilestone(blockId, phase.id, milestone.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          milestone.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-600 hover:border-green-400'
                        }`}
                      >
                        {milestone.completed && <Check size={10} className="text-white" />}
                      </button>
                      <span
                        className={`text-xs flex-1 ${
                          milestone.completed ? 'line-through text-gray-600' : 'text-gray-300'
                        }`}
                      >
                        {milestone.label}
                      </span>
                      <button
                        onClick={() => removeMilestone(blockId, phase.id, milestone.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Add milestone */}
                  <div className="flex gap-1 mt-2">
                    <input
                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                      placeholder="Add milestone..."
                      value={newMilestoneLabels[phase.id] ?? ''}
                      onChange={(e) =>
                        setNewMilestoneLabels((prev) => ({
                          ...prev,
                          [phase.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddMilestone(phase.id)
                      }}
                    />
                    <button
                      onClick={() => handleAddMilestone(phase.id)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add phase */}
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
          placeholder="New phase name..."
          value={newPhaseName}
          onChange={(e) => setNewPhaseName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddPhase()
          }}
        />
        <button
          onClick={handleAddPhase}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors flex items-center gap-1"
        >
          <Plus size={12} />
          Phase
        </button>
      </div>
    </div>
  )
}
