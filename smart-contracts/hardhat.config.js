require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

// You would need to add your private key and API keys in a .env file
const config = {
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
    hardhat: {
      chainId: 31337,
    },
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: [
        "0x92933fc7e313f86f0845b0f4e31094630b38eb1d4ec1894cb0da33defed6b6e3"
      ],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: [
        "0x92933fc7e313f86f0845b0f4e31094630b38eb1d4ec1894cb0da33defed6b6e3"
      ],
    },
    zora: {
      url: "https://rpc.zora.energy",
      chainId: 7777777,
      accounts: [
        "0x92933fc7e313f86f0845b0f4e31094630b38eb1d4ec1894cb0da33defed6b6e3"
      ],
    },
    zoraSepolia: {
      url: "https://sepolia.rpc.zora.energy",
      chainId: 999999999,
      accounts: [
        "0x0000000000000000000000000000000000000000000000000000000000000000" // Placeholder
      ],
    },
  },
  etherscan: {
    apiKey: {
      zora: "YOUR_ZORA_API_KEY", // If available
    },
    customChains: [
      {
        network: "zora",
        chainId: 7777777,
        urls: {
          apiURL: "https://explorer.zora.energy/api",
          browserURL: "https://explorer.zora.energy",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

module.exports = config;