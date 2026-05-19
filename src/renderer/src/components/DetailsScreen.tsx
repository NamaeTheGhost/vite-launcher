import { useNavigate } from 'react-router-dom'
import { useInstaller } from './InstallerContext'
import Footer from './Footer'

function DetailsScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const { projectName, setProjectName } = useInstaller()
  const canProceed = projectName.trim().length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">
            Proje Detayları
          </h1>
          <p className="text-sm text-on-surface-variant/70">
            Lütfen oluşturmak istediğiniz yeni projenin temel bilgilerini girin.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant/80 ml-1 uppercase tracking-wider">
              Proje Adı <span className="text-primary/70">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e): void => setProjectName(e.target.value)}
              placeholder="örneğin: modern-ui-projesi"
              className={`w-full bg-surface-container-high/50 border rounded-xl px-5 py-3.5 text-sm text-on-surface placeholder-on-surface-variant/30 focus:ring-1 outline-none transition-all ${
                projectName.length > 0 && projectName.trim().length === 0
                  ? 'border-red-400/40 focus:border-red-400/50 focus:ring-red-400/30'
                  : 'border-outline-variant/30 focus:border-primary/50 focus:ring-primary/30'
              }`}
            />
            <p className="text-xs text-on-surface-variant/40 ml-1">
              Bu ad proje klasörü ve meta veriler için kullanılacaktır.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant/80 ml-1 uppercase tracking-wider">
              Şablon Seçimi
            </label>
            <div className="bg-surface-container-high/30 border border-primary/30 rounded-xl p-4 flex items-center justify-between cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    terminal
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">
                    Standart TypeScript Uygulaması
                  </div>
                  <div className="text-xs text-on-surface-variant/50">
                    Vite + React + TypeScript
                  </div>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-on-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer
        onBack={(): void => {
          void navigate('/')
        }}
        onNext={(): void => {
          if (canProceed) void navigate('/features')
        }}
        nextDisabled={!canProceed}
        nextDisabledTitle="Lütfen bir proje adı girin"
      />
    </div>
  )
}

export default DetailsScreen
