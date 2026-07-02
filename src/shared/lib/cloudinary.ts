export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  quality?: 'auto' | number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  fit?: 'cover' | 'contain' | 'fill' | 'crop'
  gravity?: 'auto' | 'face' | 'north' | 'south' | 'west' | 'east' | string
}

const DEFAULT_CLOUD_NAME = 'demo'

function normalizePublicId(publicId: string) {
  return publicId.replace(/^\/+/, '')
}

function createTransformString(options: CloudinaryTransformOptions = {}) {
  const transforms: string[] = ['f_auto']

  if (options.format && options.format !== 'auto') {
    transforms.unshift(`f_${options.format}`)
  }

  if (typeof options.quality === 'number') {
    transforms.push(`q_${options.quality}`)
  } else {
    transforms.push('q_auto')
  }

  if (options.width) {
    transforms.push(`w_${Math.round(options.width)}`)
  }

  if (options.height) {
    transforms.push(`h_${Math.round(options.height)}`)
  }

  if (options.fit) {
    transforms.push(`c_${options.fit}`)
  } else {
    transforms.push('c_limit')
  }

  if (options.gravity) {
    transforms.push(`g_${options.gravity}`)
  }

  return transforms.join(',')
}

export function buildCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {},
) {
  if (/^https?:\/\//.test(publicId)) {
    return publicId
  }

  const cloudName =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || DEFAULT_CLOUD_NAME

  return `https://res.cloudinary.com/${cloudName}/image/upload/${createTransformString(
    options,
  )}/${normalizePublicId(publicId)}`
}

export function buildCloudinarySrcSet(
  publicId: string,
  widths = [480, 768, 1024, 1440],
  options: Omit<CloudinaryTransformOptions, 'width'> = {},
) {
  return widths
    .map(
      (width) =>
        `${buildCloudinaryUrl(publicId, { ...options, width })} ${width}w`,
    )
    .join(', ')
}

export function buildBlurDataUrl(
  label = 'KumbhMelaStore',
  background = '#f5efe6',
  foreground = '#b68952',
) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${label}">
      <rect width="24" height="24" rx="8" fill="${background}" />
      <circle cx="12" cy="11" r="4.25" fill="none" stroke="${foreground}" stroke-width="1.5" />
      <path d="M6 16.5c1.9-1.5 3.9-2.2 6-2.2s4.1.7 6 2.2" fill="none" stroke="${foreground}" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}
