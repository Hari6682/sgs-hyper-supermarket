import { useMemo, useState } from 'react'
import { ACTIVE_STORES, getStoreById } from '../data/stores'
import { PICKUP_SLOTS, PICKUP_DAYS_AHEAD } from '../data/pickupSlots'
import { formatRupees } from '../lib/currency'
import { useCart } from '../context/CartContext'
import { useOrderCenter } from '../context/OrderCenterContext'
import { useProductCatalog } from '../context/ProductCatalogContext'
import { useStore } from '../context/StoreContext'
import Payment from './Payment'
import type { CustomerDetails, Order } from '../types'

interface CheckoutProps {
  onOrderPlaced: (order: Order) => void
  onBack: () => void
}

function upcomingDates(daysAhead: number) {
  return Array.from({ length: daysAhead }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function toIsoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function Checkout({ onOrderPlaced, onBack }: CheckoutProps) {
  const { lines, subtotal, clearCart } = useCart()
  const { placeOrder } = useOrderCenter()
  const { products } = useProductCatalog()
  const { selectedStoreId, setSelectedStoreId } = useStore()

  const [fullName, setFullName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [email, setEmail] = useState('')
  const [pickupDate, setPickupDate] = useState(toIsoDate(new Date()))
  const [pickupSlotId, setPickupSlotId] = useState('')
  const [formError, setFormError] = useState('')

  const dates = useMemo(() => upcomingDates(PICKUP_DAYS_AHEAD), [])
  const selectedStore = selectedStoreId ? getStoreById(selectedStoreId) : null

  const items = lines
    .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
    .filter((x): x is { line: typeof lines[number]; product: NonNullable<typeof x.product> } => !!x.product)

  const charges = 0 // Phase 1: in-store pickup has no delivery/service charge
  const total = subtotal + charges

  const isFormValid =
    fullName.trim().length > 1 &&
    /^[6-9]\d{9}$/.test(mobileNumber.trim()) &&
    !!selectedStoreId &&
    !!pickupDate &&
    !!pickupSlotId

  function validateAndReturnError(): string {
    if (fullName.trim().length < 2) return 'Please enter your full name.'
    if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) return 'Please enter a valid 10-digit mobile number.'
    if (!selectedStoreId) return 'Please select a pickup store.'
    if (!pickupSlotId) return 'Please select a pickup time slot.'
    return ''
  }

  async function handlePaymentSuccess() {
    const customer: CustomerDetails = {
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.trim() || undefined,
    }

    const order: Order = {
      orderNumber: `SGS${Math.floor(10000 + Math.random() * 89999)}`,
      customer,
      storeId: selectedStoreId!,
      orderType: 'PICKUP',
      lines: items.map(({ line, product }) => ({
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        packSize: product.packSize,
        imageUrl: product.imageUrl,
        quantity: line.quantity,
        unitPrice: product.price,
        lineTotal: product.price * line.quantity,
      })),
      pickupDate,
      pickupSlotId,
      subtotal,
      charges,
      total,
      paymentStatus: 'PAID',
      orderStatus: 'PLACED',
      statusNote: 'We have received your order and the store team will confirm it shortly.',
      createdAt: new Date().toISOString(),
    }

    try {
      const savedOrder = await placeOrder(order)
      clearCart()
      onOrderPlaced(savedOrder)
    } catch {
      setFormError('We could not save your order right now. Please try again.')
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-content mx-auto px-4 py-16 text-center">
        <p className="font-display font-semibold text-lg mb-2">Your cart is empty</p>
        <button onClick={onBack} className="text-sgs-green-dark font-medium underline">
          Back to shopping
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-content mx-auto px-4 py-8 grid lg:grid-cols-[1.3fr_1fr] gap-8">
      <div>
        <button onClick={onBack} className="text-sm text-sgs-green-dark font-medium mb-6">
          ← Back to shopping
        </button>
        <h1 className="font-display font-bold text-2xl mb-6">Checkout</h1>

        {/* Customer information */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg mb-3">Customer information</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-card border border-sgs-line px-3.5 py-2.5 focus:border-sgs-green"
                placeholder="Priya Raman"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mobile">
                Mobile number
              </label>
              <input
                id="mobile"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full rounded-card border border-sgs-line px-3.5 py-2.5 focus:border-sgs-green"
                placeholder="98765 43210"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email <span className="text-sgs-ink/40 font-normal">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-card border border-sgs-line px-3.5 py-2.5 focus:border-sgs-green"
                placeholder="you@example.com"
              />
            </div>
          </div>
        </section>

        {/* Pickup store */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg mb-3">Pickup location</h2>
          <div className="rounded-card border border-sgs-line bg-white px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{selectedStore?.storeName ?? 'No store selected'}</p>
              <p className="text-sm text-sgs-ink/60">{selectedStore?.address}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {ACTIVE_STORES.map((s) => (
              <button
                key={s.storeId}
                onClick={() => setSelectedStoreId(s.storeId)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  s.storeId === selectedStoreId
                    ? 'bg-sgs-green text-sgs-cream border-sgs-green'
                    : 'bg-white border-sgs-line hover:border-sgs-green'
                }`}
              >
                {s.area}
              </button>
            ))}
          </div>
        </section>

        {/* Pickup date & time */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg mb-3">Pickup date &amp; time</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
            {dates.map((d) => {
              const iso = toIsoDate(d)
              const isSelected = iso === pickupDate
              return (
                <button
                  key={iso}
                  onClick={() => setPickupDate(iso)}
                  className={`shrink-0 rounded-card border px-3.5 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-sgs-green text-sgs-cream border-sgs-green'
                      : 'bg-white border-sgs-line hover:border-sgs-green'
                  }`}
                >
                  {formatDateLabel(d)}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PICKUP_SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setPickupSlotId(slot.id)}
                className={`rounded-card border px-3 py-2.5 text-sm font-medium transition-colors ${
                  slot.id === pickupSlotId
                    ? 'bg-sgs-green text-sgs-cream border-sgs-green'
                    : 'bg-white border-sgs-line hover:border-sgs-green'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </section>

        {/* Order type */}
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Order type</h2>
          <div className="flex items-center justify-between rounded-card border border-sgs-green bg-sgs-green/5 px-4 py-3 mb-2">
            <span className="font-medium text-sgs-green-dark">✓ In-Store Pickup</span>
          </div>
          <div className="flex items-center justify-between rounded-card border border-dashed border-sgs-line px-4 py-3 text-sgs-ink/40">
            <span>Home Delivery</span>
            <span className="text-xs font-medium">Coming Soon</span>
          </div>
        </section>
      </div>

      {/* Order summary + payment */}
      <aside className="lg:sticky lg:top-24 h-fit rounded-card border border-sgs-line bg-white p-5">
        <h2 className="font-display font-semibold text-lg mb-4">Order summary</h2>
        <ul className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {items.map(({ line, product }) => (
            <li key={product.id} className="flex justify-between text-sm">
              <span className="text-sgs-ink/70">
                {product.name} × {line.quantity}
              </span>
              <span className="font-medium">{formatRupees(product.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 border-t border-sgs-line pt-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-sgs-ink/60">Subtotal</span>
            <span>{formatRupees(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sgs-ink/60">Charges</span>
            <span>{formatRupees(charges)}</span>
          </div>
          <div className="flex justify-between font-display font-bold text-lg pt-1">
            <span>Total</span>
            <span>{formatRupees(total)}</span>
          </div>
        </div>

        {formError && <p className="text-sm text-sgs-tomato mb-3">{formError}</p>}

        <Payment
          amount={total}
          customerName={fullName || 'Customer'}
          customerPhone={mobileNumber}
          customerEmail={email || undefined}
          disabled={!isFormValid}
          onSuccess={handlePaymentSuccess}
        />
        {!isFormValid && (
          <button
            className="w-full text-center text-xs text-sgs-ink/50 mt-2"
            onClick={() => setFormError(validateAndReturnError())}
          >
            What's missing?
          </button>
        )}
      </aside>
    </div>
  )
}
