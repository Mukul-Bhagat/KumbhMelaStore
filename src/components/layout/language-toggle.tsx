import { useLocaleActions } from '@/shared/hooks/use-locale'

export function LanguageToggleButton() {
  const { locale, setLocale } = useLocaleActions()

  return (
    <div className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full border border-border bg-card px-1 text-xs" role="group" aria-label="Language">
      <button
        type="button"
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
        className={`h-6 min-w-7 rounded-full px-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${locale === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        EN
      </button>
      <span aria-hidden="true" className="text-muted-foreground">|</span>
      <button
        type="button"
        aria-pressed={locale === 'hi'}
        onClick={() => setLocale('hi')}
        className={`h-6 rounded-full px-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${locale === 'hi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        हिन्दी
      </button>
    </div>
  )
}
