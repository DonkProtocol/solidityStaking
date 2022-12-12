const { ethers } = require("hardhat");

async function main() {
  const Staking = await ethers.getContractFactory("Staking");

  staking = await Staking.deploy("0x82ed3B2c38547426D634293E95d29F7B541b834c");

  const result = await staking.deployed();
  //token adress ==>

  console.log("Contract deployed at:", result.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
