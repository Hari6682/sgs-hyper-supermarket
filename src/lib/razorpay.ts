// ---------------------------------------------------------------------------
// Razorpay integration.
//
// IMPORTANT — how this is meant to be wired up:
// 1. The Razorpay Key ID (public, safe for frontend) comes from
//    VITE_RAZORPAY_KEY_ID in your .env file.
// 2. The Razorpay Key SECRET must NEVER be used in frontend code. Order
//    creation and payment-signature verification have to happen on a
//    backend/serverless function that holds the secret. This file calls
//    that backend via VITE_ORDER_API_BASE_URL — it does not talk to
//    Razorpay's order-creation API directly.
// 3. Until that backend exists, createRazorpayOrder() below throws a
//    clear error instead of silently faking a payment, so it's obvious
//    in development that the backend piece is still needed.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

interface RazorpayOptions {
  key: string
  amount: number // in paise
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name: string; contact: string; email?: string }
  theme: { color: string }
  handler: (response: RazorpaySuccessResponse) => void
  modal?: { ondismiss?: () => void }
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined
const ORDER_API_BASE_URL = import.meta.env.VITE_ORDER_API_BASE_URL as string | undefined

/** Asks your backend to create a Razorpay order (this is where the secret
 * key is used, server-side only) and returns the Razorpay order id. */
async function createRazorpayOrder(amountInRupees: number): Promise<string> {
  if (!ORDER_API_BASE_URL) {
    throw new Error(
      'VITE_ORDER_API_BASE_URL is not configured. Set up a backend endpoint that creates ' +
        'a Razorpay order server-side (using your Key Secret) before going live — see README.',
    )
  }

  const res = await fetch(`${ORDER_API_BASE_URL}/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amountInRupees * 100), currency: 'INR' }),
  })

  if (!res.ok) {
    throw new Error('Could not start payment. Please try again.')
  }

  const data = await res.json()
  return data.orderId as string
}

interface OpenCheckoutParams {
  amountInRupees: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  onSuccess: (response: RazorpaySuccessResponse) => void
  onDismiss: () => void
  onError: (message: string) => void
}

export async function openRazorpayCheckout({
  amountInRupees,
  customerName,
  customerPhone,
  customerEmail,
  onSuccess,
  onDismiss,
  onError,
}: OpenCheckoutParams) {
  if (!RAZORPAY_KEY_ID) {
    onError('Payment gateway is not configured yet. Set VITE_RAZORPAY_KEY_ID in your .env file.')
    return
  }

  if (typeof window.Razorpay === 'undefined') {
    onError('Payment gateway failed to load. Check your connection and try again.')
    return
  }

  try {
    const orderId = await createRazorpayOrder(amountInRupees)

    const razorpay = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amountInRupees * 100),
      currency: 'INR',
      name: 'SGS Hyper Supermarket',
      description: 'In-store pickup order',
      order_id: orderId,
      prefill: { name: customerName, contact: customerPhone, email: customerEmail },
      theme: { color: '#1F6B4C' },
      handler: onSuccess,
      modal: { ondismiss: onDismiss },
    })

    razorpay.open()
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Something went wrong starting payment.')
  }
}
