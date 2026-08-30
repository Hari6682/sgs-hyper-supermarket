import type { Category } from '../types'

// Add/remove/reorder categories here — CategoryList and ProductGrid
// read from this list, nothing is hardcoded in the UI.
export const CATEGORIES: Category[] = [
  { id: 'fruits-veg', name: 'Fruits & Vegetables', icon: '🥦' },
  { id: 'rice-grains', name: 'Rice & Grains', icon: '🌾' },
  { id: 'dals-pulses', name: 'Dals & Pulses', icon: '🫘' },
  { id: 'oil-ghee', name: 'Oil & Ghee', icon: '🫙' },
  { id: 'spices-masalas', name: 'Spices & Masalas', icon: '🌶️' },
  { id: 'dairy-bakery', name: 'Dairy & Bakery', icon: '🥛' },
  { id: 'beverages', name: 'Beverages', icon: '🧃' },
  { id: 'snacks', name: 'Snacks', icon: '🍪' },
  { id: 'personal-care', name: 'Personal Care', icon: '🧴' },
  { id: 'household', name: 'Household', icon: '🧺' },
  { id: 'baby-care', name: 'Baby Care', icon: '🍼' },
  { id: 'cleaning', name: 'Cleaning Products', icon: '🧽' },
]

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}
