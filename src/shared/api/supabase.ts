import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getPublicEnv, getSupabasePublishableKey, hasRequiredEnv } from '@/shared/config/env'
import type { Database } from '@/shared/types/database'

type BrowserSupabaseClient = SupabaseClient<Database>

let browserClient: BrowserSupabaseClient | null = null

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(15_000)
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal

  return fetch(input, { ...init, signal })
}

export function isSupabaseConfigured() {
  return hasRequiredEnv()
}

export function getSupabaseBrowserClient(): BrowserSupabaseClient {
  if (browserClient) {
    return browserClient
  }

  const env = getPublicEnv()
  const client = createClient<Database>(
    env.VITE_SUPABASE_URL,
    getSupabasePublishableKey(env),
    {
      global: {
        fetch: fetchWithTimeout,
      },
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
        storageKey: 'kumbh-melastore-auth',
      },
    },
  ) as BrowserSupabaseClient

  browserClient = client
  return client
}
