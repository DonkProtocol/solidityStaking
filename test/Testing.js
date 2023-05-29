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

    await tokenContract.transfer(
      account2.address,
      ethers.utils.parseEther(tokenAmount.toString())
    );
  });

  describe("deployment verfication", function () {
    it("should set owner", async function () {
      const [deployer, account1, account2] = await ethers.getSigners();
      expect(await stakingContract.adminWallet()).to.equal(deployer.address);
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

      const value1 = await stakingContract.connect(account1).getPositions();
      console.log(value1.amountStaked, "account one staked amount");

      expect(stakingAmount).to.equal(value1.amountStaked);

      //account two

      const stakingAmount2 = ethers.utils.parseEther("20");

      //approving tokens
      const approveTx2 = await tokenContract
        .connect(account2)
        .approve(stakingContract.address, stakingAmount2);
      await approveTx2.wait();

      // Stake tokens
      await stakingContract.connect(account2).stake(stakingAmount2);

      const totalStaked = await stakingContract
        .connect(account1)
        .getTotalStakedAmount();
      expect(totalStaked).to.equal(stakingAmount.add(stakingAmount2));
      console.log("total staked amount:", totalStaked);
      // Check staking balance
      const stakingBalance2 = await stakingContract.checkBalance(
        stakingContract.address
      );

      const value = await stakingContract.connect(account2).getPositions();
      console.log(value.amountStaked, "account two staked amount");

      expect(stakingAmount2).to.equal(value.amountStaked);

      expect(stakingBalance2).to.equal("70000000000000000000");

      // Unstake tokens
      await stakingContract.connect(account2).unstake();

      // Check staking balance
      const newStakingBalance2 = await stakingContract.checkBalance(
        stakingContract.address
      );

      expect(newStakingBalance2).to.equal(stakingAmount);

      // Unstake tokens
      await stakingContract.connect(account1).unstake();

      const newStakingBalance3 = await stakingContract.checkBalance(
        stakingContract.address
      );

      expect(newStakingBalance3).to.equal("0");
    });
  });

  describe("unstaking and retrieving reward", function () {
    it("it should allow user unstake but not harvest without an amount staked", async function () {
      const [deployer, account1, account2] = await ethers.getSigners();
      const stakingAmount = ethers.utils.parseEther("50");
      const amountAllowence = ethers.utils.parseEther("1000");

      const tokenAmountContract = 1000000;

      await tokenContract.transfer(
        stakingContract.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, amountAllowence);
      await approveTx.wait();

      // Stake tokens
      await stakingContract.connect(account1).stake(stakingAmount);

      const value1 = await stakingContract.connect(account1).getPositions();
      console.log(value1.amountStaked, "account one staked amount");

      expect(stakingAmount).to.equal(value1.amountStaked);

      //increasing time in 60 days
      await network.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const reward = await stakingContract
        .connect(account1)
        .callStatic.getRewards();
      console.log(reward, "user rewards after 60 days");

      const bigNumber = BigNumber.from(reward);
      const decimalValue = parseFloat(bigNumber.toString()) / 10 ** 18;

      console.log(decimalValue, "reward value converted");

      const totalStaked1 = await stakingContract
        .connect(account1)
        .getTotalStakedAmount();

      // Unstake tokens
      await stakingContract.connect(account1).unstake();

      const totalStaked2 = await stakingContract
        .connect(account1)
        .getTotalStakedAmount();

      expect(totalStaked1.toString()).to.not.equal(totalStaked2.toString());

      await expect(
        stakingContract.connect(account1).harvest()
      ).to.be.revertedWith("revert");

      await stakingContract.connect(account1).stake(stakingAmount);

      const positionRewards = await stakingContract
        .connect(account1)
        .getPositions();

      const userBalance = await stakingContract.checkBalance(account1.address);

      const userRewards = positionRewards.rewardStaked.add(
        positionRewards.savedReward
      );

      //calculating the amount user should receive as reward
      const num11 = BigNumber.from(userRewards);
      const num22 = BigNumber.from(userBalance);

      const sum = num11.add(num22);

      await stakingContract.connect(account1).harvest();

      const newBalance = await stakingContract.checkBalance(account1.address);

      expect(newBalance).to.equal(sum);
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

      var tokenAmountContractt = BigNumber.from("150000000000");

      await tokenContract.transfer(
        stakingContract.address,
        ethers.utils.parseEther(tokenAmountContractt.toString())
      );

      //Stake tokens
      await stakingContract.connect(account1).stake(stakingAmount);

      //increasing time in 60 days
      await network.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const reward = await stakingContract
        .connect(account1)
        .callStatic.getRewards();
      console.log(reward, "user rewards after 60 days hav");

      const apr = await stakingContract.connect(account1).getAPR();
      const bigNumber = BigNumber.from(reward);
      const decimalValue = parseFloat(bigNumber.toString()) / 10 ** 18;

      console.log(decimalValue, "reward value converted");

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
    });
  });

  describe("Staking and retrieving the saved amount", function () {
    it("it should allow user stake more than one time and retrive the saved reward", async function () {
      const tokenAmountContract = ethers.utils.parseEther("100000");

      const [deployer, account1, account2] = await ethers.getSigners();

      await tokenContract.transfer(account1.address, tokenAmountContract);

      const stakingAmount = ethers.utils.parseEther("100");
      const allowance = tokenAmountContract;

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, allowance);
      await approveTx.wait();

      const transferAmount = ethers.utils.parseEther("150000000000");

      await tokenContract.transfer(stakingContract.address, transferAmount);

      //1
      await stakingContract.connect(account1).stake(stakingAmount);

      //2
      await network.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const allPositions = await stakingContract
        .connect(account1)
        .getPositions();

      expect(allPositions.savedReward.toString()).to.equal("0");

      const reward = await stakingContract
        .connect(account1)
        .callStatic.getRewards();

      await stakingContract.connect(account1).stake(stakingAmount);

      const allPositions2 = await stakingContract
        .connect(account1)
        .getPositions();

      expect(allPositions2.savedReward).to.equal(reward);

      //3
      await network.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const reward2 = await stakingContract
        .connect(account1)
        .callStatic.getRewards();

      await stakingContract.connect(account1).stake(stakingAmount);

      const allPositions4 = await stakingContract
        .connect(account1)
        .getPositions();

      expect(allPositions4.savedReward).to.equal(reward2);

      const harvesting = await stakingContract.connect(account1).harvest();
      await harvesting.wait();

      const allPositions5 = await stakingContract
        .connect(account1)
        .getPositions();

      const reward3 = await stakingContract
        .connect(account1)
        .callStatic.getRewards();

      expect(allPositions5.savedReward).to.equal("0");
      expect(reward3).to.equal("0");
    });
  });

  describe("Fees and auto restaking", function () {
    it("it should set the fees and restake the user rewards", async function () {
      const tokenAmountContract = ethers.utils.parseEther("100");
      const tokenAmountStakingContract = ethers.utils.parseEther("100000");
      const [deployer, account1, account2] = await ethers.getSigners();

      await tokenContract.transfer(account1.address, tokenAmountContract);

      await tokenContract.transfer(
        stakingContract.address,
        tokenAmountStakingContract
      );

      const stakingAmount = ethers.utils.parseEther("10");
      const allowance = ethers.utils.parseEther("100");
      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, allowance);
      await approveTx.wait();

      //1
      const balance = await stakingContract.checkBalance(account1.address);

      await stakingContract.connect(account1).stake(stakingAmount);

      await stakingContract.connect(account1).unstake();

      const balance1 = await stakingContract.checkBalance(account1.address);

      expect(balance1).to.equal(balance);

      //2
      //98% of fees
      await stakingContract.connect(deployer).setStakingFee(9800);

      await stakingContract.connect(account1).stake(stakingAmount);

      await stakingContract.connect(account1).unstake();

      const balance2 = await stakingContract.checkBalance(account1.address);

      console.log(balance2, "after fee applied");
      expect(balance1).to.not.equal(balance2);
    });
  });
  describe("APR calculations", function () {
    it("returns the correct APR for 10% of total supply staked", async function () {
      const tokenAmountContract = BigNumber.from("100000000000");
      const [deployer, account1, account2] = await ethers.getSigners();

      await tokenContract.transfer(
        account1.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      const stakingAmount = ethers.utils.parseEther("100000000000");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      await stakingContract.connect(account1).stake(stakingAmount);

      const apr = await stakingContract.getAPR();

      console.log(apr, "apr current value");
      expect(apr).to.equal(1208);
    });

    it("returns the correct APR for 15% of total supply staked", async function () {
      const tokenAmountContract = BigNumber.from("150000000000");
      const [deployer, account1, account2] = await ethers.getSigners();

      await tokenContract.transfer(
        account1.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      const stakingAmount = ethers.utils.parseEther("150000000000");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      await stakingContract.connect(account1).stake(stakingAmount);

      const apr = await stakingContract.getAPR();

      console.log(apr, "apr current value");
      expect(apr).to.equal(612);
    });

    it("returns the correct APR for 20% of total supply staked", async function () {
      const tokenAmountContract = BigNumber.from("200000000000");

      const [deployer, account1, account2] = await ethers.getSigners();

      await tokenContract.transfer(
        account1.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      const stakingAmount = ethers.utils.parseEther("200000000000");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      await stakingContract.connect(account1).stake(stakingAmount);

      const apr = await stakingContract.getAPR();
      console.log(apr, "apr current value");
      expect(apr).to.equal(15);
    });

    it("returns the correct APR for 40% of total supply staked", async function () {
      const tokenAmountContract = BigNumber.from("400000000000");

      const [deployer, account1, account2] = await ethers.getSigners();

      await tokenContract.transfer(
        account1.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      const stakingAmount = ethers.utils.parseEther("400000000000");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      await stakingContract.connect(account1).stake(stakingAmount);

      const apr = await stakingContract.getAPR();
      console.log(apr, "apr current value");

      expect(apr).to.equal(7);
    });

    it("returns the correct APR for 0% of total supply staked", async function () {
      const tokenAmountContract = 0;

      const [deployer, account1, account2] = await ethers.getSigners();

      await tokenContract.transfer(
        account1.address,
        ethers.utils.parseEther(tokenAmountContract.toString())
      );

      const stakingAmount = ethers.utils.parseEther("0");

      //approving tokens
      const approveTx = await tokenContract
        .connect(account1)
        .approve(stakingContract.address, stakingAmount);
      await approveTx.wait();

      await stakingContract.connect(account1).stake(stakingAmount);

      const apr = await stakingContract.getAPR();
      console.log(apr, "apr current value");

      expect(apr).to.equal(2400);
    });
  });
});
