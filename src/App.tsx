import { useState } from 'react'
import { StoreProvider } from './context/StoreContext'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import Hero from './components/Hero'
import CategoryList from './components/CategoryList'
import ProductGrid from './components/ProductGrid'
import CartDrawer from './components/CartDrawer'
import StoreSelectorModal from './components/StoreSelectorModal'
import Checkout from './components/Checkout'
import OrderConfirmation from './components/OrderConfirmation'
import Footer from './components/Footer'
import type { Order } from './types'

type View = 'shop' | 'checkout' | 'confirmation'

function AppShell() {
  const [view, setView] = useState<View>('shop')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  function handleOrderPlaced(order: Order) {
    setPlacedOrder(order)
    setView('confirmation')
    window.scrollTo({ top: 0 })
  }

  function handleContinueShopping() {
    setPlacedOrder(null)
    setView('shop')
    setSearchQuery('')
    setSelectedCategoryId(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value)
          if (view !== 'shop') setView('shop')
        }}
        onCategorySelect={(categoryId) => {
          setSelectedCategoryId(categoryId)
          if (view !== 'shop') setView('shop')
        }}
      />

      {view === 'shop' && (
        <>
          <Hero />
          <CategoryList selectedCategoryId={selectedCategoryId} onSelect={setSelectedCategoryId} />
          <ProductGrid searchQuery={searchQuery} selectedCategoryId={selectedCategoryId} />
        </>
      )}

      {view === 'checkout' && (
        <Checkout onOrderPlaced={handleOrderPlaced} onBack={() => setView('shop')} />
      )}

      {view === 'confirmation' && placedOrder && (
        <OrderConfirmation order={placedOrder} onContinueShopping={handleContinueShopping} />
      )}

      <Footer />

      <CartDrawer onCheckout={() => setView('checkout')} />
      <StoreSelectorModal />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </StoreProvider>
  )
}
