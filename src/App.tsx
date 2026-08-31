import { useEffect, useState } from 'react'
import { StoreProvider } from './context/StoreContext'
import { CartProvider } from './context/CartContext'
import { OrderCenterProvider } from './context/OrderCenterContext'
import { ProductCatalogProvider } from './context/ProductCatalogContext'
import AdminPanel from './components/AdminPanel'
import ContactUsPage from './components/ContactUsPage'
import Header from './components/Header'
import Hero from './components/Hero'
import PickupInfoPage from './components/PickupInfoPage'
import CategoryList from './components/CategoryList'
import ProductGrid from './components/ProductGrid'
import StaffDashboard from './components/StaffDashboard'
import CartDrawer from './components/CartDrawer'
import StoreSelectorModal from './components/StoreSelectorModal'
import Checkout from './components/Checkout'
import TrackOrderPage from './components/TrackOrderPage'
import OrderConfirmation from './components/OrderConfirmation'
import Footer from './components/Footer'
import type { Order } from './types'

type View = 'shop' | 'checkout' | 'confirmation'
type Route = 'storefront' | 'admin' | 'staff' | 'track-order' | 'contact-us' | 'pickup-info'

function getRouteFromPath(pathname: string): Route {
  if (pathname === '/admin') return 'admin'
  if (pathname === '/staff') return 'staff'
  if (pathname === '/track-order') return 'track-order'
  if (pathname === '/contact-us') return 'contact-us'
  if (pathname === '/pickup-info') return 'pickup-info'
  return 'storefront'
}

function AppShell() {
  const [route, setRoute] = useState<Route>(() => getRouteFromPath(window.location.pathname))
  const [view, setView] = useState<View>('shop')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  useEffect(() => {
    function handlePopState() {
      setRoute(getRouteFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigateTo(pathname: string) {
    window.history.pushState({}, '', pathname)
    setRoute(getRouteFromPath(pathname))
    window.scrollTo({ top: 0 })
  }

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

  if (route === 'admin') {
    return <AdminPanel onBackToStore={() => navigateTo('/')} />
  }

  if (route === 'staff') {
    return <StaffDashboard onBackToStore={() => navigateTo('/')} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      {route === 'storefront' && (
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
      )}

      {route === 'storefront' && view === 'shop' && (
        <>
          <Hero />
          <CategoryList selectedCategoryId={selectedCategoryId} onSelect={setSelectedCategoryId} />
          <ProductGrid searchQuery={searchQuery} selectedCategoryId={selectedCategoryId} />
        </>
      )}

      {route === 'storefront' && view === 'checkout' && (
        <Checkout onOrderPlaced={handleOrderPlaced} onBack={() => setView('shop')} />
      )}

      {route === 'storefront' && view === 'confirmation' && placedOrder && (
        <OrderConfirmation order={placedOrder} onContinueShopping={handleContinueShopping} />
      )}

      {route === 'track-order' && <TrackOrderPage onBack={() => navigateTo('/')} />}
      {route === 'contact-us' && <ContactUsPage onBack={() => navigateTo('/')} />}
      {route === 'pickup-info' && <PickupInfoPage onBack={() => navigateTo('/')} />}

      <Footer />

      {route === 'storefront' && <CartDrawer onCheckout={() => setView('checkout')} />}
      {route === 'storefront' && <StoreSelectorModal />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ProductCatalogProvider>
        <OrderCenterProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </OrderCenterProvider>
      </ProductCatalogProvider>
    </StoreProvider>
  )
}
