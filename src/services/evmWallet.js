/**
 * evmWallet.js — EVM Wallet Service (HashKey Chain / MetaMask)
 * Drop-in replacement for the old bchWallet.js
 */

import { ethers } from 'ethers'

export const HASHKEY_CHAIN_ID = '0x85' // 133 decimal — HashKey Chain Testnet
export const HASHKEY_RPC      = 'https://hashkeychain-testnet.alt.technology'
export const HASHKEY_EXPLORER = 'https://hashkeychain-testnet-explorer.alt.technology'

const WALLET_STORAGE_KEY = 'arbit_evm_private_key'

// ─── Network Config ────────────────────────────────────────────────────────────

export const HASHKEY_NETWORK_PARAMS = {
    chainId:          HASHKEY_CHAIN_ID,
    chainName:        'HashKey Chain Testnet',
    rpcUrls:          [HASHKEY_RPC],
    nativeCurrency:   { name: 'HSK', symbol: 'HSK', decimals: 18 },
    blockExplorerUrls:[HASHKEY_EXPLORER],
}

// ─── MetaMask helpers ──────────────────────────────────────────────────────────

export function isMetaMaskAvailable() {
    return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask)
}

/**
 * connectMetaMask()
 * Prompts MetaMask to connect and switches to HashKey Chain.
 * Returns an ethers.BrowserProvider + signer-like wallet object.
 */
export async function connectMetaMask() {
    if (!isMetaMaskAvailable()) {
        throw new Error('MetaMask is not installed. Please install it from metamask.io')
    }

    const provider = new ethers.BrowserProvider(window.ethereum)

    // Request accounts
    await provider.send('eth_requestAccounts', [])

    // Switch / add HashKey Chain
    try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: HASHKEY_CHAIN_ID }])
    } catch (err) {
        // Chain not added yet → add it
        if (err.code === 4902) {
            await provider.send('wallet_addEthereumChain', [HASHKEY_NETWORK_PARAMS])
        } else {
            throw err
        }
    }

    const signer   = await provider.getSigner()
    const address  = await signer.getAddress()
    const network  = await provider.getNetwork()

    console.log('[evmWallet] MetaMask connected:', address, '| chainId:', network.chainId.toString())

    return { provider, signer, address, isMetaMask: true }
}

// ─── Local / Session wallet ────────────────────────────────────────────────────

/**
 * initializeWallet(privateKey?)
 * If no private key is supplied, creates a random one and persists it.
 * Returns an ethers.Wallet connected to HashKey Chain RPC.
 */
export async function initializeWallet(privateKey = null) {
    const provider = new ethers.JsonRpcProvider(HASHKEY_RPC)

    if (!privateKey) {
        privateKey = localStorage.getItem(WALLET_STORAGE_KEY)
    }

    let wallet
    if (privateKey) {
        console.log('[evmWallet] Restoring wallet from stored key…')
        wallet = new ethers.Wallet(privateKey, provider)
    } else {
        console.log('[evmWallet] Generating new random wallet…')
        wallet = ethers.Wallet.createRandom().connect(provider)
        localStorage.setItem(WALLET_STORAGE_KEY, wallet.privateKey)
    }

    localStorage.setItem(WALLET_STORAGE_KEY, wallet.privateKey)
    console.log('[evmWallet] Wallet address:', wallet.address)
    return wallet
}

// ─── Balance & Utilities ───────────────────────────────────────────────────────

export async function getBalance(walletOrAddress) {
    try {
        const provider  = new ethers.JsonRpcProvider(HASHKEY_RPC)
        const address   = typeof walletOrAddress === 'string'
            ? walletOrAddress
            : walletOrAddress.address
        const balWei    = await provider.getBalance(address)
        const balHSK    = Number(ethers.formatEther(balWei))
        console.log('[evmWallet] Balance:', balHSK, 'HSK')
        return balHSK
    } catch (err) {
        console.error('[evmWallet] Failed to fetch balance:', err.message)
        return 0
    }
}

/**
 * fundProject(wallet, amountHsk, toAddress)
 * Sends HSK to a contract / project address.
 */
export async function fundProject(wallet, amountHsk, toAddress) {
    console.log(`[evmWallet] Sending ${amountHsk} HSK → ${toAddress}`)
    const value = ethers.parseEther(String(amountHsk))
    const tx    = await wallet.sendTransaction({ to: toAddress, value })
    console.log('[evmWallet] TX broadcasted:', tx.hash)
    await tx.wait()
    console.log('[evmWallet] ✓ TX confirmed:', tx.hash)
    return tx.hash
}

// ─── Session management ────────────────────────────────────────────────────────

export function disconnectWallet() {
    localStorage.removeItem(WALLET_STORAGE_KEY)
    console.log('[evmWallet] Wallet session cleared.')
}

export function getExplorerUrl(txHash) {
    return `${HASHKEY_EXPLORER}/tx/${txHash}`
}

export function shortenAddress(address) {
    if (!address) return ''
    return `${address.slice(0, 6)}…${address.slice(-4)}`
}
