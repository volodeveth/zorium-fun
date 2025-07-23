interface NFTDetailProps {
  params: {
    id: string
  }
}

export default function NFTDetail({ params }: NFTDetailProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">NFT {params.id}</h1>
      <div className="text-center py-12">
        <p className="text-gray-600">NFT detail page is under construction</p>
      </div>
    </div>
  )
}