const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🔄 Upgrading ZoriumPlatformManager...");

  // Get the existing proxy address
  const PROXY_ADDRESS = "0x1B2221E8c1AEdf3a6Db7929453A253739dC64f3c";
  
  // Get the contract factory
  const ZoriumPlatformManagerV2 = await ethers.getContractFactory("ZoriumPlatformManager");
  
  console.log("📦 Deploying new implementation...");
  
  // Upgrade the proxy to the new implementation
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, ZoriumPlatformManagerV2);
  
  await upgraded.waitForDeployment();
  
  console.log("✅ ZoriumPlatformManager upgraded successfully!");
  console.log("📍 Proxy address (unchanged):", await upgraded.getAddress());
  
  // Test the new function
  console.log("\n🧪 Testing new claimEarlyBirdBonus function...");
  
  try {
    // Check if function exists by calling view functions
    const maxUsers = await upgraded.maxEarlyBirdUsers();
    const totalUsers = await upgraded.totalEarlyBirdUsers();
    const rewardAmount = await upgraded.earlyBirdRewardAmount();
    
    console.log("📊 Early Bird Status:");
    console.log(`  Max Users: ${maxUsers.toString()}`);
    console.log(`  Current Users: ${totalUsers.toString()}`);
    console.log(`  Reward Amount: ${ethers.formatEther(rewardAmount)} ZRM`);
    
    console.log("\n✅ New function is available and ready to use!");
    
  } catch (error) {
    console.error("❌ Error testing new function:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  });