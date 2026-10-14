import type { User } from '@supabase/supabase-js'

import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { normalizeLocale, type Locale } from '@/shared/config/locales'
import { site } from '@/shared/config/site'
import type { AuthProfile, AppRole } from '@/shared/auth/types'

export async function fetchAuthProfile(user: User): Promise<AuthProfile> {
  const supabase = getSupabaseBrowserClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, avatar_url, phone, locale_code')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError && profileError.code !== '42P01') {
    throw profileError
  }

  const [userRolesResult, rolesResult] = await Promise.all([
    supabase.from('user_roles').select('role_id').eq('user_id', user.id),
    supabase.from('roles').select('id, slug'),
  ])

  const rolesError = userRolesResult.error ?? rolesResult.error
  if (rolesError) {
    throw rolesError
  }

  const roleIds = new Set((userRolesResult.data ?? []).map((row) => row.role_id))
  const resolvedRoles = (rolesResult.data ?? [])
    .filter((role) => roleIds.has(role.id))
    .map((role) => role.slug as AppRole)
  const mappedRoles: AppRole[] = resolvedRoles.length > 0 ? resolvedRoles : ['customer']

  return {
    id: user.id,
    fullName: profile?.full_name ?? user.user_metadata.full_name ?? null,
    displayName: profile?.display_name ?? user.user_metadata.full_name ?? user.email ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    phone: profile?.phone ?? user.user_metadata.phone ?? null,
    localeCode: normalizeLocale(profile?.locale_code ?? user.user_metadata.locale ?? site.defaultLocale),
    roles: mappedRoles,
  }
}

export function getRedirectPathForRoles(roles: AppRole[] | undefined, fallback: string) {
  return roles?.includes('super_admin') ? '/admin' : fallback
}

export function getPreferredLocaleFromProfile(profile: AuthProfile | null): Locale {
  return normalizeLocale(profile?.localeCode ?? site.defaultLocale)
}
