const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("=🚀 Deploying ZORIUM.FUN Promotion Token...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("=👤 Deploying contracts with account:", deployer.address);
  console.log("=💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Contract parameters
  const tokenName = "ZORIUM.FUN Promotion";
  const tokenSymbol = "ZRM";
  const feeReceiver = deployer.address; // Initially set to deployer, can be updated later
  const dailyWheelReward = ethers.parseEther("100"); // 100 ZRM per day

  console.log("📋 Contract parameters:");
  console.log("  - Name:", tokenName);
  console.log("  - Symbol:", tokenSymbol);
  console.log("  - Fee Receiver:", feeReceiver);
  console.log("  - Daily Wheel Reward:", ethers.formatEther(dailyWheelReward), "ZRM");

  // Deploy the upgradeable contract
  const ZoriumPromotion = await ethers.getContractFactory("ZoriumPromotion");
  
  console.log("=⏳ Deploying proxy contract...");
  const zoriumPromotion = await upgrades.deployProxy(
    ZoriumPromotion,
    [tokenName, tokenSymbol, feeReceiver, dailyWheelReward],
    { initializer: "initialize" }
  );

  await zoriumPromotion.waitForDeployment();

  console.log("✅ ZoriumPromotion deployed to:", await zoriumPromotion.getAddress());
  
  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(await zoriumPromotion.getAddress());
  console.log("=🔧 Implementation address:", implementationAddress);
  
  // Get admin address
  const adminAddress = await upgrades.erc1967.getAdminAddress(await zoriumPromotion.getAddress());
  console.log("=👑 Proxy admin address:", adminAddress);

  // Mint initial supply to deployer (for testing)
  const initialSupply = ethers.parseEther("1000000"); // 1M ZRM
  console.log("⚡ Minting initial supply of", ethers.formatEther(initialSupply), "ZRM to deployer...");
  
  const mintTx = await zoriumPromotion.connect(deployer).mint(deployer.address, initialSupply);
  await mintTx.wait();
  
  console.log("✅ Initial supply minted!");

  // Verify deployment
  console.log("=🔍 Verifying deployment...");
  const balance = await zoriumPromotion.balanceOf(deployer.address);
  const treasury = await zoriumPromotion.treasuryBalance();
  const totalSupply = await zoriumPromotion.totalSupply();

  console.log("=📊 Deployment verification:");
  console.log("  - Deployer balance:", ethers.formatEther(balance), "ZRM");
  console.log("  - Treasury balance:", ethers.formatEther(treasury), "ZRM");
  console.log("  - Total supply:", ethers.formatEther(totalSupply), "ZRM");

  console.log("\\n✨ Deployment completed successfully!");
  console.log("\\n=📝 Contract addresses for verification:");
  console.log("Proxy (main contract):", await zoriumPromotion.getAddress());
  console.log("Implementation:", implementationAddress);
  console.log("Proxy Admin:", adminAddress);

  // Save deployment info to file
  const deploymentInfo = {
    network: process.env.HARDHAT_NETWORK || "localhost",
    contractName: "ZoriumPromotion",
    proxyAddress: await zoriumPromotion.getAddress(),
    implementationAddress: implementationAddress,
    proxyAdminAddress: adminAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    parameters: {
      tokenName,
      tokenSymbol,
      feeReceiver,
      dailyWheelReward: dailyWheelReward.toString()
    }
  };

  console.log("\\n=📄 Deployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });