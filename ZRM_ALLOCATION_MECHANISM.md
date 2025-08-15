# ZRM Allocation Mechanism - Zorium.fun Platform

## Overview
This document explains how ZRM (Zorium) tokens and platform fees are collected, managed, and distributed on the zorium.fun platform.

## Fee Structure

### Default Fee Breakdown (0.000111 ETH total)
- **Creator**: 50% (0.000055 ETH) - Goes to NFT creator
- **First Minter Reward**: 10% (0.000011 ETH) - Goes to first person who PAYS to mint
- **Referral**: 20% (0.000022 ETH) - Goes to referrer if referral link used
- **Platform**: 20% (0.000022 ETH) - Goes to platform treasury

### Special Cases

#### Creator First Mint
- Creator's first mint is **completely FREE** (only gas fees required)
- No platform fees collected for creator's first mint
- Encourages creators to join the platform

#### No Referral Used
- When no referral link is used, the 20% referral fee goes to platform
- Total platform fee becomes 40% (0.000044 ETH)

#### First Minter Reward Distribution
- Goes to the first wallet that **PAYS** to mint the NFT
- Does NOT go to creator for their free mint
- Could be the creator if they mint again after their free mint
- Could be any other wallet that mints first

## Platform Fee Collection

### Where Fees Accumulate
Platform fees are collected in a smart contract treasury from:
1. **Base Platform Fee**: 20% of all paid mints (0.000022 ETH per mint)
2. **Unused Referral Fees**: 20% additional when no referral used (0.000022 ETH per mint)
3. **Total Platform Revenue**: 20-40% depending on referral usage

### Admin Access Control
- Only the platform owner can access admin functions
- Owner address is hardcoded in admin dashboard: `OWNER_ADDRESS`
- Non-owners are automatically redirected when attempting to access admin

## Admin Dashboard Functions

### 1. Platform Fee Withdrawal
**Purpose**: Withdraw accumulated ETH fees to owner wallet
**Process**:
- Display current available balance in ETH
- Allow owner to specify withdrawal amount
- Execute withdrawal transaction to owner's connected wallet
- Update balance display after successful withdrawal

### 2. ZRM Token Allocation
**Purpose**: Distribute ZRM tokens to users for rewards/promotions
**Process**:
- Display available ZRM token balance
- Allow owner to specify recipient address and amount
- Execute ZRM transfer to specified wallet
- Common use cases:
  - User rewards for platform activities
  - Promotional campaigns
  - Referral bonuses
  - Community incentives

### 3. Analytics & Monitoring
**Real-time Platform Statistics**:
- Total platform fees collected (ETH)
- Available ZRM tokens for allocation
- Total registered users
- Total NFTs created
- Monthly revenue trends
- Daily active users

**Fee Collection History**:
- Date and amount of each fee collection
- Source classification (platform fee vs unused referral)
- Transaction tracking for audit purposes

## ZRM Token Utility

### Platform Uses
1. **NFT Promotion**: Users spend ZRM to feature NFTs
2. **Boosted Visibility**: Enhanced search rankings
3. **Premium Features**: Access to advanced platform features
4. **Rewards Program**: Earned through platform activities

### Admin Allocation Strategy
- **New User Bonuses**: Welcome rewards for account creation
- **Creator Incentives**: Bonus ZRM for high-quality content
- **Referral Rewards**: Additional ZRM for successful referrals
- **Community Events**: Contests and promotional distributions
- **Activity Rewards**: Daily/weekly active user bonuses

## Technical Implementation

### Smart Contract Functions
```solidity
// Platform fee withdrawal (owner only)
function withdrawPlatformFees(uint256 amount) external onlyOwner

// ZRM token allocation (owner only)  
function allocateZRM(address recipient, uint256 amount) external onlyOwner

// Fee collection (automatic)
function collectMintFees(address creator, address referrer) external
```

### Frontend Integration
- Admin dashboard at `/admin` route
- Owner authentication via wallet connection
- Real-time balance updates
- Transaction confirmation flows
- Error handling and user feedback

## Security Considerations

### Access Control
- Owner-only functions protected by smart contract modifiers
- Frontend additional validation for better UX
- Multi-signature wallet recommended for owner address

### Fee Management
- Transparent fee structure displayed to users
- Immutable smart contract logic for fee distribution
- Regular audits of accumulated balances
- Clear separation between platform and user funds

## Monitoring & Reporting

### Key Metrics to Track
1. **Revenue Metrics**:
   - Daily/weekly/monthly fee collection
   - Average fee per NFT mint
   - Referral vs non-referral mint ratio

2. **User Engagement**:
   - Creator adoption rate
   - First-time vs repeat minters
   - ZRM token circulation and usage

3. **Platform Health**:
   - Treasury balance growth
   - ZRM allocation efficiency
   - User retention and activity

### Automated Alerts
- Low ZRM token balance warnings
- High fee accumulation notifications
- Unusual transaction pattern detection
- Monthly revenue reports

## Future Enhancements

### Planned Features
1. **Automated ZRM Distribution**: Rule-based token allocation
2. **Staking Rewards**: ZRM staking for platform benefits
3. **Governance**: ZRM holder voting on platform decisions
4. **Advanced Analytics**: Detailed user and revenue analytics
5. **Multi-token Support**: Additional reward token integration

This mechanism ensures fair distribution of platform revenue while providing powerful tools for the platform owner to manage growth and incentivize user participation through strategic ZRM allocation.