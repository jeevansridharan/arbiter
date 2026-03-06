import { Contract, ElectrumNetworkProvider } from 'cashscript';
import { createReadStream } from 'fs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * deployMilestoneEscrow
 *
 * Compiles and instantiates the MilestoneEscrow CashScript contract
 * using the pre-compiled artifact (MilestoneEscrow.json).
 *
 * Returns the real P2SH contract address on Chipnet.
 */
export async function deployMilestoneEscrow(params) {
    const {
        creatorPk,       // Uint8Array — project creator's compressed public key
        funderPk,        // Uint8Array — funder's compressed public key
        oraclePk,        // Uint8Array — tally oracle's compressed public key
        milestoneId,     // Uint8Array (32 bytes) — unique milestone identifier
        deadlineHeight,  // number — block height after which refund is possible
    } = params;

    // ── 1. Load the pre-compiled contract artifact ─────────────────────────────
    const artifactPath = path.resolve(__dirname, '../contracts/MilestoneEscrow.json');
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

    // ── 2. Connect to Chipnet ──────────────────────────────────────────────────
    const provider = new ElectrumNetworkProvider('chipnet');

    // ── 3. Instantiate the contract with real constructor arguments ────────────
    const contract = new Contract(
        artifact,
        [creatorPk, funderPk, oraclePk, milestoneId, BigInt(deadlineHeight)],
        { provider }
    );

    const address = contract.address;
    console.log(`[Deploy] ✅ MilestoneEscrow deployed for milestone`);
    console.log(`[Deploy]    Address : ${address}`);
    console.log(`[Deploy]    TokenAddress: ${contract.tokenAddress}`);

    return {
        address,          // The real Chipnet P2SH address — send BCH here to fund escrow
        tokenAddress: contract.tokenAddress,
        contract,         // The Contract instance (for building release/refund txs)
    };
}
