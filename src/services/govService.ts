/**
 * govService.ts — Milestara On-Chain Governance Service
 * 
 * Handles CashTokens lifecycle on Bitcoin Cash Chipnet:
 * 1. Minting GOV tokens upon funding
 * 2. Transferring GOV tokens between wallets
 * 3. Voting by sending tokens to script addresses
 * 4. Tallying votes by scanning UTXOs
 */

import { TestNetWallet, Connection } from 'mainnet-js';

// --- Constants ---

// The Unique ID for the Milestara Governance Token (Chipnet)
// In a real app, this is minted once and stored here.
// Placeholder ID (Will be replaced by actual Category ID after first mint)
export const GOV_TOKEN_CATEGORY_ID = '9da68991a0c7c647565c567540a02d41549dad1182284730b9a92e21d7a4c651';

// Fixed Voting Addresses (Chipnet - Valid Checksummed)
export const APPROVE_ADDR = 'bchtest:qrgjvcl80ykgaar9k8y226vntxayjxuz3ve2eqz4n3';
export const REJECT_ADDR = 'bchtest:qrsx5usns6uw7075l5z3vgdhfk03dl6qrvk8d9rn9n';

// Minting Ratio: 1 BCH = 100,000 GOV
const MINTING_RATIO = 100000;
const DUST_LIMIT = 1000n; // Satoshis to carry tokens

/**
 * Interface for Vote Tally
 */
export interface VoteStats {
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
    approvalPercentage: number;
}

// --- Service Functions ---

/**
 * mintGovTokens
 * 
 * Mints GOV tokens to a funder based on their BCH contribution.
 * NOTE: This requires a 'Minter Wallet' that holds the Minting Baton UTXO.
 */
export async function mintGovTokens(recipientAddress: string, bchAmount: number, minterWif: string) {
    console.log(`[govService] Minting tokens for ${recipientAddress} (Amount: ${bchAmount} BCH)`);

    try {
        const minterWallet = await TestNetWallet.fromWIF(minterWif);
        const tokenAmount = BigInt(Math.floor(bchAmount * MINTING_RATIO));

        const result = await minterWallet.tokenMint(
            GOV_TOKEN_CATEGORY_ID,
            [
                {
                    cashaddr: recipientAddress,
                    value: DUST_LIMIT,
                    token: {
                        amount: tokenAmount,
                        capability: 'none',
                    }
                } as any
            ]
        );

        console.log(`[govService] ✓ Minted ${tokenAmount} GOV tokens. TXID: ${result.txId}`);
        return result;
    } catch (err: any) {
        console.error('[govService] Minting failed:', err.message);
        throw err;
    }
}

/**
 * transferGovTokens
 * 
 * Transfers fungible GOV tokens from the active wallet to another address.
 */
export async function transferGovTokens(wallet: any, toAddress: string, amount: number) {
    console.log(`[govService] Transferring ${amount} GOV to ${toAddress}`);

    if (!wallet) throw new Error('Wallet not connected');

    try {
        const result = await wallet.send([
            {
                cashaddr: toAddress,
                value: DUST_LIMIT,
                token: {
                    amount: BigInt(amount),
                    category: GOV_TOKEN_CATEGORY_ID,
                }
            }
        ]);

        console.log(`[govService] ✓ Transfer successful. TXID: ${result.txId}`);
        return result;
    } catch (err: any) {
        console.error('[govService] Transfer failed:', err.message);
        throw err;
    }
}

/**
 * scanVotes
 * 
 * Scans the blockchain UTXOs for specific voting addresses to tally token votes.
 */
export async function scanVotes(): Promise<VoteStats> {
    console.log('[govService] Scanning blockchain for votes...');

    try {
        // We use a temporary wallet or connection to fetch UTXOs
        const conn = new Connection('testnet', 'wss://chipnet.imaginary.cash:50004');

        // Fetch UTXOs for both addresses
        const yesUtxos = await conn.networkProvider.getUtxos(APPROVE_ADDR);
        const noUtxos = await conn.networkProvider.getUtxos(REJECT_ADDR);

        const sumTokens = (utxos: any[]) => {
            return utxos.reduce((acc, utxo) => {
                if (utxo.token && utxo.token.category === GOV_TOKEN_CATEGORY_ID) {
                    return acc + Number(utxo.token.amount);
                }
                return acc;
            }, 0);
        };

        const yesVotes = sumTokens(yesUtxos);
        const noVotes = sumTokens(noUtxos);
        const totalVotes = yesVotes + noVotes;

        const approvalPercentage = totalVotes > 0
            ? (yesVotes / totalVotes) * 100
            : 0;

        console.log(`[govService] Tally complete: YES ${yesVotes} | NO ${noVotes}`);

        return {
            yesVotes,
            noVotes,
            totalVotes,
            approvalPercentage
        };
    } catch (err: any) {
        console.error('[govService] Vote scan failed:', err.message);
        return { yesVotes: 0, noVotes: 0, totalVotes: 0, approvalPercentage: 0 };
    }
}
