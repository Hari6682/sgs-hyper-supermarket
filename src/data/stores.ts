import type { Store } from '../types'

// ---------------------------------------------------------------------------
// Centralized store configuration.
// Add Location 4 / Location 5 details here later — nothing else in the
// app needs to change. Set isActive: true once real coordinates/address
// are available and it will appear in the store selector automatically.
// ---------------------------------------------------------------------------

export const STORES: Store[] = [
  {
    storeId: 'thoraipakam',
    storeName: 'SGS Hyper Supermarket – Thoraipakam',
    area: 'Thoraipakam',
    address: 'Old Mahabalipuram Road, Thoraipakkam, Chennai, Tamil Nadu 600097',
    latitude: 12.9417,
    longitude: 80.2325,
    phone: '+91 44 4000 1001',
    openingHours: { open: '08:00', close: '22:00' },
    deliveryEnabled: false,
    isActive: true,
  },
  {
    storeId: 'velachery',
    storeName: 'SGS Hyper Supermarket – Velachery',
    area: 'Velachery',
    address: '100 Feet Bypass Road, Velachery, Chennai, Tamil Nadu 600042',
    latitude: 12.9756,
    longitude: 80.2207,
    phone: '+91 44 4000 1002',
    openingHours: { open: '08:00', close: '22:00' },
    deliveryEnabled: false,
    isActive: true,
  },
  {
    storeId: 'ocean-dew',
    storeName: 'SGS Hyper Supermarket – Ocean Dew',
    area: 'Ocean Dew',
    address: 'Ocean Dew, Injambakkam, ECR, Chennai, Tamil Nadu 600115',
    latitude: 12.9186,
    longitude: 80.2464,
    phone: '+91 44 4000 1003',
    openingHours: { open: '08:00', close: '22:00' },
    deliveryEnabled: false,
    isActive: true,
  },
  {
    storeId: 'location-4',
    storeName: 'SGS Hyper Supermarket – Location 4',
    area: 'Coming soon',
    address: 'Details to be added',
    // Placeholder coordinates — kept null-safe by isActive: false, so
    // this store is excluded from nearest-store math and the selector
    // until real data is filled in.
    latitude: 0,
    longitude: 0,
    phone: '',
    openingHours: { open: '08:00', close: '22:00' },
    deliveryEnabled: false,
    isActive: false,
  },
  {
    storeId: 'location-5',
    storeName: 'SGS Hyper Supermarket – Location 5',
    area: 'Coming soon',
    address: 'Details to be added',
    latitude: 0,
    longitude: 0,
    phone: '',
    openingHours: { open: '08:00', close: '22:00' },
    deliveryEnabled: false,
    isActive: false,
  },
]

export const ACTIVE_STORES = STORES.filter((s) => s.isActive)

export function getStoreById(storeId: string): Store | undefined {
  return STORES.find((s) => s.storeId === storeId)
}
