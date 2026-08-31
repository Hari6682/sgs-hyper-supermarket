import { useState } from 'react'
import type { Product } from '../types'
import { discountPercent, formatRupees } from '../lib/currency'
import { useCart } from '../context/CartContext'
import { useOrderCenter } from '../context/OrderCenterContext'

export default function ProductCard({ product }: { product: Product }) {
  const { lines, addToCart, updateQuantity } = useCart()
  const { requestBackInStockNotification } = useOrderCenter()
  const [pendingQty, setPendingQty] = useState(1)
  const [showNotifyForm, setShowNotifyForm] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [notifyMessage, setNotifyMessage] = useState('')
  const cartLine = lines.find((l) => l.productId === product.id)
  const discount = discountPercent(product.price, product.mrp)

  async function handleNotifySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!customerName.trim() || (!email.trim() && !mobileNumber.trim())) {
      setNotifyMessage('Add your name and either an email or mobile number.')
      return
    }

    try {
      await requestBackInStockNotification({
        productId: product.id,
        productName: product.name,
        customerName: customerName.trim(),
        email: email.trim() || undefined,
        mobileNumber: mobileNumber.trim() || undefined,
      })
      setNotifyMessage('Request saved. The store team can follow up when this item is back in stock.')
      setShowNotifyForm(false)
    } catch {
      setNotifyMessage('Could not save your notification request right now.')
    }
  }

  return (
    <div className="flex flex-col rounded-card border border-sgs-line bg-white overflow-hidden">
      <div className="relative aspect-square bg-sgs-sage/30">
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        {discount && (
          <span className="absolute top-2 left-2 rounded-full bg-sgs-tomato text-white text-xs font-bold px-2 py-1">
            {discount}% OFF
          </span>
        )}
        {product.offerText && (
          <span className="absolute bottom-2 left-2 max-w-[85%] rounded-full bg-sgs-green px-2.5 py-1 text-[11px] font-semibold text-sgs-cream">
            {product.offerText}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-sgs-ink/50">{product.brand}</p>
        <h3 className="font-medium text-sm leading-snug mb-0.5 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-sgs-ink/50 mb-2">{product.packSize}</p>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="font-display font-bold">{formatRupees(product.price)}</span>
            {product.mrp && (
              <span className="text-xs text-sgs-ink/40 line-through">{formatRupees(product.mrp)}</span>
            )}
          </div>

          {!product.inStock ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-sgs-tomato">Out of stock</p>
              <button
                type="button"
                onClick={() => setShowNotifyForm((value) => !value)}
                className="w-full rounded-full border border-sgs-line px-3 py-2 text-xs font-medium text-sgs-green-dark hover:border-sgs-green"
              >
                {showNotifyForm ? 'Close notify form' : 'Get notified'}
              </button>
              {showNotifyForm && (
                <form className="space-y-2" onSubmit={handleNotifySubmit}>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="w-full rounded-card border border-sgs-line px-3 py-2 text-xs"
                    placeholder="Your name"
                  />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-card border border-sgs-line px-3 py-2 text-xs"
                    placeholder="Email"
                    type="email"
                  />
                  <input
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-card border border-sgs-line px-3 py-2 text-xs"
                    placeholder="Mobile number"
                    inputMode="numeric"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-full bg-sgs-green py-2 text-xs font-medium text-sgs-cream hover:bg-sgs-green-dark"
                  >
                    Save notification request
                  </button>
                </form>
              )}
              {notifyMessage && <p className="text-[11px] text-sgs-ink/60">{notifyMessage}</p>}
            </div>
          ) : cartLine ? (
            <div className="flex items-center justify-between rounded-full border border-sgs-green">
              <button
                className="px-3 py-1.5 text-sgs-green font-bold"
                onClick={() => updateQuantity(product.id, cartLine.quantity - 1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="text-sm font-medium">{cartLine.quantity}</span>
              <button
                className="px-3 py-1.5 text-sgs-green font-bold"
                onClick={() => updateQuantity(product.id, cartLine.quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border border-sgs-line">
                <button
                  className="px-2.5 py-1.5 text-sgs-ink/70"
                  onClick={() => setPendingQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-sm px-1">{pendingQty}</span>
                <button
                  className="px-2.5 py-1.5 text-sgs-ink/70"
                  onClick={() => setPendingQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  addToCart(product.id, pendingQty)
                  setPendingQty(1)
                }}
                className="flex-1 rounded-full bg-sgs-green text-sgs-cream text-sm font-medium py-1.5 hover:bg-sgs-green-dark transition-colors"
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
