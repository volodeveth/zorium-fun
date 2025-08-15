// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IZoriumFactory
 * @dev Interface for ZoriumFactory contract
 */
interface IZoriumFactory {
    // ==============================================
    // CONSTANTS
    // ==============================================
    
    function DEFAULT_MINT_PRICE() external view returns (uint256);
    function TRIGGER_SUPPLY() external view returns (uint256);
    function FINAL_COUNTDOWN_DURATION() external view returns (uint256);
    
    // Fee constants
    function CREATOR_FEE_BP() external view returns (uint256);
    function FIRST_MINTER_FEE_BP() external view returns (uint256);
    function REFERRAL_FEE_BP() external view returns (uint256);
    function PLATFORM_FEE_BP() external view returns (uint256);
    function PLATFORM_NO_REF_FEE_BP() external view returns (uint256);
    
    function CUSTOM_CREATOR_FEE_BP() external view returns (uint256);
    function CUSTOM_PLATFORM_FEE_BP() external view returns (uint256);
    
    function ROYALTY_FEE_BP() external view returns (uint256);
    function MARKETPLACE_FEE_BP() external view returns (uint256);
    
    // ==============================================
    // STATE VARIABLES
    // ==============================================
    
    function platformFeeRecipient() external view returns (address);
    function totalCollections() external view returns (uint256);
    function isValidCollection(address collection) external view returns (bool);
    
    // ==============================================
    // FUNCTIONS
    // ==============================================
    
    function accumulatePlatformFees(uint256 amount) external;
    
    function calculateMintFees(
        uint256 price,
        bool hasReferrer,
        bool isCustomPrice
    ) external pure returns (
        uint256 creatorFee,
        uint256 firstMinterFee,
        uint256 referralFee,
        uint256 platformFee
    );
    
    function calculateSaleFees(uint256 price) external pure returns (
        uint256 royalty,
        uint256 marketplaceFee,
        uint256 sellerAmount
    );
}