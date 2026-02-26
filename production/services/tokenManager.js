import { TestNetWallet, TokenMintRequest } from 'mainnet-js';

/**
 * TokenManager Service
 * 
 * Handles CashToken lifecycle for Milestara projects.
 */

// 1 BCH contribution = 100,000 GOV tokens (Standard Unit)
const MINTING_RATIO = 100000;

/**
 * createProjectTokenCategory(wallet, projectTitle)
 * Creates a unique CashToken category for a new project.
 * This should be done once when the project starts.
 */
export async function createProjectTokenCategory(wallet, projectTitle) {
    console.log(`[TokenManager] Creating token category for: ${projectTitle}`);

    // In mainnet-js, creating a category involves a genesis transaction
    // We mint 1 token to the project wallet initially to define the categoryId (txid)
    const result = await wallet.tokenGenesis({
        cashaddr: wallet.cashaddr,
        amount: 1n, // Initial token
        token: {
            symbol: "GOV",
            name: `${projectTitle} Governance`,
        }
    });

    console.log(`[TokenManager] Category Created! ID: ${result.tokenCategoryId}`);
    return result.tokenCategoryId;
}

/**
 * mintTokensForContribution(contributorAddr, amountBch, categoryId, batonWalletWif)
 * Mints tokens to a contributor proportional to their BCH funding.
 */
export async function mintTokensForContribution(contributorAddr, amountBch, categoryId, batonWalletWif) {
    const batonWallet = await TestNetWallet.fromWIF(batonWalletWif);

    const tokenAmount = BigInt(Math.floor(amountBch * MINTING_RATIO));

    console.log(`[TokenManager] Minting ${tokenAmount} tokens for ${contributorAddr}`);

    const mintRequest = {
        cashaddr: contributorAddr,
        value: 1000n, // Dust output
        token: {
            amount: tokenAmount,
            category: categoryId,
        }
    };

    const { txId } = await batonWallet.tokenMint(categoryId, mintRequest);

    console.log(`[TokenManager] Mint successful. TXID: ${txId}`);
    return txId;
}
