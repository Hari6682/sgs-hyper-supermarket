import LocationDetector from './LocationDetector'

export default function Hero() {
  return (
    <section id="top" className="border-b border-sgs-line bg-sgs-sage/40">
      <div className="max-w-content mx-auto px-4 py-10 md:py-16 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-[1.05] tracking-tight mb-4">
            SGS Hyper Supermarket
          </h1>
          <p className="text-xl md:text-2xl font-display font-semibold text-sgs-green-dark mb-3">
            Your everyday shopping, made easier.
          </p>
          <p className="text-base md:text-lg text-sgs-ink/70 mb-7 max-w-md">
            Shop your groceries online and conveniently pick them up from your nearest SGS store
            across Chennai.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#products"
              className="rounded-full bg-sgs-green text-sgs-cream px-6 py-3 font-medium hover:bg-sgs-green-dark transition-colors"
            >
              Shop Now
            </a>
            <a
              href="#top"
              className="rounded-full border border-sgs-ink/20 px-6 py-3 font-medium hover:border-sgs-green transition-colors"
            >
              Find My Nearest Store
            </a>
          </div>
        </div>

        <div className="w-full">
          <LocationDetector />
        </div>
      </div>
    </section>
  )
}
