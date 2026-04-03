require("dotenv").config();

const RPC_URL    = process.env.RPC_URL    || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // ── HashKey Chain (mainnet / testnet) ──────────────────────────────────
    hashkey: {
      url:      RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId:  177,          // HashKey Chain mainnet; use 133 for testnet
    },

    // ── Local Hardhat node (for quick testing without RPC) ─────────────────
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },

  // Where Hardhat looks for contracts (one level up, in /contracts)
  paths: {
    sources:   "../contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
