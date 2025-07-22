interface CollectionDetailProps {
  params: {
    id: string
  }
}

export default function CollectionDetail({ params }: CollectionDetailProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Collection {params.id}</h1>
      <div className="text-center py-12">
        <p className="text-gray-600">Collection detail page is under construction</p>
      </div>
    </div>
  )
}