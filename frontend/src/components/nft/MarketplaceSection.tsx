'use client'

import { useState } from 'react'
import { ShoppingCart, Tag, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import Button from '@/components/common/Button'
import UserLink from '@/components/common/UserLink'
import Modal from '@/components/common/Modal'
import { useMarketplace, MarketplaceListing } from '@/hooks/useMarketplace'

interface MarketplaceSectionProps {
  nftId: string
  userOwnsNFT?: boolean
  onPurchaseSuccess?: () => void
}

export default function MarketplaceSection({ 
  nftId, 
  userOwnsNFT = false,
  onPurchaseSuccess 
}: MarketplaceSectionProps) {
  const { 
    marketplaceData, 
    isLoading, 
    buyListing, 
    listForSale, 
    hasListings,
    cheapestPrice 
  } = useMarketplace(nftId)

  const [showSellModal, setShowSellModal] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [sellQuantity, setSellQuantity] = useState(1)
  const [isTransacting, setIsTransacting] = useState(false)
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)

  const handleBuyClick = () => {
    if (marketplaceData.cheapestListing) {
      setSelectedListing(marketplaceData.cheapestListing)
      setShowBuyModal(true)
    }
  }

  const handleBuy = async () => {
    if (!selectedListing) return

    try {
      setIsTransacting(true)
      const result = await buyListing(selectedListing.id)
      
      if (result.success) {
        setShowBuyModal(false)
        onPurchaseSuccess?.()
        // Show success message
        console.log('Purchase successful:', result.transactionHash)
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      // Show error message
    } finally {
      setIsTransacting(false)
    }
  }

  const handleSell = async () => {
    if (!sellPrice) return

    try {
      setIsTransacting(true)
      const result = await listForSale(sellPrice, sellQuantity)
      
      if (result.success) {
        setShowSellModal(false)
        setSellPrice('')
        setSellQuantity(1)
        // Show success message
        console.log('Listed successfully:', result.listingId)
      }
    } catch (error) {
      console.error('Listing failed:', error)
      // Show error message
    } finally {
      setIsTransacting(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  if (isLoading) {
    return (
      <div className="bg-background-secondary rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-background-tertiary rounded mb-4"></div>
          <div className="h-12 bg-background-tertiary rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Marketplace Section */}
      <div className="bg-background-secondary rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Marketplace</h3>
          {hasListings && (
            <div className="text-text-secondary text-sm">
              {marketplaceData.totalListings} listing{marketplaceData.totalListings !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {hasListings ? (
          <div className="space-y-4">
            {/* Best Offer Section */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-green-400" size={20} />
                  <span className="text-green-400 font-medium">Best Offer</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {cheapestPrice} ETH
                </div>
              </div>
              
              {marketplaceData.cheapestListing && (
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span>by</span>
                    <UserLink
                      address={marketplaceData.cheapestListing.seller.address}
                      username={marketplaceData.cheapestListing.seller.username}
                      className="text-text-primary hover:text-green-400"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-text-secondary">
                    <Clock size={12} />
                    <span>{formatTimeAgo(marketplaceData.cheapestListing.listedAt)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBuyClick}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                leftIcon={<ShoppingCart size={16} />}
              >
                Buy Now for {cheapestPrice} ETH
              </Button>
            </div>

            {/* Floor Price Info */}
            {marketplaceData.floorPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Floor Price:</span>
                <span className="text-text-primary font-medium">{marketplaceData.floorPrice} ETH</span>
              </div>
            )}

            {/* All Listings */}
            {marketplaceData.listings.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-primary">All Offers</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {marketplaceData.listings.slice(0, 5).map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-text-primary font-medium">{listing.price} ETH</div>
                          <div className="text-text-secondary text-xs">
                            by <UserLink
                              address={listing.seller.address}
                              username={listing.seller.username}
                              className="text-text-secondary hover:text-purple-primary"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-text-secondary text-xs">
                          {formatTimeAgo(listing.listedAt)}
                        </div>
                        {listing.quantity > 1 && (
                          <div className="text-text-secondary text-xs">
                            Qty: {listing.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center">
                <AlertCircle className="text-text-secondary" size={24} />
              </div>
            </div>
            <h4 className="text-lg font-medium text-text-primary mb-2">No Offers Available</h4>
            <p className="text-text-secondary mb-4">
              There are currently no NFTs listed for sale. Be the first to mint or check back later!
            </p>
            <div className="text-text-secondary text-sm">
              💡 Tip: Try minting this NFT first, then you can list it for sale
            </div>
          </div>
        )}
      </div>

      {/* Sell Section - Only show if user owns NFT */}
      {userOwnsNFT && (
        <div className="bg-background-secondary rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Sell Your NFT</h3>
            <Tag className="text-purple-primary" size={20} />
          </div>
          
          <p className="text-text-secondary text-sm mb-4">
            List your NFT for sale on the marketplace. You can cancel anytime before it's sold.
          </p>
          
          <Button
            onClick={() => setShowSellModal(true)}
            variant="outline"
            leftIcon={<Tag size={16} />}
            className="w-full"
          >
            List for Sale
          </Button>
        </div>
      )}

      {/* Buy Modal */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title="Purchase NFT"
      >
        {selectedListing && (
          <div className="space-y-4">
            <div className="bg-background-tertiary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary">Price:</span>
                <span className="text-2xl font-bold text-text-primary">{selectedListing.price} ETH</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Seller:</span>
                <UserLink
                  address={selectedListing.seller.address}
                  username={selectedListing.seller.username}
                  className="text-text-primary hover:text-purple-primary"
                />
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-orange-500 mt-0.5" size={16} />
                <div className="text-sm">
                  <p className="text-orange-700 dark:text-orange-300 font-medium mb-1">
                    Important Notice
                  </p>
                  <p className="text-orange-600 dark:text-orange-400">
                    This purchase is final and cannot be undone. Make sure you have enough ETH plus gas fees.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowBuyModal(false)}
                variant="ghost"
                className="flex-1"
                disabled={isTransacting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBuy}
                loading={isTransacting}
                className="flex-1 bg-green-500 hover:bg-green-600"
                leftIcon={<ShoppingCart size={16} />}
              >
                Buy Now
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sell Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title="List NFT for Sale"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">Sale Price (ETH)</label>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full bg-background-primary border border-border rounded-lg p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary"
              placeholder="0.000111"
            />
            {marketplaceData.floorPrice && (
              <p className="text-xs text-text-secondary mt-1">
                Current floor price: {marketplaceData.floorPrice} ETH
              </p>
            )}
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              value={sellQuantity}
              onChange={(e) => setSellQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-background-primary border border-border rounded-lg p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-primary"
            />
            <p className="text-xs text-text-secondary mt-1">
              How many copies to list for sale
            </p>
          </div>

          <div className="bg-background-tertiary rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">You will receive:</span>
              <span className="text-text-primary font-medium">
                {sellPrice ? `${(parseFloat(sellPrice) * 0.975).toFixed(6)} ETH` : '0 ETH'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-secondary mt-1">
              <span>Platform fee (2.5%):</span>
              <span>{sellPrice ? `${(parseFloat(sellPrice) * 0.025).toFixed(6)} ETH` : '0 ETH'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowSellModal(false)}
              variant="ghost"
              className="flex-1"
              disabled={isTransacting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSell}
              loading={isTransacting}
              className="flex-1"
              disabled={!sellPrice || parseFloat(sellPrice) <= 0}
              leftIcon={<Tag size={16} />}
            >
              List for Sale
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}