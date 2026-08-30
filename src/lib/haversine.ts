import type { Coordinates, Store } from '../types'

const EARTH_RADIUS_KM = 6371

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two coordinates, in kilometres. */
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return EARTH_RADIUS_KM * c
}

export interface StoreWithDistance extends Store {
  distanceKm: number | null
}

/** Sorts stores by distance from the customer. Falls back to store-list
 * order (distanceKm: null) when customer coordinates are unavailable. */
export function sortStoresByDistance(
  stores: Store[],
  customerCoords: Coordinates | null,
): StoreWithDistance[] {
  if (!customerCoords) {
    return stores.map((s) => ({ ...s, distanceKm: null }))
  }

  return [...stores]
    .map((s) => ({
      ...s,
      distanceKm: haversineDistanceKm(customerCoords, {
        latitude: s.latitude,
        longitude: s.longitude,
      }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
