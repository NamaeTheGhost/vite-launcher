import { useNavigate } from 'react-router-dom'
import Footer from './Footer'

function WelcomeScreen(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center pistachio-glow mb-6">
          <span
            className="material-symbols-outlined text-primary text-[40px] animate-bolt"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            bolt
          </span>
        </div>

        <h1 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">
          Vite Projenize Hoş Geldiniz
        </h1>

        <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-8 max-w-md">
          Modern ve hızlı bir geliştirme deneyimi için doğru yerdesiniz. Bu araç, projenizi
          saniyeler içinde yapılandırmanıza yardımcı olur.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: 'Turbo Hız', icon: 'bolt' },
            { label: 'HMR Desteği', icon: 'autorenew' },
            { label: 'Güvenli Kurulum', icon: 'verified' }
          ].map((feat, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-surface-container-highest/50 px-3.5 py-2 rounded-xl border border-outline-variant/20 text-on-surface/80"
            >
              <span className="material-symbols-outlined text-primary text-[14px]">
                {feat.icon}
              </span>
              <span className="text-xs font-semibold">{feat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Footer
        onBack={(): void => {}}
        onNext={(): void => {
          void navigate('/details')
        }}
        backText="Back"
        nextText="Start Setup"
      />
    </div>
  )
}

export default WelcomeScreen
