/// <reference types="vite/client" />

interface Window {
  electron: {
    ipcRenderer: {
      send: (channel: string, ...args: unknown[]) => void
      on: (channel: string, callback: (...args: unknown[]) => void) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
    process: {
      versions: Record<string, string>
    }
  }
  api: {
    getDiskSpace: (drivePath: string) => Promise<{ free: number; total: number }>
    selectDirectory: () => Promise<string | null>
    createProject: (config: {
      targetDir: string
      projectName: string
      features: string[]
    }) => Promise<{ success: boolean; path?: string; error?: string }>
    onProjectProgress: (
      callback: (data: { stage: string; message: string; percent: number }) => void
    ) => () => void
  }
}
