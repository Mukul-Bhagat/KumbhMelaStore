import { useEffect } from 'react'

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      return
    }

    const { body } = document
    const previous = body.style.overflow
    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previous
    }
  }, [locked])
}
