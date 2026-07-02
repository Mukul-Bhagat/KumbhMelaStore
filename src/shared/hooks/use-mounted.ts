import { useState } from 'react'

export function useMounted() {
  const [mounted] = useState(() => typeof window !== 'undefined')

  return mounted
}
