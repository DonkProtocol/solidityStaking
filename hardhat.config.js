require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
module.exports = {
  solidity: {
    version: "0.8.0",
  },
  networks: {
    goerli: {
      url: process.env.STAKING_RPC_URL,
      accounts: [process.env.USER],
    },
  },
  paths: {
    artifacts: "./client/src/artifacts",
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
};
//env config keys
//STAKING_RPC_URL
//RPC_URL
//0x82ed3B2c38547426D634293E95d29F7B541b834c
