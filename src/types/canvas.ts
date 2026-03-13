export type ColourMode = 'status' | 'threads' | 'tags'

export interface CanvasTransform {
  x: number
  y: number
  scale: number
}

export interface ViewPreset {
  id: string
  name: string
  transform: CanvasTransform
  globalVisibilityFloor: 0 | 1 | 2 | 3
  colourMode: ColourMode
}
