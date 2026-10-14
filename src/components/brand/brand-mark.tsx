import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { useLocale } from '@/shared/hooks/use-locale'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'

export interface BrandMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'lockup' | 'stacked' | 'symbol'
  linked?: boolean
  name?: string
  devanagari?: string
}

const sizeMap = {
  sm: {
    symbol: 'h-10 w-10',
    title: 'text-lg',
    subtitle: 'text-[0.65rem] tracking-[0.34em]',
  },
  md: {
    symbol: 'h-12 w-12',
    title: 'text-xl',
    subtitle: 'text-[0.68rem] tracking-[0.36em]',
  },
  lg: {
    symbol: 'h-16 w-16',
    title: 'text-2xl',
    subtitle: 'text-[0.72rem] tracking-[0.38em]',
  },
} as const

function BrandSymbol({ className }: { className?: string }) {
  return (
    <img
      src={site.brandLogoUrl}
      alt="KumbhMelaStore logo"
      className={cn('shrink-0 object-contain', className)}
      loading="eager"
      decoding="async"
    />
  )
}

function BrandWordmark({
  size = 'md',
  name = site.name,
  devanagari = site.devanagari,
}: {
  size?: keyof typeof sizeMap
  name?: string
  devanagari?: string
}) {
  const tokens = sizeMap[size]

  return (
    <div className="flex flex-col leading-none">
      <span className={cn(tokens.title, 'font-display font-semibold tracking-tight text-foreground')}>
        {name}
      </span>
      <span
        className={cn(
          tokens.subtitle,
          'font-devanagari uppercase text-primary/80',
        )}
      >
        {devanagari}
      </span>
    </div>
  )
}

function BrandLockup({
  size = 'md',
  variant = 'lockup',
  name = site.name,
  devanagari = site.devanagari,
}: {
  size?: keyof typeof sizeMap
  variant?: 'lockup' | 'stacked' | 'symbol'
  name?: string
  devanagari?: string
}) {
  const tokens = sizeMap[size]

  if (variant === 'symbol') {
    return <BrandSymbol className={cn(tokens.symbol, 'rounded-full bg-white/10 p-0.5 shadow-sm')} />
  }

  if (variant === 'stacked') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandSymbol className={cn(tokens.symbol, 'rounded-full bg-white/10 p-0.5 shadow-sm')} />
        <BrandWordmark size={size} name={name} devanagari={devanagari} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <BrandSymbol className={cn(tokens.symbol, 'rounded-full bg-white/10 p-0.5 shadow-sm')} />
      <BrandWordmark size={size} name={name} devanagari={devanagari} />
    </div>
  )
}

export function BrandMark({
  className,
  size = 'md',
  variant = 'lockup',
  linked = false,
  name = site.name,
  devanagari = site.devanagari,
}: BrandMarkProps) {
  const locale = useLocale()
  const mark: ReactNode = (
    <BrandLockup size={size} variant={variant} name={name} devanagari={devanagari} />
  )

  if (linked) {
    return (
      <Link to={routes.forLocale(locale, '')} aria-label={name} className={cn('inline-flex', className)}>
        {mark}
      </Link>
    )
  }

  return <div className={cn('inline-flex', className)}>{mark}</div>
}
