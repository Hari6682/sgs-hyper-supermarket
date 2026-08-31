import { useState, type FormEvent } from 'react'
import { useOrderCenter } from '../context/OrderCenterContext'

export default function ContactUsPage({ onBack }: { onBack: () => void }) {
  const { submitSupportMessage } = useOrderCenter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('')

    try {
      await submitSupportMessage({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        mobileNumber: mobileNumber.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      })
      setStatusMessage('Your message has been sent to the store team.')
      setFullName('')
      setEmail('')
      setMobileNumber('')
      setSubject('')
      setMessage('')
    } catch {
      setStatusMessage('We could not send your message right now. Please try again.')
    }
  }

  return (
    <main className="max-w-content mx-auto px-4 py-10">
      <button onClick={onBack} className="mb-6 text-sm font-medium text-sgs-green-dark">
        ← Back to shopping
      </button>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] border border-sgs-line bg-sgs-sage/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">Customer Support</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-sgs-ink">Contact the SGS team</h1>
          <p className="mt-4 text-sm text-sgs-ink/70">
            Use this page for order help, pickup questions, stock checks, or anything the team should follow up on.
          </p>
        </section>

        <form className="rounded-[28px] border border-sgs-line bg-white p-6 shadow-sm space-y-4" onSubmit={handleSubmit}>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="Your name"
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-sgs-line px-4 py-3"
              placeholder="Email"
              type="email"
            />
            <input
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full rounded-2xl border border-sgs-line px-4 py-3"
              placeholder="Mobile number"
              inputMode="numeric"
            />
          </div>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="Subject"
            required
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-[180px] w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="Tell us how we can help"
            required
          />
          {statusMessage && <p className="text-sm text-sgs-ink/70">{statusMessage}</p>}
          <button className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark">
            Send message
          </button>
        </form>
      </div>
    </main>
  )
}
