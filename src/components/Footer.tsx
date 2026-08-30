import { ACTIVE_STORES } from '../data/stores'

export default function Footer() {
  return (
    <footer className="border-t border-sgs-line bg-sgs-sage/30 mt-auto">
      <div className="max-w-content mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="font-display font-bold text-lg mb-2">
            SGS <span className="text-sgs-green">Hyper</span> Supermarket
          </p>
          <p className="text-sm text-sgs-ink/60 mb-4">
            Shop online, pick up at your nearest SGS store across Chennai.
          </p>
          <div className="flex gap-3 text-sgs-ink/50 text-lg">
            <span aria-hidden>📘</span>
            <span aria-hidden>📸</span>
            <span aria-hidden>🐦</span>
          </div>
        </div>

        <div>
          <p className="font-medium mb-3">Store Locations</p>
          <ul className="space-y-1.5 text-sm text-sgs-ink/60">
            {ACTIVE_STORES.map((s) => (
              <li key={s.storeId}>{s.storeName.replace('SGS Hyper Supermarket – ', '')}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-medium mb-3">Customer Support</p>
          <ul className="space-y-1.5 text-sm text-sgs-ink/60">
            <li>Contact Us</li>
            <li>Pickup Information</li>
            <li>Track My Order</li>
          </ul>
        </div>

        <div>
          <p className="font-medium mb-3">Policies</p>
          <ul className="space-y-1.5 text-sm text-sgs-ink/60">
            <li>Terms &amp; Conditions</li>
            <li>Privacy Policy</li>
            <li>Refund &amp; Cancellation Policy</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sgs-line px-4 py-4 text-center text-xs text-sgs-ink/40">
        © {new Date().getFullYear()} SGS Hyper Supermarket. All rights reserved.
      </div>
    </footer>
  )
}
