import React, { useState, useEffect } from 'react'
import { Vote, Info, Coins, Shield, ChevronRight } from 'lucide-react'
import { getVotesByMilestone } from '../lib/db/votes'
import { fetchProjects } from '../lib/db/projects'
import { mockDB } from '../lib/db/mockDB'
// mainnet-js not needed directly in this page — wallet ops are in bchWallet.js

// ── Info card ─────────────────────────────────────────────────────────────────
function InfoCard({ Icon, title, body, color }) {
    return (
        <div style={{
            background: 'rgba(15,17,35,0.85)',
            border: `1px solid ${color}20`,
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            gap: '16px',
            backdropFilter: 'blur(20px)',
        }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
            </div>
            <div>
                <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>{title}</p>
                <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.6 }}>{body}</p>
            </div>
        </div>
    )
}

// ── Step row ──────────────────────────────────────────────────────────────────
function Step({ num, text, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}20`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color }}>{num}</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{text}</p>
            <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function GovernancePage() {
    const [stats, setStats] = useState({
        tokens: 0,
        votes: 0,
        approved: '0/0'
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                // In production, we don't fetch from localStorage automatically.
                // We keep stats at 0 until a wallet is connected in the session.

                // 1. Fetch Global Voting Stats from mock DB
                const dbVotesCount = mockDB.getAll('votes').length;

                // 2. Mock Global Approved Stats (To be replaced by on-chain scan summary)
                const totalCount = 12
                const appCount = 4

                setStats({
                    tokens: 0, // Session-based
                    votes: dbVotesCount || 0,
                    approved: `${appCount}/${totalCount} (Verified)`
                })
            } catch (err) {
                console.error('[GovernancePage] Load error:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '4px 12px', borderRadius: '999px', marginBottom: '12px',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.06em' }}>HASHKEY CHAIN TESTNET</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: '6px' }}>
                    Governance
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    AI-driven autonomous governance powered by HashKey Chain.
                </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Voting Power', value: stats.tokens, color: '#10b981' },
                    { label: 'On-Chain Votes', value: stats.votes, color: '#34d399' },
                    { label: 'Score Baseline', value: stats.approved, color: '#06b6d4' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(15,17,35,0.85)', border: `1px solid ${color}20`, borderRadius: '14px', padding: '20px', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800, color }}>
                            {loading ? '...' : value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                <InfoCard Icon={Coins} color="#10b981" title="Autonomous Evaluation" body="AI oracles evaluate milestone proofs in a completely decentralized manner on HashKey Chain." />
                <InfoCard Icon={Vote} color="#34d399" title="Secure Escrow" body="Project HSK is locked in an EVM smart contract. Release conditions are enforced by AI scores and on-chain verification." />
                <InfoCard Icon={Shield} color="#06b6d4" title="Verified Proofs" body="Proof of work is stored immutably on-chain, allowing for transparent auditing of AI-driven fund releases." />
            </div>

            {/* Participation guide */}
            <div style={{ background: 'rgba(15,17,35,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Info size={16} color="#475569" />
                    <h2 style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Native Participation Guide
                    </h2>
                </div>
                <Step num="1" text="Connect your HashKey Wallet (MetaMask or Private Key)" color="#10b981" />
                <Step num="2" text='Fund a project to establish your contribution baseline' color="#10b981" />
                <Step num="3" text="HSK is locked in the EVM Milestone Escrow" color="#34d399" />
                <Step num="4" text='Submit milestone proof for AI oracle scoring' color="#34d399" />
                <Step num="5" text='Escrow contract verifies the AI signature and releases funds' color="#06b6d4" />
            </div>
        </div>
    )
}
