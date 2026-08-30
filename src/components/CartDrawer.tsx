import { PRODUCTS } from '../data/products'
import { formatRupees } from '../lib/currency'
import { useCart } from '../context/CartContext'

interface CartDrawerProps {
  onCheckout: () => void
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { lines, isCartOpen, closeCart, updateQuantity, removeFromCart, subtotal } = useCart()

  if (!isCartOpen) return null

  const items = lines
    .map((line) => ({ line, product: PRODUCTS.find((p) => p.id === line.productId) }))
    .filter((x): x is { line: typeof lines[number]; product: NonNullable<typeof x.product> } => !!x.product)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-sgs-ink/40 animate-fade-in" onClick={closeCart}>
      <div
        className="h-full w-full sm:w-[420px] bg-sgs-cream flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sgs-line px-5 py-4">
          <h2 className="font-display font-semibold text-lg">Your Cart</h2>
          <button onClick={closeCart} aria-label="Close cart" className="text-xl leading-none px-1">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-4xl mb-3" aria-hidden>
              🛒
            </p>
            <p className="font-display font-semibold mb-1">Your cart is empty</p>
            <p className="text-sm text-sgs-ink/60 mb-5">Add some groceries to get started.</p>
            <button
              onClick={closeCart}
              className="rounded-full bg-sgs-green text-sgs-cream px-5 py-2.5 text-sm font-medium"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-sgs-line px-5">
              {items.map(({ line, product }) => (
                <li key={product.id} className="py-4 flex gap-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-16 w-16 rounded-card object-cover border border-sgs-line shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                    <p className="text-xs text-sgs-ink/50 mb-2">
                      {product.packSize} · {formatRupees(product.price)} each
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-sgs-line">
                        <button
                          className="px-2.5 py-1 text-sgs-ink/70"
                          onClick={() => updateQuantity(product.id, line.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-sm px-1">{line.quantity}</span>
                        <button
                          className="px-2.5 py-1 text-sgs-ink/70"
                          onClick={() => updateQuantity(product.id, line.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-medium text-sm">{formatRupees(product.price * line.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Remove ${product.name}`}
                    className="text-sgs-ink/40 hover:text-sgs-tomato self-start"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-sgs-line px-5 py-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sgs-ink/60">Subtotal</span>
                <span className="font-medium">{formatRupees(subtotal)}</span>
              </div>
              <p className="text-xs text-sgs-ink/50">Final total, including any applicable charges, is shown at checkout.</p>
              <button
                onClick={() => {
                  closeCart()
                  onCheckout()
                }}
                className="w-full rounded-full bg-sgs-green text-sgs-cream py-3 font-medium hover:bg-sgs-green-dark transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
