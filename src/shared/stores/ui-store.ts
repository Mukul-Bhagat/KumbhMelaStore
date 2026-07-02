import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface UiState {
  theme: ThemeMode
  locale: string
  currency: string
  mobileNavOpen: boolean
  searchOpen: boolean
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: string) => void
  setCurrency: (currency: string) => void
  setMobileNavOpen: (open: boolean) => void
  toggleMobileNav: () => void
  setSearchOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      locale: 'en-IN',
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
      name: 'kumbh-mela-store-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        currency: state.currency,
      }),
    },
  ),
)
