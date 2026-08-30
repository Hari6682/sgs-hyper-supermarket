import type { PickupSlot } from '../types'

// Configurable pickup windows. Add/remove slots here; Checkout reads
// from this list and auto-filters past slots for same-day pickup.
export const PICKUP_SLOTS: PickupSlot[] = [
  { id: 'slot-1', label: '10:00 AM – 12:00 PM', startHour: 10 },
  { id: 'slot-2', label: '12:00 PM – 2:00 PM', startHour: 12 },
  { id: 'slot-3', label: '2:00 PM – 4:00 PM', startHour: 14 },
  { id: 'slot-4', label: '4:00 PM – 6:00 PM', startHour: 16 },
  { id: 'slot-5', label: '6:00 PM – 8:00 PM', startHour: 18 },
]

/** Days ahead a customer can schedule pickup for. */
export const PICKUP_DAYS_AHEAD = 5
