// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ZoriumPlatformManager
 * @dev Manages existing ZRM token for Zorium.fun platform operations
 * @notice This contract works with existing ZRM token at 0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a
 */
contract ZoriumPlatformManager is 
    Initializable, 
    PausableUpgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable 
{
    using SafeERC20 for IERC20;

    // === CONSTANTS ===
    IERC20 public constant ZRM_TOKEN = IERC20(0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a);
    uint256 public constant WHEEL_COOLDOWN = 24 hours;
    uint256 public constant MIN_WHEEL_REWARD = 25 * 1e18;    // 25 ZRM
    uint256 public constant MAX_WHEEL_REWARD = 200 * 1e18;   // 200 ZRM

    // === USER BALANCES ===
    mapping(address => uint256) public allocatedBalances;    // Allocated ZRM (cannot withdraw)
    mapping(address => uint256) public userDeposits;        // How much user deposited

    // === PLATFORM BALANCES ===
    uint256 public adminTreasuryDeposits;                   // Admin deposits
    uint256 public totalUserDeposits;                       // User deposits  
    uint256 public totalSpentOnPromotions;                  // Spent on promotions
    uint256 public totalAllocatedToUsers;                   // Allocated to users
    uint256 public totalWheelRewards;                       // Given through wheel
    uint256 public totalWithdrawnByAdmin;                   // Withdrawn by admin

    // === WHEEL LOGIC ===
    mapping(address => uint256) public lastWheelSpin;       // Unix timestamp
    uint256 private wheelNonce;                             // For randomness

    // === EARLY BIRD LOGIC ===
    uint256 public earlyBirdRewardAmount;                   // Amount per early bird user
    mapping(address => bool) public hasReceivedEarlyBird;
    uint256 public totalEarlyBirdUsers;
    uint256 public maxEarlyBirdUsers;                       // Set by admin

    // === EVENTS ===
    event TreasuryDeposit(address indexed admin, uint256 amount);
    event UserAllocation(address indexed user, uint256 amount, string reason);
    event UserDeposit(address indexed user, uint256 amount);
    event PromotionSpent(address indexed user, uint256 amount);
    event WheelSpun(address indexed user, uint256 reward);
    event FeesWithdrawn(address indexed admin, uint256 amount, address to);
    event EarlyBirdAllocated(address indexed user, uint256 amount);
    event EarlyBirdCampaignUpdated(uint256 maxUsers, uint256 rewardAmount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        // Default Early Bird settings
        earlyBirdRewardAmount = 10000 * 1e18;  // 10,000 ZRM
        maxEarlyBirdUsers = 10000;             // 10,000 users max
    }

    // === VIEW FUNCTIONS ===

    /**
     * @dev Calculate available ZRM that can be allocated or withdrawn
     * @return Available ZRM amount
     */
    function getAvailableZRM() public view returns (uint256) {
        uint256 totalReceived = adminTreasuryDeposits + totalUserDeposits + totalSpentOnPromotions;
        uint256 totalSpent = totalAllocatedToUsers + totalWheelRewards + totalWithdrawnByAdmin;
        
        return totalReceived >= totalSpent ? totalReceived - totalSpent : 0;
    }

    /**
     * @dev Get actual ZRM balance on contract
     * @return Contract ZRM balance
     */
    function getTreasuryBalance() public view returns (uint256) {
        return ZRM_TOKEN.balanceOf(address(this));
    }

    /**
     * @dev Check if user can spin wheel
     * @param user User address
     * @return Can spin wheel
     */
    function canUserSpinWheel(address user) public view returns (bool) {
        return block.timestamp >= lastWheelSpin[user] + WHEEL_COOLDOWN;
    }

    /**
     * @dev Get wheel cooldown time for user
     * @param user User address
     * @return Cooldown time in seconds (0 if can spin)
     */
    function getWheelCooldownTime(address user) public view returns (uint256) {
        if (canUserSpinWheel(user)) {
            return 0;
        }
        return (lastWheelSpin[user] + WHEEL_COOLDOWN) - block.timestamp;
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 contractBalance,
        uint256 availableZRM,
        uint256 adminDeposits,
        uint256 userDeposits,
        uint256 promotionRevenue,
        uint256 earlyBirdAllocated,
        uint256 wheelRewards,
        uint256 adminWithdrawn
    ) {
        return (
            getTreasuryBalance(),
            getAvailableZRM(),
            adminTreasuryDeposits,
            totalUserDeposits,
            totalSpentOnPromotions,
            totalAllocatedToUsers,
            totalWheelRewards,
            totalWithdrawnByAdmin
        );
    }

    // === ADMIN FUNCTIONS ===

    /**
     * @dev Admin deposits ZRM to treasury
     * @param amount Amount to deposit
     */
    function depositToTreasury(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be positive");
        
        ZRM_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
        adminTreasuryDeposits += amount;
        
        emit TreasuryDeposit(msg.sender, amount);
    }

    /**
     * @dev Allocate ZRM to user (Early Bird or manual allocation)
     * @param user User address
     * @param amount Amount to allocate
     * @param reason Reason for allocation
     */
    function allocateToUser(address user, uint256 amount, string calldata reason) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be positive");
        require(getAvailableZRM() >= amount, "Insufficient treasury balance");
        
        allocatedBalances[user] += amount;
        totalAllocatedToUsers += amount;
        
        emit UserAllocation(user, amount, reason);
    }

    /**
     * @dev Set Early Bird campaign parameters
     * @param maxUsers Maximum number of early bird users
     * @param rewardAmount Reward amount per user
     */
    function setEarlyBirdCampaign(uint256 maxUsers, uint256 rewardAmount) external onlyOwner {
        require(maxUsers > 0, "Max users must be positive");
        require(rewardAmount > 0, "Reward amount must be positive");
        
        maxEarlyBirdUsers = maxUsers;
        earlyBirdRewardAmount = rewardAmount;
        
        emit EarlyBirdCampaignUpdated(maxUsers, rewardAmount);
    }

    /**
     * @dev Allocate Early Bird bonus to user
     * @param user User address
     */
    function allocateEarlyBirdBonus(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(!hasReceivedEarlyBird[user], "User already received Early Bird bonus");
        require(totalEarlyBirdUsers < maxEarlyBirdUsers, "Early Bird limit reached");
        require(getAvailableZRM() >= earlyBirdRewardAmount, "Insufficient treasury balance");
        
        allocatedBalances[user] += earlyBirdRewardAmount;
        totalAllocatedToUsers += earlyBirdRewardAmount;
        hasReceivedEarlyBird[user] = true;
        totalEarlyBirdUsers++;
        
        emit EarlyBirdAllocated(user, earlyBirdRewardAmount);
    }

    /**
     * @dev Batch allocate Early Bird bonuses
     * @param users Array of user addresses
     */
    function batchAllocateEarlyBird(address[] calldata users) external onlyOwner {
        uint256 totalRequired = users.length * earlyBirdRewardAmount;
        require(getAvailableZRM() >= totalRequired, "Insufficient treasury balance");
        require(totalEarlyBirdUsers + users.length <= maxEarlyBirdUsers, "Would exceed Early Bird limit");
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            require(user != address(0), "Invalid user address");
            require(!hasReceivedEarlyBird[user], "User already received Early Bird bonus");
            
            allocatedBalances[user] += earlyBirdRewardAmount;
            hasReceivedEarlyBird[user] = true;
            totalEarlyBirdUsers++;
            
            emit EarlyBirdAllocated(user, earlyBirdRewardAmount);
        }
        
        totalAllocatedToUsers += totalRequired;
    }

    /**
     * @dev Withdraw accumulated fees to admin or specified address
     * @param amount Amount to withdraw
     * @param to Recipient address (if zero, sends to owner)
     */
    function withdrawAccumulatedFees(uint256 amount, address to) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(amount <= getAvailableZRM(), "Insufficient available funds");
        require(amount <= getTreasuryBalance(), "Insufficient contract balance");
        
        address recipient = to == address(0) ? owner() : to;
        
        ZRM_TOKEN.safeTransfer(recipient, amount);
        totalWithdrawnByAdmin += amount;
        
        emit FeesWithdrawn(msg.sender, amount, recipient);
    }

    // === USER FUNCTIONS ===

    /**
     * @dev User deposits their own ZRM
     * @param amount Amount to deposit
     */
    function depositZRM(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be positive");
        
        ZRM_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
        userDeposits[msg.sender] += amount;
        allocatedBalances[msg.sender] += amount;
        totalUserDeposits += amount;
        
        emit UserDeposit(msg.sender, amount);
    }

    /**
     * @dev User spends allocated ZRM on promotion
     * @param amount Amount to spend
     */
    function spendOnPromotion(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be positive");
        require(allocatedBalances[msg.sender] >= amount, "Insufficient allocated balance");
        
        allocatedBalances[msg.sender] -= amount;
        totalSpentOnPromotions += amount;
        
        emit PromotionSpent(msg.sender, amount);
    }

    /**
     * @dev User spins the wheel for daily reward
     * @return reward Amount of ZRM rewarded
     */
    function spinWheel() external nonReentrant whenNotPaused returns (uint256 reward) {
        require(canUserSpinWheel(msg.sender), "Wheel cooldown not finished");
        
        // Generate random reward between MIN and MAX
        reward = _generateWheelReward();
        require(getAvailableZRM() >= reward, "Insufficient treasury for reward");
        
        allocatedBalances[msg.sender] += reward;
        totalWheelRewards += reward;
        lastWheelSpin[msg.sender] = block.timestamp;
        
        emit WheelSpun(msg.sender, reward);
    }

    /**
     * @dev User claims Early Bird bonus (first 10,000 users get 10,000 ZRM)
     * @return amount Amount of ZRM rewarded
     */
    function claimEarlyBirdBonus() external nonReentrant whenNotPaused returns (uint256 amount) {
        require(!hasReceivedEarlyBird[msg.sender], "User already received Early Bird bonus");
        require(totalEarlyBirdUsers < maxEarlyBirdUsers, "Early Bird limit reached");
        require(getAvailableZRM() >= earlyBirdRewardAmount, "Insufficient treasury balance");
        
        amount = earlyBirdRewardAmount;
        allocatedBalances[msg.sender] += amount;
        totalAllocatedToUsers += amount;
        hasReceivedEarlyBird[msg.sender] = true;
        totalEarlyBirdUsers++;
        
        emit EarlyBirdAllocated(msg.sender, amount);
    }

    // === INTERNAL FUNCTIONS ===

    /**
     * @dev Generate pseudo-random wheel reward
     * @return Reward amount
     */
    function _generateWheelReward() internal returns (uint256) {
        wheelNonce++;
        uint256 randomness = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            wheelNonce
        )));
        
        // Map to reward range (25-200 ZRM)
        uint256 range = MAX_WHEEL_REWARD - MIN_WHEEL_REWARD;
        uint256 reward = MIN_WHEEL_REWARD + (randomness % (range + 1));
        
        return reward;
    }

    // === UPGRADE FUNCTIONS ===

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    // === EMERGENCY FUNCTIONS ===

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency function to recover any ERC20 tokens (except ZRM)
     * @param token Token address
     * @param amount Amount to recover
     */
    function emergencyRecoverToken(address token, uint256 amount) external onlyOwner {
        require(token != address(ZRM_TOKEN), "Cannot recover ZRM token");
        IERC20(token).safeTransfer(owner(), amount);
    }
}