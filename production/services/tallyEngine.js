import { Connection } from 'mainnet-js';
import * as libauth from '@bitauth/libauth';

/**
 * TallyEngine Service
 * 
 * Responsibilities:
 * 1. Scan UTXOs at voting addresses (Approve/Reject).
 * 2. Calculate token-weighted results for specific milestones.
 * 3. Sign "Proof of Approval" for the MilestoneEscrow contract.
 */

// Production Voting Addresses (To be replaced with dynamic creation in future)
const APPROVE_SCRIPT_ADDR = 'bchtest:pzj6g9n34y6grh7u2u3s4p5u6v7x8y9z0a1b2c3d';
const REJECT_SCRIPT_ADDR = 'bchtest:pzq7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n';

/**
 * tallyVotes(tokenCategoryId)
 * Scans the blockchain for token UTXOs used in voting.
 */
export async function tallyVotes(tokenCategoryId) {
    const conn = new Connection('testnet');

    console.log(`[TallyEngine] Scanning votes for category: ${tokenCategoryId}`);

    const approveUtxos = await conn.getUtxos(APPROVE_SCRIPT_ADDR);
    const rejectUtxos = await conn.getUtxos(REJECT_SCRIPT_ADDR);

    // Sum matching tokens
    const yesVotes = approveUtxos
        .filter(u => u.token?.category === tokenCategoryId)
        .reduce((sum, u) => sum + BigInt(u.token.amount), 0n);

    const noVotes = rejectUtxos
        .filter(u => u.token?.category === tokenCategoryId)
        .reduce((sum, u) => sum + BigInt(u.token.amount), 0n);

    const totalVotes = yesVotes + noVotes;
    const approvalRate = totalVotes > 0n ? (Number(yesVotes) / Number(totalVotes)) : 0;

    // Quorum Requirement: e.g. 10% of total possible supply (Needs a way to check supply)
    // For demo/prototype: Just use a flat 1,000,000 token quorum
    const QUORUM = 1000000n;

    const result = {
        milestoneId: '', // Should be passed in
        yesVotes: yesVotes.toString(),
        noVotes: noVotes.toString(),
        totalVotes: totalVotes.toString(),
        percentage: (approvalRate * 100).toFixed(2),
        isApproved: approvalRate >= 0.60 && totalVotes >= QUORUM
    };

    console.log('[TallyEngine] Result:', result);
    return result;
}

/**
 * generateApprovalSignature(milestoneId, oracleWif)
 * Creates the Data Signature for the smart contract if a milestone is approved.
 */
export async function generateApprovalSignature(milestoneId, oracleWif) {
    // 1. Prepare the proof: [milestoneId (32 bytes)][status (1 byte: 0x01)]
    const status = '01';
    const messageHex = milestoneId.replace('0x', '') + status;
    const messageBytes = libauth.hexToBin(messageHex);
    const messageHash = libauth.sha256(messageBytes);

    // 2. Decode Oracle WIF
    const wifResult = libauth.decodeWif(oracleWif);
    if (typeof wifResult === 'string') throw new Error(wifResult);

    const privateKey = wifResult.privateKey;

    // 3. Sign the message hash
    const signature = libauth.signDataSigHash(privateKey, messageHash);

    return {
        proofHex: messageHex,
        signatureHex: libauth.binToHex(signature)
    };
}
