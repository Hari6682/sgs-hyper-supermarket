import { useState } from 'react'
import type { Product } from '../types'
import { discountPercent, formatRupees } from '../lib/currency'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }: { product: Product }) {
  const { lines, addToCart, updateQuantity } = useCart()
  const [pendingQty, setPendingQty] = useState(1)
  const cartLine = lines.find((l) => l.productId === product.id)
  const discount = discountPercent(product.price, product.mrp)

  return (
    <div className="flex flex-col rounded-card border border-sgs-line bg-white overflow-hidden">
      <div className="relative aspect-square bg-sgs-sage/30">
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        {discount && (
          <span className="absolute top-2 left-2 rounded-full bg-sgs-tomato text-white text-xs font-bold px-2 py-1">
            {discount}% OFF
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
            <p className="text-xs font-medium text-sgs-tomato">Out of stock</p>
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
