// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./ZoriumCollection.sol";

/**
 * @title ZoriumFactory
 * @dev Factory contract for creating Zorium NFT collections using ERC-1155 standard
 * @notice This contract manages the creation and configuration of NFT collections
 * @author Zorium.fun Team
 */
contract ZoriumFactory is 
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // ==============================================
    // CONSTANTS & GLOBAL CONFIGURATION
    // ==============================================
    
    /// @dev Default mint price in wei (0.000111 ETH)
    uint256 public constant DEFAULT_MINT_PRICE = 111000000000000;
    
    /// @dev After how many mints the 48-hour countdown starts
    uint256 public constant TRIGGER_SUPPLY = 1000;
    
    /// @dev Duration of final countdown period (48 hours)
    uint256 public constant FINAL_COUNTDOWN_DURATION = 48 hours;
    
    /// @dev Fee percentages for default mint price (basis points: 10000 = 100%)
    uint256 public constant CREATOR_FEE_BP = 5000;         // 50%
    uint256 public constant FIRST_MINTER_FEE_BP = 1000;    // 10%
    uint256 public constant REFERRAL_FEE_BP = 2000;        // 20%
    uint256 public constant PLATFORM_FEE_BP = 2000;        // 20%
    uint256 public constant PLATFORM_NO_REF_FEE_BP = 4000; // 40% when no referrer
    
    /// @dev Fee percentages for custom mint price
    uint256 public constant CUSTOM_CREATOR_FEE_BP = 9500;  // 95%
    uint256 public constant CUSTOM_PLATFORM_FEE_BP = 500;  // 5%
    
    /// @dev Marketplace sale fee percentages
    uint256 public constant ROYALTY_FEE_BP = 250;         // 2.5%
    uint256 public constant MARKETPLACE_FEE_BP = 250;     // 2.5%
    
    // ==============================================
    // STATE VARIABLES
    // ==============================================
    
    /// @dev Template contract address for cloning collections
    address public collectionTemplate;
    
    /// @dev Platform fee recipient address
    address public platformFeeRecipient;
    
    /// @dev Total number of collections created
    uint256 public totalCollections;
    
    /// @dev Platform accumulated fees from all collections
    uint256 public platformAccumulatedFees;
    
    // ==============================================
    // MAPPINGS
    // ==============================================
    
    /// @dev Track all created collections
    mapping(uint256 => address) public collections;
    
    /// @dev Track collections by creator
    mapping(address => address[]) public collectionsByCreator;
    
    /// @dev Track if address is a valid collection created by this factory
    mapping(address => bool) public isValidCollection;
    
    /// @dev Track collection metadata
    mapping(address => CollectionInfo) public collectionInfo;
    
    // ==============================================
    // STRUCTS
    // ==============================================
    
    struct CollectionInfo {
        address creator;
        string name;
        string symbol;
        bool isPersonal;        // True if it's a personal collection for single NFT
        uint256 createdAt;
        uint256 totalTokens;    // Number of different token IDs in collection
    }
    
    struct CreateCollectionParams {
        string name;
        string symbol;
        string baseURI;
        bool isPersonal;
    }
    
    // ==============================================
    // EVENTS
    // ==============================================
    
    event CollectionCreated(
        address indexed collection,
        address indexed creator,
        string name,
        string symbol,
        bool isPersonal,
        uint256 collectionId
    );
    
    event PersonalCollectionCreated(
        address indexed collection,
        address indexed creator,
        string nftName,
        string tokenURI,
        uint256 tokenId
    );
    
    event CollectionTemplateUpdated(address indexed oldTemplate, address indexed newTemplate);
    
    event PlatformFeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    
    event PlatformFeesWithdrawn(address indexed recipient, uint256 amount);
    
    // ==============================================
    // MODIFIERS
    // ==============================================
    
    modifier onlyValidCollection() {
        require(isValidCollection[msg.sender], "ZoriumFactory: Not a valid collection");
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
        address _collectionTemplate,
        address _platformFeeRecipient
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        require(_collectionTemplate != address(0), "ZoriumFactory: Invalid template");
        require(_platformFeeRecipient != address(0), "ZoriumFactory: Invalid fee recipient");
        
        collectionTemplate = _collectionTemplate;
        platformFeeRecipient = _platformFeeRecipient;
        totalCollections = 0;
    }
    
    // ==============================================
    // COLLECTION CREATION FUNCTIONS
    // ==============================================
    
    /**
     * @dev Create a new NFT collection
     * @param params Collection creation parameters
     * @return collection Address of the created collection
     */
    function createCollection(CreateCollectionParams memory params) 
        external 
        whenNotPaused 
        returns (address payable collection) 
    {
        require(bytes(params.name).length > 0, "ZoriumFactory: Empty name");
        require(bytes(params.symbol).length > 0, "ZoriumFactory: Empty symbol");
        
        // Clone the collection template
        collection = payable(Clones.clone(collectionTemplate));
        
        // Initialize the collection
        ZoriumCollection(collection).initialize(
            params.name,
            params.symbol,
            params.baseURI,
            msg.sender,
            address(this)
        );
        
        // Store collection info
        collectionInfo[collection] = CollectionInfo({
            creator: msg.sender,
            name: params.name,
            symbol: params.symbol,
            isPersonal: params.isPersonal,
            createdAt: block.timestamp,
            totalTokens: 0
        });
        
        // Track the collection
        collections[totalCollections] = collection;
        collectionsByCreator[msg.sender].push(collection);
        isValidCollection[collection] = true;
        totalCollections++;
        
        emit CollectionCreated(
            collection,
            msg.sender,
            params.name,
            params.symbol,
            params.isPersonal,
            totalCollections - 1
        );
        
        return collection;
    }
    
    /**
     * @dev Create a personal collection for a single NFT
     * @param nftName Name of the NFT (will be used as collection name)
     * @param tokenURI Metadata URI for the NFT
     * @return collection Address of the created collection
     * @return tokenId ID of the created token
     */
    function createPersonalCollection(
        string memory nftName,
        string memory tokenURI
    ) 
        external 
        whenNotPaused 
        returns (address payable collection, uint256 tokenId) 
    {
        require(bytes(nftName).length > 0, "ZoriumFactory: Empty NFT name");
        require(bytes(tokenURI).length > 0, "ZoriumFactory: Empty token URI");
        
        // Clone the collection template
        collection = payable(Clones.clone(collectionTemplate));
        
        // Initialize the collection
        ZoriumCollection(collection).initialize(
            nftName,
            "ZORIUM",
            "",
            msg.sender,
            address(this)
        );
        
        // Store collection info
        collectionInfo[collection] = CollectionInfo({
            creator: msg.sender,
            name: nftName,
            symbol: "ZORIUM",
            isPersonal: true,
            createdAt: block.timestamp,
            totalTokens: 0
        });
        
        // Track the collection
        collections[totalCollections] = collection;
        collectionsByCreator[msg.sender].push(collection);
        isValidCollection[collection] = true;
        totalCollections++;
        
        // Create the first token (creator's free mint)
        tokenId = ZoriumCollection(collection).createTokenSimple(
            tokenURI,
            0, // customPrice = 0 for creator's free mint
            0  // mintEndTime = 0 for default behavior
        );
        
        emit PersonalCollectionCreated(
            collection,
            msg.sender,
            nftName,
            tokenURI,
            tokenId
        );
        
        return (collection, tokenId);
    }
    
    // ==============================================
    // FEE ACCUMULATION (Called by collections)
    // ==============================================
    
    /**
     * @dev Accumulate platform fees from collections
     * @param amount Amount to accumulate
     */
    function accumulatePlatformFees(uint256 amount) external onlyValidCollection {
        platformAccumulatedFees += amount;
    }
    
    // ==============================================
    // VIEW FUNCTIONS
    // ==============================================
    
    /**
     * @dev Get collections created by a specific creator
     * @param creator Creator address
     * @return Array of collection addresses
     */
    function getCollectionsByCreator(address creator) external view returns (address[] memory) {
        return collectionsByCreator[creator];
    }
    
    /**
     * @dev Get collection information
     * @param collection Collection address
     * @return Collection info struct
     */
    function getCollectionInfo(address collection) external view returns (CollectionInfo memory) {
        require(isValidCollection[collection], "ZoriumFactory: Invalid collection");
        return collectionInfo[collection];
    }
    
    /**
     * @dev Calculate mint fees for given parameters
     * @param price Mint price
     * @param hasReferrer Whether there's a referrer
     * @param isCustomPrice Whether it's custom price
     * @return creatorFee Creator fee amount
     * @return firstMinterFee First minter fee amount
     * @return referralFee Referral fee amount
     * @return platformFee Platform fee amount
     */
    function calculateMintFees(
        uint256 price,
        bool hasReferrer,
        bool isCustomPrice
    ) 
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
            
            if (hasReferrer) {
                referralFee = (price * REFERRAL_FEE_BP) / 10000;
                platformFee = (price * PLATFORM_FEE_BP) / 10000;
            } else {
                referralFee = 0;
                platformFee = (price * PLATFORM_NO_REF_FEE_BP) / 10000; // 40% when no referrer
            }
        }
    }
    
    /**
     * @dev Calculate marketplace sale fees
     * @param price Sale price
     * @return royalty Royalty fee amount
     * @return marketplaceFee Marketplace fee amount
     * @return sellerAmount Amount for seller
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
     * @dev Update collection template
     * @param newTemplate New template address
     */
    function updateCollectionTemplate(address newTemplate) external onlyOwner {
        require(newTemplate != address(0), "ZoriumFactory: Invalid template");
        
        address oldTemplate = collectionTemplate;
        collectionTemplate = newTemplate;
        
        emit CollectionTemplateUpdated(oldTemplate, newTemplate);
    }
    
    /**
     * @dev Update platform fee recipient
     * @param newRecipient New fee recipient address
     */
    function updatePlatformFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "ZoriumFactory: Invalid recipient");
        
        address oldRecipient = platformFeeRecipient;
        platformFeeRecipient = newRecipient;
        
        emit PlatformFeeRecipientUpdated(oldRecipient, newRecipient);
    }
    
    /**
     * @dev Withdraw accumulated platform fees
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformAccumulatedFees;
        require(amount > 0, "ZoriumFactory: No fees to withdraw");
        
        platformAccumulatedFees = 0;
        payable(platformFeeRecipient).transfer(amount);
        
        emit PlatformFeesWithdrawn(platformFeeRecipient, amount);
    }
    
    /**
     * @dev Withdraw platform fees to specific address
     * @param to Recipient address
     */
    function withdrawPlatformFeesTo(address to) external onlyOwner nonReentrant {
        require(to != address(0), "ZoriumFactory: Invalid address");
        
        uint256 amount = platformAccumulatedFees;
        require(amount > 0, "ZoriumFactory: No fees to withdraw");
        
        platformAccumulatedFees = 0;
        payable(to).transfer(amount);
        
        emit PlatformFeesWithdrawn(to, amount);
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
        require(balance > 0, "ZoriumFactory: No balance to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    // ==============================================
    // UPGRADE AUTHORIZATION
    // ==============================================
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // ==============================================
    // RECEIVE ETHER
    // ==============================================
    
    receive() external payable {
        // Allow receiving ETH from collections for fee accumulation
    }
}