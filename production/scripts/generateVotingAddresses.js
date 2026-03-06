/**
 * generateVotingAddresses.js
 *
 * Generates deterministic Approve / Reject voting P2PKH addresses for each
 * project on Chipnet.
 *
 * Design:
 *   ─ Each project gets its own Approve address and Reject address.
 *   ─ They are derived deterministically from the project ID so they can be
 *     re-derived at any time without storing an extra private key.
 *   ─ We hash projectId + a domain tag to get a 32-byte private-key seed for
 *     each address type, then derive the compressed public key → P2PKH address.
 *   ─ Nobody owns the private key, so tokens sent there are "locked" (vote-locked).
 *     This is intentional — tokens once voted cannot be retrieved. A more advanced
 *     design would use a contract, but for the prototype this is sufficient.
 *
 * Usage:
 *   import { generateVotingAddresses } from './generateVotingAddresses'
 *   const { approveAddr, rejectAddr } = await generateVotingAddresses(projectId)
 */

import * as libauth from '@bitauth/libauth';

// Domain salt — keeps project vote keys separate from any wallet keys
const APPROVE_SALT = 'milestara:vote:approve:v1';
const REJECT_SALT = 'milestara:vote:reject:v1';

/**
 * deriveP2PKHAddress(seed32)
 *
 * Takes a 32-byte private key seed and returns the Chipnet P2PKH cash address.
 * The address starts with "bchtest:q..." (P2PKH).
 */
async function deriveP2PKHAddress(seed32) {
    // 1. Derive the compressed public key from the private key
    const secp256k1 = await libauth.instantiateSecp256k1();
    const compressedPubKey = secp256k1.derivePublicKeyCompressed(seed32);
    if (typeof compressedPubKey === 'string') {
        throw new Error(`secp256k1 error: ${compressedPubKey}`);
    }

    // 2. Hash the public key → P2PKH (HASH160 = RIPEMD160(SHA256(pubkey)))
    const sha256Engine = await libauth.instantiateSha256();
    const sha256Hash = sha256Engine.hash(compressedPubKey);

    const ripemd160Engine = await libauth.instantiateRipemd160();
    const pkHash = ripemd160Engine.hash(sha256Hash);

    // 3. Encode as cashaddr (P2PKH, testnet/chipnet prefix = "bchtest")
    const address = libauth.encodeCashAddress({
        prefix: 'bchtest',
        type: 0, // 0 = P2PKH
        payload: pkHash,
    });

    if (typeof address === 'string' && address.startsWith('bchtest:')) {
        return address;
    }

    // Handle object return shape from newer libauth
    if (typeof address === 'object' && address.address) {
        return address.address;
    }

    throw new Error(`encodeCashAddress failed: ${JSON.stringify(address)}`);
}

/**
 * hashToPrivKey(projectId, salt)
 *
 * Produces a deterministic 32-byte private key seed from a project ID and salt.
 * SHA256(SHA256(salt + ":" + projectId))
 */
async function hashToPrivKey(projectId, salt) {
    const sha256 = await libauth.instantiateSha256();
    const input = libauth.utf8ToBin(`${salt}:${projectId}`);
    // Double-SHA256 so the output is uniformly distributed
    const firstPass = sha256.hash(input);
    return sha256.hash(firstPass);
}

/**
 * generateVotingAddresses(projectId)
 *
 * Returns the Approve and Reject Chipnet addresses for a given project.
 *
 * @param {string} projectId  — UUID from Supabase (or any stable string)
 * @returns {{ approveAddr: string, rejectAddr: string }}
 */
export async function generateVotingAddresses(projectId) {
    if (!projectId) throw new Error('generateVotingAddresses: projectId is required');

    const approveKey = await hashToPrivKey(projectId, APPROVE_SALT);
    const rejectKey = await hashToPrivKey(projectId, REJECT_SALT);

    const approveAddr = await deriveP2PKHAddress(approveKey);
    const rejectAddr = await deriveP2PKHAddress(rejectKey);

    console.log(`[generateVotingAddresses] Project: ${projectId}`);
    console.log(`  ✅ Approve: ${approveAddr}`);
    console.log(`  ❌ Reject : ${rejectAddr}`);

    return { approveAddr, rejectAddr };
}
