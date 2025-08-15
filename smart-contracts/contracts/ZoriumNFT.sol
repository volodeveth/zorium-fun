// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ZoriumNFT
 * @dev Upgradeable NFT contract with integrated marketplace and fee distribution
 * @author Zorium.fun Team
 */
contract ZoriumNFT is 
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // ==============================================
    // CONSTANTS & VARIABLES
    // ==============================================
    
    /// @dev Default mint price in wei (0.000111 ETH)
    uint256 public constant DEFAULT_MINT_PRICE = 111000000000000;
    
    /// @dev Fee percentages for default mint price (basis points: 10000 = 100%)
    uint256 public constant CREATOR_FEE_BP = 5000;      // 50%
    uint256 public constant FIRST_MINTER_FEE_BP = 1000;  // 10%
    uint256 public constant REFERRAL_FEE_BP = 2000;     // 20%
    uint256 public constant PLATFORM_FEE_BP = 2000;     // 20%
    
    /// @dev Fee percentages for custom mint price
    uint256 public constant CUSTOM_CREATOR_FEE_BP = 9500; // 95%
    uint256 public constant CUSTOM_PLATFORM_FEE_BP = 500;  // 5%
    
    /// @dev Marketplace sale fee percentages
    uint256 public constant ROYALTY_FEE_BP = 250;      // 2.5%
    uint256 public constant MARKETPLACE_FEE_BP = 250;   // 2.5%
    
    /// @dev Token counter
    uint256 private _nextTokenId;
    
    /// @dev Platform fee recipient
    address public platformFeeRecipient;
    
    // ==============================================
    // STRUCTS
    // ==============================================
    
    struct MintParams {
        address to;
        string tokenURI;
        bool isCreatorFirstMint;
        address referrer;
        uint256 customPrice;
    }
    
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }
    
    struct TokenInfo {
        address creator;
        address firstMinter;
        uint256 mintPrice;
        bool isCreatorFirstMint;
        bool hasReferrer;
        address referrer;
    }
    
    // ==============================================
    // MAPPINGS
    // ==============================================
    
    /// @dev Track creator's first mint status (DEPRECATED but kept for storage compatibility)
    mapping(address => bool) public hasCreatorMinted;
    
    /// @dev Track token information
    mapping(uint256 => TokenInfo) public tokenInfo;
    
    /// @dev Marketplace listings
    mapping(uint256 => Listing) public listings;
    
    /// @dev Accumulated fees for withdrawal
    mapping(address => uint256) public accumulatedFees;
    
    /// @dev Platform accumulated fees
    uint256 public platformAccumulatedFees;
    
    /// @dev Track if token was already minted by its creator (tokenId => bool) - V2 upgrade
    mapping(uint256 => bool) public tokenFirstMinted;
    
    // ==============================================
    // EVENTS
    // ==============================================
    
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed to,
        uint256 price,
        bool isCreatorFirstMint,
        address referrer
    );
    
    event FeesDistributed(
        uint256 indexed tokenId,
        address creator,
        address firstMinter,
        address referrer,
        address platform,
        uint256 creatorFee,
        uint256 firstMinterFee,
        uint256 referralFee,
        uint256 platformFee
    );
    
    event TokenListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    
    event TokenSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 royalty,
        uint256 platformFee
    );
    
    event TokenDelisted(uint256 indexed tokenId);
    
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    // ==============================================
    // MODIFIERS
    // ==============================================
    
    modifier validTokenId(uint256 tokenId) {
        require(_exists(tokenId), "ZoriumNFT: Token does not exist");
        _;
    }
    
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "ZoriumNFT: Not token owner");
        _;
    }
    
    // ==============================================
    // INITIALIZATION
    // ==============================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        string memory name,
        string memory symbol,
        address _platformFeeRecipient
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        platformFeeRecipient = _platformFeeRecipient;
        _nextTokenId = 1;
    }
    
    // ==============================================
    // MINTING FUNCTIONS
    // ==============================================
    
    /**
     * @dev Mint NFT with fee distribution logic
     * @param params Mint parameters
     */
    function mint(MintParams memory params) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(params.to != address(0), "ZoriumNFT: Invalid recipient");
        require(bytes(params.tokenURI).length > 0, "ZoriumNFT: Empty tokenURI");
        // OPTIMIZED: Re-enable IPFS validation with gas-optimized version
        require(_isValidIPFSURI(params.tokenURI), "ZoriumNFT: Invalid IPFS URI format");
        
        uint256 tokenId = _nextTokenId;
        uint256 finalPrice = params.customPrice > 0 ? params.customPrice : DEFAULT_MINT_PRICE;
        
        // Check if this is creator's first mint of THIS token
        bool isActuallyFirstMint = params.isCreatorFirstMint && !tokenFirstMinted[tokenId];
        
        if (isActuallyFirstMint) {
            // Creator's first mint of this token is FREE (only gas cost)
            require(msg.value == 0, "ZoriumNFT: First mint should be free");
            tokenFirstMinted[tokenId] = true;
        } else {
            // Regular mint with payment
            require(msg.value >= finalPrice, "ZoriumNFT: Insufficient payment");
            
            // Distribute fees
            _distributeMintFees(
                tokenId,
                finalPrice,
                msg.sender,
                params.to,
                params.referrer,
                params.customPrice > 0
            );
        }
        
        // Store token information
        tokenInfo[tokenId] = TokenInfo({
            creator: msg.sender,
            firstMinter: params.to,
            mintPrice: finalPrice,
            isCreatorFirstMint: isActuallyFirstMint,
            hasReferrer: params.referrer != address(0),
            referrer: params.referrer
        });
        
        // Mint the NFT
        _safeMint(params.to, tokenId);
        _setTokenURI(tokenId, params.tokenURI);
        
        _nextTokenId++;
        
        emit TokenMinted(
            tokenId,
            msg.sender,
            params.to,
            finalPrice,
            isActuallyFirstMint,
            params.referrer
        );
    }
    
    /**
     * @dev Distribute fees for minting
     */
    function _distributeMintFees(
        uint256 tokenId,
        uint256 price,
        address creator,
        address firstMinter,
        address referrer,
        bool isCustomPrice
    ) private {
        uint256 creatorFee;
        uint256 firstMinterFee;
        uint256 referralFee;
        uint256 platformFee;
        
        if (isCustomPrice) {
            // Custom price: 95% creator, 5% platform
            creatorFee = (price * CUSTOM_CREATOR_FEE_BP) / 10000;
            platformFee = (price * CUSTOM_PLATFORM_FEE_BP) / 10000;
            firstMinterFee = 0;
            referralFee = 0;
        } else {
            // Default price distribution
            creatorFee = (price * CREATOR_FEE_BP) / 10000;
            firstMinterFee = (price * FIRST_MINTER_FEE_BP) / 10000;
            referralFee = (price * REFERRAL_FEE_BP) / 10000;
            platformFee = (price * PLATFORM_FEE_BP) / 10000;
            
            // If no referrer, platform gets the referral fee too
            if (referrer == address(0)) {
                platformFee += referralFee;
                referralFee = 0;
            }
        }
        
        // Accumulate fees
        if (creatorFee > 0) {
            accumulatedFees[creator] += creatorFee;
        }
        if (firstMinterFee > 0 && firstMinter != creator) {
            accumulatedFees[firstMinter] += firstMinterFee;
        }
        if (referralFee > 0) {
            accumulatedFees[referrer] += referralFee;
        }
        if (platformFee > 0) {
            platformAccumulatedFees += platformFee;
        }
        
        emit FeesDistributed(
            tokenId,
            creator,
            firstMinter,
            referrer,
            platformFeeRecipient,
            creatorFee,
            firstMinterFee,
            referralFee,
            platformFee
        );
    }
    
    // ==============================================
    // MARKETPLACE FUNCTIONS
    // ==============================================
    
    /**
     * @dev List NFT for sale
     */
    function listForSale(uint256 tokenId, uint256 price) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        whenNotPaused 
    {
        require(price > 0, "ZoriumNFT: Price must be greater than 0");
        require(!listings[tokenId].active, "ZoriumNFT: Already listed");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });
        
        emit TokenListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Buy NFT from marketplace
     */
    function buyNFT(uint256 tokenId) 
        external 
        payable 
        validTokenId(tokenId) 
        nonReentrant 
        whenNotPaused 
    {
        Listing memory listing = listings[tokenId];
        require(listing.active, "ZoriumNFT: Not for sale");
        require(msg.value >= listing.price, "ZoriumNFT: Insufficient payment");
        require(msg.sender != listing.seller, "ZoriumNFT: Cannot buy own NFT");
        
        // Calculate fees
        uint256 royalty = (listing.price * ROYALTY_FEE_BP) / 10000;
        uint256 marketplaceFee = (listing.price * MARKETPLACE_FEE_BP) / 10000;
        uint256 sellerAmount = listing.price - royalty - marketplaceFee;
        
        // Get creator for royalty
        address creator = tokenInfo[tokenId].creator;
        
        // Transfer fees
        if (royalty > 0) {
            accumulatedFees[creator] += royalty;
        }
        if (marketplaceFee > 0) {
            platformAccumulatedFees += marketplaceFee;
        }
        
        // Transfer to seller
        if (sellerAmount > 0) {
            payable(listing.seller).transfer(sellerAmount);
        }
        
        // Transfer NFT
        _transfer(listing.seller, msg.sender, tokenId);
        
        // Remove listing
        delete listings[tokenId];
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit TokenSold(
            tokenId,
            listing.seller,
            msg.sender,
            listing.price,
            royalty,
            marketplaceFee
        );
    }
    
    /**
     * @dev Remove NFT from sale
     */
    function delistNFT(uint256 tokenId) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
    {
        require(listings[tokenId].active, "ZoriumNFT: Not listed");
        
        delete listings[tokenId];
        
        emit TokenDelisted(tokenId);
    }
    
    // ==============================================
    // FEE WITHDRAWAL FUNCTIONS
    // ==============================================
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external nonReentrant {
        uint256 amount = accumulatedFees[msg.sender];
        require(amount > 0, "ZoriumNFT: No fees to withdraw");
        
        accumulatedFees[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit FeesWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw platform fees (only owner)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformAccumulatedFees;
        require(amount > 0, "ZoriumNFT: No platform fees to withdraw");
        
        platformAccumulatedFees = 0;
        payable(platformFeeRecipient).transfer(amount);
        
        emit FeesWithdrawn(platformFeeRecipient, amount);
    }
    
    /**
     * @dev Withdraw platform fees to specific address (only owner)
     */
    function withdrawPlatformFeesTo(address to) external onlyOwner nonReentrant {
        require(to != address(0), "ZoriumNFT: Invalid address");
        
        uint256 amount = platformAccumulatedFees;
        require(amount > 0, "ZoriumNFT: No platform fees to withdraw");
        
        platformAccumulatedFees = 0;
        payable(to).transfer(amount);
        
        emit FeesWithdrawn(to, amount);
    }
    
    // ==============================================
    // VIEW FUNCTIONS
    // ==============================================
    
    /**
     * @dev Get current token ID
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
    
    /**
     * @dev Check if token is listed for sale
     */
    function isTokenListed(uint256 tokenId) external view returns (bool) {
        return listings[tokenId].active;
    }
    
    /**
     * @dev Get listing information
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
    
    /**
     * @dev Get token information
     */
    function getTokenInfo(uint256 tokenId) external view returns (TokenInfo memory) {
        return tokenInfo[tokenId];
    }
    
    /**
     * @dev Calculate mint fees for given price
     */
    function calculateMintFees(uint256 price, bool hasReferrer, bool isCustomPrice) 
        external 
        pure 
        returns (
            uint256 creatorFee,
            uint256 firstMinterFee,
            uint256 referralFee,
            uint256 platformFee
        ) 
    {
        if (isCustomPrice) {
            creatorFee = (price * CUSTOM_CREATOR_FEE_BP) / 10000;
            platformFee = (price * CUSTOM_PLATFORM_FEE_BP) / 10000;
            firstMinterFee = 0;
            referralFee = 0;
        } else {
            creatorFee = (price * CREATOR_FEE_BP) / 10000;
            firstMinterFee = (price * FIRST_MINTER_FEE_BP) / 10000;
            referralFee = (price * REFERRAL_FEE_BP) / 10000;
            platformFee = (price * PLATFORM_FEE_BP) / 10000;
            
            if (!hasReferrer) {
                platformFee += referralFee;
                referralFee = 0;
            }
        }
    }
    
    /**
     * @dev Calculate sale fees
     */
    function calculateSaleFees(uint256 price) 
        external 
        pure 
        returns (uint256 royalty, uint256 marketplaceFee, uint256 sellerAmount) 
    {
        royalty = (price * ROYALTY_FEE_BP) / 10000;
        marketplaceFee = (price * MARKETPLACE_FEE_BP) / 10000;
        sellerAmount = price - royalty - marketplaceFee;
    }
    
    // ==============================================
    // ADMIN FUNCTIONS
    // ==============================================
    
    /**
     * @dev Update platform fee recipient
     */
    function setPlatformFeeRecipient(address _platformFeeRecipient) external onlyOwner {
        require(_platformFeeRecipient != address(0), "ZoriumNFT: Invalid address");
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
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "ZoriumNFT: No balance to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    // ==============================================
    // UPGRADE AUTHORIZATION
    // ==============================================
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // ==============================================
    // INTERNAL FUNCTIONS
    // ==============================================
    
    /**
     * @dev OPTIMIZED: Validates that a URI follows the IPFS format
     * @param uri The URI to validate
     * @return bool True if valid IPFS URI, false otherwise
     * @notice Gas optimized version - saves ~40,000+ gas by not validating every character
     */
    function _isValidIPFSURI(string memory uri) internal pure returns (bool) {
        bytes memory uriBytes = bytes(uri);
        
        // Check minimum length for "ipfs://" + minimal hash
        // IPFS v0 hashes: 46 chars (Qm...), IPFS v1 hashes: 59+ chars (baf...)
        if (uriBytes.length < 39) {  // ipfs:// (7) + minimal hash (32 chars minimum)
            return false;
        }
        
        // Check maximum reasonable length to prevent DoS
        if (uriBytes.length > 100) {
            return false;
        }
        
        // OPTIMIZATION: Only check prefix "ipfs://" - trust that IPFS hash is valid
        // This saves massive gas compared to character-by-character validation
        // Frontend and IPFS service should ensure URI validity before calling contract
        return (uriBytes[0] == 'i' && 
                uriBytes[1] == 'p' && 
                uriBytes[2] == 'f' && 
                uriBytes[3] == 's' &&
                uriBytes[4] == ':' &&
                uriBytes[5] == '/' &&
                uriBytes[6] == '/');
    }
    
    // ==============================================
    // OVERRIDES
    // ==============================================
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Remove listing when token is transferred
        if (listings[tokenId].active) {
            delete listings[tokenId];
            emit TokenDelisted(tokenId);
        }
    }
    
    function _burn(uint256 tokenId) 
        internal 
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable) 
    {
        super._burn(tokenId);
        
        // Clean up listings and token info
        if (listings[tokenId].active) {
            delete listings[tokenId];
        }
        delete tokenInfo[tokenId];
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}