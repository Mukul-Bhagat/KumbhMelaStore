import * as React from 'react'

import { cn } from '@/shared/lib/cn'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | undefined
  alt?: string | undefined
  fallback?: string | undefined
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({
  src,
  alt = '',
  fallback = '',
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full border border-border bg-muted text-center font-medium text-muted-foreground',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      {!src ? <span className="absolute inset-0 grid place-items-center">{fallback}</span> : null}
    </div>
  )
}
