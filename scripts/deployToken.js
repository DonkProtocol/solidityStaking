const { ethers } = require("hardhat");

async function main() {
  const deploy = await ethers.getContractFactory("StakingYourToken");
  const Deploy = await deploy.deploy();

  const result = await Deploy.deployed();

  console.log("Contract deployed at:", result.address);
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
});
