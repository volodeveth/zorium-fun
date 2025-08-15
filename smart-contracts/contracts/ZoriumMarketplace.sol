// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title ZoriumMarketplace
 * @dev Advanced marketplace for Zorium NFTs with offers, auctions, and batch operations
 * @author Zorium.fun Team
 */
contract ZoriumMarketplace is 
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // ==============================================
    // CONSTANTS & VARIABLES
    // ==============================================
    
    /// @dev Marketplace fee in basis points (250 = 2.5%)
    uint256 public constant MARKETPLACE_FEE_BP = 250;
    
    /// @dev Minimum auction duration (1 hour)
    uint256 public constant MIN_AUCTION_DURATION = 3600;
    
    /// @dev Maximum auction duration (30 days)
    uint256 public constant MAX_AUCTION_DURATION = 2592000;
    
    /// @dev Auction extension time (10 minutes)
    uint256 public constant AUCTION_EXTENSION_TIME = 600;
    
    /// @dev Platform fee recipient
    address public platformFeeRecipient;
    
    /// @dev ZRM token address for payments
    address public zrmToken;
    
    // ==============================================
    // STRUCTS
    // ==============================================
    
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address paymentToken; // address(0) for ETH
        bool active;
        uint256 listedAt;
        uint256 expiresAt; // 0 for no expiration
    }
    
    struct Offer {
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        address paymentToken;
        uint256 expiresAt;
        bool active;
    }
    
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 currentBid;
        address currentBidder;
        address paymentToken;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool claimed;
    }
    
    // ==============================================
    // MAPPINGS
    // ==============================================
    
    /// @dev Listings by ID
    mapping(bytes32 => Listing) public listings;
    
    /// @dev Offers by ID
    mapping(bytes32 => Offer) public offers;
    
    /// @dev Auctions by ID
    mapping(bytes32 => Auction) public auctions;
    
    /// @dev User accumulated fees
    mapping(address => uint256) public accumulatedFees;
    
    /// @dev Platform accumulated fees
    uint256 public platformAccumulatedFees;
    
    /// @dev Supported NFT contracts
    mapping(address => bool) public supportedNFTContracts;
    
    /// @dev Supported payment tokens
    mapping(address => bool) public supportedPaymentTokens;
    
    // ==============================================
    // EVENTS
    // ==============================================
    
    event NFTListed(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    );
    
    event NFTSold(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed buyer,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    );
    
    event ListingCancelled(bytes32 indexed listingId);
    
    event OfferMade(
        bytes32 indexed offerId,
        address indexed buyer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount,
        address paymentToken
    );
    
    event OfferAccepted(
        bytes32 indexed offerId,
        address indexed seller,
        address indexed buyer,
        address nftContract,
        uint256 tokenId,
        uint256 amount
    );
    
    event OfferCancelled(bytes32 indexed offerId);
    
    event AuctionCreated(
        bytes32 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 endTime
    );
    
    event BidPlaced(
        bytes32 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionFinalized(
        bytes32 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );
    
    // ==============================================
    // INITIALIZATION
    // ==============================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _platformFeeRecipient,
        address _zrmToken
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        platformFeeRecipient = _platformFeeRecipient;
        zrmToken = _zrmToken;
        
        // ETH is always supported
        supportedPaymentTokens[address(0)] = true;
        // ZRM token is supported
        supportedPaymentTokens[_zrmToken] = true;
    }
    
    // ==============================================
    // LISTING FUNCTIONS
    // ==============================================
    
    /**
     * @dev List NFT for sale
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken,
        uint256 duration // 0 for no expiration
    ) external whenNotPaused returns (bytes32 listingId) {
        require(supportedNFTContracts[nftContract], "ZoriumMarketplace: Unsupported NFT contract");
        require(supportedPaymentTokens[paymentToken], "ZoriumMarketplace: Unsupported payment token");
        require(price > 0, "ZoriumMarketplace: Price must be greater than 0");
        
        // Verify ownership
        IERC721Upgradeable nft = IERC721Upgradeable(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "ZoriumMarketplace: Not token owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || 
                nft.getApproved(tokenId) == address(this), 
                "ZoriumMarketplace: Not approved");
        
        listingId = keccak256(abi.encodePacked(nftContract, tokenId, msg.sender, block.timestamp));
        
        uint256 expiresAt = duration > 0 ? block.timestamp + duration : 0;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            paymentToken: paymentToken,
            active: true,
            listedAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        emit NFTListed(listingId, msg.sender, nftContract, tokenId, price, paymentToken);
    }
    
    /**
     * @dev Buy NFT from listing
     */
    function buyNFT(bytes32 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "ZoriumMarketplace: Listing not active");
        require(listing.expiresAt == 0 || block.timestamp <= listing.expiresAt, "ZoriumMarketplace: Listing expired");
        require(msg.sender != listing.seller, "ZoriumMarketplace: Cannot buy own NFT");
        
        IERC721Upgradeable nft = IERC721Upgradeable(listing.nftContract);
        require(nft.ownerOf(listing.tokenId) == listing.seller, "ZoriumMarketplace: Seller no longer owns NFT");
        
        uint256 marketplaceFee = (listing.price * MARKETPLACE_FEE_BP) / 10000;
        uint256 sellerAmount = listing.price - marketplaceFee;
        
        if (listing.paymentToken == address(0)) {
            // ETH payment
            require(msg.value >= listing.price, "ZoriumMarketplace: Insufficient payment");
            
            // Transfer fees
            if (marketplaceFee > 0) {
                platformAccumulatedFees += marketplaceFee;
            }
            
            // Transfer to seller
            if (sellerAmount > 0) {
                payable(listing.seller).transfer(sellerAmount);
            }
            
            // Refund excess
            if (msg.value > listing.price) {
                payable(msg.sender).transfer(msg.value - listing.price);
            }
        } else {
            // ERC20 payment
            require(msg.value == 0, "ZoriumMarketplace: ETH not accepted for ERC20 listing");
            
            IERC20Upgradeable token = IERC20Upgradeable(listing.paymentToken);
            require(token.transferFrom(msg.sender, address(this), listing.price), "ZoriumMarketplace: Payment failed");
            
            // Accumulate marketplace fee
            if (marketplaceFee > 0) {
                accumulatedFees[platformFeeRecipient] += marketplaceFee;
            }
            
            // Transfer to seller
            if (sellerAmount > 0) {
                require(token.transfer(listing.seller, sellerAmount), "ZoriumMarketplace: Seller payment failed");
            }
        }
        
        // Transfer NFT
        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        
        // Mark listing as inactive
        listing.active = false;
        
        emit NFTSold(
            listingId,
            listing.seller,
            msg.sender,
            listing.nftContract,
            listing.tokenId,
            listing.price,
            listing.paymentToken
        );
    }
    
    /**
     * @dev Cancel listing
     */
    function cancelListing(bytes32 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "ZoriumMarketplace: Listing not active");
        require(listing.seller == msg.sender, "ZoriumMarketplace: Not listing owner");
        
        listing.active = false;
        
        emit ListingCancelled(listingId);
    }
    
    // ==============================================
    // OFFER FUNCTIONS
    // ==============================================
    
    /**
     * @dev Make offer on NFT
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        address paymentToken,
        uint256 duration
    ) external payable nonReentrant whenNotPaused returns (bytes32 offerId) {
        require(supportedNFTContracts[nftContract], "ZoriumMarketplace: Unsupported NFT contract");
        require(supportedPaymentTokens[paymentToken], "ZoriumMarketplace: Unsupported payment token");
        require(amount > 0, "ZoriumMarketplace: Amount must be greater than 0");
        require(duration > 0, "ZoriumMarketplace: Duration must be greater than 0");
        
        IERC721Upgradeable nft = IERC721Upgradeable(nftContract);
        require(nft.ownerOf(tokenId) != msg.sender, "ZoriumMarketplace: Cannot offer on own NFT");
        
        offerId = keccak256(abi.encodePacked(nftContract, tokenId, msg.sender, amount, block.timestamp));
        
        if (paymentToken == address(0)) {
            // ETH offer - hold in escrow
            require(msg.value >= amount, "ZoriumMarketplace: Insufficient ETH");
            
            // Refund excess
            if (msg.value > amount) {
                payable(msg.sender).transfer(msg.value - amount);
            }
        } else {
            // ERC20 offer - transfer to contract
            require(msg.value == 0, "ZoriumMarketplace: ETH not accepted for ERC20 offer");
            IERC20Upgradeable token = IERC20Upgradeable(paymentToken);
            require(token.transferFrom(msg.sender, address(this), amount), "ZoriumMarketplace: Payment failed");
        }
        
        offers[offerId] = Offer({
            buyer: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            paymentToken: paymentToken,
            expiresAt: block.timestamp + duration,
            active: true
        });
        
        emit OfferMade(offerId, msg.sender, nftContract, tokenId, amount, paymentToken);
    }
    
    /**
     * @dev Accept offer
     */
    function acceptOffer(bytes32 offerId) external nonReentrant whenNotPaused {
        Offer storage offer = offers[offerId];
        require(offer.active, "ZoriumMarketplace: Offer not active");
        require(block.timestamp <= offer.expiresAt, "ZoriumMarketplace: Offer expired");
        
        IERC721Upgradeable nft = IERC721Upgradeable(offer.nftContract);
        require(nft.ownerOf(offer.tokenId) == msg.sender, "ZoriumMarketplace: Not token owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || 
                nft.getApproved(offer.tokenId) == address(this), 
                "ZoriumMarketplace: Not approved");
        
        uint256 marketplaceFee = (offer.amount * MARKETPLACE_FEE_BP) / 10000;
        uint256 sellerAmount = offer.amount - marketplaceFee;
        
        if (offer.paymentToken == address(0)) {
            // ETH payment
            if (marketplaceFee > 0) {
                platformAccumulatedFees += marketplaceFee;
            }
            if (sellerAmount > 0) {
                payable(msg.sender).transfer(sellerAmount);
            }
        } else {
            // ERC20 payment
            IERC20Upgradeable token = IERC20Upgradeable(offer.paymentToken);
            
            if (marketplaceFee > 0) {
                accumulatedFees[platformFeeRecipient] += marketplaceFee;
            }
            if (sellerAmount > 0) {
                require(token.transfer(msg.sender, sellerAmount), "ZoriumMarketplace: Seller payment failed");
            }
        }
        
        // Transfer NFT
        nft.safeTransferFrom(msg.sender, offer.buyer, offer.tokenId);
        
        // Mark offer as inactive
        offer.active = false;
        
        emit OfferAccepted(offerId, msg.sender, offer.buyer, offer.nftContract, offer.tokenId, offer.amount);
    }
    
    /**
     * @dev Cancel offer
     */
    function cancelOffer(bytes32 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.active, "ZoriumMarketplace: Offer not active");
        require(offer.buyer == msg.sender, "ZoriumMarketplace: Not offer owner");
        
        // Refund escrowed amount
        if (offer.paymentToken == address(0)) {
            // ETH refund
            payable(offer.buyer).transfer(offer.amount);
        } else {
            // ERC20 refund
            IERC20Upgradeable token = IERC20Upgradeable(offer.paymentToken);
            require(token.transfer(offer.buyer, offer.amount), "ZoriumMarketplace: Refund failed");
        }
        
        offer.active = false;
        
        emit OfferCancelled(offerId);
    }
    
    // ==============================================
    // AUCTION FUNCTIONS
    // ==============================================
    
    /**
     * @dev Create auction
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration,
        address paymentToken
    ) external whenNotPaused returns (bytes32 auctionId) {
        require(supportedNFTContracts[nftContract], "ZoriumMarketplace: Unsupported NFT contract");
        require(supportedPaymentTokens[paymentToken], "ZoriumMarketplace: Unsupported payment token");
        require(startingPrice > 0, "ZoriumMarketplace: Starting price must be greater than 0");
        require(duration >= MIN_AUCTION_DURATION && duration <= MAX_AUCTION_DURATION, 
                "ZoriumMarketplace: Invalid duration");
        
        IERC721Upgradeable nft = IERC721Upgradeable(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "ZoriumMarketplace: Not token owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || 
                nft.getApproved(tokenId) == address(this), 
                "ZoriumMarketplace: Not approved");
        
        auctionId = keccak256(abi.encodePacked(nftContract, tokenId, msg.sender, block.timestamp));
        
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startingPrice: startingPrice,
            currentBid: 0,
            currentBidder: address(0),
            paymentToken: paymentToken,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true,
            claimed: false
        });
        
        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startingPrice, block.timestamp + duration);
    }
    
    /**
     * @dev Place bid on auction
     */
    function placeBid(bytes32 auctionId) external payable nonReentrant whenNotPaused {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "ZoriumMarketplace: Auction not active");
        require(block.timestamp < auction.endTime, "ZoriumMarketplace: Auction ended");
        require(msg.sender != auction.seller, "ZoriumMarketplace: Cannot bid on own auction");
        
        uint256 bidAmount;
        if (auction.paymentToken == address(0)) {
            bidAmount = msg.value;
        } else {
            require(msg.value == 0, "ZoriumMarketplace: ETH not accepted");
            // For ERC20, bidAmount should be passed as parameter in a separate function
            revert("ZoriumMarketplace: Use placeBidERC20 for token auctions");
        }
        
        require(bidAmount >= auction.startingPrice, "ZoriumMarketplace: Bid below starting price");
        require(bidAmount > auction.currentBid, "ZoriumMarketplace: Bid too low");
        
        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            payable(auction.currentBidder).transfer(auction.currentBid);
        }
        
        auction.currentBid = bidAmount;
        auction.currentBidder = msg.sender;
        
        // Extend auction if bid placed in last 10 minutes
        if (auction.endTime - block.timestamp < AUCTION_EXTENSION_TIME) {
            auction.endTime = block.timestamp + AUCTION_EXTENSION_TIME;
        }
        
        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }
    
    /**
     * @dev Finalize auction
     */
    function finalizeAuction(bytes32 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "ZoriumMarketplace: Auction not active");
        require(block.timestamp >= auction.endTime, "ZoriumMarketplace: Auction not ended");
        require(!auction.claimed, "ZoriumMarketplace: Already claimed");
        
        auction.active = false;
        auction.claimed = true;
        
        if (auction.currentBidder != address(0)) {
            // Auction had bids
            uint256 marketplaceFee = (auction.currentBid * MARKETPLACE_FEE_BP) / 10000;
            uint256 sellerAmount = auction.currentBid - marketplaceFee;
            
            // Transfer fees and payment
            if (marketplaceFee > 0) {
                platformAccumulatedFees += marketplaceFee;
            }
            if (sellerAmount > 0) {
                payable(auction.seller).transfer(sellerAmount);
            }
            
            // Transfer NFT to winner
            IERC721Upgradeable nft = IERC721Upgradeable(auction.nftContract);
            nft.safeTransferFrom(auction.seller, auction.currentBidder, auction.tokenId);
            
            emit AuctionFinalized(auctionId, auction.currentBidder, auction.currentBid);
        } else {
            // No bids - NFT remains with seller
            emit AuctionFinalized(auctionId, address(0), 0);
        }
    }
    
    // ==============================================
    // FEE WITHDRAWAL FUNCTIONS
    // ==============================================
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external nonReentrant {
        uint256 amount = accumulatedFees[msg.sender];
        require(amount > 0, "ZoriumMarketplace: No fees to withdraw");
        
        accumulatedFees[msg.sender] = 0;
        
        // Transfer tokens or ETH based on the fee accumulation logic
        // For now, assuming ETH fees are in platformAccumulatedFees
        // and ERC20 fees are in accumulatedFees[user]
        
        // This needs to be implemented based on specific token handling
        revert("ZoriumMarketplace: Fee withdrawal needs token-specific implementation");
    }
    
    /**
     * @dev Withdraw platform fees (only owner)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformAccumulatedFees;
        require(amount > 0, "ZoriumMarketplace: No platform fees to withdraw");
        
        platformAccumulatedFees = 0;
        payable(platformFeeRecipient).transfer(amount);
    }
    
    // ==============================================
    // ADMIN FUNCTIONS
    // ==============================================
    
    /**
     * @dev Add supported NFT contract
     */
    function addSupportedNFTContract(address nftContract) external onlyOwner {
        supportedNFTContracts[nftContract] = true;
    }
    
    /**
     * @dev Remove supported NFT contract
     */
    function removeSupportedNFTContract(address nftContract) external onlyOwner {
        supportedNFTContracts[nftContract] = false;
    }
    
    /**
     * @dev Add supported payment token
     */
    function addSupportedPaymentToken(address token) external onlyOwner {
        supportedPaymentTokens[token] = true;
    }
    
    /**
     * @dev Remove supported payment token
     */
    function removeSupportedPaymentToken(address token) external onlyOwner {
        supportedPaymentTokens[token] = false;
    }
    
    /**
     * @dev Update platform fee recipient
     */
    function setPlatformFeeRecipient(address _platformFeeRecipient) external onlyOwner {
        require(_platformFeeRecipient != address(0), "ZoriumMarketplace: Invalid address");
        platformFeeRecipient = _platformFeeRecipient;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ==============================================
    // VIEW FUNCTIONS
    // ==============================================
    
    /**
     * @dev Check if listing is active and valid
     */
    function isListingValid(bytes32 listingId) external view returns (bool) {
        Listing memory listing = listings[listingId];
        if (!listing.active) return false;
        if (listing.expiresAt > 0 && block.timestamp > listing.expiresAt) return false;
        
        IERC721Upgradeable nft = IERC721Upgradeable(listing.nftContract);
        return nft.ownerOf(listing.tokenId) == listing.seller;
    }
    
    /**
     * @dev Check if offer is active and valid
     */
    function isOfferValid(bytes32 offerId) external view returns (bool) {
        Offer memory offer = offers[offerId];
        return offer.active && block.timestamp <= offer.expiresAt;
    }
    
    /**
     * @dev Check if auction is active and valid
     */
    function isAuctionActive(bytes32 auctionId) external view returns (bool) {
        Auction memory auction = auctions[auctionId];
        return auction.active && block.timestamp < auction.endTime;
    }
    
    // ==============================================
    // UPGRADE AUTHORIZATION
    // ==============================================
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}