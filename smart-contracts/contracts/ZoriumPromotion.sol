// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ZORIUM.FUN Promotion Token
 * @dev Upgradeable ERC20 token for Zorium.fun platform promotion system
 * 
 * Features:
 * - Admin can deposit ZRM tokens to platform
 * - Admin can allocate ZRM to users (non-transferable)
 * - Users can spend ZRM on promotions
 * - Admin can withdraw accumulated promotion fees
 * - Daily wheel rewards system
 * - Upgradeable contract via UUPS proxy pattern
 */
contract ZoriumPromotion is 
    Initializable, 
    ERC20Upgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    // ============ STATE VARIABLES ============
    
    /// @notice Platform fee receiver address
    address public feeReceiver;
    
    /// @notice Platform treasury balance
    uint256 public treasuryBalance;
    
    /// @notice Total ZRM allocated to users (non-transferable)
    uint256 public totalAllocated;
    
    /// @notice Accumulated fees from promotions
    uint256 public accumulatedFees;
    
    /// @notice Mapping of user addresses to their allocated (non-transferable) balances
    mapping(address => uint256) public allocatedBalances;
    
    /// @notice Mapping of user addresses to their last wheel spin timestamp
    mapping(address => uint256) public lastWheelSpin;
    
    /// @notice Daily wheel reward amount
    uint256 public dailyWheelReward;
    
    /// @notice Minimum time between wheel spins (24 hours)
    uint256 public constant WHEEL_COOLDOWN = 24 hours;
    
    // ============ EVENTS ============
    
    event TokensDeposited(address indexed admin, uint256 amount);
    event TokensAllocated(address indexed recipient, uint256 amount, string reason);
    event PromotionPaid(address indexed user, uint256 amount, string promotionType);
    event FeesWithdrawn(address indexed admin, uint256 amount);
    event WheelSpun(address indexed user, uint256 reward);
    event TreasuryUpdated(uint256 newBalance);
    event FeeReceiverUpdated(address indexed newReceiver);
    event DailyWheelRewardUpdated(uint256 newReward);
    
    // ============ MODIFIERS ============
    
    modifier onlyAdmin() {
        require(owner() == _msgSender(), "ZoriumPromotion: caller is not the admin");
        _;
    }
    
    modifier canSpinWheel(address user) {
        require(
            block.timestamp >= lastWheelSpin[user] + WHEEL_COOLDOWN,
            "ZoriumPromotion: wheel cooldown not finished"
        );
        _;
    }
    
    // ============ INITIALIZER ============
    
    /**
     * @notice Initialize the contract
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _feeReceiver Address to receive fees
     * @param _dailyWheelReward Amount of ZRM rewarded daily from wheel
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        address _feeReceiver,
        uint256 _dailyWheelReward
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        feeReceiver = _feeReceiver;
        dailyWheelReward = _dailyWheelReward;
        
        emit FeeReceiverUpdated(_feeReceiver);
        emit DailyWheelRewardUpdated(_dailyWheelReward);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Deposit ZRM tokens to platform treasury
     * @param amount Amount of ZRM tokens to deposit
     */
    function depositToTreasury(uint256 amount) external onlyAdmin whenNotPaused {
        require(amount > 0, "ZoriumPromotion: amount must be greater than 0");
        require(balanceOf(_msgSender()) >= amount, "ZoriumPromotion: insufficient balance");
        
        _transfer(_msgSender(), address(this), amount);
        treasuryBalance += amount;
        
        emit TokensDeposited(_msgSender(), amount);
        emit TreasuryUpdated(treasuryBalance);
    }
    
    /**
     * @notice Allocate ZRM tokens to a user (non-transferable)
     * @param recipient Address to receive allocated tokens
     * @param amount Amount of ZRM tokens to allocate
     * @param reason Reason for allocation
     */
    function allocateToUser(
        address recipient,
        uint256 amount,
        string calldata reason
    ) external onlyAdmin whenNotPaused {
        require(recipient != address(0), "ZoriumPromotion: invalid recipient");
        require(amount > 0, "ZoriumPromotion: amount must be greater than 0");
        require(treasuryBalance >= amount, "ZoriumPromotion: insufficient treasury balance");
        
        treasuryBalance -= amount;
        allocatedBalances[recipient] += amount;
        totalAllocated += amount;
        
        emit TokensAllocated(recipient, amount, reason);
        emit TreasuryUpdated(treasuryBalance);
    }
    
    /**
     * @notice Withdraw accumulated promotion fees
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyAdmin {
        require(amount > 0, "ZoriumPromotion: amount must be greater than 0");
        require(accumulatedFees >= amount, "ZoriumPromotion: insufficient accumulated fees");
        
        accumulatedFees -= amount;
        _mint(feeReceiver, amount);
        
        emit FeesWithdrawn(_msgSender(), amount);
    }
    
    /**
     * @notice Update fee receiver address
     * @param newReceiver New fee receiver address
     */
    function updateFeeReceiver(address newReceiver) external onlyAdmin {
        require(newReceiver != address(0), "ZoriumPromotion: invalid address");
        feeReceiver = newReceiver;
        emit FeeReceiverUpdated(newReceiver);
    }
    
    /**
     * @notice Update daily wheel reward amount
     * @param newReward New daily wheel reward amount
     */
    function updateDailyWheelReward(uint256 newReward) external onlyAdmin {
        require(newReward > 0, "ZoriumPromotion: reward must be greater than 0");
        dailyWheelReward = newReward;
        emit DailyWheelRewardUpdated(newReward);
    }
    
    /**
     * @notice Mint ZRM tokens (admin only)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyAdmin {
        require(to != address(0), "ZoriumPromotion: invalid address");
        require(amount > 0, "ZoriumPromotion: amount must be greater than 0");
        
        _mint(to, amount);
    }
    
    // ============ USER FUNCTIONS ============
    
    /**
     * @notice Spend allocated ZRM tokens on promotion
     * @param amount Amount of ZRM to spend
     * @param promotionType Type of promotion
     */
    function spendOnPromotion(
        uint256 amount,
        string calldata promotionType
    ) external whenNotPaused {
        require(amount > 0, "ZoriumPromotion: amount must be greater than 0");
        require(
            allocatedBalances[_msgSender()] >= amount,
            "ZoriumPromotion: insufficient allocated balance"
        );
        
        allocatedBalances[_msgSender()] -= amount;
        totalAllocated -= amount;
        accumulatedFees += amount;
        
        emit PromotionPaid(_msgSender(), amount, promotionType);
    }
    
    /**
     * @notice Spin the daily reward wheel
     * @return reward Amount of ZRM tokens rewarded
     */
    function spinWheel() external canSpinWheel(_msgSender()) whenNotPaused returns (uint256 reward) {
        require(treasuryBalance >= dailyWheelReward, "ZoriumPromotion: insufficient treasury for reward");
        
        lastWheelSpin[_msgSender()] = block.timestamp;
        treasuryBalance -= dailyWheelReward;
        allocatedBalances[_msgSender()] += dailyWheelReward;
        totalAllocated += dailyWheelReward;
        reward = dailyWheelReward;
        
        emit WheelSpun(_msgSender(), reward);
        emit TreasuryUpdated(treasuryBalance);
        
        return reward;
    }
    
    /**
     * @notice Deposit user's own ZRM tokens to their allocated balance
     * @param amount Amount of ZRM tokens to deposit
     */
    function depositForPromotion(uint256 amount) external whenNotPaused {
        require(amount > 0, "ZoriumPromotion: amount must be greater than 0");
        require(balanceOf(_msgSender()) >= amount, "ZoriumPromotion: insufficient balance");
        
        _transfer(_msgSender(), address(this), amount);
        allocatedBalances[_msgSender()] += amount;
        totalAllocated += amount;
        
        emit TokensAllocated(_msgSender(), amount, "User deposit for promotion");
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get user's allocated (non-transferable) balance
     * @param user User address
     * @return Allocated balance
     */
    function getAllocatedBalance(address user) external view returns (uint256) {
        return allocatedBalances[user];
    }
    
    /**
     * @notice Check if user can spin the wheel
     * @param user User address
     * @return Whether user can spin the wheel
     */
    function canUserSpinWheel(address user) external view returns (bool) {
        return block.timestamp >= lastWheelSpin[user] + WHEEL_COOLDOWN;
    }
    
    /**
     * @notice Get time until user can spin wheel again
     * @param user User address
     * @return Seconds until next wheel spin is available
     */
    function getWheelCooldownTime(address user) external view returns (uint256) {
        uint256 nextSpinTime = lastWheelSpin[user] + WHEEL_COOLDOWN;
        if (block.timestamp >= nextSpinTime) {
            return 0;
        }
        return nextSpinTime - block.timestamp;
    }
    
    /**
     * @notice Get platform statistics
     * @return _treasuryBalance Current treasury balance
     * @return _totalAllocated Total allocated tokens
     * @return _accumulatedFees Total accumulated fees
     * @return _totalSupply Total token supply
     */
    function getPlatformStats() external view returns (
        uint256 _treasuryBalance,
        uint256 _totalAllocated,
        uint256 _accumulatedFees,
        uint256 _totalSupply
    ) {
        return (treasuryBalance, totalAllocated, accumulatedFees, totalSupply());
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Override to prevent transfers of allocated tokens
     * @dev Users cannot transfer allocated tokens, only spend them on promotions
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        // Allow minting and burning
        if (from == address(0) || to == address(0)) {
            return;
        }
        
        // Allow admin and contract operations
        if (from == owner() || from == address(this) || to == address(this)) {
            return;
        }
        
        // Regular users cannot transfer tokens
        revert("ZoriumPromotion: transfers not allowed for regular users");
    }
    
    /**
     * @notice Authorize contract upgrades (only owner)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // ============ PAUSE FUNCTIONS ============
    
    /**
     * @notice Pause contract operations
     */
    function pause() external onlyAdmin {
        _pause();
    }
    
    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyAdmin {
        _unpause();
    }
}