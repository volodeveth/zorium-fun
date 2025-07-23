'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SortDropdownProps {
  sortBy: string
  onSortChange: (sortBy: string) => void
}

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'mints', label: 'Most Minted' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' }
]

export default function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const currentSort = sortOptions.find(option => option.value === sortBy)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary hover:bg-background-tertiary transition-colors"
      >
        <span className="text-sm">Sort by: {currentSort?.label}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-background-secondary border border-border rounded-lg shadow-lg z-50">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 hover:bg-background-tertiary transition-colors first:rounded-t-lg last:rounded-b-lg ${
                sortBy === option.value 
                  ? 'bg-purple-primary text-white' 
                  : 'text-text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}