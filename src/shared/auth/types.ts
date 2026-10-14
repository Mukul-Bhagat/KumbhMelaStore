import type { Session, User } from '@supabase/supabase-js'

export type AppRole = 'customer' | 'super_admin' | 'admin' | 'vendor'

export interface AuthProfile {
  id: string
  fullName: string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  localeCode: 'hi' | 'en'
  roles: AppRole[]
}

export interface AuthState {
  status: 'loading' | 'anonymous' | 'authenticated'
  session: Session | null
  user: User | null
  profile: AuthProfile | null
}
