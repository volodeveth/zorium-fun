'use client'

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  'All',
  'Art',
  'Photography', 
  'Music',
  'Video',
  'Collectibles',
  'Gaming',
  'Sports'
]

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedCategory === category
              ? 'bg-purple-primary text-white shadow-lg'
              : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary hover:text-text-primary border border-border'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}