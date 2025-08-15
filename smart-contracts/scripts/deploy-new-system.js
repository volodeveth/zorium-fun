const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 Deploying new Zorium system (Factory + Collection)...");
    
    // Get deployment parameters
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    
    const networkName = await deployer.provider.getNetwork().then(n => n.name);
    const chainId = await deployer.provider.getNetwork().then(n => n.chainId);
    console.log("Network:", networkName, "Chain ID:", chainId);
    
    // Platform fee recipient (you can change this)
    const platformFeeRecipient = deployer.address; // Change to actual platform address
    
    try {
        // 1. Deploy ZoriumCollection template (implementation)
        console.log("\n📝 Deploying ZoriumCollection template...");
        const ZoriumCollection = await ethers.getContractFactory("ZoriumCollection");
        const collectionTemplate = await ZoriumCollection.deploy();
        await collectionTemplate.waitForDeployment();
        
        const collectionTemplateAddress = await collectionTemplate.getAddress();
        console.log("✅ ZoriumCollection template deployed to:", collectionTemplateAddress);
        
        // 2. Deploy ZoriumFactory with UUPS proxy
        console.log("\n📝 Deploying ZoriumFactory (UUPS Proxy)...");
        const ZoriumFactory = await ethers.getContractFactory("ZoriumFactory");
        
        const factory = await upgrades.deployProxy(
            ZoriumFactory,
            [collectionTemplateAddress, platformFeeRecipient],
            { 
                kind: 'uups',
                initializer: 'initialize',
                timeout: 0
            }
        );
        await factory.waitForDeployment();
        
        const factoryAddress = await factory.getAddress();
        console.log("✅ ZoriumFactory (Proxy) deployed to:", factoryAddress);
        
        // Get the implementation address
        const factoryImplAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);
        console.log("📋 ZoriumFactory implementation:", factoryImplAddress);
        
        // 3. Verify deployment by calling some view functions
        console.log("\n🔍 Verifying deployment...");
        
        const defaultMintPrice = await factory.DEFAULT_MINT_PRICE();
        console.log("Default mint price:", ethers.formatEther(defaultMintPrice), "ETH");
        
        const triggerSupply = await factory.TRIGGER_SUPPLY();
        console.log("Trigger supply (countdown activation):", triggerSupply.toString());
        
        const countdownDuration = await factory.FINAL_COUNTDOWN_DURATION();
        console.log("Countdown duration:", (Number(countdownDuration) / 3600).toString(), "hours");
        
        const totalCollections = await factory.totalCollections();
        console.log("Total collections:", totalCollections.toString());
        
        const platformRecipient = await factory.platformFeeRecipient();
        console.log("Platform fee recipient:", platformRecipient);
        
        // 4. Test creating a collection
        console.log("\n🧪 Testing collection creation...");
        
        const createCollectionTx = await factory.createCollection({
            name: "Test Collection",
            symbol: "TEST",
            baseURI: "",
            isPersonal: false
        });
        
        const receipt = await createCollectionTx.wait();
        console.log("✅ Test collection created, gas used:", receipt.gasUsed.toString());
        
        // Find the CollectionCreated event
        const collectionCreatedEvent = receipt.logs.find(log => {
            try {
                const parsed = factory.interface.parseLog(log);
                return parsed && parsed.name === 'CollectionCreated';
            } catch {
                return false;
            }
        });
        
        if (collectionCreatedEvent) {
            const parsed = factory.interface.parseLog(collectionCreatedEvent);
            const testCollectionAddress = parsed.args[0];
            console.log("📝 Test collection address:", testCollectionAddress);
            
            // Verify the collection
            const ZoriumCollection = await ethers.getContractFactory("ZoriumCollection");
            const testCollection = ZoriumCollection.attach(testCollectionAddress);
            
            const collectionName = await testCollection.name();
            const collectionSymbol = await testCollection.symbol();
            const collectionCreator = await testCollection.creator();
            
            console.log("Collection name:", collectionName);
            console.log("Collection symbol:", collectionSymbol);
            console.log("Collection creator:", collectionCreator);
        }
        
        console.log("\n🎉 Deployment Summary:");
        console.log("=====================================");
        console.log("Network:", networkName, `(Chain ID: ${chainId})`);
        console.log("Deployer:", deployer.address);
        console.log("ZoriumCollection Template:", collectionTemplateAddress);
        console.log("ZoriumFactory Proxy:", factoryAddress);
        console.log("ZoriumFactory Implementation:", factoryImplAddress);
        console.log("Platform Fee Recipient:", platformFeeRecipient);
        console.log("=====================================");
        
        // Save deployment info
        const deploymentInfo = {
            network: networkName,
            chainId: chainId.toString(),
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {
                ZoriumFactory: {
                    proxy: factoryAddress,
                    implementation: factoryImplAddress
                },
                ZoriumCollectionTemplate: collectionTemplateAddress
            },
            configuration: {
                platformFeeRecipient,
                defaultMintPrice: ethers.formatEther(defaultMintPrice),
                triggerSupply: triggerSupply.toString(),
                countdownDuration: `${Number(countdownDuration) / 3600} hours`
            }
        };
        
        const fs = require('fs');
        const deploymentFile = `deployments/new-system-${networkName}-${chainId}.json`;
        
        // Create deployments directory if it doesn't exist
        if (!fs.existsSync('deployments')) {
            fs.mkdirSync('deployments');
        }
        
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n📄 Deployment info saved to: ${deploymentFile}`);
        
        console.log("\n✅ New Zorium system deployed successfully!");
        
        return {
            factory: factoryAddress,
            factoryImpl: factoryImplAddress,
            collectionTemplate: collectionTemplateAddress
        };
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
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