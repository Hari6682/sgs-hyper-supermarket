import { CATEGORIES } from '../data/categories'

interface CategoryListProps {
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

export default function CategoryList({ selectedCategoryId, onSelect }: CategoryListProps) {
  return (
    <div className="max-w-content mx-auto w-full min-w-0 px-4 py-4">
      <div className="flex max-w-full gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
            selectedCategoryId === null
              ? 'bg-sgs-green text-sgs-cream border-sgs-green'
              : 'bg-white text-sgs-ink/80 border-sgs-line hover:border-sgs-green'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              selectedCategoryId === cat.id
                ? 'bg-sgs-green text-sgs-cream border-sgs-green'
                : 'bg-white text-sgs-ink/80 border-sgs-line hover:border-sgs-green'
            }`}
          >
            <span className="mr-1.5" aria-hidden>
              {cat.icon}
            </span>
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
