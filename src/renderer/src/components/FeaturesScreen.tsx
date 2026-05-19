import { useNavigate } from 'react-router-dom'
import { useInstaller } from './InstallerContext'
import Footer from './Footer'

function FeaturesScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const { features, toggleFeature, totalSizeMB } = useInstaller()
  const anyChecked = features.some((f) => f.checked)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">
            Özellikleri Seçin
          </h1>
          <p className="text-sm text-on-surface-variant/70">
            Projenize dahil etmek istediğiniz modülleri seçin.
          </p>
        </div>

        <div className="space-y-2.5">
          {features.map((f) => (
            <label
              key={f.id}
              onClick={(): void => toggleFeature(f.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                f.checked
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-outline-variant/20 bg-surface-container-high/20 hover:border-outline-variant/40'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    f.checked ? 'bg-primary/15' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      f.checked ? 'text-primary' : 'text-on-surface-variant/40'
                    }`}
                  >
                    {f.icon}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">{f.label}</div>
                  <div className="text-xs text-on-surface-variant/50">{f.desc}</div>
                  <div className="text-[11px] text-on-surface-variant/30 mt-0.5">
                    ~{f.sizeMB} MB
                  </div>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                  f.checked ? 'border-primary bg-primary' : 'border-outline-variant/40'
                }`}
              >
                {f.checked && (
                  <span className="material-symbols-outlined text-[14px] text-on-primary">
                    check
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-[16px]">storage</span>
          <span className="text-xs font-medium">Seçilen toplam: ~{totalSizeMB} MB</span>
        </div>
      </div>

      <Footer
        onBack={(): void => {
          void navigate('/details')
        }}
        onNext={(): void => {
          if (anyChecked) void navigate('/location')
        }}
        nextDisabled={!anyChecked}
        nextDisabledTitle="En az bir özellik seçmelisiniz"
      />
    </div>
  )
}

export default FeaturesScreen
