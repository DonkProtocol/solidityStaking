const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Staking", function () {
  beforeEach(async function () {
    const tokenAmount = 100;
    //const tokenAmountContract = 1000;
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
    /*
    await tokenContract.transfer(
      stakingContract.address,
      ethers.utils.parseEther(tokenAmountContract.toString())
    );
    */
  });

  describe("deployment verfication", function () {
    it("should set owner", async function () {
      const [deployer, account1, account2] = await ethers.getSigners();
      expect(await stakingContract.owner()).to.equal(deployer.address);
    });
  });

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

  describe("it should allow harvesting", function () {
    it("deposit", async function () {
      const [deployer, account1, account2] = await ethers.getSigners();
      const stakingAmount = ethers.utils.parseEther("10");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      //Stake tokens
      await stakingContract.connect(account1).stake(stakingAmount);

      //it gets the current timestamp
      const currentTimestamp = Math.floor(Date.now() / 1000);

      //it goes 10 minutes in the future
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        currentTimestamp + 600,
      ]);

      //miny the nest block to apply the timestamp
      await ethers.provider.send("evm_mine", []);

      const reward = await stakingContract.connect(account1).getRewards();
      console.log(reward, "user rewards after 10 minutes");

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

      await stakingContract.connect(account1).harvest();

      const newBalance = await stakingContract.checkBalance(account1.address);
      expect(newBalance).to.equal(sum);
    });
  });
});
