/**
 * bchWallet.js — Milestara BCH Wallet Service (Corrected for Chipnet v3)
 *
 * ─── FIXES APPLIED ───────────────────────────────────────────────────────────
 * 1. Network: Forced to "chipnet" to avoid Testnet3 defaults.
 * 2. Balance: Fixed API mismatch (v3 returns BigInt satoshis directly).
 * 3. Connection: Manual override to wss://chipnet.imaginary.cash:50004.
 * 4. Sync: Added UTXO refresh before balance fetch.
 * 5. Debugging: Added detailed console logs for every step.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TestNetWallet, toBch, Connection } from 'mainnet-js'

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Chipnet Electrum WSS Endpoint.
 * Essential for getting balance from the correct test network.
 */
const CHIPNET_ELECTRUM_WSS = 'wss://chipnet.imaginary.cash:50004'

/**
 * The predefined Chipnet project wallet that RECEIVES funds.
 * Note: Should be in cashaddr format starting with 'bchtest:'
 */
export const PROJECT_ADDRESS = 'bchtest:qzs8qgaupu6m6gqnrm3n3zt0p8slhgn4sy2smwwvy2'

const WALLET_STORAGE_KEY = 'milestara_chipnet_wif'

// ─── Internal Helper: Force Chipnet Connection ───────────────────────────────

async function setupChipnetProvider(wallet) {
    console.log('[bchWallet] Configuring Chipnet network provider...')
    try {
        // Create a dedicated Chipnet connection
        const conn = new Connection('testnet', CHIPNET_ELECTRUM_WSS)

        // Attach to the wallet
        wallet.provider = conn.networkProvider

        // Sync UTXOs to ensure we see the latest on-chain state
        console.log('[bchWallet] Synchronizing UTXOs...')
        await wallet.getUtxos()

        console.log('[bchWallet] ✓ Chipnet provider & UTXOs synced')
    } catch (err) {
        console.error('[bchWallet] Provider setup failed:', err.message)
    }
}

// ─── Wallet Creation & Loading ───────────────────────────────────────────────

/**
 * createOrLoadWallet()
 * 
 * Restores or generates a "chipnet" wallet.
 * Ensures the wallet is pointing to the Chipnet Electrum server.
 */
export async function createOrLoadWallet() {
    const savedWif = localStorage.getItem(WALLET_STORAGE_KEY)
    let wallet

    try {
        if (savedWif) {
            console.log('[bchWallet] Loading existing wallet from saved WIF:', savedWif.slice(0, 5) + '...')
            wallet = await TestNetWallet.fromWIF(savedWif)
        } else {
            console.log('[bchWallet] No saved wallet found. Creating new random chipnet wallet...')
            wallet = await TestNetWallet.newRandom()
            localStorage.setItem(WALLET_STORAGE_KEY, wallet.privateKeyWif)
        }

        console.log('[bchWallet] Wallet Address:', wallet.cashaddr)
        console.log('[bchWallet] Network Type:', wallet.network)

        // Force connection to Chipnet nodes
        await setupChipnetProvider(wallet)

        return wallet
    } catch (err) {
        console.error('[bchWallet] Error in createOrLoadWallet:', err)
        throw err
    }
}

// ─── Balance Logic ───────────────────────────────────────────────────────────

/**
 * getBalance(wallet)
 * 
 * Fetches the live balance in BCH.
 * Handles the mainnet-js v3 BigInt return type.
 */
export async function getBalance(wallet) {
    if (!wallet) return 0

    console.log('[bchWallet] Fetching balance for', wallet.cashaddr, '...')
    try {
        // 1. Force a UTXO sync right before checking balance
        await wallet.getUtxos()

        // 2. Get raw balance (returns BigInt in satoshis in mainnet-js v3)
        const satoshisBigInt = await wallet.getBalance()
        console.log('[bchWallet] Raw satoshis (BigInt):', satoshisBigInt.toString())

        // 3. Convert Satoshis (BigInt) -> BCH (Number) using toBch utility
        const bchBalance = Number(toBch(satoshisBigInt))
        console.log('[bchWallet] Final BCH Balance:', bchBalance)

        return bchBalance
    } catch (err) {
        console.error('[bchWallet] Failed to fetch balance:', err.message)
        return 0
    }
}

// ─── Funding Logic ───────────────────────────────────────────────────────────

/**
 * fundProject(wallet, amountBch)
 * 
 * Broadcasts a transaction to the project address.
 */
export async function fundProject(wallet, amountBch) {
    console.log(`[bchWallet] Initiating funding: ${amountBch} BCH -> ${PROJECT_ADDRESS}`)

    try {
        // Convert BCH to satoshis (BigInt) for v3 API
        const satoshis = BigInt(Math.round(parseFloat(amountBch) * 1e8))

        const result = await wallet.send([
            {
                cashaddr: PROJECT_ADDRESS,
                value: satoshis,
                unit: 'sat',
            }
        ])

        console.log('[bchWallet] Transaction successful! TXID:', result.txId)
        return result.txId
    } catch (err) {
        console.error('[bchWallet] Funding failed:', err.message)
        throw new Error(err.message || 'Transaction failed')
    }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

export function disconnectWallet() {
    localStorage.removeItem(WALLET_STORAGE_KEY)
    console.log('[bchWallet] Wallet disconnected.')
}

export function getExplorerUrl(txId) {
    return `https://chipnet.imaginary.cash/tx/${txId}`
}

export function shortenAddress(address) {
    if (!address) return ''
    const parts = address.split(':')
    const prefix = parts[0] ? parts[0] + ':' : ''
    const raw = parts[1] || parts[0]
    return `${prefix}${raw.slice(0, 6)}...${raw.slice(-4)}`
}
