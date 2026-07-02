import { Link } from 'react-router-dom'

import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'

export interface BrandMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  linked?: boolean
}

const sizeClasses = {
  sm: 'w-32 sm:w-36',
  md: 'w-40 sm:w-48',
  lg: 'w-52 sm:w-64',
}

export function BrandMark({ className, size = 'md', linked = false }: BrandMarkProps) {
  const mark = (
    <img
      src="/logo.png"
      alt={site.name}
      className={cn(
        'h-auto select-none object-contain',
        sizeClasses[size],
        className,
      )}
      draggable={false}
    />
  )

  if (linked) {
    return (
      <Link to="/" aria-label={site.name} className="inline-flex">
        {mark}
      </Link>
    )
  }

  return mark
}
