import { useState } from 'react'
import { CATEGORIES } from '../data/categories'
import { useCart } from '../context/CartContext'
import { useSelectedStore, useStore } from '../context/StoreContext'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onCategorySelect: (categoryId: string | null) => void
}

export default function Header({ searchQuery, onSearchChange, onCategorySelect }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { itemCount, openCart } = useCart()
  const { openSelector } = useStore()
  const selectedStore = useSelectedStore()

  return (
    <header className="sticky top-0 z-30 bg-sgs-cream/95 backdrop-blur border-b border-sgs-line">
      <div className="max-w-content mx-auto px-4">
        {/* Top strip: brand promise */}
        <div className="hidden sm:flex items-center justify-center py-1.5 text-xs text-sgs-green-dark font-medium tracking-tight">
          Shop online. Pick up at your nearest SGS store.
        </div>

        <div className="flex items-center gap-3 py-3 border-t border-sgs-line sm:border-t-0">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2 shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-card bg-sgs-green text-sgs-cream font-display font-bold text-lg">
              S
            </span>
            <span className="font-display font-bold text-lg leading-none">
              SGS <span className="text-sgs-green">Hyper</span>
            </span>
          </a>

          {/* Store selector */}
          <button
            onClick={openSelector}
            className="hidden md:flex items-center gap-1.5 rounded-full border border-sgs-line bg-white px-3 py-1.5 text-sm hover:border-sgs-green transition-colors"
          >
            <span aria-hidden>📍</span>
            <span className="max-w-[160px] truncate">
              {selectedStore ? selectedStore.area : 'Select store'}
            </span>
            <span className="text-sgs-green-dark text-xs font-medium">Change</span>
          </button>

          {/* Search */}
          <div className="flex-1 min-w-0">
            <label className="sr-only" htmlFor="site-search">
              Search products
            </label>
            <input
              id="site-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for atta, rice, milk…"
              className="w-full rounded-full border border-sgs-line bg-white px-4 py-2 text-sm placeholder:text-sgs-ink/40 focus:border-sgs-green"
            />
          </div>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 rounded-full bg-sgs-green text-sgs-cream px-3.5 py-2 text-sm font-medium hover:bg-sgs-green-dark transition-colors"
            aria-label={`Cart, ${itemCount} items`}
          >
            <span aria-hidden>🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sgs-mango px-1 text-xs font-bold text-sgs-ink">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden rounded-full border border-sgs-line p-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span aria-hidden>{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile: store selector row */}
        <button
          onClick={openSelector}
          className="md:hidden flex items-center gap-1.5 pb-2 text-sm text-sgs-green-dark"
        >
          <span aria-hidden>📍</span>
          <span className="truncate">{selectedStore ? selectedStore.storeName : 'Select your store'}</span>
          <span className="font-medium">· Change</span>
        </button>

        {/* Category nav */}
        <nav
          className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-1 md:gap-4 pb-3 md:pb-2 overflow-x-auto no-scrollbar`}
        >
          <button
            onClick={() => {
              onCategorySelect(null)
              setMenuOpen(false)
            }}
            className="text-left md:text-center whitespace-nowrap text-sm font-medium text-sgs-ink/80 hover:text-sgs-green py-1"
          >
            All Products
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onCategorySelect(cat.id)
                setMenuOpen(false)
              }}
              className="text-left md:text-center whitespace-nowrap text-sm font-medium text-sgs-ink/80 hover:text-sgs-green py-1"
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
