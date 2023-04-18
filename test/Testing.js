const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  beforeEach(async function () {
    [signer1, signer2] = await ethers.getSigners();

    Staking = await ethers.getContractFactory("Staking", signer1);

    StakingYourToken = await ethers.getContractFactory(
      "StakingYourToken",
      signer1
    );

    const deploy = await StakingYourToken.deploy();

    const token = await deploy.deployed();

    staking = await Staking.deploy(token.address);
  });

  describe("deploy", function () {
    it("should set owner", async function () {
      expect(await staking.owner()).to.equal(signer1.address);
    });
  });

  describe("stake tokens", function () {
    it("deposit", async function () {});
  });

  describe("harvest tokens", function () {
    it("deposit", async function () {});
  });

  describe("unstake tokens", function () {
    it("deposit", async function () {});
  });
});
