import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartLine } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useProductCatalog } from './ProductCatalogContext'

interface CartContextValue {
  lines: CartLine[]
  addToCart: (productId: string, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useProductCatalog()
  const [lines, setLines] = useLocalStorage<CartLine[]>('sgs.cart', [])
  const [isCartOpen, setIsCartOpen] = useState(false)

  function addToCart(productId: string, quantity = 1) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId)
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
        )
      }
      return [...prev, { productId, quantity }]
    })
    setIsCartOpen(true)
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)))
  }

  function removeFromCart(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  function clearCart() {
    setLines([])
  }

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0)

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const product = products.find((p) => p.id === l.productId)
      return product ? sum + product.price * l.quantity : sum
    }, 0)
  }, [lines, products])

  const value: CartContextValue = {
    lines,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    itemCount,
    subtotal,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
