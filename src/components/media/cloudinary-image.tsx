import type { ImgHTMLAttributes } from 'react'

import { buildBlurDataUrl, buildCloudinarySrcSet, buildCloudinaryUrl } from '@/shared/lib/cloudinary'
import { cn } from '@/shared/lib/cn'

export interface CloudinaryImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  publicId: string
  alt: string
  widths?: number[]
  sizes?: string
  priority?: boolean
}

export function CloudinaryImage({
  publicId,
  alt,
  widths = [480, 768, 1024, 1440],
  sizes = '(min-width: 1024px) 50vw, 100vw',
  className,
  priority = false,
  loading,
  decoding = 'async',
  fetchPriority,
  ...props
}: CloudinaryImageProps) {
  return (
    <img
      src={buildCloudinaryUrl(publicId)}
      srcSet={buildCloudinarySrcSet(publicId, widths)}
      sizes={sizes}
      alt={alt}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding={decoding}
      fetchPriority={fetchPriority ?? (priority ? 'high' : 'auto')}
      data-blur={buildBlurDataUrl(alt)}
      className={cn('h-full w-full object-cover', className)}
      {...props}
    />
  )
}
