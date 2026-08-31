import { ACTIVE_STORES } from '../data/stores'

export default function PickupInfoPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="max-w-content mx-auto px-4 py-10">
      <button onClick={onBack} className="mb-6 text-sm font-medium text-sgs-green-dark">
        ← Back to shopping
      </button>
      <div className="rounded-[32px] border border-sgs-line bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">Pickup Information</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-sgs-ink">How pickup works</h1>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-sgs-sage/30 p-4">
            <p className="font-semibold text-sgs-ink">1. Place your order</p>
            <p className="mt-2 text-sm text-sgs-ink/70">Choose a store, confirm your slot, and place the order from checkout.</p>
          </div>
          <div className="rounded-2xl bg-sgs-sage/30 p-4">
            <p className="font-semibold text-sgs-ink">2. Wait for status updates</p>
            <p className="mt-2 text-sm text-sgs-ink/70">The order moves from Placed to Confirmed, then Ready for Pickup once the team finishes it.</p>
          </div>
          <div className="rounded-2xl bg-sgs-sage/30 p-4">
            <p className="font-semibold text-sgs-ink">3. Collect at the store</p>
            <p className="mt-2 text-sm text-sgs-ink/70">Bring your order number and phone number when you arrive for collection.</p>
          </div>
        </div>

        <h2 className="mt-8 font-display text-2xl font-bold text-sgs-ink">Active stores</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ACTIVE_STORES.map((store) => (
            <div key={store.storeId} className="rounded-2xl border border-sgs-line p-4">
              <p className="font-semibold text-sgs-ink">{store.storeName}</p>
              <p className="mt-2 text-sm text-sgs-ink/70">{store.address}</p>
              <p className="mt-2 text-sm text-sgs-ink/60">
                {store.openingHours.open} - {store.openingHours.close} · {store.phone}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
