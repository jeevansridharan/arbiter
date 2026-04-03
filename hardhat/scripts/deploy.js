// scripts/deploy.js
// ─────────────────────────────────────────────────────────────────────────────
// Deploys ArbitCore.sol and exports the ABI to src/abi/ArbitCore.json
// so the frontend can import it directly.
//
// Usage:
//   npx hardhat run scripts/deploy.js --network hashkey
// ─────────────────────────────────────────────────────────────────────────────

const { ethers } = require("hardhat");
const fs          = require("fs");
const path        = require("path");

async function main() {
  // ── 1. Get the deployer account ──────────────────────────────────────────
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // ── 2. Set the AI Oracle address ─────────────────────────────────────────
  //   Replace this with your real oracle wallet address before deploying.
  //   For quick local tests, we reuse the deployer as oracle.
  const AI_ORACLE = process.env.AI_ORACLE || deployer.address;
  console.log("AI Oracle address:", AI_ORACLE);

  // ── 3. Deploy ArbitCore ──────────────────────────────────────────────────
  console.log("\nDeploying ArbitCore...");
  const ArbitCore = await ethers.getContractFactory("ArbitCore");
  const contract  = await ArbitCore.deploy(AI_ORACLE);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ ArbitCore deployed at:", address);

  // ── 4. Export ABI for frontend use ───────────────────────────────────────
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "..",           // hardhat/
    "..",           // arbiter/
    "contracts",
    "ArbitCore.sol",
    "ArbitCore.json"
  );

  // Hardhat stores artifacts at: hardhat/artifacts/contracts/ArbitCore.sol/ArbitCore.json
  const hardhatArtifact = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "ArbitCore.sol",
    "ArbitCore.json"
  );

  const abiOutputDir  = path.join(__dirname, "..", "..", "src", "abi");
  const abiOutputFile = path.join(abiOutputDir, "ArbitCore.json");

  if (fs.existsSync(hardhatArtifact)) {
    const artifact = JSON.parse(fs.readFileSync(hardhatArtifact, "utf8"));
    const abiExport = {
      address: address,
      abi:     artifact.abi,
    };

    fs.mkdirSync(abiOutputDir, { recursive: true });
    fs.writeFileSync(abiOutputFile, JSON.stringify(abiExport, null, 2));
    console.log("✅ ABI exported to: src/abi/ArbitCore.json");
  } else {
    console.warn("⚠️  Artifact not found — run `npx hardhat compile` first.");
  }

  // ── 5. Summary ───────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log("  CONTRACT ADDRESS :", address);
  console.log("  NETWORK          :", hre.network.name);
  console.log("  AI ORACLE        :", AI_ORACLE);
  console.log("─────────────────────────────────────────\n");
  console.log("👉 Copy the contract address above and paste it into your .env:");
  console.log(`   VITE_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
