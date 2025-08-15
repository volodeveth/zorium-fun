const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ZoriumPlatformManager...");

  // Get the contract factory
  const ZoriumPlatformManager = await ethers.getContractFactory("ZoriumPlatformManager");

  // Deploy the upgradeable contract
  console.log("📦 Deploying proxy contract...");
  const platformManager = await upgrades.deployProxy(
    ZoriumPlatformManager,
    [], // No constructor parameters for initialize()
    {
      initializer: "initialize",
      kind: "uups"
    }
  );

  await platformManager.waitForDeployment();

  const proxyAddress = await platformManager.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ ZoriumPlatformManager deployed successfully!");
  console.log("📍 Proxy Address:", proxyAddress);
  console.log("📍 Implementation Address:", implementationAddress);
  console.log("📍 ZRM Token Address:", "0x538D6F4fb9598dC74e15e6974049B109ae0AbC6a");

  // Verify contract interaction
  console.log("\n🔍 Verifying contract setup...");
  
  const zrmTokenAddress = await platformManager.ZRM_TOKEN();
  console.log("✓ ZRM Token configured:", zrmTokenAddress);

  const earlyBirdAmount = await platformManager.earlyBirdRewardAmount();
  console.log("✓ Early Bird reward amount:", ethers.formatEther(earlyBirdAmount), "ZRM");
  
  const maxEarlyBirdUsers = await platformManager.maxEarlyBirdUsers();
  console.log("✓ Max Early Bird users:", maxEarlyBirdUsers.toString());

  const wheelCooldown = await platformManager.WHEEL_COOLDOWN();
  console.log("✓ Wheel cooldown:", wheelCooldown.toString() / 3600, "hours");

  // Get platform stats
  const stats = await platformManager.getPlatformStats();
  console.log("\n📊 Initial Platform Stats:");
  console.log("   Contract Balance:", ethers.formatEther(stats[0]), "ZRM");
  console.log("   Available ZRM:", ethers.formatEther(stats[1]), "ZRM");
  console.log("   Admin Deposits:", ethers.formatEther(stats[2]), "ZRM");
  console.log("   User Deposits:", ethers.formatEther(stats[3]), "ZRM");

  console.log("\n🎯 Integration Instructions:");
  console.log("1. Update frontend contract address to:", proxyAddress);
  console.log("2. Update backend contract address to:", proxyAddress);
  console.log("3. Use ZRM token address:", zrmTokenAddress);
  console.log("4. Admin can now deposit ZRM using depositToTreasury()");
  console.log("5. Users can deposit ZRM using depositZRM()");
  console.log("6. Wheel rewards will be distributed from treasury");

  // Save deployment info
  const deploymentInfo = {
    network: "zora",
    chainId: 7777777,
    timestamp: new Date().toISOString(),
    contracts: {
      ZoriumPlatformManager: {
        proxy: proxyAddress,
        implementation: implementationAddress
      },
      ZRMToken: zrmTokenAddress
    },
    settings: {
      earlyBirdRewardAmount: ethers.formatEther(earlyBirdAmount),
      maxEarlyBirdUsers: maxEarlyBirdUsers.toString(),
      wheelCooldown: wheelCooldown.toString()
    }
  };

  console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });