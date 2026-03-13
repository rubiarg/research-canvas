import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { Plus, ChevronRight, ChevronDown, Tag } from 'lucide-react'

interface TagEditorProps {
  blockId: string
}

export function TagEditor({ blockId }: TagEditorProps) {
  const block = useStore((s) => s.blocks[blockId])
  const taxonomy = useStore((s) => s.taxonomy)
  const updateBlock = useStore((s) => s.updateBlock)
  const addDomain = useStore((s) => s.addDomain)
  const addFlavour = useStore((s) => s.addFlavour)
  const addFacet = useStore((s) => s.addFacet)

  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [expandedFlavours, setExpandedFlavours] = useState<Set<string>>(new Set())
  const [newDomainName, setNewDomainName] = useState('')
  const [newDomainColour, setNewDomainColour] = useState('#6366f1')
  const [newFlavourInputs, setNewFlavourInputs] = useState<Record<string, string>>({})
  const [newFacetInputs, setNewFacetInputs] = useState<Record<string, string>>({})

  if (!block) return null

  const tagIds = block.tagIds

  const toggleTag = (id: string) => {
    const current = tagIds ?? []
    const next = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id]
    updateBlock(blockId, { tagIds: next })
  }

  const toggleDomain = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleFlavour = (id: string) => {
    setExpandedFlavours((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddDomain = () => {
    if (!newDomainName.trim()) return
    addDomain(newDomainName.trim(), newDomainColour)
    setNewDomainName('')
    setNewDomainColour('#6366f1')
  }

  const handleAddFlavour = (domainId: string) => {
    const name = newFlavourInputs[domainId]?.trim()
    if (!name) return
    addFlavour(domainId, name)
    setNewFlavourInputs((prev) => ({ ...prev, [domainId]: '' }))
  }

  const handleAddFacet = (flavourId: string) => {
    const name = newFacetInputs[flavourId]?.trim()
    if (!name) return
    addFacet(flavourId, name)
    setNewFacetInputs((prev) => ({ ...prev, [flavourId]: '' }))
  }

  // Show current tag path summary
  const tagPaths = tagIds.map((id) => {
    const domain = taxonomy.domains.find((d) => d.id === id)
    const flavour = taxonomy.flavours.find((f) => f.id === id)
    const facet = taxonomy.facets.find((fc) => fc.id === id)
    if (domain) return { label: domain.name, colour: domain.colour }
    if (flavour) {
      const dom = taxonomy.domains.find((d) => d.id === flavour.domainId)
      return { label: `${dom?.name ?? '?'} > ${flavour.name}`, colour: dom?.colour ?? '#94a3b8' }
    }
    if (facet) {
      const fl = taxonomy.flavours.find((f) => f.id === facet.flavourId)
      const dom = taxonomy.domains.find((d) => d.id === fl?.domainId)
      return { label: `${dom?.name ?? '?'} > ${fl?.name ?? '?'} > ${facet.name}`, colour: dom?.colour ?? '#94a3b8' }
    }
    return null
  }).filter((x): x is { label: string; colour: string } => x !== null)

  return (
    <div className="space-y-4">
      {/* Current tags */}
      {tagPaths.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assigned Tags</h4>
          <div className="flex flex-wrap gap-1">
            {tagPaths.map((tp, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                style={{ backgroundColor: tp.colour + '99', border: `1px solid ${tp.colour}` }}
              >
                <Tag size={10} />
                {tp.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Taxonomy tree */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Taxonomy</h4>
        <div className="space-y-1">
          {taxonomy.domains.map((domain) => {
            const domainChecked = tagIds.includes(domain.id)
            const domainExpanded = expandedDomains.has(domain.id)
            const flavours = taxonomy.flavours.filter((f) => f.domainId === domain.id)

            return (
              <div key={domain.id} className="rounded border border-gray-700">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={domainChecked}
                    onChange={() => toggleTag(domain.id)}
                    className="rounded"
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: domain.colour }}
                  />
                  <span className="text-sm text-gray-200 flex-1">{domain.name}</span>
                  {flavours.length > 0 && (
                    <button
                      onClick={() => toggleDomain(domain.id)}
                      className="text-gray-500 hover:text-gray-200"
                    >
                      {domainExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  )}
                </div>

                {domainExpanded && (
                  <div className="pl-6 pb-2 space-y-1 border-t border-gray-700 pt-1">
                    {flavours.map((flavour) => {
                      const flavourChecked = tagIds.includes(flavour.id)
                      const flavourExpanded = expandedFlavours.has(flavour.id)
                      const facets = taxonomy.facets.filter((fc) => fc.flavourId === flavour.id)

                      return (
                        <div key={flavour.id}>
                          <div className="flex items-center gap-2 px-2 py-1">
                            <input
                              type="checkbox"
                              checked={flavourChecked}
                              onChange={() => toggleTag(flavour.id)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-300 flex-1">{flavour.name}</span>
                            {facets.length > 0 && (
                              <button
                                onClick={() => toggleFlavour(flavour.id)}
                                className="text-gray-500 hover:text-gray-200"
                              >
                                {flavourExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                              </button>
                            )}
                          </div>

                          {flavourExpanded && (
                            <div className="pl-4 space-y-1">
                              {facets.map((facet) => (
                                <div key={facet.id} className="flex items-center gap-2 px-2 py-0.5">
                                  <input
                                    type="checkbox"
                                    checked={tagIds.includes(facet.id)}
                                    onChange={() => toggleTag(facet.id)}
                                    className="rounded"
                                  />
                                  <span className="text-xs text-gray-400">{facet.name}</span>
                                </div>
                              ))}
                              {/* Add facet */}
                              <div className="flex gap-1 px-2 mt-1">
                                <input
                                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-300 focus:outline-none"
                                  placeholder="Add facet..."
                                  value={newFacetInputs[flavour.id] ?? ''}
                                  onChange={(e) =>
                                    setNewFacetInputs((prev) => ({ ...prev, [flavour.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddFacet(flavour.id)
                                  }}
                                />
                                <button
                                  onClick={() => handleAddFacet(flavour.id)}
                                  className="text-gray-500 hover:text-gray-200"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Add flavour inline */}
                        </div>
                      )
                    })}

                    {/* Add flavour */}
                    <div className="flex gap-1 px-2 mt-2">
                      <input
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-300 focus:outline-none"
                        placeholder="Add flavour..."
                        value={newFlavourInputs[domain.id] ?? ''}
                        onChange={(e) =>
                          setNewFlavourInputs((prev) => ({ ...prev, [domain.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddFlavour(domain.id)
                        }}
                      />
                      <button
                        onClick={() => handleAddFlavour(domain.id)}
                        className="text-gray-500 hover:text-gray-200"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add new domain */}
      <div className="border-t border-gray-700 pt-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add Domain</h4>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
            placeholder="Domain name..."
            value={newDomainName}
            onChange={(e) => setNewDomainName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddDomain()
            }}
          />
          <input
            type="color"
            value={newDomainColour}
            onChange={(e) => setNewDomainColour(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-700"
          />
          <button
            onClick={handleAddDomain}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
