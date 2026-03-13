import { useState } from 'react'
import { useStore } from '@/store/index.ts'
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X } from 'lucide-react'

const FLAVOUR_SYMBOLS = ['●', '◆', '▲', '■', '◉', '✦']

export function TaxonomyManager() {
  const taxonomy = useStore((s) => s.taxonomy)
  const addDomain = useStore((s) => s.addDomain)
  const updateDomain = useStore((s) => s.updateDomain)
  const removeDomain = useStore((s) => s.removeDomain)
  const addFlavour = useStore((s) => s.addFlavour)
  const updateFlavour = useStore((s) => s.updateFlavour)
  const removeFlavour = useStore((s) => s.removeFlavour)
  const addFacet = useStore((s) => s.addFacet)
  const removeFacet = useStore((s) => s.removeFacet)

  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [expandedFlavours, setExpandedFlavours] = useState<Set<string>>(new Set())

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // New item inputs
  const [newDomainName, setNewDomainName] = useState('')
  const [newDomainColour, setNewDomainColour] = useState('#6366f1')
  const [newFlavourInputs, setNewFlavourInputs] = useState<Record<string, string>>({})
  const [newFacetInputs, setNewFacetInputs] = useState<Record<string, string>>({})
  const [editingColourId, setEditingColourId] = useState<string | null>(null)

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditValue(currentName)
  }

  const commitEdit = (type: 'domain' | 'flavour', id: string) => {
    if (!editValue.trim()) { setEditingId(null); return }
    if (type === 'domain') updateDomain(id, { name: editValue.trim() })
    else updateFlavour(id, editValue.trim())
    setEditingId(null)
  }

  const handleAddDomain = () => {
    if (!newDomainName.trim()) return
    addDomain(newDomainName.trim(), newDomainColour)
    setNewDomainName('')
    setNewDomainColour('#6366f1')
  }

  const inputCls = 'flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500'

  return (
    <div className="space-y-3">
      {taxonomy.domains.length === 0 && (
        <p className="text-xs text-gray-500">No domains defined yet.</p>
      )}

      {taxonomy.domains.map((domain) => {
        const expanded = expandedDomains.has(domain.id)
        const flavours = taxonomy.flavours.filter((f) => f.domainId === domain.id)

        return (
          <div key={domain.id} className="rounded border border-gray-700 bg-gray-800">
            {/* Domain row */}
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              {/* Colour swatch / editor */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-4 h-4 rounded-full cursor-pointer border border-gray-600"
                  style={{ backgroundColor: domain.colour }}
                  onClick={() => setEditingColourId(editingColourId === domain.id ? null : domain.id)}
                />
                {editingColourId === domain.id && (
                  <input
                    type="color"
                    value={domain.colour}
                    onChange={(e) => updateDomain(domain.id, { colour: e.target.value })}
                    onBlur={() => setEditingColourId(null)}
                    className="absolute top-5 left-0 w-8 h-8 cursor-pointer z-10"
                    autoFocus
                  />
                )}
              </div>

              {editingId === domain.id ? (
                <>
                  <input
                    className={`${inputCls} flex-1`}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit('domain', domain.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                  />
                  <button onClick={() => commitEdit('domain', domain.id)} className="text-green-400 hover:text-green-300"><Check size={11} /></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300"><X size={11} /></button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-200 flex-1 font-medium">{domain.name}</span>
                  <button onClick={() => startEdit(domain.id, domain.name)} className="text-gray-500 hover:text-gray-300" title="Rename"><Pencil size={11} /></button>
                  <button
                    onClick={() => setExpandedDomains((prev) => {
                      const next = new Set(prev)
                      if (next.has(domain.id)) next.delete(domain.id)
                      else next.add(domain.id)
                      return next
                    })}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  <button onClick={() => removeDomain(domain.id)} className="text-red-500 hover:text-red-400" title="Delete domain (removes from all blocks)"><Trash2 size={11} /></button>
                </>
              )}
            </div>

            {/* Flavours */}
            {expanded && (
              <div className="border-t border-gray-700 px-3 pb-2 pt-1 space-y-1">
                {flavours.map((flavour, fi) => {
                  const symbol = FLAVOUR_SYMBOLS[fi % FLAVOUR_SYMBOLS.length]!
                  const facets = taxonomy.facets.filter((fc) => fc.flavourId === flavour.id)
                  const flavourExpanded = expandedFlavours.has(flavour.id)

                  return (
                    <div key={flavour.id}>
                      <div className="flex items-center gap-1.5 py-0.5">
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center text-white text-xs flex-shrink-0"
                          style={{ background: domain.colour, fontSize: '8px' }}
                        >
                          {symbol}
                        </span>

                        {editingId === flavour.id ? (
                          <>
                            <input
                              className={`${inputCls} flex-1`}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit('flavour', flavour.id)
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              autoFocus
                            />
                            <button onClick={() => commitEdit('flavour', flavour.id)} className="text-green-400 hover:text-green-300"><Check size={10} /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300"><X size={10} /></button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-gray-300 flex-1">{flavour.name}</span>
                            <button onClick={() => startEdit(flavour.id, flavour.name)} className="text-gray-500 hover:text-gray-300" title="Rename"><Pencil size={10} /></button>
                            {facets.length > 0 && (
                              <button
                                onClick={() => setExpandedFlavours((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(flavour.id)) next.delete(flavour.id)
                                  else next.add(flavour.id)
                                  return next
                                })}
                                className="text-gray-500 hover:text-gray-300"
                              >
                                {flavourExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                              </button>
                            )}
                            <button onClick={() => removeFlavour(flavour.id)} className="text-red-500 hover:text-red-400" title="Delete flavour"><Trash2 size={10} /></button>
                          </>
                        )}
                      </div>

                      {/* Facets */}
                      {flavourExpanded && (
                        <div className="pl-6 space-y-0.5 mt-0.5">
                          {facets.map((facet) => (
                            <div key={facet.id} className="flex items-center gap-1.5 py-0.5">
                              <span className="text-xs text-gray-400 flex-1">{facet.name}</span>
                              <button onClick={() => removeFacet(facet.id)} className="text-red-500 hover:text-red-400"><Trash2 size={9} /></button>
                            </div>
                          ))}
                          <div className="flex gap-1 mt-1">
                            <input
                              className={inputCls}
                              placeholder="Add facet…"
                              value={newFacetInputs[flavour.id] ?? ''}
                              onChange={(e) => setNewFacetInputs((p) => ({ ...p, [flavour.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const n = newFacetInputs[flavour.id]?.trim()
                                  if (n) { addFacet(flavour.id, n); setNewFacetInputs((p) => ({ ...p, [flavour.id]: '' })) }
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const n = newFacetInputs[flavour.id]?.trim()
                                if (n) { addFacet(flavour.id, n); setNewFacetInputs((p) => ({ ...p, [flavour.id]: '' })) }
                              }}
                              className="text-gray-500 hover:text-gray-200"
                            ><Plus size={10} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add flavour */}
                <div className="flex gap-1 mt-1">
                  <input
                    className={inputCls}
                    placeholder="Add flavour…"
                    value={newFlavourInputs[domain.id] ?? ''}
                    onChange={(e) => setNewFlavourInputs((p) => ({ ...p, [domain.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const n = newFlavourInputs[domain.id]?.trim()
                        if (n) { addFlavour(domain.id, n); setNewFlavourInputs((p) => ({ ...p, [domain.id]: '' })) }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const n = newFlavourInputs[domain.id]?.trim()
                      if (n) { addFlavour(domain.id, n); setNewFlavourInputs((p) => ({ ...p, [domain.id]: '' })) }
                    }}
                    className="text-gray-500 hover:text-gray-200"
                  ><Plus size={11} /></button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Add domain */}
      <div className="border-t border-gray-700 pt-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add Domain</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            placeholder="Domain name…"
            value={newDomainName}
            onChange={(e) => setNewDomainName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddDomain() }}
          />
          <input
            type="color"
            value={newDomainColour}
            onChange={(e) => setNewDomainColour(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border border-gray-700 p-0.5"
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
