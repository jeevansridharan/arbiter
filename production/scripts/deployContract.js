import { Contract, ElectrumNetworkProvider } from 'cashscript';
import artifact from '../contracts/MilestoneEscrow.json';

/**
 * deployMilestoneEscrow
 *
 * Instantiates the MilestoneEscrow CashScript contract
 * using the bundled artifact (MilestoneEscrow.json).
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

    // ── 1. Connect to Chipnet ──────────────────────────────────────────────────
    const provider = new ElectrumNetworkProvider('chipnet');

    // ── 2. Instantiate the contract with real constructor arguments ────────────
    // Note: ensure params are passed correctly to the constructor
    // creatorPk, funderPk, tallyOraclePk, milestoneId, deadline
    const contract = new Contract(
        artifact,
        [creatorPk, funderPk, oraclePk, milestoneId, BigInt(deadlineHeight)],
        { provider }
    );

    const address = contract.address;
    console.log(`[Deploy] ✅ MilestoneEscrow initialized at: ${address}`);

    return {
        address,          // The real Chipnet P2SH address
        tokenAddress: contract.tokenAddress,
        contract,         // The Contract instance
    };
}
