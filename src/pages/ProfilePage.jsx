/**
 * pages/ProfilePage.jsx
 * Wallet identity + account overview (Non-Custodial Refactor)
 */

import React, { useState, useEffect } from 'react'
import { Copy, CheckCircle, Wallet, Shield, ExternalLink, LogOut } from 'lucide-react'
import { initializeWallet, getBalance, disconnectWallet } from '../services/bchWallet'
import { getLockedAmount } from '../services/milestoneContract'

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono = false, color = '#94a3b8' }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: '0.82rem', color, fontWeight: 700, fontFamily: mono ? 'monospace' : 'inherit', maxWidth: '260px', wordBreak: 'break-all', textAlign: 'right' }}>
                {value}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const [address, setAddress] = useState('')
    const [copied, setCopied] = useState(false)
    const [balance, setBalance] = useState(0)
    const [tokens, setTokens] = useState(0)
    const [locked, setLocked] = useState(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadConnectedWallet = async () => {
            const storedWif = localStorage.getItem('milestara_chipnet_wif')
            if (storedWif) {
                setLoading(true)
                try {
                    const wallet = await initializeWallet(storedWif)
                    setAddress(wallet.cashaddr)
                    const bal = await getBalance(wallet)
                    setBalance(bal)
                    // If your wallet object carries tokens, you can set them here
                    // setTokens(wallet.tokens ? Number(wallet.tokens) : 0)
                } catch (err) {
                    console.error('[ProfilePage] Failed to reconnect wallet:', err)
                } finally {
                    setLoading(false)
                }
            }
            setLocked(getLockedAmount())
        }
        loadConnectedWallet()
    }, [])

    const handleCopy = () => {
        if (!address) return
        navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDisconnect = () => {
        disconnectWallet()
        setAddress('')
        setTokens(0)
        setLocked(0)
        // Clear session
        window.location.reload()
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: '6px' }}>
                    Profile
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your non-custodial wallet identity</p>
            </div>

            {/* Wallet card */}
            <div style={{ background: 'rgba(15,17,35,0.85)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '28px', backdropFilter: 'blur(20px)', marginBottom: '20px' }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(16,185,129,0.4)' }}>
                        <Wallet size={26} color="white" />
                    </div>
                    <div>
                        <p style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem' }}>BCH Wallet</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: address ? '#10b981' : '#475569', boxShadow: address ? '0 0 6px rgba(16,185,129,0.8)' : 'none' }} />
                            <span style={{ fontSize: '0.75rem', color: address ? '#10b981' : '#475569', fontWeight: 600 }}>
                                {address ? 'Active Session · Chipnet' : 'Session Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details */}
                {address ? (
                    <>
                        <InfoRow label="Wallet Address" value={address} mono color="#10b981" />
                        <InfoRow label="BCH Balance" value={`${balance.toFixed(8)} BCH`} color="#10b981" />
                        <InfoRow label="Network" value="Bitcoin Cash Chipnet (Testnet)" color="#34d399" />
                        <InfoRow label="Session GOV Tokens" value={`${tokens} tokens`} color="#10b981" />
                        <InfoRow label="Locked BCH" value={`${locked.toFixed(8)} BCH`} color="#34d399" />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={handleCopy}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                                    border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.25)',
                                    color: copied ? '#10b981' : '#34d399', fontWeight: 700, fontSize: '0.82rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s',
                                }}
                            >
                                {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Address</>}
                            </button>
                            <a
                                href={`https://chipnet.imaginary.cash/address/${address}`}
                                target="_blank" rel="noreferrer"
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                                    background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
                                    color: '#06b6d4', fontWeight: 700, fontSize: '0.82rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    textDecoration: 'none', transition: 'all 0.2s',
                                }}
                            >
                                <ExternalLink size={14} /> View on Explorer
                            </a>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '16px' }}>
                            Go to <strong style={{ color: '#10b981' }}>Projects</strong> and connect your wallet to see your profile details.
                        </p>
                    </div>
                )}
            </div>

            {/* Security card */}
            <div style={{ background: 'rgba(15,17,35,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Shield size={16} color="#fbbf24" />
                    <h2 style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Security Protocol
                    </h2>
                </div>
                {[
                    'Non-Custodial: Your private keys are stored securely in your browser\'s local storage.',
                    'Persistent: Your wallet stays active across page refreshes and browser restarts.',
                    'This is a TESTNET wallet. Do not send real BCH to these addresses.',
                    'Identity Persistence: To remove the wallet, you must click the Disconnect button.',
                ].map((note, i) => (
                    <p key={i} style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.7 }}>• {note}</p>
                ))}
            </div>

            {/* Disconnect */}
            {address && (
                <button
                    onClick={handleDisconnect}
                    style={{
                        width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer',
                        background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.2)',
                        color: '#f87171', fontWeight: 700, fontSize: '0.875rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                    }}
                >
                    <LogOut size={16} /> Disconnect &amp; Remove Wallet
                </button>
            )}
        </div>
    )
}
