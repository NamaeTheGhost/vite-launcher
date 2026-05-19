/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'

interface Feature {
  id: string
  label: string
  desc: string
  icon: string
  checked: boolean
  sizeMB: number
}

interface DiskSpace {
  free: number
  total: number
}

interface InstallerState {
  projectName: string
  setProjectName: (name: string) => void
  features: Feature[]
  toggleFeature: (id: string) => void
  totalSizeMB: number
  diskSpace: DiskSpace | null
  setDiskSpace: (space: DiskSpace) => void
  installPath: string
  setInstallPath: (path: string) => void
  isInstalling: boolean
  setIsInstalling: (v: boolean) => void
}

const defaultFeatures: Feature[] = [
  {
    id: 'ts',
    label: 'TypeScript',
    desc: 'Statik tipleme ile güvenli kod.',
    icon: 'terminal',
    checked: true,
    sizeMB: 85
  },
  {
    id: 'tw',
    label: 'Tailwind CSS',
    desc: 'Utility-first styling.',
    icon: 'palette',
    checked: true,
    sizeMB: 45
  },
  {
    id: 'lint',
    label: 'ESLint',
    desc: 'Statik analiz aracı.',
    icon: 'rule',
    checked: false,
    sizeMB: 25
  },
  {
    id: 'pret',
    label: 'Prettier',
    desc: 'Kod formatlayıcı.',
    icon: 'format_align_left',
    checked: false,
    sizeMB: 18
  }
]

const InstallerContext = createContext<InstallerState | null>(null)

function InstallerProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [projectName, setProjectName] = useState('')
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures)
  const [diskSpace, setDiskSpace] = useState<DiskSpace | null>(null)
  const [installPath, setInstallPath] = useState('C:\\Program Files\\ViteInstaller')
  const [isInstalling, setIsInstalling] = useState(false)

  const toggleFeature = (id: string): void => {
    setFeatures(features.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f)))
  }

  const totalSizeMB = features.filter((f) => f.checked).reduce((sum, f) => sum + f.sizeMB, 0)

  return (
    <InstallerContext.Provider
      value={{
        projectName,
        setProjectName,
        features,
        toggleFeature,
        totalSizeMB,
        diskSpace,
        setDiskSpace,
        installPath,
        setInstallPath,
        isInstalling,
        setIsInstalling
      }}
    >
      {children}
    </InstallerContext.Provider>
  )
}

function useInstaller(): InstallerState {
  const ctx = useContext(InstallerContext)
  if (!ctx) throw new Error('useInstaller must be used within InstallerProvider')
  return ctx
}

export { InstallerProvider, useInstaller, type Feature, type DiskSpace }
