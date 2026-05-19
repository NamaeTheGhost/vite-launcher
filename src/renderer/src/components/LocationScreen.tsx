import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInstaller } from './InstallerContext'
import Footer from './Footer'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(1)} GB`
}

function LocationScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const {
    totalSizeMB,
    diskSpace,
    setDiskSpace,
    installPath,
    setInstallPath,
    projectName,
    features,
    setIsInstalling
  } = useInstaller()
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState<{
    stage: string
    message: string
    percent: number
  } | null>(null)
  const [error, setError] = useState('')

  const totalSizeBytes = totalSizeMB * 1024 * 1024

  useEffect(() => {
    const drive = installPath.startsWith('\\\\') ? installPath : installPath.split(':')[0] + ':\\'
    window.api.getDiskSpace(drive).then((space) => {
      setDiskSpace(space)
    })
  }, [installPath, setDiskSpace])

  const freeBytes = diskSpace?.free ?? 0
  const enoughSpace = freeBytes >= totalSizeBytes || freeBytes === 0

  const handleSelectDir = useCallback(async (): Promise<void> => {
    const dir = await window.api.selectDirectory()
    if (dir) setInstallPath(dir)
  }, [setInstallPath])

  const handleInstall = useCallback(async (): Promise<void> => {
    if (!enoughSpace) return
    setInstalling(true)
    setIsInstalling(true)
    setError('')

    const cleanup = window.api.onProjectProgress((data) => {
      setProgress(data)
    })

    try {
      const activeFeatures = features.filter((f) => f.checked).map((f) => f.id)
      const result = await window.api.createProject({
        targetDir: installPath,
        projectName: projectName.trim(),
        features: activeFeatures
      })

      if (result.success) {
        setProgress({ stage: 'done', message: 'Kurulum başarıyla tamamlandı!', percent: 100 })
      } else {
        setError(result.error || 'Bilinmeyen bir hata oluştu')
        setInstalling(false)
        setIsInstalling(false)
        setProgress(null)
      }
    } catch (err) {
      setError(String(err))
      setInstalling(false)
      setIsInstalling(false)
      setProgress(null)
    } finally {
      cleanup()
    }
  }, [enoughSpace, features, installPath, projectName, setIsInstalling])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Kurulum Konumu</h1>
          <p className="text-sm text-on-surface-variant/70">
            Lütfen yazılımın kurulacağı hedef dizini seçin.
          </p>
        </div>

        <div className="space-y-5">
          <div className="bg-surface-container-high/20 rounded-xl p-5 border border-outline-variant/15">
            <label className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wider block mb-3">
              Yükleme Yolu
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-surface-container-highest/40 rounded-xl px-4 py-3 border border-outline-variant/20 focus-within:border-primary/40 transition-all flex items-center gap-2.5">
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">
                  folder
                </span>
                <input
                  className="bg-transparent border-none outline-none text-sm text-on-surface/80 w-full p-0"
                  readOnly
                  type="text"
                  value={installPath + '\\' + projectName}
                />
              </div>
              <button
                onClick={handleSelectDir}
                disabled={installing}
                className="px-5 py-3 rounded-xl bg-surface-container-highest text-sm font-semibold text-on-surface-variant/70 hover:text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 border border-outline-variant/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Gözat
              </button>
            </div>
          </div>

          {progress && (
            <div className="bg-surface-container-high/20 rounded-xl p-5 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                {progress.stage !== 'done' ? (
                  <span className="material-symbols-outlined text-primary animate-spin text-[20px]">
                    sync
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    check_circle
                  </span>
                )}
                <span className="text-sm font-medium text-on-surface">{progress.message}</span>
              </div>
              {progress.stage !== 'done' && (
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-400/5 rounded-xl p-4 border border-red-400/20">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-red-400 text-[18px] mt-0.5">
                  error
                </span>
                <div>
                  <span className="text-xs font-semibold text-red-400/80 uppercase tracking-wider">
                    Hata
                  </span>
                  <p className="text-sm text-red-400/70 mt-0.5 break-all">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-high/20 rounded-xl p-5 border border-outline-variant/15">
              <span className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider block mb-1.5">
                Gerekli Alan
              </span>
              <span className="text-xl font-bold text-on-surface">
                {formatBytes(totalSizeBytes)}
              </span>
              {totalSizeMB > 0 && (
                <div className="mt-2 w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width:
                        freeBytes > 0
                          ? `${Math.min((totalSizeBytes / freeBytes) * 100, 100)}%`
                          : '0%'
                    }}
                  />
                </div>
              )}
            </div>
            <div className="bg-surface-container-high/20 rounded-xl p-5 border border-outline-variant/15">
              <span className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-wider block mb-1.5">
                Kullanılabilir Alan
              </span>
              <span
                className={`text-xl font-bold ${enoughSpace ? 'text-primary' : 'text-red-400'}`}
              >
                {freeBytes > 0 ? formatBytes(freeBytes) : 'Sorgulanıyor...'}
              </span>
              {!enoughSpace && freeBytes > 0 && (
                <p className="text-[11px] text-red-400/70 mt-1">Yetersiz alan!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer
        onBack={(): void => {
          void navigate('/features')
        }}
        onNext={handleInstall}
        nextText={
          installing
            ? `${progress?.percent ?? 0}%`
            : progress?.stage === 'done'
              ? 'Tamamlandı'
              : 'Kurulumu Başlat'
        }
        nextIcon={installing ? 'sync' : progress?.stage === 'done' ? 'check' : 'rocket_launch'}
        isPrimary={false}
        nextDisabled={installing || (!enoughSpace && freeBytes > 0)}
        nextDisabledTitle={!enoughSpace && freeBytes > 0 ? 'Yeterli disk alanı yok' : undefined}
      />
    </div>
  )
}

export default LocationScreen
