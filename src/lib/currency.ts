export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function discountPercent(price: number, mrp?: number): number | null {
  if (!mrp || mrp <= price) return null
  return Math.round(((mrp - price) / mrp) * 100)
}
