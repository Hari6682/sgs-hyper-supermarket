import { useCallback, useEffect, useState } from 'react'
import { PICKUP_SLOTS } from '../data/pickupSlots'
import { getStoreById } from '../data/stores'
import { formatRupees } from '../lib/currency'
import { useOrderCenter } from '../context/OrderCenterContext'
import type { Order } from '../types'

export default function TrackOrderPage({ onBack }: { onBack: () => void }) {
  const { trackOrder, lastPlacedOrderNumber, lastPlacedOrderPhone } = useOrderCenter()
  const [orderNumber, setOrderNumber] = useState(() => new URLSearchParams(window.location.search).get('order') || lastPlacedOrderNumber || '')
  const [mobileNumber, setMobileNumber] = useState(lastPlacedOrderPhone || '')
  const [order, setOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!orderNumber.trim() || !mobileNumber.trim()) {
      setMessage('Enter both the order number and the mobile number used during checkout.')
      return
    }

    setIsLoading(true)
    setMessage('')
    const nextOrder = await trackOrder(orderNumber.trim(), mobileNumber.trim())
    setOrder(nextOrder)
    setMessage(nextOrder ? '' : 'No order matched that order number and mobile number.')
    setIsLoading(false)
  }, [mobileNumber, orderNumber, trackOrder])

  useEffect(() => {
    if (!orderNumber || !mobileNumber) return
    void loadOrder()
    const intervalId = window.setInterval(() => {
      void loadOrder()
    }, 20000)
    return () => window.clearInterval(intervalId)
  }, [loadOrder, mobileNumber, orderNumber])

  const slot = order ? PICKUP_SLOTS.find((item) => item.id === order.pickupSlotId) : null
  const store = order ? getStoreById(order.storeId) : null

  return (
    <main className="max-w-content mx-auto px-4 py-10">
      <button onClick={onBack} className="mb-6 text-sm font-medium text-sgs-green-dark">
        ← Back to shopping
      </button>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] border border-sgs-line bg-sgs-sage/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">Track My Order</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-sgs-ink">Check your order status</h1>
          <p className="mt-4 text-sm text-sgs-ink/70">
            Enter the same order number and mobile number you used during checkout. This page refreshes itself every 20 seconds.
          </p>
          <div className="mt-6 space-y-3">
            <input
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              className="w-full rounded-2xl border border-sgs-line px-4 py-3"
              placeholder="Order number"
            />
            <input
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full rounded-2xl border border-sgs-line px-4 py-3"
              placeholder="Mobile number"
              inputMode="numeric"
            />
            <button
              onClick={() => void loadOrder()}
              className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark"
            >
              {isLoading ? 'Checking…' : 'Track order'}
            </button>
            {message && <p className="text-sm text-sgs-ink/70">{message}</p>}
          </div>
        </section>

        <section className="rounded-[28px] border border-sgs-line bg-white p-6 shadow-sm">
          {!order ? (
            <div className="rounded-2xl border border-dashed border-sgs-line px-6 py-16 text-center text-sm text-sgs-ink/60">
              Your latest order status will appear here.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl font-bold text-sgs-ink">#{order.orderNumber}</h2>
                <span className="rounded-full bg-sgs-green/10 px-3 py-1 text-xs font-semibold text-sgs-green-dark">
                  {order.orderStatus}
                </span>
              </div>
              <div className="rounded-2xl bg-sgs-sage/30 p-4 text-sm text-sgs-ink/70">
                {order.statusNote || 'The store team is processing your order.'}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-sgs-line p-4">
                  <p className="font-semibold text-sgs-ink">Pickup store</p>
                  <p className="mt-2 text-sm text-sgs-ink/70">{store?.storeName}</p>
                  <p className="text-sm text-sgs-ink/60">{store?.address}</p>
                </div>
                <div className="rounded-2xl border border-sgs-line p-4">
                  <p className="font-semibold text-sgs-ink">Pickup schedule</p>
                  <p className="mt-2 text-sm text-sgs-ink/70">{order.pickupDate}</p>
                  <p className="text-sm text-sgs-ink/60">{slot?.label}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {order.lines.map((line) => (
                  <li key={`${order.orderNumber}-${line.productId}`} className="flex justify-between rounded-2xl border border-sgs-line px-4 py-3 text-sm">
                    <span>{line.productName} × {line.quantity}</span>
                    <span>{formatRupees(line.lineTotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
