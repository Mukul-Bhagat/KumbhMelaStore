import { z } from 'zod'

const publicEnvSchema = z.object({
  VITE_SITE_URL: z.string().url().default('https://kumbhmelastore.in'),
  VITE_SUPABASE_URL: z.string().trim().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1).optional(),
  VITE_SUPABASE_ANON_KEY: z.string().trim().min(1).optional(),
  VITE_CLOUDINARY_CLOUD_NAME: z.string().trim().transform((value) => value || undefined).optional(),
  VITE_CLOUDINARY_UPLOAD_PRESET: z.string().trim().transform((value) => value || undefined).optional(),
  VITE_ENABLE_GITHUB_OAUTH: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

let cachedEnv: PublicEnv | null = null

function ensureSupabaseKey(env: PublicEnv) {
  if (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY) {
    return
  }

  throw new Error(
    'Missing Supabase publishable key. Set VITE_SUPABASE_PUBLISHABLE_KEY (or the legacy VITE_SUPABASE_ANON_KEY) in your local environment.',
  )
}

export function getPublicEnv() {
  if (cachedEnv) {
    return cachedEnv
  }

  const parsed = publicEnvSchema.safeParse(import.meta.env)

  if (!parsed.success) {
    throw new Error(
      `Missing or invalid Vite environment variables: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
    )
  }

  ensureSupabaseKey(parsed.data)
  cachedEnv = parsed.data
  return cachedEnv
}

export function getSupabasePublishableKey(env = getPublicEnv()) {
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY

  if (!key) {
    throw new Error(
      'Missing Supabase publishable key. Set VITE_SUPABASE_PUBLISHABLE_KEY (or the legacy VITE_SUPABASE_ANON_KEY) in your local environment.',
    )
  }

  return key
}

export function hasRequiredEnv() {
  try {
    getPublicEnv()
    return true
  } catch {
    return false
  }
}

export function isGithubOAuthEnabled() {
  return import.meta.env.VITE_ENABLE_GITHUB_OAUTH?.trim() === 'true'
}
