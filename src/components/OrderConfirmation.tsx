import { getStoreById } from '../data/stores'
import { PICKUP_SLOTS } from '../data/pickupSlots'
import { formatRupees } from '../lib/currency'
import type { Order } from '../types'

interface OrderConfirmationProps {
  order: Order
  onContinueShopping: () => void
}

export default function OrderConfirmation({ order, onContinueShopping }: OrderConfirmationProps) {
  const store = getStoreById(order.storeId)
  const slot = PICKUP_SLOTS.find((s) => s.id === order.pickupSlotId)
  const pickupDateLabel = new Date(order.pickupDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-content mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sgs-green text-sgs-cream text-3xl">
          ✓
        </div>
        <h1 className="font-display font-bold text-3xl mb-1">Order Confirmed!</h1>
        <p className="text-sgs-ink/60">
          Order <span className="font-semibold text-sgs-ink">#{order.orderNumber}</span>
        </p>
      </div>

      <div className="max-w-xl mx-auto rounded-card border border-sgs-line bg-white p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <div>
            <p className="text-xs font-medium text-sgs-ink/50 mb-1">Pickup Location</p>
            <p className="font-medium">{store?.storeName}</p>
            <p className="text-sm text-sgs-ink/60">{store?.address}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-sgs-ink/50 mb-1">Pickup Date</p>
            <p className="font-medium">{pickupDateLabel}</p>
            <p className="text-xs font-medium text-sgs-ink/50 mt-3 mb-1">Pickup Time</p>
            <p className="font-medium">{slot?.label}</p>
          </div>
        </div>

        <div className="border-t border-sgs-line pt-4 mb-5">
          <p className="text-xs font-medium text-sgs-ink/50 mb-2">Order summary</p>
          <ul className="space-y-1.5">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex justify-between text-sm">
                <span className="text-sgs-ink/70">
                  {line.productName} × {line.quantity}
                </span>
                <span>{formatRupees(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-sgs-line pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-sgs-ink/50">Total Paid</p>
            <p className="font-display font-bold text-xl">{formatRupees(order.total)}</p>
          </div>
          <span className="rounded-full bg-sgs-green/10 text-sgs-green-dark text-xs font-semibold px-3 py-1.5">
            Payment {order.paymentStatus === 'PAID' ? 'Successful' : order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto rounded-card bg-sgs-sage/50 px-5 py-4 mb-8 text-center">
        <p className="text-sm font-medium">
          Please show your order number when collecting your order.
        </p>
      </div>

      <div className="text-center">
        <a
          href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
          className="mb-4 inline-flex rounded-full border border-sgs-line px-6 py-3 font-medium text-sgs-green-dark hover:border-sgs-green"
        >
          Track This Order
        </a>
      </div>

      <div className="text-center">
        <button
          onClick={onContinueShopping}
          className="rounded-full bg-sgs-green text-sgs-cream px-6 py-3 font-medium hover:bg-sgs-green-dark transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )
}
