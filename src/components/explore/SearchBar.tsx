'use client'

import { Search, X } from 'lucide-react'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export default function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search NFTs, creators, collections..." 
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-text-secondary" />
      </div>
      
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="block w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background-primary text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
        placeholder={placeholder}
      />
      
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}