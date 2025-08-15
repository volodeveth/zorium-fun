// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IZoriumFactory.sol";

/**
 * @title ZoriumCollection
 * @dev ERC-1155 NFT collection with advanced minting logic and marketplace
 * @notice This contract implements timer-based minting, first minter rewards, and integrated marketplace
 * @author Zorium.fun Team
 */
contract ZoriumCollection is 
    Initializable,
    ERC1155Upgradeable,
    ERC1155URIStorageUpgradeable,
    ERC1155SupplyUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // ==============================================
    // ENUMS
    // ==============================================
    
    enum TokenStatus { 
        Created,         // Creator's free mint done
        FirstMinted,     // First paid mint done
        CountdownActive, // 48-hour countdown active (for default price)
        Finalized       // Minting finished
    }
    
    // ==============================================
    // STATE VARIABLES
    // ==============================================
    
    /// @dev Factory contract interface
    IZoriumFactory public factory;
    
    /// @dev Collection creator
    address public creator;
    
    /// @dev Collection name
    string public name;
    
    /// @dev Collection symbol  
    string public symbol;
    
    /// @dev Next token ID to be minted
    uint256 private _nextTokenId;
    
    /// @dev Base URI for metadata
    string private _baseTokenURI;
    
    // ==============================================
    // MAPPINGS
    // ==============================================
    
    /// @dev Token information mapping
    mapping(uint256 => TokenInfo) public tokenInfo;
    
    /// @dev Marketplace listings mapping
    mapping(uint256 => Listing) public listings;
    
    /// @dev User accumulated fees mapping
    mapping(address => uint256) public accumulatedFees;
    
    /// @dev Track if user created first free mint for token
    mapping(uint256 => bool) public creatorFreeMintDone;
    
    // ==============================================
    // STRUCTS
    // ==============================================
    
    struct TokenInfo {
        address creator;
        address firstMinter;
        uint256 mintPrice;
        bool isCustomPrice;
        uint256 mintEndTime;         // For custom price only
        uint256 totalMinted;
        uint256 finalCountdownStart; // When 48h countdown started (default price)
        TokenStatus status;
        address referrer;            // First minter's referrer
        string tokenURI;
    }
    
    struct MintParams {
        address to;
        uint256 tokenId;
        uint256 amount;
        address referrer;
    }
    
    struct CreateTokenParams {
        string tokenURI;
        uint256 customPrice;
        uint256 mintEndTime;    // Only for custom price, 0 = default behavior
    }
    
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerToken;
        bool active;
        uint256 listedAt;
    }
    
    // ==============================================
    // EVENTS
    // ==============================================
    
    event TokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string tokenURI,
        bool isCustomPrice,
        uint256 mintPrice,
        uint256 mintEndTime
    );
    
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed minter,
        address indexed to,
        uint256 amount,
        uint256 totalPaid,
        bool isFirstMint
    );
    
    event FirstMinterSet(
        uint256 indexed tokenId,
        address indexed firstMinter,
        address indexed referrer
    );
    
    event CountdownActivated(
        uint256 indexed tokenId,
        uint256 countdownEndTime
    );
    
    event TokenFinalized(
        uint256 indexed tokenId,
        uint256 totalMinted
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
        uint256 amount,
        uint256 pricePerToken
    );
    
    event TokenSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice,
        uint256 royalty,
        uint256 platformFee
    );
    
    event TokenDelisted(uint256 indexed tokenId);
    
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    // ==============================================
    // MODIFIERS
    // ==============================================
    
    modifier validTokenId(uint256 tokenId) {
        require(tokenInfo[tokenId].creator != address(0), "ZoriumCollection: Token does not exist");
        _;
    }
    
    modifier onlyTokenCreator(uint256 tokenId) {
        require(tokenInfo[tokenId].creator == msg.sender, "ZoriumCollection: Not token creator");
        _;
    }
    
    modifier onlyCollectionOwner() {
        require(msg.sender == creator, "ZoriumCollection: Not collection owner");
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
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        address _creator,
        address _factory
    ) public initializer {
        __ERC1155_init(_baseURI);
        __ERC1155URIStorage_init();
        __ERC1155Supply_init();
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        name = _name;
        symbol = _symbol;
        creator = _creator;
        factory = IZoriumFactory(_factory);
        _baseTokenURI = _baseURI;
        _nextTokenId = 1;
        
        // Transfer ownership to creator
        _transferOwnership(_creator);
    }
    
    // ==============================================
    // TOKEN CREATION FUNCTIONS
    // ==============================================
    
    /**
     * @dev Create a new token (only collection creator)
     * @param params Token creation parameters
     * @return tokenId ID of created token
     */
    function createToken(CreateTokenParams memory params) 
        external 
        onlyCollectionOwner 
        whenNotPaused 
        returns (uint256 tokenId) 
    {
        require(bytes(params.tokenURI).length > 0, "ZoriumCollection: Empty tokenURI");
        require(_isValidIPFSURI(params.tokenURI), "ZoriumCollection: Invalid IPFS URI format");
        
        tokenId = _nextTokenId;
        _nextTokenId++;
        
        bool isCustomPrice = params.customPrice > 0;
        uint256 mintPrice = isCustomPrice ? params.customPrice : factory.DEFAULT_MINT_PRICE();
        
        // Store token information
        tokenInfo[tokenId] = TokenInfo({
            creator: msg.sender,
            firstMinter: address(0),
            mintPrice: mintPrice,
            isCustomPrice: isCustomPrice,
            mintEndTime: params.mintEndTime,
            totalMinted: 0,
            finalCountdownStart: 0,
            status: TokenStatus.Created,
            referrer: address(0),
            tokenURI: params.tokenURI
        });
        
        // Set token URI
        _setURI(tokenId, params.tokenURI);
        
        // Creator gets free mint
        _mint(msg.sender, tokenId, 1, "");
        creatorFreeMintDone[tokenId] = true;
        
        emit TokenCreated(
            tokenId,
            msg.sender,
            params.tokenURI,
            isCustomPrice,
            mintPrice,
            params.mintEndTime
        );
        
        return tokenId;
    }
    
    /**
     * @dev Create token with just URI (for personal collections)
     */
    function createTokenSimple(
        string memory tokenURI,
        uint256 customPrice,
        uint256 mintEndTime
    ) external onlyCollectionOwner whenNotPaused returns (uint256 tokenId) {
        require(bytes(tokenURI).length > 0, "ZoriumCollection: Empty tokenURI");
        require(_isValidIPFSURI(tokenURI), "ZoriumCollection: Invalid IPFS URI format");
        
        tokenId = _nextTokenId;
        _nextTokenId++;
        
        bool isCustomPrice = customPrice > 0;
        uint256 mintPrice = isCustomPrice ? customPrice : factory.DEFAULT_MINT_PRICE();
        
        // Store token information
        tokenInfo[tokenId] = TokenInfo({
            creator: msg.sender,
            firstMinter: address(0),
            mintPrice: mintPrice,
            isCustomPrice: isCustomPrice,
            mintEndTime: mintEndTime,
            totalMinted: 0,
            finalCountdownStart: 0,
            status: TokenStatus.Created,
            referrer: address(0),
            tokenURI: tokenURI
        });
        
        // Set token URI
        _setURI(tokenId, tokenURI);
        
        // Creator gets free mint
        _mint(msg.sender, tokenId, 1, "");
        creatorFreeMintDone[tokenId] = true;
        
        emit TokenCreated(
            tokenId,
            msg.sender,
            tokenURI,
            isCustomPrice,
            mintPrice,
            mintEndTime
        );
        
        return tokenId;
    }
    
    // ==============================================
    // MINTING FUNCTIONS
    // ==============================================
    
    /**
     * @dev Mint tokens with full validation and fee distribution
     * @param params Mint parameters
     */
    function mint(MintParams memory params) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validTokenId(params.tokenId)
    {
        TokenInfo storage token = tokenInfo[params.tokenId];
        
        require(params.amount > 0, "ZoriumCollection: Amount must be greater than 0");
        require(params.to != address(0), "ZoriumCollection: Invalid recipient");
        require(token.status != TokenStatus.Finalized, "ZoriumCollection: Minting finished");
        
        // Check timing constraints
        _validateMintTiming(params.tokenId);
        
        uint256 totalPrice = token.mintPrice * params.amount;
        require(msg.value >= totalPrice, "ZoriumCollection: Insufficient payment");
        
        bool isFirstMint = (token.status == TokenStatus.Created);
        
        // Set first minter if this is the first paid mint
        if (isFirstMint) {
            token.firstMinter = msg.sender;
            token.referrer = params.referrer;
            token.status = TokenStatus.FirstMinted;
            
            emit FirstMinterSet(params.tokenId, msg.sender, params.referrer);
        }
        
        // Distribute fees
        _distributeMintFees(params.tokenId, totalPrice, msg.sender, params.referrer);
        
        // Update minted count and check for countdown activation
        token.totalMinted += params.amount;
        _checkAndActivateCountdown(params.tokenId);
        
        // Mint tokens
        _mint(params.to, params.tokenId, params.amount, "");
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit TokenMinted(
            params.tokenId,
            msg.sender,
            params.to,
            params.amount,
            totalPrice,
            isFirstMint
        );
    }
    
    /**
     * @dev Validate timing constraints for minting
     * @param tokenId Token ID to validate
     */
    function _validateMintTiming(uint256 tokenId) internal view {
        TokenInfo storage token = tokenInfo[tokenId];
        
        if (token.isCustomPrice) {
            // Custom price: check mintEndTime
            require(
                block.timestamp <= token.mintEndTime,
                "ZoriumCollection: Custom mint period ended"
            );
        } else {
            // Default price: check 48-hour countdown if active
            if (token.status == TokenStatus.CountdownActive) {
                require(
                    block.timestamp <= token.finalCountdownStart + factory.FINAL_COUNTDOWN_DURATION(),
                    "ZoriumCollection: Final countdown ended"
                );
            }
        }
    }
    
    /**
     * @dev Check and activate countdown after reaching trigger supply
     * @param tokenId Token ID to check
     */
    function _checkAndActivateCountdown(uint256 tokenId) internal {
        TokenInfo storage token = tokenInfo[tokenId];
        
        // Only for default price tokens
        if (!token.isCustomPrice && 
            token.status == TokenStatus.FirstMinted && 
            token.totalMinted >= factory.TRIGGER_SUPPLY()) {
            
            token.finalCountdownStart = block.timestamp;
            token.status = TokenStatus.CountdownActive;
            
            emit CountdownActivated(
                tokenId, 
                block.timestamp + factory.FINAL_COUNTDOWN_DURATION()
            );
        }
    }
    
    /**
     * @dev Distribute mint fees according to the economic model
     * @param tokenId Token ID being minted
     * @param totalPrice Total price paid
     * @param minter Address of the minter
     * @param referrer Address of referrer (can be zero)
     */
    function _distributeMintFees(
        uint256 tokenId,
        uint256 totalPrice,
        address minter,
        address referrer
    ) internal {
        TokenInfo storage token = tokenInfo[tokenId];
        
        uint256 creatorFee;
        uint256 firstMinterFee;
        uint256 referralFee;
        uint256 platformFee;
        
        // Get fees from factory
        (creatorFee, firstMinterFee, referralFee, platformFee) = factory.calculateMintFees(
            totalPrice,
            referrer != address(0),
            token.isCustomPrice
        );
        
        // Accumulate fees
        if (creatorFee > 0) {
            accumulatedFees[token.creator] += creatorFee;
        }
        
        if (firstMinterFee > 0 && token.firstMinter != address(0) && token.firstMinter != token.creator) {
            accumulatedFees[token.firstMinter] += firstMinterFee;
        }
        
        if (referralFee > 0) {
            accumulatedFees[referrer] += referralFee;
        }
        
        if (platformFee > 0) {
            // Send platform fee to factory
            payable(address(factory)).transfer(platformFee);
            factory.accumulatePlatformFees(platformFee);
        }
        
        emit FeesDistributed(
            tokenId,
            token.creator,
            token.firstMinter,
            referrer,
            address(factory),
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
     * @dev List tokens for sale
     * @param tokenId Token ID to list
     * @param amount Amount to list
     * @param pricePerToken Price per token
     */
    function listForSale(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerToken
    ) 
        external 
        validTokenId(tokenId) 
        whenNotPaused 
    {
        require(balanceOf(msg.sender, tokenId) >= amount, "ZoriumCollection: Insufficient balance");
        require(amount > 0, "ZoriumCollection: Amount must be greater than 0");
        require(pricePerToken > 0, "ZoriumCollection: Price must be greater than 0");
        
        // For simplicity, one listing per user per token
        uint256 listingId = uint256(keccak256(abi.encodePacked(msg.sender, tokenId, block.timestamp)));
        
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerToken: pricePerToken,
            active: true,
            listedAt: block.timestamp
        });
        
        emit TokenListed(tokenId, msg.sender, amount, pricePerToken);
    }
    
    /**
     * @dev Buy tokens from marketplace
     * @param listingId Listing ID to buy from
     * @param amount Amount to buy
     */
    function buyNFT(uint256 listingId, uint256 amount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Listing storage listing = listings[listingId];
        require(listing.active, "ZoriumCollection: Listing not active");
        require(amount > 0 && amount <= listing.amount, "ZoriumCollection: Invalid amount");
        require(msg.sender != listing.seller, "ZoriumCollection: Cannot buy own listing");
        
        uint256 totalPrice = listing.pricePerToken * amount;
        require(msg.value >= totalPrice, "ZoriumCollection: Insufficient payment");
        
        // Calculate fees
        (uint256 royalty, uint256 marketplaceFee, uint256 sellerAmount) = factory.calculateSaleFees(totalPrice);
        
        TokenInfo storage token = tokenInfo[listing.tokenId];
        
        // Transfer royalty to creator
        if (royalty > 0) {
            accumulatedFees[token.creator] += royalty;
        }
        
        // Send marketplace fee to factory
        if (marketplaceFee > 0) {
            payable(address(factory)).transfer(marketplaceFee);
            factory.accumulatePlatformFees(marketplaceFee);
        }
        
        // Transfer to seller
        if (sellerAmount > 0) {
            payable(listing.seller).transfer(sellerAmount);
        }
        
        // Transfer tokens
        safeTransferFrom(listing.seller, msg.sender, listing.tokenId, amount, "");
        
        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit TokenSold(
            listing.tokenId,
            listing.seller,
            msg.sender,
            amount,
            totalPrice,
            royalty,
            marketplaceFee
        );
    }
    
    /**
     * @dev Delist tokens from marketplace
     * @param listingId Listing ID to delist
     */
    function delistNFT(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "ZoriumCollection: Not listing owner");
        require(listing.active, "ZoriumCollection: Listing not active");
        
        listing.active = false;
        
        emit TokenDelisted(listing.tokenId);
    }
    
    // ==============================================
    // FEE WITHDRAWAL FUNCTIONS
    // ==============================================
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external nonReentrant {
        uint256 amount = accumulatedFees[msg.sender];
        require(amount > 0, "ZoriumCollection: No fees to withdraw");
        
        accumulatedFees[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit FeesWithdrawn(msg.sender, amount);
    }
    
    // ==============================================
    // VIEW FUNCTIONS
    // ==============================================
    
    /**
     * @dev Get token information
     * @param tokenId Token ID
     * @return TokenInfo struct
     */
    function getTokenInfo(uint256 tokenId) external view returns (TokenInfo memory) {
        return tokenInfo[tokenId];
    }
    
    /**
     * @dev Check if token minting is active
     * @param tokenId Token ID
     * @return Whether minting is active
     */
    function isMintingActive(uint256 tokenId) external view validTokenId(tokenId) returns (bool) {
        TokenInfo storage token = tokenInfo[tokenId];
        
        if (token.status == TokenStatus.Finalized) {
            return false;
        }
        
        if (token.isCustomPrice) {
            return block.timestamp <= token.mintEndTime;
        } else {
            if (token.status == TokenStatus.CountdownActive) {
                return block.timestamp <= token.finalCountdownStart + factory.FINAL_COUNTDOWN_DURATION();
            }
            return true; // Always active until countdown starts
        }
    }
    
    /**
     * @dev Get time until countdown ends (for default price tokens)
     * @param tokenId Token ID
     * @return Seconds until countdown ends, 0 if not in countdown
     */
    function getCountdownTimeLeft(uint256 tokenId) external view validTokenId(tokenId) returns (uint256) {
        TokenInfo storage token = tokenInfo[tokenId];
        
        if (token.isCustomPrice || token.status != TokenStatus.CountdownActive) {
            return 0;
        }
        
        uint256 endTime = token.finalCountdownStart + factory.FINAL_COUNTDOWN_DURATION();
        if (block.timestamp >= endTime) {
            return 0;
        }
        
        return endTime - block.timestamp;
    }
    
    // ==============================================
    // ADMIN FUNCTIONS  
    // ==============================================
    
    /**
     * @dev Finalize token (emergency function)
     * @param tokenId Token ID to finalize
     */
    function finalizeToken(uint256 tokenId) external onlyOwner validTokenId(tokenId) {
        TokenInfo storage token = tokenInfo[tokenId];
        require(token.status != TokenStatus.Finalized, "ZoriumCollection: Already finalized");
        
        token.status = TokenStatus.Finalized;
        
        emit TokenFinalized(tokenId, token.totalMinted);
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
    // INTERNAL FUNCTIONS
    // ==============================================
    
    /**
     * @dev Validate IPFS URI format (gas optimized)
     * @param uriToValidate URI to validate
     * @return Whether URI is valid IPFS format
     */
    function _isValidIPFSURI(string memory uriToValidate) internal pure returns (bool) {
        bytes memory uriBytes = bytes(uriToValidate);
        
        if (uriBytes.length < 39 || uriBytes.length > 100) {
            return false;
        }
        
        return (uriBytes[0] == 'i' && 
                uriBytes[1] == 'p' && 
                uriBytes[2] == 'f' && 
                uriBytes[3] == 's' &&
                uriBytes[4] == ':' &&
                uriBytes[5] == '/' &&
                uriBytes[6] == '/');
    }
    
    // ==============================================
    // UPGRADE AUTHORIZATION
    // ==============================================
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // ==============================================
    // OVERRIDES
    // ==============================================
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    function uri(uint256 tokenId) public view override(ERC1155Upgradeable, ERC1155URIStorageUpgradeable) returns (string memory) {
        return super.uri(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // ==============================================
    // RECEIVE ETHER
    // ==============================================
    
    receive() external payable {
        // Allow receiving ETH for fee accumulation
    }
}