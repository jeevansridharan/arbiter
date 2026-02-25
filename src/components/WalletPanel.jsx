/**
 * WalletPanel.jsx
 *
 * Handles the full wallet UX for Chipnet:
 *  - Connect / Generate Chipnet wallet
 *  - Display address + live balance
 *  - Fund project form (amount input + send button)
 *  - Transaction hash display + explorer link
 */

import React, { useState, useCallback } from 'react'
import {
    createOrLoadWallet,
    getBalance,
    fundProject,
    disconnectWallet,
    getExplorerUrl,
    shortenAddress,
    PROJECT_ADDRESS,
} from '../services/bchWallet'
import { QRCodeCanvas } from 'qrcode.react'

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
    const [wallet, setWallet] = useState(null)   // mainnet-js wallet object
    const [address, setAddress] = useState('')
    const [balance, setBalance] = useState(null)   // BCH number or null
    const [amount, setAmount] = useState('')     // user-typed BCH amount
    const [txId, setTxId] = useState('')     // successful tx hash
    const [error, setError] = useState('')
    const [connectLoading, setConnectLoading] = useState(false)
    const [balanceLoading, setBalanceLoading] = useState(false)
    const [sendLoading, setSendLoading] = useState(false)
    const [txStatus, setTxStatus] = useState('idle') // 'idle'|'sending'|'success'|'error'
    const [showQr, setShowQr] = useState(false)

    // ── Helpers ───────────────────────────────────────────────────────────────
    const clearError = () => setError('')

    const refreshBalance = useCallback(async (w) => {
        if (!w && !wallet) return
        setBalanceLoading(true)
        try {
            const bal = await getBalance(w ?? wallet)
            setBalance(bal)
        } catch (e) {
            setError('Could not fetch balance. Check Chipnet connection.')
        } finally {
            setBalanceLoading(false)
        }
    }, [wallet])

    // ── Connect wallet ────────────────────────────────────────────────────────
    const handleConnect = async () => {
        clearError()
        setConnectLoading(true)
        try {
            const w = await createOrLoadWallet()
            setWallet(w)
            setAddress(w.cashaddr)
            await refreshBalance(w)
            if (onWalletConnect) onWalletConnect(w)
        } catch (e) {
            console.error(e)
            setError('Failed to create wallet: ' + e.message)
        } finally {
            setConnectLoading(false)
        }
    }

    // ── Disconnect wallet ─────────────────────────────────────────────────────
    const handleDisconnect = () => {
        disconnectWallet()
        setWallet(null)
        setAddress('')
        setBalance(null)
        setAmount('')
        setTxId('')
        setTxStatus('idle')
        clearError()
        if (onWalletConnect) onWalletConnect(null)
    }

    // ── Fund project ──────────────────────────────────────────────────────────
    const handleFund = async () => {
        clearError()
        const parsed = parseFloat(amount)
        if (!parsed || parsed <= 0) {
            setError('Enter a valid BCH amount greater than 0.')
            return
        }
        if (balance !== null && parsed > balance) {
            setError(`Insufficient balance. You have ${balance.toFixed(8)} BCH.`)
            return
        }

        setSendLoading(true)
        setTxStatus('sending')
        setTxId('')

        try {
            const hash = await fundProject(wallet, parsed)
            setTxId(hash)
            setTxStatus('success')
            if (onRealFund) onRealFund(parsed, hash)
            await refreshBalance()
        } catch (e) {
            console.error(e)
            setTxStatus('error')
            setError(e.message || 'Transaction failed.')
        } finally {
            setSendLoading(false)
        }
    }

    // ── Copy address ──────────────────────────────────────────────────────────
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!wallet) {
        return (
            <div className="card-glass rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L3 12L12 22L21 12L12 2Z" stroke="#10b981" strokeWidth="2" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">Bitcoin Cash Wallet</h2>
                        <p className="text-slate-500 text-xs">Chipnet (Testnet)</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.2)', color: '#94a3b8' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                        Not connected
                    </div>
                </div>

                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                    Connect a Chipnet wallet to send BCH test transactions to the project address.
                    A new wallet is auto-generated and saved in your browser.
                </p>

                <button
                    id="connect-wallet-btn"
                    onClick={handleConnect}
                    disabled={connectLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white gradient-btn-green flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {connectLoading ? (
                        <><Spinner /> Generating Chipnet Wallet…</>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 12L12 22L21 12L12 2Z" stroke="currentColor" strokeWidth="2" /></svg>
                            Connect Wallet
                        </>
                    )}
                </button>

                {error && <ErrorBox message={error} onClose={clearError} />}
            </div>
        )
    }

    return (
        <div className="card-glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L3 12L12 22L21 12L12 2Z" stroke="#10b981" strokeWidth="2" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-white font-bold text-base">Bitcoin Cash Wallet</h2>
                    <p className="text-slate-500 text-xs">Chipnet (Testnet)</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 5px rgba(52,211,153,0.9)' }}></div>
                    Connected
                </div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Chipnet Address</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowQr(!showQr)}
                            className="text-xs font-medium transition-colors px-2 py-0.5 rounded-md"
                            style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}
                        >
                            {showQr ? 'Close QR' : 'Show QR'}
                        </button>
                        <button
                            onClick={handleCopy}
                            className="text-xs font-medium transition-colors px-2 py-0.5 rounded-md"
                            style={{ color: copied ? '#10b981' : '#34d399', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)' }}
                        >
                            {copied ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
                <p className="text-slate-300 text-sm font-mono break-all leading-relaxed">{address}</p>

                {showQr && (
                    <div className="mt-4 p-4 bg-white rounded-xl flex flex-col items-center gap-3">
                        <QRCodeCanvas
                            value={address}
                            size={180}
                            level="H"
                            includeMargin={true}
                            imageSettings={{
                                src: "https://cryptologos.cc/logos/bitcoin-cash-bch-logo.svg",
                                x: undefined,
                                y: undefined,
                                height: 30,
                                width: 30,
                                excavate: true,
                            }}
                        />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
                            Scan with Paytaca, Zapit, or Cashonize
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a href="https://cashonize.com" target="_blank" rel="noreferrer" title="Cashonize">
                                <img src="https://cashonize.com/favicon.ico" className="w-6 h-6 rounded-full grayscale hover:grayscale-0 transition-all" alt="Cashonize" />
                            </a>
                            <a href="https://paytaca.com" target="_blank" rel="noreferrer" title="Paytaca">
                                <img src="https://www.paytaca.com/img/favicon.png" className="w-6 h-6 rounded-md grayscale hover:grayscale-0 transition-all" alt="Paytaca" />
                            </a>
                            <a href="https://zapit.io" target="_blank" rel="noreferrer" title="Zapit">
                                <img src="https://www.zapit.io/favicon.ico" className="w-6 h-6 rounded-md grayscale hover:grayscale-0 transition-all" alt="Zapit" />
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between rounded-xl p-4 mb-5" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Balance</p>
                    {balanceLoading ? (
                        <div className="flex items-center gap-2 text-slate-400"><Spinner /> Fetching…</div>
                    ) : balance !== null ? (
                        <p className="text-xl font-bold" style={{ color: '#34d399' }}>
                            {balance.toFixed(8)} <span className="text-sm font-semibold text-emerald-400">BCH</span>
                        </p>
                    ) : (
                        <p className="text-slate-500 text-sm">Unknown</p>
                    )}
                </div>
                <button
                    id="refresh-balance-btn"
                    onClick={() => refreshBalance()}
                    disabled={balanceLoading}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg disabled:opacity-40"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                    title="Refresh balance"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={balanceLoading ? 'animate-spin' : ''}>
                        <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {balance !== null && balance === 0 && (
                <div className="rounded-xl p-3 mb-4 flex items-start gap-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                        <p className="text-yellow-400 text-xs font-semibold mb-2">Your balance is zero — get free Chipnet BCH!</p>
                        <div className="flex flex-col gap-1.5">
                            <a href="https://faucet.paytaca.com" target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-lg transition-all"
                                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                                <span>🟡</span>
                                <span>faucet.paytaca.com</span>
                                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓ LIVE</span>
                            </a>
                            <a href="https://tbch.googol.cash" target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-lg transition-all"
                                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                                <span>⚡</span>
                                <span>tbch.googol.cash</span>
                                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓ LIVE</span>
                            </a>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-2">Paste your address → request coins → wait ~1 min ✓</p>
                    </div>
                </div>
            )}

            <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sending to Project</p>
                <p className="text-emerald-300 text-xs font-mono break-all">
                    {PROJECT_ADDRESS}
                </p>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <input
                        id="fund-amount-input"
                        type="number"
                        min="0.0001"
                        step="0.001"
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); clearError(); setTxStatus('idle'); setTxId('') }}
                        placeholder="0.0100"
                        className="input-web3 pr-16"
                        disabled={sendLoading}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#10b981' }}>BCH</span>
                </div>

                <div className="flex gap-2">
                    {['0.001', '0.005', '0.01', '0.05'].map((v) => (
                        <button
                            key={v}
                            onClick={() => { setAmount(v); clearError(); setTxStatus('idle'); setTxId('') }}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <button
                    id="fund-project-btn"
                    onClick={handleFund}
                    disabled={sendLoading || !amount}
                    className="w-full py-3.5 rounded-xl font-bold text-white gradient-btn-green flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {sendLoading ? (
                        <><Spinner /> Broadcasting Transaction…</>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Fund Project on Chipnet
                        </>
                    )}
                </button>
            </div>

            {error && <ErrorBox message={error} onClose={clearError} />}

            {txStatus === 'success' && txId && (
                <TxSuccess txId={txId} amount={amount} />
            )}

            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    id="disconnect-wallet-btn"
                    onClick={handleDisconnect}
                    className="text-slate-500 hover:text-slate-400 text-xs font-medium transition-colors"
                >
                    Disconnect & clear wallet
                </button>
            </div>
        </div>
    )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ErrorBox({ message, onClose }) {
    return (
        <div className="mt-4 p-3 rounded-xl flex items-start gap-3" style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)' }}>
            <span className="text-rose-400 mt-0.5">⚠</span>
            <p className="text-rose-300 text-sm flex-1">{message}</p>
            <button onClick={onClose} className="text-rose-400 hover:text-rose-200 text-lg leading-none">×</button>
        </div>
    )
}

function TxSuccess({ txId, amount }) {
    const url = getExplorerUrl(txId)
    return (
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span className="text-emerald-400 font-bold text-sm">Transaction Sent!</span>
                <span className="text-slate-400 text-xs ml-auto">{parseFloat(amount).toFixed(8)} BCH</span>
            </div>
            <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Transaction Hash</p>
            <p className="text-slate-300 text-xs font-mono break-all mb-3">{txId}</p>
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                id="view-tx-explorer-link"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
            >
                View on Explorer
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
        </div>
    )
}
