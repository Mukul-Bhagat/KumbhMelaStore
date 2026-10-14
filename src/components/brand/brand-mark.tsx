import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { useLocale } from '@/shared/hooks/use-locale'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'

export interface BrandMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'logo' | 'stacked' | 'symbol'
  linked?: boolean
  name?: string
  devanagari?: string
}

const sizeMap = {
  sm: 'h-auto w-[112px] sm:w-[130px]',
  md: 'h-auto w-[150px] sm:w-[170px]',
  lg: 'h-auto w-[180px] sm:w-[220px]',
} as const

function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={site.brandLogoUrl}
      alt="KumbhMelaStore logo"
      className={cn('block object-contain', className)}
      loading="eager"
      decoding="async"
    />
  )
}

function BrandLockup({ size = 'md', variant = 'logo' }: { size?: keyof typeof sizeMap; variant?: 'logo' | 'stacked' | 'symbol' }) {
  const logoClass = cn(sizeMap[size], (variant === 'stacked' || variant === 'symbol') && 'mx-auto')

  return <BrandLogo className={logoClass} />
}

export function BrandMark({
  className,
  size = 'md',
  variant = 'logo',
  linked = false,
  name = site.name,
}: BrandMarkProps) {
  const locale = useLocale()
  const mark: ReactNode = <BrandLockup size={size} variant={variant} />

  if (linked) {
    return (
      <Link to={routes.forLocale(locale, '')} aria-label={name} className={cn('inline-flex', className)}>
        {mark}
      </Link>
    )
  }

  return <div className={cn('inline-flex', className)}>{mark}</div>
}
