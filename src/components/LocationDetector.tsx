import { useEffect } from 'react'
import { useSelectedStore, useStore } from '../context/StoreContext'

/**
 * Handles the geolocation → nearest-store flow described in the spec:
 * request permission → compute nearest store via Haversine (in StoreContext)
 * → show "Shop From This Store" / "Change Store". Never blocks the page —
 * denial or an unsupported browser falls back to manual selection.
 */
export default function LocationDetector() {
  const { locationState, requestLocation, nearestStore, openSelector, setSelectedStoreId } = useStore()
  const selectedStore = useSelectedStore()

  // Ask once, automatically, on first mount — but never require it.
  useEffect(() => {
    requestLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (locationState === 'requesting' || locationState === 'idle') {
    return (
      <div className="flex items-center gap-3 rounded-card border border-sgs-line bg-white px-4 py-3 text-sm text-sgs-ink/70">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sgs-green" aria-hidden />
        Finding your nearest SGS store…
      </div>
    )
  }

  if (locationState === 'granted' && nearestStore) {
    return (
      <div className="rounded-card border border-sgs-green/30 bg-white px-4 py-4">
        <p className="text-xs font-medium text-sgs-green-dark mb-1">Your nearest SGS store</p>
        <p className="font-display font-semibold text-lg mb-0.5">{nearestStore.storeName}</p>
        <p className="text-sm text-sgs-ink/60 mb-3">
          {nearestStore.distanceKm !== null ? `${nearestStore.distanceKm.toFixed(1)} km away` : nearestStore.address}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full bg-sgs-green text-sgs-cream px-4 py-2 text-sm font-medium hover:bg-sgs-green-dark transition-colors"
            onClick={() => {
              setSelectedStoreId(nearestStore.storeId)
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Shop From This Store
          </button>
          <button
            className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green transition-colors"
            onClick={openSelector}
          >
            Change Store
          </button>
        </div>
      </div>
    )
  }

  // denied / unsupported — manual fallback, site still fully usable
  return (
    <div className="rounded-card border border-sgs-line bg-white px-4 py-4">
      <p className="font-display font-semibold mb-0.5">
        {selectedStore ? `Shopping from ${selectedStore.area}` : 'Choose your nearest SGS store'}
      </p>
      <p className="text-sm text-sgs-ink/60 mb-3">
        We couldn't detect your location automatically — pick your store manually.
      </p>
      <button
        className="rounded-full bg-sgs-green text-sgs-cream px-4 py-2 text-sm font-medium hover:bg-sgs-green-dark transition-colors"
        onClick={openSelector}
      >
        {selectedStore ? 'Change Store' : 'Select Store'}
      </button>
    </div>
  )
}
