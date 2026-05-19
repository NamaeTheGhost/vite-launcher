interface FooterProps {
  onBack: () => void
  onNext: () => void
  backText?: string
  nextText?: string
  nextIcon?: string
  isPrimary?: boolean
  nextDisabled?: boolean
  nextDisabledTitle?: string
}

function Footer({
  onBack,
  onNext,
  backText = 'Geri',
  nextText = 'İleri',
  nextIcon = 'arrow_forward',
  isPrimary = true,
  nextDisabled = false,
  nextDisabledTitle
}: FooterProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20">
      <button
        onClick={onBack}
        className="px-5 py-2 rounded-xl text-sm font-semibold text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        {backText}
      </button>
      <button
        onClick={nextDisabled ? undefined : onNext}
        title={nextDisabled ? nextDisabledTitle : undefined}
        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
          nextDisabled
            ? 'bg-surface-container-high text-on-surface-variant/30 cursor-not-allowed'
            : isPrimary
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95'
              : 'bg-primary-container/80 text-on-primary-container hover:bg-primary-container active:scale-95'
        }`}
      >
        {nextText}
        <span className="material-symbols-outlined text-[18px]">{nextIcon}</span>
      </button>
    </div>
  )
}

export default Footer
