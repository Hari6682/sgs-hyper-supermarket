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

  if (!isSelectorOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sgs-ink/40 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Select your SGS store"
      onClick={closeSelector}
    >
      <div
        className="w-full sm:max-w-md sm:rounded-card rounded-t-card bg-sgs-cream max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-sgs-line bg-sgs-cream px-5 py-4">
          <h2 className="font-display font-semibold text-lg">Choose your store</h2>
          <button onClick={closeSelector} aria-label="Close" className="text-xl leading-none px-1">
            ✕
          </button>
        </div>

        <ul className="divide-y divide-sgs-line px-5">
          {storesWithDistance.map((store) => {
            const isSelected = store.storeId === selectedStoreId
            const isRecommended = nearestStore?.storeId === store.storeId
            const open = isStoreOpenNow(store.openingHours.open, store.openingHours.close)

            return (
              <li key={store.storeId} className="py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-display font-semibold">{store.storeName}</p>
                    {isRecommended && (
                      <span className="rounded-full bg-sgs-mango/20 text-sgs-mango-dark text-xs font-medium px-2 py-0.5">
                        Recommended for You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-sgs-ink/60">{store.address}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-sgs-ink/60">
                    {store.distanceKm !== null && <span>{store.distanceKm.toFixed(1)} km away</span>}
                    <span className={open ? 'text-sgs-green-dark font-medium' : 'text-sgs-tomato font-medium'}>
                      {open ? 'Open now' : 'Closed now'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStoreId(store.storeId)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
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

        <p className="px-5 pb-5 pt-1 text-xs text-sgs-ink/50">
          More SGS locations are opening soon across Chennai.
        </p>
      </div>
    </div>
  )
}
