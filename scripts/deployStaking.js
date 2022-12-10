const { ethers } = require("hardhat");

async function main() {
  [signer1, signer2] = await ethers.getSigners();

  console.log(ethers.utils.parseEther("10"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
