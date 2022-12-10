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
};
//env config keys
//STAKING_RPC_URL
//RPC_URL
