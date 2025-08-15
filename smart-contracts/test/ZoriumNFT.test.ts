import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ZoriumNFT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZoriumNFT", function () {
  let zoriumNFT: ZoriumNFT;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let firstMinter: HardhatEthersSigner;
  let referrer: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let platformAdmin: HardhatEthersSigner;

  const DEFAULT_MINT_PRICE = ethers.parseEther("0.000111");
  const CUSTOM_MINT_PRICE = ethers.parseEther("0.01");
  const SALE_PRICE = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, creator, firstMinter, referrer, buyer, platformAdmin] = await ethers.getSigners();

    const ZoriumNFT = await ethers.getContractFactory("ZoriumNFT");
    zoriumNFT = await upgrades.deployProxy(
      ZoriumNFT,
      [
        "Zorium NFT",
        "ZRNFT", 
        platformAdmin.address
      ],
      { initializer: 'initialize', kind: 'uups' }
    ) as ZoriumNFT;

    await zoriumNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await zoriumNFT.name()).to.equal("Zorium NFT");
      expect(await zoriumNFT.symbol()).to.equal("ZRNFT");
    });

    it("Should set the right platform fee recipient", async function () {
      expect(await zoriumNFT.platformFeeRecipient()).to.equal(platformAdmin.address);
    });

    it("Should start with token ID 1", async function () {
      expect(await zoriumNFT.getCurrentTokenId()).to.equal(1);
    });
  });

  describe("Creator First Mint", function () {
    it("Should allow creator's first mint for free", async function () {
      const mintParams = {
        to: creator.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: true,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      // First mint should be free (only gas cost)
      await expect(zoriumNFT.connect(creator).mint(mintParams, { value: 0 }))
        .to.not.be.reverted;

      expect(await zoriumNFT.ownerOf(1)).to.equal(creator.address);
      expect(await zoriumNFT.hasCreatorMinted(creator.address)).to.be.true;
    });

    it("Should not allow creator's second mint for free", async function () {
      // First mint (free)
      const firstMintParams = {
        to: creator.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: true,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await zoriumNFT.connect(creator).mint(firstMintParams, { value: 0 });

      // Second mint should require payment
      const secondMintParams = {
        to: creator.address,
        tokenURI: "ipfs://QmTest987654321zyxwvutsrqponmlkjihgfedcba",
        isCreatorFirstMint: true, // This should be ignored
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await expect(zoriumNFT.connect(creator).mint(secondMintParams, { value: 0 }))
        .to.be.revertedWith("ZoriumNFT: Insufficient payment");
    });
  });

  describe("Default Price Minting", function () {
    it("Should distribute fees correctly for default price with referrer", async function () {
      const mintParams = {
        to: firstMinter.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: false,
        referrer: referrer.address,
        customPrice: 0
      };

      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const referrerBalanceBefore = await ethers.provider.getBalance(referrer.address);

      await zoriumNFT.connect(creator).mint(mintParams, { value: DEFAULT_MINT_PRICE });

      // Check fee calculations
      const [creatorFee, firstMinterFee, referralFee, platformFee] = 
        await zoriumNFT.calculateMintFees(DEFAULT_MINT_PRICE, true, false);

      expect(creatorFee).to.equal(ethers.parseEther("0.000055")); // 50%
      expect(firstMinterFee).to.equal(ethers.parseEther("0.000011")); // 10%
      expect(referralFee).to.equal(ethers.parseEther("0.000022")); // 20%
      expect(platformFee).to.equal(ethers.parseEther("0.000022")); // 20%

      // Check accumulated fees
      expect(await zoriumNFT.accumulatedFees(creator.address)).to.equal(creatorFee);
      expect(await zoriumNFT.accumulatedFees(firstMinter.address)).to.equal(firstMinterFee);
      expect(await zoriumNFT.accumulatedFees(referrer.address)).to.equal(referralFee);
      expect(await zoriumNFT.platformAccumulatedFees()).to.equal(platformFee);
    });

    it("Should distribute fees correctly for default price without referrer", async function () {
      const mintParams = {
        to: firstMinter.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: false,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await zoriumNFT.connect(creator).mint(mintParams, { value: DEFAULT_MINT_PRICE });

      const [creatorFee, firstMinterFee, referralFee, platformFee] = 
        await zoriumNFT.calculateMintFees(DEFAULT_MINT_PRICE, false, false);

      expect(creatorFee).to.equal(ethers.parseEther("0.000055")); // 50%
      expect(firstMinterFee).to.equal(ethers.parseEther("0.000011")); // 10%
      expect(referralFee).to.equal(0); // No referrer
      expect(platformFee).to.equal(ethers.parseEther("0.000044")); // 20% + 20% referral

      // Check accumulated fees
      expect(await zoriumNFT.accumulatedFees(creator.address)).to.equal(creatorFee);
      expect(await zoriumNFT.accumulatedFees(firstMinter.address)).to.equal(firstMinterFee);
      expect(await zoriumNFT.platformAccumulatedFees()).to.equal(platformFee);
    });
  });

  describe("Custom Price Minting", function () {
    it("Should distribute fees correctly for custom price", async function () {
      const mintParams = {
        to: firstMinter.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: false,
        referrer: referrer.address,
        customPrice: CUSTOM_MINT_PRICE
      };

      await zoriumNFT.connect(creator).mint(mintParams, { value: CUSTOM_MINT_PRICE });

      const [creatorFee, firstMinterFee, referralFee, platformFee] = 
        await zoriumNFT.calculateMintFees(CUSTOM_MINT_PRICE, true, true);

      expect(creatorFee).to.equal(ethers.parseEther("0.0095")); // 95%
      expect(firstMinterFee).to.equal(0); // No first minter fee for custom price
      expect(referralFee).to.equal(0); // No referral fee for custom price
      expect(platformFee).to.equal(ethers.parseEther("0.0005")); // 5%

      // Check accumulated fees
      expect(await zoriumNFT.accumulatedFees(creator.address)).to.equal(creatorFee);
      expect(await zoriumNFT.accumulatedFees(firstMinter.address)).to.equal(0);
      expect(await zoriumNFT.accumulatedFees(referrer.address)).to.equal(0);
      expect(await zoriumNFT.platformAccumulatedFees()).to.equal(platformFee);
    });
  });

  describe("Marketplace Functions", function () {
    beforeEach(async function () {
      // Mint an NFT first
      const mintParams = {
        to: creator.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: true,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await zoriumNFT.connect(creator).mint(mintParams, { value: 0 });
    });

    it("Should list NFT for sale", async function () {
      await zoriumNFT.connect(creator).listForSale(1, SALE_PRICE);

      const listing = await zoriumNFT.getListing(1);
      expect(listing.seller).to.equal(creator.address);
      expect(listing.price).to.equal(SALE_PRICE);
      expect(listing.active).to.be.true;
      expect(await zoriumNFT.isTokenListed(1)).to.be.true;
    });

    it("Should buy NFT from marketplace", async function () {
      await zoriumNFT.connect(creator).listForSale(1, SALE_PRICE);

      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const platformFeesBefore = await zoriumNFT.platformAccumulatedFees();

      await zoriumNFT.connect(buyer).buyNFT(1, { value: SALE_PRICE });

      // Check NFT ownership transfer
      expect(await zoriumNFT.ownerOf(1)).to.equal(buyer.address);
      expect(await zoriumNFT.isTokenListed(1)).to.be.false;

      // Check fee distribution
      const [royalty, marketplaceFee, sellerAmount] = 
        await zoriumNFT.calculateSaleFees(SALE_PRICE);

      expect(royalty).to.equal(ethers.parseEther("0.0025")); // 2.5%
      expect(marketplaceFee).to.equal(ethers.parseEther("0.0025")); // 2.5%
      expect(sellerAmount).to.equal(ethers.parseEther("0.095")); // 95%

      // Creator should receive royalty
      expect(await zoriumNFT.accumulatedFees(creator.address)).to.equal(royalty);
      
      // Platform should receive marketplace fee
      expect(await zoriumNFT.platformAccumulatedFees()).to.equal(platformFeesBefore + marketplaceFee);
    });

    it("Should delist NFT", async function () {
      await zoriumNFT.connect(creator).listForSale(1, SALE_PRICE);
      expect(await zoriumNFT.isTokenListed(1)).to.be.true;

      await zoriumNFT.connect(creator).delistNFT(1);
      expect(await zoriumNFT.isTokenListed(1)).to.be.false;
    });

    it("Should not allow non-owner to list NFT", async function () {
      await expect(zoriumNFT.connect(buyer).listForSale(1, SALE_PRICE))
        .to.be.revertedWith("ZoriumNFT: Not token owner");
    });

    it("Should not allow buying own NFT", async function () {
      await zoriumNFT.connect(creator).listForSale(1, SALE_PRICE);

      await expect(zoriumNFT.connect(creator).buyNFT(1, { value: SALE_PRICE }))
        .to.be.revertedWith("ZoriumNFT: Cannot buy own NFT");
    });
  });

  describe("Fee Withdrawal", function () {
    beforeEach(async function () {
      // Create some fees by minting
      const mintParams = {
        to: firstMinter.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: false,
        referrer: referrer.address,
        customPrice: 0
      };

      await zoriumNFT.connect(creator).mint(mintParams, { value: DEFAULT_MINT_PRICE });
    });

    it("Should allow users to withdraw accumulated fees", async function () {
      const creatorFeesBefore = await zoriumNFT.accumulatedFees(creator.address);
      expect(creatorFeesBefore).to.be.gt(0);

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await zoriumNFT.connect(creator).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      expect(balanceAfter).to.equal(balanceBefore + creatorFeesBefore - gasUsed);
      expect(await zoriumNFT.accumulatedFees(creator.address)).to.equal(0);
    });

    it("Should allow platform admin to withdraw platform fees", async function () {
      const platformFeesBefore = await zoriumNFT.platformAccumulatedFees();
      expect(platformFeesBefore).to.be.gt(0);

      const balanceBefore = await ethers.provider.getBalance(platformAdmin.address);
      await zoriumNFT.connect(owner).withdrawPlatformFees();
      const balanceAfter = await ethers.provider.getBalance(platformAdmin.address);

      expect(balanceAfter).to.equal(balanceBefore + platformFeesBefore);
      expect(await zoriumNFT.platformAccumulatedFees()).to.equal(0);
    });

    it("Should not allow non-users to withdraw fees with no balance", async function () {
      await expect(zoriumNFT.connect(buyer).withdrawFees())
        .to.be.revertedWith("ZoriumNFT: No fees to withdraw");
    });

    it("Should not allow non-owner to withdraw platform fees", async function () {
      await expect(zoriumNFT.connect(buyer).withdrawPlatformFees())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause and unpause", async function () {
      await zoriumNFT.connect(owner).pause();
      expect(await zoriumNFT.paused()).to.be.true;

      const mintParams = {
        to: creator.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: true,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await expect(zoriumNFT.connect(creator).mint(mintParams, { value: 0 }))
        .to.be.revertedWith("Pausable: paused");

      await zoriumNFT.connect(owner).unpause();
      expect(await zoriumNFT.paused()).to.be.false;

      await expect(zoriumNFT.connect(creator).mint(mintParams, { value: 0 }))
        .to.not.be.reverted;
    });

    it("Should allow owner to update platform fee recipient", async function () {
      const newRecipient = buyer.address;
      await zoriumNFT.connect(owner).setPlatformFeeRecipient(newRecipient);
      expect(await zoriumNFT.platformFeeRecipient()).to.equal(newRecipient);
    });

    it("Should not allow non-owner to update platform fee recipient", async function () {
      await expect(zoriumNFT.connect(buyer).setPlatformFeeRecipient(buyer.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Token Information", function () {
    beforeEach(async function () {
      const mintParams = {
        to: firstMinter.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: false,
        referrer: referrer.address,
        customPrice: CUSTOM_MINT_PRICE
      };

      await zoriumNFT.connect(creator).mint(mintParams, { value: CUSTOM_MINT_PRICE });
    });

    it("Should store and retrieve token information correctly", async function () {
      const tokenInfo = await zoriumNFT.getTokenInfo(1);
      
      expect(tokenInfo.creator).to.equal(creator.address);
      expect(tokenInfo.firstMinter).to.equal(firstMinter.address);
      expect(tokenInfo.mintPrice).to.equal(CUSTOM_MINT_PRICE);
      expect(tokenInfo.isCreatorFirstMint).to.be.false;
      expect(tokenInfo.hasReferrer).to.be.true;
      expect(tokenInfo.referrer).to.equal(referrer.address);
    });

    it("Should return correct token URI", async function () {
      expect(await zoriumNFT.tokenURI(1)).to.equal("ipfs://test-uri-1");
    });
  });

  describe("Edge Cases", function () {
    it("Should revert if trying to mint with insufficient payment", async function () {
      const mintParams = {
        to: firstMinter.address,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: false,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await expect(zoriumNFT.connect(creator).mint(mintParams, { value: ethers.parseEther("0.00001") }))
        .to.be.revertedWith("ZoriumNFT: Insufficient payment");
    });

    it("Should revert if trying to mint with empty tokenURI", async function () {
      const mintParams = {
        to: firstMinter.address,
        tokenURI: "",
        isCreatorFirstMint: false,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await expect(zoriumNFT.connect(creator).mint(mintParams, { value: DEFAULT_MINT_PRICE }))
        .to.be.revertedWith("ZoriumNFT: Empty tokenURI");
    });

    it("Should revert if trying to mint to zero address", async function () {
      const mintParams = {
        to: ethers.ZeroAddress,
        tokenURI: "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        isCreatorFirstMint: false,
        referrer: ethers.ZeroAddress,
        customPrice: 0
      };

      await expect(zoriumNFT.connect(creator).mint(mintParams, { value: DEFAULT_MINT_PRICE }))
        .to.be.revertedWith("ZoriumNFT: Invalid recipient");
    });

    it("Should revert if trying to mint with invalid IPFS URI", async function () {
      const invalidURIs = [
        "https://example.com/metadata.json",
        "ipfs://",
        "ipfs:/",
        "http://ipfs.io/ipfs/test",
        "not-ipfs-uri"
      ];

      for (const invalidURI of invalidURIs) {
        const mintParams = {
          to: firstMinter.address,
          tokenURI: invalidURI,
          isCreatorFirstMint: false,
          referrer: ethers.ZeroAddress,
          customPrice: 0
        };

        await expect(zoriumNFT.connect(creator).mint(mintParams, { value: DEFAULT_MINT_PRICE }))
          .to.be.revertedWith("ZoriumNFT: Invalid IPFS URI format");
      }
    });

    it("Should accept valid IPFS URIs", async function () {
      const validURIs = [
        "ipfs://QmTest123456789abcdefghijklmnopqrstuvwxyz",
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        "ipfs://QmValidHash/metadata.json",
        "ipfs://QmTestHash?param=value"
      ];

      for (let i = 0; i < validURIs.length; i++) {
        const mintParams = {
          to: creator.address,
          tokenURI: validURIs[i],
          isCreatorFirstMint: true,
          referrer: ethers.ZeroAddress,
          customPrice: 0
        };

        await expect(zoriumNFT.connect(creator).mint(mintParams, { value: 0 }))
          .to.not.be.reverted;

        expect(await zoriumNFT.tokenURI(i + 1)).to.equal(validURIs[i]);
      }
    });
  });
});