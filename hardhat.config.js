require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
module.exports = {
  solidity: {
    version: "0.8.0",
  },
  networks: {
    goerli: {
      url: process.env.RPC_URL,
      accounts: [process.env.USER],
    },
  },
  paths: {
    artifacts: "./client/src/artifacts",
  },
};
