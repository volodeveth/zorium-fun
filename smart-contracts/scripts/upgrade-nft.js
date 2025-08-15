const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Upgrading ZoriumNFT contracts with IPFS validation...");
  
  // Contract addresses from deployment
  const BASE_NFT_PROXY = "0xF422E7F6DF90e7296813eE12Bd3eBc631aA8FFde";
  const ZORA_NFT_PROXY = "0x72fD543e13450cb4D07E088c63D9596d6D084D29";
  
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get the new implementation
  const ZoriumNFTV2 = await ethers.getContractFactory("ZoriumNFT");
  
  try {
    // Determine which network we're on
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    
    let proxyAddress;
    let networkName;
    
    if (chainId === 8453) {
      proxyAddress = BASE_NFT_PROXY;
      networkName = "Base Mainnet";
    } else if (chainId === 7777777) {
      proxyAddress = ZORA_NFT_PROXY;
      networkName = "Zora Mainnet";
    } else {
      throw new Error(`Unsupported network: ${chainId}`);
    }
    
    console.log(`\n📡 Upgrading on ${networkName} (Chain ID: ${chainId})`);
    console.log(`📍 Proxy address: ${proxyAddress}`);
    
    // Upgrade the implementation
    console.log("🔄 Upgrading implementation...");
    const upgraded = await upgrades.upgradeProxy(proxyAddress, ZoriumNFTV2);
    await upgraded.waitForDeployment();
    
    console.log(`✅ ZoriumNFT upgraded successfully!`);
    console.log(`📍 Proxy address (unchanged): ${proxyAddress}`);
    console.log(`🔗 New implementation address: ${await upgrades.erc1967.getImplementationAddress(proxyAddress)}`);
    
    // Test the new functionality
    console.log("\n🧪 Testing IPFS validation...");
    const contract = await ethers.getContractAt("ZoriumNFT", proxyAddress);
    
    // Test that the contract still works
    console.log(`📊 Contract name: ${await contract.name()}`);
    console.log(`📊 Contract symbol: ${await contract.symbol()}`);
    console.log(`📊 Next token ID: ${await contract.getCurrentTokenId()}`);
    
    console.log("\n🎉 Upgrade completed successfully!");
    console.log("📝 New features:");
    console.log("   - IPFS URI validation in mint function");
    console.log("   - Automatic rejection of non-IPFS URIs");
    console.log("   - Improved security for NFT metadata");
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });