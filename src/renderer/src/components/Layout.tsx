import { useNavigate } from 'react-router-dom'
import { useInstaller } from './InstallerContext'

interface LayoutProps {
  children: React.ReactNode
  activeStep: string
  sidebarImg?: string
  sidebarTitle?: string
  sidebarSubtitle?: string
}

const steps = [
  { id: '/', label: 'Welcome', icon: 'start' },
  { id: '/details', label: 'Details', icon: 'description' },
  { id: '/features', label: 'Features', icon: 'featured_play_list' },
  { id: '/location', label: 'Location', icon: 'folder_open' }
]

function Layout({
  children,
  activeStep,
  sidebarImg,
  sidebarTitle = 'Vite Installer',
  sidebarSubtitle = 'Minimalist Setup'
}: LayoutProps): React.JSX.Element {
  const navigate = useNavigate()
  const currentIndex = steps.findIndex((s) => s.id === activeStep)
  const { projectName, features, isInstalling } = useInstaller()

  const canNavigateTo = (targetIndex: number): boolean => {
    if (isInstalling) return false
    if (targetIndex <= currentIndex) return true
    if (targetIndex === currentIndex + 1) {
      if (currentIndex === 0) return true
      if (currentIndex === 1) return projectName.trim().length > 0
      if (currentIndex === 2) return features.some((f) => f.checked)
      return true
    }
    return false
  }

  const handleMinimize = (): void => {
    window.electron?.ipcRenderer.send('window-minimize')
  }

  const handleClose = (): void => {
    window.electron?.ipcRenderer.send('window-close')
  }

  return (
    <div className="installer-window">
      {/* Titlebar */}
      <div className="titlebar">
        <button className="titlebar-button" onClick={handleMinimize}>
          <span className="material-symbols-outlined">minimize</span>
        </button>
        <button className="titlebar-button" onClick={handleClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Sidebar */}
      <aside className="w-[35%] h-full bg-surface-dim flex flex-col border-r border-outline-variant/30 relative overflow-hidden z-10">
        {sidebarImg && (
          <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
            <img src={sidebarImg} alt="" className="w-full h-full object-cover grayscale" />
          </div>
        )}

        <div className="px-gutter-md pt-8 pb-4 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[24px]">
                install_desktop
              </span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary">
                {sidebarTitle}
              </h1>
              <p className="text-[12px] text-on-surface-variant/50 font-medium tracking-wide uppercase">
                {sidebarSubtitle}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col justify-center gap-1 px-3 relative z-10">
          {steps.map((step, i) => {
            const isActive = activeStep === step.id
            const isPast = currentIndex > i
            const canNav = canNavigateTo(i)

            return (
              <div
                key={step.id}
                onClick={() => canNav && navigate(step.id)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  !canNav
                    ? 'text-on-surface-variant/20 cursor-not-allowed'
                    : isActive
                      ? 'bg-primary/10 text-primary font-semibold cursor-pointer'
                      : isPast
                        ? 'text-primary/60 hover:bg-surface-container-highest/30 hover:text-primary/80 cursor-pointer'
                        : 'text-on-surface-variant/40 hover:bg-surface-container-highest/20 hover:text-on-surface-variant/70 cursor-pointer'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    !canNav
                      ? 'bg-surface-container-highest text-on-surface-variant/20'
                      : isActive
                        ? 'bg-primary text-on-primary'
                        : isPast
                          ? 'bg-primary/15 text-primary'
                          : 'bg-surface-container-highest text-on-surface-variant/40'
                  }`}
                >
                  {isPast ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-tight">{step.label}</span>
                  {isActive && (
                    <span className="text-[11px] text-primary/60 font-medium">
                      Step {i + 1} of {steps.length}
                    </span>
                  )}
                </div>

                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
              </div>
            )
          })}
        </nav>

        <div className="px-gutter-md py-6 relative z-10">
          <div className="flex items-center gap-2 text-on-surface-variant/30">
            <span className="material-symbols-outlined text-[16px]">more_horiz</span>
            <span className="text-[11px] font-medium">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-[65%] h-full flex flex-col bg-surface relative">
        <div className="flex-1 px-8 py-6 overflow-hidden">{children}</div>
      </main>

      {/* Glow */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
    </div>
  )
}

export default Layout
