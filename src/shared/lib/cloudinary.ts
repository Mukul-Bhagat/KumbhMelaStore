import { getPublicEnv } from '@/shared/config/env'

export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  quality?: 'auto' | number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  fit?: 'cover' | 'contain' | 'fill' | 'crop'
  gravity?: 'auto' | 'face' | 'north' | 'south' | 'west' | 'east' | string
}

export interface CloudinaryUploadResult {
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
}

type CloudinaryUploadResponse = {
  public_id?: unknown
  secure_url?: unknown
  width?: unknown
  height?: unknown
  format?: unknown
  error?: { message?: unknown }
}

export async function uploadCloudinaryImage(file: File): Promise<CloudinaryUploadResult> {
  const { VITE_CLOUDINARY_CLOUD_NAME: cloudName, VITE_CLOUDINARY_UPLOAD_PRESET: uploadPreset } =
    getPublicEnv()

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Image upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to an unsigned, restricted Cloudinary upload preset.',
    )
  }

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, or AVIF image.')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Images must be 10 MB or smaller.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: 'POST', body: formData },
  )
  const payload = (await response.json()) as CloudinaryUploadResponse

  if (!response.ok) {
    throw new Error(
      typeof payload.error?.message === 'string'
        ? payload.error.message
        : `Cloudinary upload failed (${response.status}).`,
    )
  }

  if (
    typeof payload.public_id !== 'string' ||
    typeof payload.secure_url !== 'string' ||
    typeof payload.width !== 'number' ||
    typeof payload.height !== 'number' ||
    typeof payload.format !== 'string'
  ) {
    throw new Error('Cloudinary returned an incomplete image record.')
  }

  return {
    publicId: payload.public_id,
    secureUrl: payload.secure_url,
    width: payload.width,
    height: payload.height,
    format: payload.format,
  }
}

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

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim()

  if (!cloudName) {
    return normalizePublicId(publicId)
  }

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
