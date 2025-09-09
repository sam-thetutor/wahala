require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: ["de02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61"],
    },
    celoTestnet: {
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts: ["de02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61"],
    },
  },
  etherscan: {
    apiKey: {
      celo: "", // Add CeloScan API key if needed
    },
  },
};
