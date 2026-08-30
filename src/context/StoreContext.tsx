import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ACTIVE_STORES, getStoreById } from '../data/stores'
import { sortStoresByDistance, type StoreWithDistance } from '../lib/haversine'
import type { Coordinates } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'

type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

interface StoreContextValue {
  selectedStoreId: string | null
  setSelectedStoreId: (storeId: string) => void
  customerCoords: Coordinates | null
  locationState: LocationState
  storesWithDistance: StoreWithDistance[]
  nearestStore: StoreWithDistance | null
  requestLocation: () => void
  isSelectorOpen: boolean
  openSelector: () => void
  closeSelector: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [selectedStoreId, setSelectedStoreIdRaw] = useLocalStorage<string | null>(
    'sgs.selectedStoreId',
    null,
  )
  const [customerCoords, setCustomerCoords] = useState<Coordinates | null>(null)
  const [locationState, setLocationState] = useState<LocationState>('idle')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationState('unsupported')
      return
    }
    setLocationState('requesting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationState('granted')
      },
      () => {
        // Permission denied, timeout, or position unavailable — never
        // break the site, just fall back to manual selection.
        setLocationState('denied')
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  }, [])

  const storesWithDistance = useMemo(
    () => sortStoresByDistance(ACTIVE_STORES, customerCoords),
    [customerCoords],
  )

  const nearestStore = customerCoords ? storesWithDistance[0] ?? null : null

  const setSelectedStoreId = useCallback(
    (storeId: string) => {
      setSelectedStoreIdRaw(storeId)
      setIsSelectorOpen(false)
    },
    [setSelectedStoreIdRaw],
  )

  // Auto-adopt the nearest store the first time we get a location fix,
  // as long as the customer hasn't already picked one manually.
  useEffect(() => {
    if (nearestStore && !selectedStoreId) {
      setSelectedStoreIdRaw(nearestStore.storeId)
    }
  }, [nearestStore, selectedStoreId, setSelectedStoreIdRaw])

  const value: StoreContextValue = {
    selectedStoreId,
    setSelectedStoreId,
    customerCoords,
    locationState,
    storesWithDistance,
    nearestStore,
    requestLocation,
    isSelectorOpen,
    openSelector: () => setIsSelectorOpen(true),
    closeSelector: () => setIsSelectorOpen(false),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useSelectedStore() {
  const { selectedStoreId } = useStore()
  return selectedStoreId ? getStoreById(selectedStoreId) ?? null : null
}
