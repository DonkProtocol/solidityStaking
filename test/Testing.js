const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Staking deploy", function () {
  beforeEach(async function () {
    const tokenAmount = 100;
    const [deployer, account1, account2] = await ethers.getSigners();

    // Deploy token contract
    const Token = await ethers.getContractFactory("StakingYourToken");
    tokenContract = await Token.connect(deployer).deploy();

    // Deploy staking contract
    const Staking = await ethers.getContractFactory("Staking");
    stakingContract = await Staking.connect(deployer).deploy(
      tokenContract.address
    );

    // Transfer tokens to account1 and account2
    await tokenContract.transfer(
      account1.address,
      ethers.utils.parseEther(tokenAmount.toString())
    );
  });

  describe("deployment verfication", function () {
    it("should set owner", async function () {
      const [deployer, account1, account2] = await ethers.getSigners();
      expect(await stakingContract.owner()).to.equal(deployer.address);
    });
  });

  describe("stake and unstaking", function () {
    it("it should allow staking and unstaking", async function () {
      const [deployer, account1, account2] = await ethers.getSigners();
      const stakingAmount = ethers.utils.parseEther("50");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      // Stake tokens
      await stakingContract.connect(account1).stake(stakingAmount);

      // Check staking balance
      const stakingBalance = await stakingContract.checkBalance(
        stakingContract.address
      );
      expect(stakingBalance).to.equal(stakingAmount);

      // Unstake tokens
      await stakingContract.connect(account1).unstake();

      // Check staking balance
      const newStakingBalance = await stakingContract.checkBalance(
        stakingContract.address
      );
      expect(newStakingBalance).to.equal(0);
    });
  });

  describe("harvest", function () {
    it("it should allow harvesting", async function () {
      const [deployer, account1, account2] = await ethers.getSigners();
      const stakingAmount = ethers.utils.parseEther("10");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      //Stake tokens
      await stakingContract.connect(account1).stake(stakingAmount);

      await network.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const reward = await stakingContract.connect(account1).getRewards();
      console.log(reward, "user rewards after 60 days");

      const userBalance = await stakingContract.checkBalance(account1.address);

      //calculating the amount user should receive as reward
      const num1 = BigNumber.from(userBalance);
      const num2 = BigNumber.from(reward);
      const sum = num1.add(num2);

      //printing the calculation
      console.log(
        sum.toString(),
        "the user should have this amount after harvesting"
      );

      const tokenAmountContract = 1000;

      await tokenContract.transfer(
        stakingContract.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      await stakingContract.connect(account1).harvest();

      const newBalance = await stakingContract.checkBalance(account1.address);
      expect(newBalance).to.equal(sum);
      //TODO: cretes the apr logic and verify if more than one user are able to stake
    });
  });

  describe("APR calculations", function () {
    it("returns the correct APR for 20% of total supply staked", async function () {
      const tokenAmountContract = 2000;

      await tokenContract.transfer(
        stakingContract.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      const apr = await stakingContract.getAPR();
      console.log(apr, "apr current value");
      expect(apr).to.equal(1500);
    });

    it("returns the correct APR for 40% of total supply staked", async function () {
      const tokenAmountContract = 4000;

      await tokenContract.transfer(
        stakingContract.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );
      const apr = await stakingContract.getAPR();
      console.log(apr, "apr current value");
      expect(apr).to.equal(750);
    });

    it("returns the correct APR for 0% of total supply staked", async function () {
      const tokenAmountContract = 0;

      await tokenContract.transfer(
        stakingContract.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );
      const apr = await stakingContract.getAPR();
      console.log(apr, "apr current value");
      expect(apr).to.equal(24000);
    });
  });
});
