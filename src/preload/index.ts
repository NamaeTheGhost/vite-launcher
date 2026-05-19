import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getDiskSpace: (drivePath: string): Promise<{ free: number; total: number }> =>
    ipcRenderer.invoke('get-disk-space', drivePath),

  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('select-directory'),

  createProject: (config: {
    targetDir: string
    projectName: string
    features: string[]
  }): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('create-project', config),

  onProjectProgress: (
    callback: (data: { stage: string; message: string; percent: number }) => void
  ): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown): void => {
      callback(data as { stage: string; message: string; percent: number })
    }
    ipcRenderer.on('project-progress', handler)
    return (): void => {
      ipcRenderer.removeListener('project-progress', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore - non-context-isolated fallback
  window.electron = electronAPI
  // @ts-ignore - non-context-isolated fallback
  window.api = api
}
