import { useEffect, useRef } from 'react'
import { useStore } from '../context/StoreContext'

function isStoreOpenNow(open: string, close: string): boolean {
  const now = new Date()
  const [openH, openM] = open.split(':').map(Number)
  const [closeH, closeM] = close.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes
}

export default function StoreSelectorModal() {
  const { isSelectorOpen, closeSelector, storesWithDistance, selectedStoreId, setSelectedStoreId, nearestStore } =
    useStore()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isSelectorOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeSelector()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeSelector, isSelectorOpen])

  if (!isSelectorOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-sgs-ink/45 sm:items-center sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Select your SGS store"
      onClick={closeSelector}
    >
      <div
        className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-sgs-cream shadow-2xl sm:max-h-[min(85dvh,720px)] sm:max-w-lg sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-sgs-line bg-sgs-cream px-4 pb-3 pt-2 sm:px-5 sm:py-4">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-sgs-line sm:hidden" aria-hidden />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sgs-green-dark/70">Pickup location</p>
              <h2 className="font-display text-lg font-semibold sm:text-xl">Choose your store</h2>
            </div>
          <button
            ref={closeButtonRef}
            onClick={closeSelector}
            aria-label="Close store selector"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sgs-line bg-white text-xl leading-none"
          >
            ✕
          </button>
          </div>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-sgs-line overflow-y-auto overscroll-contain px-4 sm:px-5">
          {storesWithDistance.map((store) => {
            const isSelected = store.storeId === selectedStoreId
            const isRecommended = nearestStore?.storeId === store.storeId
            const open = isStoreOpenNow(store.openingHours.open, store.openingHours.close)

            return (
              <li key={store.storeId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-display font-semibold">{store.storeName}</p>
                    {isRecommended && (
                      <span className="rounded-full bg-sgs-mango/20 text-sgs-mango-dark text-xs font-medium px-2 py-0.5">
                        Recommended for You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-sgs-ink/60">{store.address}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sgs-ink/60">
                    {store.distanceKm !== null && <span>{store.distanceKm.toFixed(1)} km away</span>}
                    <span className={open ? 'text-sgs-green-dark font-medium' : 'text-sgs-tomato font-medium'}>
                      {open ? 'Open now' : 'Closed now'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStoreId(store.storeId)}
                  className={`min-h-11 w-full shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors sm:min-h-0 sm:w-auto sm:py-2 ${
                    isSelected
                      ? 'bg-sgs-green-dark text-sgs-cream'
                      : 'bg-sgs-green text-sgs-cream hover:bg-sgs-green-dark'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Store'}
                </button>
              </li>
            )
          })}
        </ul>

        <p className="shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 text-xs text-sgs-ink/50 sm:px-5 sm:pb-5">
          More SGS locations are opening soon across Chennai.
        </p>
      </div>
    </div>
  )
}
