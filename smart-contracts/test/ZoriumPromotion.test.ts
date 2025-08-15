import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ZoriumPromotion } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZoriumPromotion", function () {
  let zoriumPromotion: ZoriumPromotion;
  let admin: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let feeReceiver: HardhatEthersSigner;

  const tokenName = "ZORIUM.FUN Promotion";
  const tokenSymbol = "ZRM";
  const dailyWheelReward = ethers.parseEther("100");
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    // Get signers
    [admin, user1, user2, feeReceiver] = await ethers.getSigners();

    // Deploy the contract
    const ZoriumPromotion = await ethers.getContractFactory("ZoriumPromotion");
    zoriumPromotion = (await upgrades.deployProxy(
      ZoriumPromotion,
      [tokenName, tokenSymbol, feeReceiver.address, dailyWheelReward],
      { initializer: "initialize" }
    )) as ZoriumPromotion;

    await zoriumPromotion.deployed();

    // Mint initial supply to admin
    await zoriumPromotion.connect(admin).mint(admin.address, initialSupply);
  });

  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await zoriumPromotion.name()).to.equal(tokenName);
      expect(await zoriumPromotion.symbol()).to.equal(tokenSymbol);
    });

    it("Should set the correct fee receiver", async function () {
      expect(await zoriumPromotion.feeReceiver()).to.equal(feeReceiver.address);
    });

    it("Should set the correct daily wheel reward", async function () {
      expect(await zoriumPromotion.dailyWheelReward()).to.equal(dailyWheelReward);
    });

    it("Should mint initial supply to admin", async function () {
      expect(await zoriumPromotion.balanceOf(admin.address)).to.equal(initialSupply);
    });
  });

  describe("Treasury Management", function () {
    it("Should allow admin to deposit to treasury", async function () {
      const depositAmount = ethers.parseEther("10000");
      
      await expect(zoriumPromotion.connect(admin).depositToTreasury(depositAmount))
        .to.emit(zoriumPromotion, "TokensDeposited")
        .withArgs(admin.address, depositAmount);

      expect(await zoriumPromotion.treasuryBalance()).to.equal(depositAmount);
    });

    it("Should not allow non-admin to deposit to treasury", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      await expect(zoriumPromotion.connect(user1).depositToTreasury(depositAmount))
        .to.be.revertedWith("ZoriumPromotion: caller is not the admin");
    });
  });

  describe("User Allocation", function () {
    beforeEach(async function () {
      // Deposit tokens to treasury first
      const depositAmount = ethers.parseEther("50000");
      await zoriumPromotion.connect(admin).depositToTreasury(depositAmount);
    });

    it("Should allow admin to allocate tokens to users", async function () {
      const allocationAmount = ethers.parseEther("1000");
      const reason = "Early bird bonus";

      await expect(zoriumPromotion.connect(admin).allocateToUser(user1.address, allocationAmount, reason))
        .to.emit(zoriumPromotion, "TokensAllocated")
        .withArgs(user1.address, allocationAmount, reason);

      expect(await zoriumPromotion.getAllocatedBalance(user1.address)).to.equal(allocationAmount);
      expect(await zoriumPromotion.totalAllocated()).to.equal(allocationAmount);
    });

    it("Should not allow allocation more than treasury balance", async function () {
      const treasuryBalance = await zoriumPromotion.treasuryBalance();
      const excessiveAmount = treasuryBalance.add(1);

      await expect(zoriumPromotion.connect(admin).allocateToUser(user1.address, excessiveAmount, "test"))
        .to.be.revertedWith("ZoriumPromotion: insufficient treasury balance");
    });
  });

  describe("Promotion Spending", function () {
    beforeEach(async function () {
      // Setup: deposit to treasury and allocate to user
      const depositAmount = ethers.parseEther("50000");
      const allocationAmount = ethers.parseEther("1000");
      
      await zoriumPromotion.connect(admin).depositToTreasury(depositAmount);
      await zoriumPromotion.connect(admin).allocateToUser(user1.address, allocationAmount, "test");
    });

    it("Should allow users to spend allocated tokens on promotion", async function () {
      const spendAmount = ethers.parseEther("500");
      const promotionType = "NFT Boost";

      await expect(zoriumPromotion.connect(user1).spendOnPromotion(spendAmount, promotionType))
        .to.emit(zoriumPromotion, "PromotionPaid")
        .withArgs(user1.address, spendAmount, promotionType);

      const remainingBalance = ethers.parseEther("500");
      expect(await zoriumPromotion.getAllocatedBalance(user1.address)).to.equal(remainingBalance);
      expect(await zoriumPromotion.accumulatedFees()).to.equal(spendAmount);
    });

    it("Should not allow spending more than allocated balance", async function () {
      const allocatedBalance = await zoriumPromotion.getAllocatedBalance(user1.address);
      const excessiveAmount = allocatedBalance.add(1);

      await expect(zoriumPromotion.connect(user1).spendOnPromotion(excessiveAmount, "test"))
        .to.be.revertedWith("ZoriumPromotion: insufficient allocated balance");
    });
  });

  describe("Wheel Functionality", function () {
    beforeEach(async function () {
      // Setup treasury for wheel rewards
      const depositAmount = ethers.parseEther("50000");
      await zoriumPromotion.connect(admin).depositToTreasury(depositAmount);
    });

    it("Should allow users to spin wheel and receive rewards", async function () {
      await expect(zoriumPromotion.connect(user1).spinWheel())
        .to.emit(zoriumPromotion, "WheelSpun")
        .withArgs(user1.address, dailyWheelReward);

      expect(await zoriumPromotion.getAllocatedBalance(user1.address)).to.equal(dailyWheelReward);
      expect(await zoriumPromotion.canUserSpinWheel(user1.address)).to.be.false;
    });

    it("Should not allow wheel spin within cooldown period", async function () {
      // First spin
      await zoriumPromotion.connect(user1).spinWheel();

      // Try to spin again immediately
      await expect(zoriumPromotion.connect(user1).spinWheel())
        .to.be.revertedWith("ZoriumPromotion: wheel cooldown not finished");
    });

    it("Should track wheel cooldown correctly", async function () {
      // Initially should be able to spin
      expect(await zoriumPromotion.canUserSpinWheel(user1.address)).to.be.true;
      expect(await zoriumPromotion.getWheelCooldownTime(user1.address)).to.equal(0);

      // After spinning, should have cooldown
      await zoriumPromotion.connect(user1).spinWheel();
      expect(await zoriumPromotion.canUserSpinWheel(user1.address)).to.be.false;
      
      const cooldownTime = await zoriumPromotion.getWheelCooldownTime(user1.address);
      expect(cooldownTime).to.be.gt(0);
    });
  });

  describe("Fee Withdrawal", function () {
    beforeEach(async function () {
      // Setup: generate some fees
      const depositAmount = ethers.parseEther("50000");
      const allocationAmount = ethers.parseEther("1000");
      const spendAmount = ethers.parseEther("500");
      
      await zoriumPromotion.connect(admin).depositToTreasury(depositAmount);
      await zoriumPromotion.connect(admin).allocateToUser(user1.address, allocationAmount, "test");
      await zoriumPromotion.connect(user1).spendOnPromotion(spendAmount, "test");
    });

    it("Should allow admin to withdraw accumulated fees", async function () {
      const withdrawAmount = ethers.parseEther("300");
      const initialFeeReceiverBalance = await zoriumPromotion.balanceOf(feeReceiver.address);

      await expect(zoriumPromotion.connect(admin).withdrawFees(withdrawAmount))
        .to.emit(zoriumPromotion, "FeesWithdrawn")
        .withArgs(admin.address, withdrawAmount);

      expect(await zoriumPromotion.balanceOf(feeReceiver.address))
        .to.equal(initialFeeReceiverBalance.add(withdrawAmount));
    });

    it("Should not allow withdrawal more than accumulated fees", async function () {
      const accumulatedFees = await zoriumPromotion.accumulatedFees();
      const excessiveAmount = accumulatedFees.add(1);

      await expect(zoriumPromotion.connect(admin).withdrawFees(excessiveAmount))
        .to.be.revertedWith("ZoriumPromotion: insufficient accumulated fees");
    });
  });

  describe("Transfer Restrictions", function () {
    it("Should prevent regular users from transferring tokens", async function () {
      // Give some tokens to user1
      await zoriumPromotion.connect(admin).mint(user1.address, ethers.parseEther("1000"));

      // Try to transfer - should fail
      await expect(zoriumPromotion.connect(user1).transfer(user2.address, ethers.parseEther("100")))
        .to.be.revertedWith("ZoriumPromotion: transfers not allowed for regular users");
    });

    it("Should allow admin to transfer tokens", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await expect(zoriumPromotion.connect(admin).transfer(user1.address, transferAmount))
        .to.not.be.reverted;

      expect(await zoriumPromotion.balanceOf(user1.address)).to.equal(transferAmount);
    });
  });
});