import { useMemo, useState } from 'react'
import { getCategoryById } from '../data/categories'
import { useProductCatalog } from '../context/ProductCatalogContext'
import ProductCard from './ProductCard'

interface ProductGridProps {
  searchQuery: string
  selectedCategoryId: string | null
}

export default function ProductGrid({ searchQuery, selectedCategoryId }: ProductGridProps) {
  const { products, isLoading } = useProductCatalog()
  const [popularOnly, setPopularOnly] = useState(false)
  const [discountedOnly, setDiscountedOnly] = useState(false)

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return products.filter((p) => {
      if (selectedCategoryId && p.categoryId !== selectedCategoryId) return false
      if (popularOnly && !p.popular) return false
      if (discountedOnly && !(p.mrp && p.mrp > p.price)) return false

      if (query) {
        const category = getCategoryById(p.categoryId)
        const haystack = `${p.name} ${p.brand} ${category?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [discountedOnly, popularOnly, products, searchQuery, selectedCategoryId])

  return (
    <section id="products" className="max-w-content mx-auto px-4 pb-16">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h2 className="font-display font-bold text-2xl mr-auto">
          {selectedCategoryId ? getCategoryById(selectedCategoryId)?.name : 'All Products'}
        </h2>

        <button
          onClick={() => setPopularOnly((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
            popularOnly
              ? 'bg-sgs-green text-sgs-cream border-sgs-green'
              : 'bg-white border-sgs-line hover:border-sgs-green'
          }`}
        >
          Popular
        </button>
        <button
          onClick={() => setDiscountedOnly((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
            discountedOnly
              ? 'bg-sgs-green text-sgs-cream border-sgs-green'
              : 'bg-white border-sgs-line hover:border-sgs-green'
          }`}
        >
          Discounted
        </button>

      </div>

      {isLoading ? (
        <div className="rounded-card border border-dashed border-sgs-line py-16 text-center">
          <p className="font-display font-semibold text-lg mb-1">Loading catalog…</p>
          <p className="text-sm text-sgs-ink/60">Pulling the latest products for this branch.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-dashed border-sgs-line py-16 text-center">
          <p className="font-display font-semibold text-lg mb-1">No products match your search</p>
          <p className="text-sm text-sgs-ink/60">Try a different keyword, category, or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
