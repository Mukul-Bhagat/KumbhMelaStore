import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getPublicEnv, getSupabasePublishableKey, hasRequiredEnv } from '@/shared/config/env'
import type { Database } from '@/shared/types/database'

type BrowserSupabaseClient = SupabaseClient<Database>

let browserClient: BrowserSupabaseClient | null = null
let signupRetryAfterSeconds: number | null = null

function parseRetryAfter(value: string | null) {
  if (!value) {
    return null
  }

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds)
  }

  const retryAt = Date.parse(value)
  return Number.isNaN(retryAt)
    ? null
    : Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
}

function requestUrlFor(input: RequestInfo | URL) {
  return input instanceof Request ? input.url : String(input)
}

function headersWithSupabaseApiKey(input: RequestInfo | URL, init: RequestInit | undefined, requestUrl: string) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined)

  if (init?.headers) {
    new Headers(init.headers).forEach((value, name) => headers.set(name, value))
  }

  // Supabase clients normally add this header themselves. Set it at the
  // transport boundary as well so the browser request cannot lose the public
  // project key when a Request and RequestInit are merged by a custom fetch.
  // This fetch implementation is used only by this project's Supabase client;
  // the origin check additionally prevents the public key being sent elsewhere.
  const env = getPublicEnv()
  if (new URL(requestUrl).origin === new URL(env.VITE_SUPABASE_URL).origin) {
    headers.set('apikey', getSupabasePublishableKey(env))
  }

  return headers
}

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const timeoutSignal = AbortSignal.timeout(15_000)
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal
  const requestUrl = requestUrlFor(input)
  const headers = headersWithSupabaseApiKey(input, init, requestUrl)

  const response = await fetch(input, { ...init, headers, signal })
  const responseUrl = response.url || requestUrl

  if (import.meta.env.DEV) {
    try {
      const url = new URL(responseUrl)
      const rpcName = url.pathname.match(/\/rest\/v1\/rpc\/([^/]+)$/)?.[1]
      if (rpcName === 'get_manual_upi_payment_config' || rpcName === 'get_manual_upi_checkout_quote') {
        // Do not log headers, request bodies, or auth data. This is deliberately
        // limited to the transport facts needed to diagnose checkout setup.
        console.info('[checkout RPC transport]', {
          rpcName,
          status: response.status,
          ok: response.ok,
          project: url.host,
        })
      }
    } catch {
      // Diagnostics must never affect checkout requests.
    }
  }

  if (response.status === 429 && new URL(response.url || requestUrl).pathname.endsWith('/auth/v1/signup')) {
    signupRetryAfterSeconds = parseRetryAfter(response.headers.get('Retry-After'))
  }

  return response
}

export function consumeSignupRetryAfterSeconds() {
  const retryAfterSeconds = signupRetryAfterSeconds
  signupRetryAfterSeconds = null
  return retryAfterSeconds
}

export function getCanonicalAuthRedirectUrl(pathname = '/auth/callback', locale?: string) {
  const baseUrl = (
    import.meta.env.VITE_SITE_URL?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'https://kumbhmelastore.in'
  ).trim()

  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const url = new URL(normalizedPath, baseUrl)

  if (locale) {
    url.searchParams.set('locale', locale)
  }

  return url.toString()
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
