interface ProfileTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  stats: {
    created: number
    minted: number
    collections: number
  }
}

export default function ProfileTabs({ activeTab, setActiveTab, stats }: ProfileTabsProps) {
  const tabs = [
    { id: 'created', label: 'Created', count: stats.created },
    { id: 'minted', label: 'Minted', count: stats.minted },
    { id: 'collections', label: 'Collections', count: stats.collections }
  ]

  return (
    <div className="border-b border-border">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-purple-primary text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            <span className="ml-2 bg-background-tertiary text-text-secondary px-2 py-1 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}