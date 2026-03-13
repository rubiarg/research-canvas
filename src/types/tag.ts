export interface TagDomain {
  id: string
  name: string
  colour: string
}

export interface TagFlavour {
  id: string
  domainId: string
  name: string
}

export interface TagFacet {
  id: string
  flavourId: string
  name: string
}

export interface TagTaxonomy {
  domains: TagDomain[]
  flavours: TagFlavour[]
  facets: TagFacet[]
}

export interface TagRef {
  domainId: string
  flavourId?: string
  facetId?: string
}
