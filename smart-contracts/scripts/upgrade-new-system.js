const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🔄 Upgrading Zorium system contracts...");
    
    // Get deployment parameters
    const [deployer] = await ethers.getSigners();
    console.log("Upgrading with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    
    const networkName = await deployer.provider.getNetwork().then(n => n.name);
    const chainId = await deployer.provider.getNetwork().then(n => n.chainId);
    console.log("Network:", networkName, "Chain ID:", chainId);
    
    // Load existing deployment info
    const fs = require('fs');
    const deploymentFile = `deployments/new-system-${networkName}-${chainId}.json`;
    
    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`Deployment file not found: ${deploymentFile}`);
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const factoryProxyAddress = deploymentInfo.contracts.ZoriumFactory.proxy;
    
    console.log("Existing Factory Proxy:", factoryProxyAddress);
    
    try {
        // 1. Deploy new ZoriumCollection template if needed
        console.log("\n📝 Deploying new ZoriumCollection template...");
        const ZoriumCollection = await ethers.getContractFactory("ZoriumCollection");
        const newCollectionTemplate = await ZoriumCollection.deploy();
        await newCollectionTemplate.waitForDeployment();
        
        const newCollectionTemplateAddress = await newCollectionTemplate.getAddress();
        console.log("✅ New ZoriumCollection template deployed to:", newCollectionTemplateAddress);
        
        // 2. Upgrade ZoriumFactory
        console.log("\n🔄 Upgrading ZoriumFactory...");
        const ZoriumFactory = await ethers.getContractFactory("ZoriumFactory");
        
        const upgradedFactory = await upgrades.upgradeProxy(
            factoryProxyAddress,
            ZoriumFactory,
            { timeout: 0 }
        );
        await upgradedFactory.waitForDeployment();
        
        console.log("✅ ZoriumFactory upgraded successfully");
        
        // Get new implementation address
        const newFactoryImplAddress = await upgrades.erc1967.getImplementationAddress(factoryProxyAddress);
        console.log("📋 New ZoriumFactory implementation:", newFactoryImplAddress);
        
        // 3. Update collection template in factory
        console.log("\n🔧 Updating collection template in factory...");
        const updateTemplateTx = await upgradedFactory.updateCollectionTemplate(newCollectionTemplateAddress);
        await updateTemplateTx.wait();
        console.log("✅ Collection template updated in factory");
        
        // 4. Verify upgrade
        console.log("\n🔍 Verifying upgrade...");
        
        const currentTemplate = await upgradedFactory.collectionTemplate();
        console.log("Current collection template:", currentTemplate);
        
        const totalCollections = await upgradedFactory.totalCollections();
        console.log("Total collections:", totalCollections.toString());
        
        console.log("\n🎉 Upgrade Summary:");
        console.log("=====================================");
        console.log("Network:", networkName, `(Chain ID: ${chainId})`);
        console.log("Upgrader:", deployer.address);
        console.log("Factory Proxy:", factoryProxyAddress);
        console.log("Old Implementation:", deploymentInfo.contracts.ZoriumFactory.implementation);
        console.log("New Implementation:", newFactoryImplAddress);
        console.log("Old Collection Template:", deploymentInfo.contracts.ZoriumCollectionTemplate);
        console.log("New Collection Template:", newCollectionTemplateAddress);
        console.log("=====================================");
        
        // Update deployment info
        deploymentInfo.contracts.ZoriumFactory.implementation = newFactoryImplAddress;
        deploymentInfo.contracts.ZoriumCollectionTemplate = newCollectionTemplateAddress;
        deploymentInfo.lastUpgrade = {
            timestamp: new Date().toISOString(),
            upgrader: deployer.address
        };
        
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n📄 Updated deployment info saved to: ${deploymentFile}`);
        
        console.log("\n✅ Zorium system upgraded successfully!");
        
        return {
            factoryProxy: factoryProxyAddress,
            newFactoryImpl: newFactoryImplAddress,
            newCollectionTemplate: newCollectionTemplateAddress
        };
        
    } catch (error) {
        console.error("❌ Upgrade failed:", error);
        throw error;
    }
}

// Allow running directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;