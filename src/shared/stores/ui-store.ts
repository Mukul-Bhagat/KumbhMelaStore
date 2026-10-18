import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { defaultLocale, type Locale } from '@/shared/config/locales'

export const UI_STORAGE_KEY = 'kumbh-mela-store-ui'

export type ThemeMode = 'light' | 'dark' | 'system'

interface UiState {
  theme: ThemeMode
  locale: Locale
  currency: string
  mobileNavOpen: boolean
  searchOpen: boolean
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: Locale) => void
  setCurrency: (currency: string) => void
  setMobileNavOpen: (open: boolean) => void
  toggleMobileNav: () => void
  setSearchOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      locale: defaultLocale,
      currency: 'INR',
      mobileNavOpen: false,
      searchOpen: false,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      toggleMobileNav: () =>
        set({ mobileNavOpen: !get().mobileNavOpen }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: UI_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        currency: state.currency,
      }),
    },
  ),
)
