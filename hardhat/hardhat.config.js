require("@nomicfoundation/hardhat-ethers");
const path = require("path");

// Always load hardhat/.env — not cwd-dependent (e.g. running from arbiter/)
require("dotenv").config({ path: path.join(__dirname, ".env") });

const RPC_URL = process.env.RPC_URL || "";
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
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY.replace(/^0x/, '')}`] : [],
      chainId: 133,          // HashKey Chain Testnet; use 177 for mainnet
    },

    // ── Local Hardhat node (for quick testing without RPC) ─────────────────
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },

  // Where Hardhat looks for contracts (one level up, in /contracts)
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
