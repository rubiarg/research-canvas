import type { SerializedState } from '@/store/index.ts'

const FILE_EXTENSION = '.rcvs'
const MIME_TYPE = 'application/json'

// Type declarations for File System Access API (not in standard lib yet)
interface FileSystemWritableFileStream {
  write(data: string | Blob | ArrayBuffer): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
  getFile(): Promise<File>
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{ description: string; accept: Record<string, string[]> }>
}

interface OpenFilePickerOptions {
  types?: Array<{ description: string; accept: Record<string, string[]> }>
  multiple?: boolean
}

interface WindowWithFilePicker extends Window {
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
  showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>
}

/**
 * Save the canvas state to a .rcvs file.
 * Uses the File System Access API if available, otherwise falls back to anchor download.
 */
export async function saveFile(state: SerializedState): Promise<void> {
  const json = JSON.stringify(state, null, 2)

  if ('showSaveFilePicker' in window) {
    try {
      const w = window as unknown as WindowWithFilePicker
      const handle = await w.showSaveFilePicker({
        suggestedName: 'research-canvas' + FILE_EXTENSION,
        types: [
          {
            description: 'ResearchCanvas File',
            accept: { 'application/json': [FILE_EXTENSION] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return
    } catch (err) {
      // User cancelled or API not permitted — fall through to download
      if ((err as Error).name === 'AbortError') return
    }
  }

  // Fallback: trigger anchor download
  const blob = new Blob([json], { type: MIME_TYPE })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'research-canvas' + FILE_EXTENSION
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Load a .rcvs file and return the parsed state.
 * Uses the File System Access API if available, otherwise falls back to file input.
 */
export async function loadFile(): Promise<SerializedState | null> {
  if ('showOpenFilePicker' in window) {
    try {
      const w = window as unknown as WindowWithFilePicker
      const [handle] = await w.showOpenFilePicker({
        types: [
          {
            description: 'ResearchCanvas File',
            accept: { 'application/json': [FILE_EXTENSION] },
          },
        ],
        multiple: false,
      })
      const file = await handle!.getFile()
      const text = await file.text()
      return JSON.parse(text) as SerializedState
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null
      console.error('File open error:', err)
      return null
    }
  }

  // Fallback: file input element
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = FILE_EXTENSION + ',.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      try {
        const text = await file.text()
        resolve(JSON.parse(text) as SerializedState)
      } catch {
        resolve(null)
      }
    }
    input.oncancel = () => resolve(null)
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  })
}
