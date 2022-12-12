const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const tokenContract = await ethers.getContractFactory(
    "StakingYourToken",
    deployer
  );

  const Token = await tokenContract.deploy();

  const TokenAddress = await Token.deployed();

  console.log(
    "Contract deployed at:",
    TokenAddress.address,
    "Deploying contracts with the account:",
    deployer.address
  );

  [signer1] = await ethers.getSigners();

  const Staking = await ethers.getContractFactory("Staking", signer1);

  staking = await Staking.deploy(TokenAddress.address);
  //token adress ==>
  console.log(
    "Staking contract deployeed to:",
    staking.address,
    "by",
    signer1.address
  );
}

//npx hardhat run --network localhost scripts/1_deploy.js

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
