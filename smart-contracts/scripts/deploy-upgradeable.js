const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Zorium Upgradeable Contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("🔐 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  // Platform admin address (VoloDev.eth)
  const PLATFORM_ADMIN = "0xe894a9E110ef27320Ae58F1E4A70ACfD07DE3705";
  
  // ZRM Token address (already deployed)
  const ZRM_TOKEN_ADDRESS = "0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a";
  
  console.log("📋 Deployment Configuration:");
  console.log("   Platform Admin:", PLATFORM_ADMIN);
  console.log("   ZRM Token:", ZRM_TOKEN_ADDRESS);
  console.log("");
  
  try {
    // ========================================
    // 1. Deploy ZoriumNFT (Upgradeable)
    // ========================================
    console.log("📦 1. Deploying ZoriumNFT (Upgradeable)...");
    
    const ZoriumNFT = await ethers.getContractFactory("ZoriumNFT");
    const zoriumNFT = await upgrades.deployProxy(
      ZoriumNFT,
      [
        "Zorium NFT",        // name
        "ZRNFT",            // symbol  
        PLATFORM_ADMIN      // platformFeeRecipient
      ],
      { 
        initializer: 'initialize',
        kind: 'uups'
      }
    );
    
    await zoriumNFT.waitForDeployment();
    const nftProxyAddress = await zoriumNFT.getAddress();
    const nftImplAddress = await upgrades.erc1967.getImplementationAddress(nftProxyAddress);
    
    console.log("✅ ZoriumNFT deployed:");
    console.log("   Proxy:", nftProxyAddress);
    console.log("   Implementation:", nftImplAddress);
    console.log("");
    
    // ========================================
    // 2. Deploy ZoriumMarketplace (Upgradeable)
    // ========================================
    console.log("📦 2. Deploying ZoriumMarketplace (Upgradeable)...");
    
    const ZoriumMarketplace = await ethers.getContractFactory("ZoriumMarketplace");
    const zoriumMarketplace = await upgrades.deployProxy(
      ZoriumMarketplace,
      [
        PLATFORM_ADMIN,     // platformFeeRecipient
        ZRM_TOKEN_ADDRESS   // zrmToken
      ],
      { 
        initializer: 'initialize',
        kind: 'uups'
      }
    );
    
    await zoriumMarketplace.waitForDeployment();
    const marketplaceProxyAddress = await zoriumMarketplace.getAddress();
    const marketplaceImplAddress = await upgrades.erc1967.getImplementationAddress(marketplaceProxyAddress);
    
    console.log("✅ ZoriumMarketplace deployed:");
    console.log("   Proxy:", marketplaceProxyAddress);
    console.log("   Implementation:", marketplaceImplAddress);
    console.log("");
    
    // ========================================
    // 3. Configure Marketplace
    // ========================================
    console.log("⚙️  3. Configuring Marketplace...");
    
    // Add ZoriumNFT as supported contract in marketplace
    const addNFTTx = await zoriumMarketplace.addSupportedNFTContract(nftProxyAddress);
    await addNFTTx.wait();
    console.log("✅ Added ZoriumNFT to supported contracts");
    
    // ========================================
    // 4. Display Summary
    // ========================================
    console.log("🎉 Deployment Complete!");
    console.log("==========================================");
    console.log("📋 CONTRACT ADDRESSES:");
    console.log("==========================================");
    console.log("🎨 ZoriumNFT:");
    console.log("   Proxy Address:  ", nftProxyAddress);
    console.log("   Implementation: ", nftImplAddress);
    console.log("");
    console.log("🏪 ZoriumMarketplace:");
    console.log("   Proxy Address:  ", marketplaceProxyAddress);
    console.log("   Implementation: ", marketplaceImplAddress);
    console.log("");
    console.log("🔧 Configuration:");
    console.log("   Platform Admin: ", PLATFORM_ADMIN);
    console.log("   ZRM Token:      ", ZRM_TOKEN_ADDRESS);
    console.log("");
    console.log("==========================================");
    console.log("📝 NEXT STEPS:");
    console.log("==========================================");
    console.log("1. Update frontend config with new contract addresses");
    console.log("2. Verify contracts on block explorer");
    console.log("3. Test minting and marketplace functions");
    console.log("4. Configure backend API with new addresses");
    console.log("");
    
    // ========================================
    // 5. Save deployment info
    // ========================================
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      contracts: {
        ZoriumNFT: {
          proxy: nftProxyAddress,
          implementation: nftImplAddress,
          name: "Zorium NFT",
          symbol: "ZRNFT"
        },
        ZoriumMarketplace: {
          proxy: marketplaceProxyAddress,
          implementation: marketplaceImplAddress
        }
      },
      config: {
        platformAdmin: PLATFORM_ADMIN,
        zrmToken: ZRM_TOKEN_ADDRESS
      }
    };
    
    const fs = require('fs');
    const deploymentFile = `deployments/${hre.network.name}-upgradeable.json`;
    
    // Create deployments directory if it doesn't exist
    if (!fs.existsSync('deployments')) {
      fs.mkdirSync('deployments');
    }
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentFile);
    
    // ========================================
    // 6. Verify fee calculations
    // ========================================
    console.log("");
    console.log("🧮 Fee Calculations Test:");
    console.log("==========================================");
    
    // Test default price fees
    const defaultPrice = ethers.parseEther("0.000111");
    const [creatorFee, firstMinterFee, referralFee, platformFee] = 
      await zoriumNFT.calculateMintFees(defaultPrice, true, false);
    
    console.log("Default Price (0.000111 ETH):");
    console.log("   Creator:      ", ethers.formatEther(creatorFee), "ETH (50%)");
    console.log("   First Minter: ", ethers.formatEther(firstMinterFee), "ETH (10%)");
    console.log("   Referral:     ", ethers.formatEther(referralFee), "ETH (20%)");
    console.log("   Platform:     ", ethers.formatEther(platformFee), "ETH (20%)");
    console.log("   Total:        ", ethers.formatEther(creatorFee + firstMinterFee + referralFee + platformFee), "ETH");
    
    // Test custom price fees
    const customPrice = ethers.parseEther("0.01");
    const [customCreatorFee, customFirstMinterFee, customReferralFee, customPlatformFee] = 
      await zoriumNFT.calculateMintFees(customPrice, false, true);
    
    console.log("");
    console.log("Custom Price (0.01 ETH):");
    console.log("   Creator:      ", ethers.formatEther(customCreatorFee), "ETH (95%)");
    console.log("   Platform:     ", ethers.formatEther(customPlatformFee), "ETH (5%)");
    console.log("   Total:        ", ethers.formatEther(customCreatorFee + customPlatformFee), "ETH");
    
    // Test marketplace sale fees
    const salePrice = ethers.parseEther("0.1");
    const [royalty, marketplaceFee, sellerAmount] = 
      await zoriumNFT.calculateSaleFees(salePrice);
    
    console.log("");
    console.log("Marketplace Sale (0.1 ETH):");
    console.log("   Royalty (2.5%):", ethers.formatEther(royalty), "ETH");
    console.log("   Marketplace (2.5%):", ethers.formatEther(marketplaceFee), "ETH");
    console.log("   Seller Amount:", ethers.formatEther(sellerAmount), "ETH");
    console.log("   Total:        ", ethers.formatEther(royalty + marketplaceFee + sellerAmount), "ETH");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exitCode = 1;
});

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});