/**
 * milestoneContract.js  —  Milestara Bitcoin Cash Chipnet Service
 *
 * This file handles Chipnet-based governance:
 *   1. Deployment simulation (locking BCH)
 *   2. Token-weighted voting
 *   3. Milestone release
 */

import { TestNetWallet } from 'mainnet-js'

// ── Constants ────────────────────────────────────────────────────────────────

// How many governance tokens to mint per 0.001 BCH funded
const TOKENS_PER_UNIT = 100

// Storage keys for demo persistence
const STORAGE_KEYS = {
    contractUtxo: 'milestara_chipnet_contract_info',
    tokenCategory: 'milestara_chipnet_token_id',
    tokenBalance: 'milestara_chipnet_token_balance',
    votes: 'milestara_chipnet_votes',
    lockedAmount: 'milestara_chipnet_locked_amount',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
    } catch {
        return defaultValue
    }
}

// ── STEP 1: Contract Artifact (CashScript) ──────────────────────────────────
export function getContractArtifact() {
    return {
        "contractName": "MilestoneLock",
        "parameters": [
            { "name": "ownerPk", "type": "pubkey" },
            { "name": "funderPk", "type": "pubkey" }
        ],
        "functions": [
            { "name": "release", "inputs": [{ "name": "sig", "type": "sig" }] },
            { "name": "refund", "inputs": [{ "name": "sig", "type": "sig" }] }
        ],
        "source": "pragma cashscript ^0.10.0; contract MilestoneLock(pubkey ownerPk, pubkey funderPk) { ... }",
        "updatedAt": "2026-02-25"
    }
}

// ── STEP 2: Fund milestone contract + mint governance tokens ──────────────────
/**
 * fundMilestoneContract(wallet, amountBch, projectAddress)
 */
export async function fundMilestoneContract(wallet, amountBch, projectAddr) {
    const tokenAmount = Math.floor((amountBch / 0.001) * TOKENS_PER_UNIT)
    if (tokenAmount < 1) throw new Error('Fund at least 0.001 BCH to receive governance tokens')

    let mintTxId = null
    let tokenCategory = null

    try {
        // Send actual BCH to the project address (simulating locking)
        const result = await wallet.send([
            {
                cashaddr: projectAddr,
                value: parseFloat(amountBch),
                unit: 'bch',
            },
        ])
        mintTxId = result.txId
        tokenCategory = mintTxId.slice(0, 10) // simulated token ID
    } catch (err) {
        console.warn('Transaction failed, simulating:', err.message)
        mintTxId = 'simulated_' + Date.now().toString(16)
        tokenCategory = 'MOCK_CHIP_TOKEN'
    }

    // Record locked amount
    const prevLocked = loadFromStorage(STORAGE_KEYS.lockedAmount, 0)
    saveToStorage(STORAGE_KEYS.lockedAmount, prevLocked + amountBch)
    saveToStorage(STORAGE_KEYS.tokenCategory, tokenCategory)

    // Update token balance
    const prevTokens = loadFromStorage(STORAGE_KEYS.tokenBalance, 0)
    const newTokenBalance = prevTokens + tokenAmount
    saveToStorage(STORAGE_KEYS.tokenBalance, newTokenBalance)

    return {
        tokenCategory,
        tokenAmount,
        newTokenBalance,
        simulatedTxId: mintTxId,
    }
}

// ── STEP 3: Token-weighted voting ─────────────────────────────────────────────
export function castVote(milestoneId, voteType, tokensToUse = 1) {
    const currentBalance = loadFromStorage(STORAGE_KEYS.tokenBalance, 0)

    if (currentBalance < tokensToUse) {
        throw new Error(`Not enough tokens. You have ${currentBalance} GOV tokens.`)
    }

    const newBalance = currentBalance - tokensToUse
    saveToStorage(STORAGE_KEYS.tokenBalance, newBalance)

    const allVotes = loadFromStorage(STORAGE_KEYS.votes, {})
    const prevVotes = allVotes[milestoneId] || { yes: 0, no: 0 }
    const updatedVotes = {
        ...prevVotes,
        [voteType]: prevVotes[voteType] + tokensToUse,
    }
    allVotes[milestoneId] = updatedVotes
    saveToStorage(STORAGE_KEYS.votes, allVotes)

    const total = updatedVotes.yes + updatedVotes.no
    const isApproved = total > 0 && (updatedVotes.yes / total) > 0.5

    return {
        votes: updatedVotes,
        tokenBalance: newBalance,
        isApproved,
        yesPercent: total > 0 ? Math.round((updatedVotes.yes / total) * 100) : 0,
    }
}

// ── STEP 4: Release funds after approval ──────────────────────────────────────
export async function releaseMilestoneFunds(wallet, amountBch, projectAddr) {
    const locked = loadFromStorage(STORAGE_KEYS.lockedAmount, 0)
    if (amountBch > locked + 0.0001) {
        throw new Error(`Cannot release ${amountBch} BCH. Only ${locked.toFixed(8)} BCH is locked.`)
    }

    // In a real system, the contract would hold the funds.
    // Here we send from the connected wallet to simulate release.
    const result = await wallet.send([
        {
            cashaddr: projectAddr,
            value: parseFloat(amountBch),
            unit: 'bch',
        },
    ])

    const remaining = Math.max(0, locked - amountBch)
    saveToStorage(STORAGE_KEYS.lockedAmount, remaining)

    return result.txId
}

// ── Getters ───────────────────────────────────────────────────────────────────

export function getTokenBalance() {
    return loadFromStorage(STORAGE_KEYS.tokenBalance, 0)
}

export function getLockedAmount() {
    return loadFromStorage(STORAGE_KEYS.lockedAmount, 0)
}

export function getMilestoneVotes(milestoneId) {
    const allVotes = loadFromStorage(STORAGE_KEYS.votes, {})
    return allVotes[milestoneId] || { yes: 0, no: 0 }
}

export function getAllVotes() {
    return loadFromStorage(STORAGE_KEYS.votes, {})
}

export function isMilestoneApproved(milestoneId) {
    const v = getMilestoneVotes(milestoneId)
    const total = v.yes + v.no
    return total > 0 && (v.yes / total) > 0.5
}

export function clearContractState() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
}

export function chipnetExplorerUrl(txId) {
    return `https://chipnet.imaginary.cash/tx/${txId}`
}
