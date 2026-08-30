import { useEffect, useState } from 'react'

/** Simple typed localStorage-backed state. Used for cart + selected store
 * persistence so an accidental refresh doesn't lose the customer's session. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage unavailable (private browsing, quota) — fail silently,
      // the app still works, it just won't persist across refresh.
    }
  }, [key, value])

  return [value, setValue] as const
}
