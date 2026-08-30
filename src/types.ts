// ---------------------------------------------------------------------------
// Core domain types for SGS Hyper Supermarket.
// Kept separate from UI so Phase 2 (delivery, accounts, inventory sync)
// can extend these without touching components.
// ---------------------------------------------------------------------------

export interface OpeningHours {
  open: string  // "09:00"
  close: string // "22:00"
}

export interface Store {
  storeId: string
  storeName: string
  area: string
  address: string
  latitude: number
  longitude: number
  phone: string
  openingHours: OpeningHours
  /** Phase 2 hook — left false for every store in Phase 1. */
  deliveryEnabled: boolean
  /** Set to false for the two placeholder locations until details arrive. */
  isActive: boolean
}

export interface Category {
  id: string
  name: string
  icon: string // emoji or icon key, kept simple for Phase 1
}

export interface Product {
  id: string
  name: string
  brand: string
  categoryId: string
  packSize: string
  price: number // ₹, current selling price
  mrp?: number // ₹, optional strike-through price
  imageUrl: string
  popular?: boolean
  inStock: boolean
}

export interface PickupSlot {
  id: string
  label: string // "10:00 AM – 12:00 PM"
  startHour: number // 24h, used to filter out past slots for "today"
}

export interface CartLine {
  productId: string
  quantity: number
}

export type OrderType = 'PICKUP' // Phase 2 will add 'DELIVERY'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED'

export interface CustomerDetails {
  fullName: string
  mobileNumber: string
  email?: string
}

export interface Order {
  orderNumber: string
  customer: CustomerDetails
  storeId: string
  orderType: OrderType
  lines: CartLine[]
  pickupDate: string // ISO date, e.g. "2026-09-02"
  pickupSlotId: string
  subtotal: number
  charges: number
  total: number
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  createdAt: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}
