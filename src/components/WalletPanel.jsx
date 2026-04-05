/**
 * WalletPanel.jsx — Arbit EVM Wallet Panel (HashKey Chain)
 * Replaces the old BCH-only WalletPanel.
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
    initializeWallet,
    connectMetaMask,
    getBalance,
    fundProject,
    disconnectWallet,
    getExplorerUrl,
    shortenAddress,
} from '../services/evmWallet'

// ── Status icon helpers ─────────────────────────────────────────────────────
function Spinner() {
    return (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

export default function WalletPanel({ onRealFund, onWalletConnect }) {
    // ── State ────────────────────────────────────────────────────────────────
    const [wallet, setWallet] = useState(null)   // ethers wallet or signer
    const [address, setAddress] = useState('')
    const [balance, setBalance] = useState(null)   // HSK number or null
    const [amount, setAmount] = useState('')       // user-typed HSK amount
    const [txId, setTxId] = useState('')           // successful tx hash
    const [error, setError] = useState('')
    const [connectLoading, setConnectLoading] = useState(false)
    const [balanceLoading, setBalanceLoading] = useState(false)
    const [sendLoading, setSendLoading] = useState(false)
    const [txStatus, setTxStatus] = useState('idle') // 'idle'|'sending'|'success'|'error'
    const [isMetaMask, setIsMetaMask] = useState(false)

    // ── Helpers ───────────────────────────────────────────────────────────────
    const clearError = () => setError('')

    const refreshBalance = useCallback(async (w) => {
        const target = w || wallet
        if (!target) return
        setBalanceLoading(true)
        try {
            const addr = target.address || (await target.getAddress())
            const bal = await getBalance(addr)
            setBalance(bal)
        } catch (e) {
            console.error('[WalletPanel] Balance refresh failed:', e)
        } finally {
            setBalanceLoading(false)
        }
    }, [wallet])

    // ── Auto-connect on mount ─────────────────────────────────────────────────
    useEffect(() => {
        const checkExisting = async () => {
            const storedKey = localStorage.getItem('arbit_evm_private_key')
            if (storedKey && !wallet) {
                handleLocalConnect()
            }
        }
        checkExisting()
    }, [])

    // ── Auto-refresh balance ──────────────────────────────────────────────────
    useEffect(() => {
        if (wallet) {
            refreshBalance(wallet)
            const interval = setInterval(() => refreshBalance(wallet), 15000)
            return () => clearInterval(interval)
        }
    }, [wallet, refreshBalance])

    // ── Connect MetaMask ──────────────────────────────────────────────────────
    const handleMetaMaskConnect = async () => {
        clearError()
        setConnectLoading(true)
        try {
            const { signer, address: addr } = await connectMetaMask()
            setWallet(signer)
            setAddress(addr)
            setIsMetaMask(true)
            if (onWalletConnect) onWalletConnect(signer)
        } catch (e) {
            setError(e.message)
        } finally {
            setConnectLoading(false)
        }
    }

    // ── Connect Local Wallet ──────────────────────────────────────────────────
    const handleLocalConnect = async () => {
        clearError()
        setConnectLoading(true)
        try {
            const w = await initializeWallet()
            setWallet(w)
            setAddress(w.address)
            setIsMetaMask(false)
            if (onWalletConnect) onWalletConnect(w)
        } catch (e) {
            setError(e.message)
        } finally {
            setConnectLoading(false)
        }
    }

    // ── Disconnect ────────────────────────────────────────────────────────────
    const handleDisconnect = () => {
        disconnectWallet()
        setWallet(null)
        setAddress('')
        setBalance(null)
        setTxStatus('idle')
        if (onWalletConnect) onWalletConnect(null)
    }

    // ── Fund project ──────────────────────────────────────────────────────────
    const handleFund = async () => {
        clearError()
        const parsed = parseFloat(amount)
        if (!parsed || parsed <= 0) return setError('Enter a valid amount.')
        
        setSendLoading(true)
        setTxStatus('sending')

        try {
            // In HashKey Chain migration, we send funds to a placeholder project address
            const dummyProjectAddr = '0x000000000000000000000000000000000000dEaD'
            const hash = await fundProject(wallet, parsed, dummyProjectAddr)
            setTxId(hash)
            setTxStatus('success')
            if (onRealFund) onRealFund(parsed, hash)
            setTimeout(() => refreshBalance(), 3000)
        } catch (e) {
            setTxStatus('error')
            setError(e.message || 'Transaction failed.')
        } finally {
            setSendLoading(false)
        }
    }

    if (!wallet) {
        return (
            <div className="card-glass rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/30">
                        <span className="text-xl">🛡️</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">HashKey Wallet</h2>
                        <p className="text-slate-500 text-xs text-uppercase">HashKey Chain Testnet</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleMetaMaskConnect}
                        disabled={connectLoading}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {connectLoading ? <Spinner /> : 'Connect MetaMask'}
                    </button>
                    
                    <div className="text-center relative py-2">
                        <hr className="border-slate-800" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-[#0f1123] text-[10px] text-slate-600 font-bold">OR USE PRIVATE KEY</span>
                    </div>

                    <button
                        onClick={handleLocalConnect}
                        disabled={connectLoading}
                        className="w-full py-3.5 rounded-xl font-bold text-slate-300 border border-slate-700 bg-slate-400/5 hover:border-blue-500/50 transition-all"
                    >
                        {connectLoading ? 'Loading…' : 'Generate / Load Private Key'}
                    </button>
                </div>

                {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">{error}</div>}
            </div>
        )
    }

    return (
        <div className="card-glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30">
                    <span className="text-xl">🛡️</span>
                </div>
                <div>
                    <h2 className="text-white font-bold text-base">Connected Wallet</h2>
                    <p className="text-slate-500 text-xs">{isMetaMask ? 'MetaMask' : 'Local Wallet'}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    Live
                </div>
            </div>

            <div className="rounded-xl p-4 mb-4 bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Address</p>
                <p className="text-slate-300 text-xs font-mono break-all">{address}</p>
            </div>

            <div className="flex items-center justify-between rounded-xl p-4 mb-5 bg-blue-500/10 border border-blue-500/20">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">HSK Balance</p>
                    <p className="text-xl font-bold text-blue-400">
                        {balanceLoading ? '…' : balance?.toFixed(4) || '0.000'} <span className="text-xs">HSK</span>
                    </p>
                </div>
                <button onClick={() => refreshBalance()} className="p-2 bg-white/5 rounded-lg text-slate-400">
                    <RefreshCw size={14} className={balanceLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="space-y-3">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0 HSK"
                    className="input-web3 w-full"
                />
                <button
                    onClick={handleFund}
                    disabled={sendLoading || !amount}
                    className="w-full py-3.5 rounded-xl font-bold text-white gradient-btn-green flex items-center justify-center gap-2"
                >
                    {sendLoading ? <Spinner /> : 'Fund Project'}
                </button>
            </div>

            {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">{error}</div>}
            
            {txStatus === 'success' && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-emerald-400 text-xs font-bold mb-2">✓ Transaction Confirmed</p>
                    <a href={getExplorerUrl(txId)} target="_blank" rel="noreferrer" className="text-emerald-400 text-[10px] underline break-all opacity-80 hover:opacity-100">
                        {txId}
                    </a>
                </div>
            )}

            <button onClick={handleDisconnect} className="mt-5 text-slate-500 hover:text-red-400 text-xs transition-colors w-full text-center">
                Disconnect Wallet
            </button>
        </div>
    )
}

function RefreshCw({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
        </svg>
    )
}
