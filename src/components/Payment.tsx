import { useState } from 'react'
import { openRazorpayCheckout, type RazorpaySuccessResponse } from '../lib/razorpay'
import { formatRupees } from '../lib/currency'

interface PaymentProps {
  amount: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  disabled?: boolean
  onSuccess: (response: RazorpaySuccessResponse) => void
}

export default function Payment({
  amount,
  customerName,
  customerPhone,
  customerEmail,
  disabled,
  onSuccess,
}: PaymentProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'failed'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function handlePay() {
    setStatus('processing')
    setErrorMessage('')

    openRazorpayCheckout({
      amountInRupees: amount,
      customerName,
      customerPhone,
      customerEmail,
      onSuccess: (response) => {
        setStatus('idle')
        onSuccess(response)
      },
      onDismiss: () => setStatus('idle'),
      onError: (message) => {
        setStatus('failed')
        setErrorMessage(message)
      },
    })
  }

  return (
    <div>
      {status === 'failed' && (
        <p className="mb-3 rounded-card bg-sgs-tomato/10 text-sgs-tomato text-sm px-3 py-2">
          Payment couldn't be completed: {errorMessage}
        </p>
      )}
      <button
        onClick={handlePay}
        disabled={disabled || status === 'processing'}
        className="w-full rounded-full bg-sgs-green text-sgs-cream py-3.5 font-medium hover:bg-sgs-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'processing' ? 'Opening payment…' : `Pay ${formatRupees(amount)} & Place Order`}
      </button>
    </div>
  )
}
