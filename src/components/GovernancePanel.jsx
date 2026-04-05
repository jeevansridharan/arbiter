/**
 * GovernancePanel.jsx — Arbit EVM Governance UI (HashKey Chain)
 * Migrated from BCH/CashTokens to EVM (HSK) and Mock AI Governance.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { getBalance } from '../services/evmWallet'
import { mockDB } from '../lib/db/mockDB'

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

// ── Vote Bar ──────────────────────────────────────────────────────────────────
function VoteBar({ yes, no }) {
    const total = yes + no
    const yesP = total > 0 ? Math.round((yes / total) * 100) : 0
    const noP = total > 0 ? Math.round((no / total) * 100) : 0
    return (
        <div className="mb-3">
            <div className="flex rounded-full overflow-hidden h-2 mb-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full transition-all duration-700" style={{ width: `${yesP}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                <div className="h-full transition-all duration-700" style={{ width: `${noP}%`, background: 'linear-gradient(90deg, #be123c, #e11d48)' }} />
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-emerald-400 font-bold">✓ YES {yesP}% ({yes} votes)</span>
                <span className="text-rose-400 font-bold">✗ NO {noP}% ({no} votes)</span>
            </div>
        </div>
    )
}

export default function GovernancePanel({ wallet, projectId, milestones = [], onMilestoneApproved, onTransaction }) {
    const [tokenBal, setTokenBal] = useState(0)
    const [lockedHsk, setLockedHsk] = useState(0)
    const [voteLoading, setVoteLoading] = useState(null)
    const [error, setError] = useState('')
    const [milestoneVotes, setMilestoneVotes] = useState({})

    const refreshState = useCallback(async () => {
        if (!wallet) return
        
        // 1. Balance from EVM Wallet
        const addr = wallet.address || (await wallet.getAddress())
        const bal = await getBalance(addr)
        setTokenBal(Math.floor(bal * 100)) // Simulation: 1 HSK = 100 Voting Power

        // 2. Fetch locked amount (Simulated from localStorage via mockDB logic)
        const transactions = mockDB.getAll('transactions')
        const locked = transactions
            .filter(tx => tx.project_id === projectId && tx.type === 'funding')
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
        setLockedHsk(locked)

        // 3. Fetch votes from mockDB
        const votes = {}
        milestones.forEach(m => {
            const mVotes = mockDB.getAll('votes').filter(v => v.milestone_id === m.id)
            votes[m.id] = {
                yes: mVotes.filter(v => v.vote === 'yes').length,
                no: mVotes.filter(v => v.vote === 'no').length
            }
        })
        setMilestoneVotes(votes)
    }, [wallet, projectId, milestones])

    useEffect(() => {
        refreshState()
    }, [refreshState])

    if (!wallet) {
        return (
            <div className="card-glass rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-xl">🗳️</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">EVM Governance</h2>
                        <p className="text-slate-500 text-xs">Unlock with HashKey Wallet</p>
                    </div>
                </div>
            </div>
        )
    }

    const handleVote = async (milestoneId, voteType) => {
        setVoteLoading(milestoneId + voteType)
        try {
            // Record vote in mockDB
            mockDB.insert('votes', {
                milestone_id: milestoneId,
                voter: address,
                vote: voteType,
                created_at: new Date().toISOString()
            })
            
            // Artificial delay for UX
            await new Promise(r => setTimeout(r, 800))
            refreshState()
        } catch (e) {
            setError(e.message)
        } finally {
            setVoteLoading(null)
        }
    }

    return (
        <div className="mb-6 space-y-4">
            <div className="card-glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-xl">🗳️</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">HashKey Governance</h2>
                        <p className="text-slate-500 text-xs">Voting Power derived from HSK balance</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Voting Power</p>
                        <p className="text-2xl font-bold text-emerald-400">{tokenBal}</p>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Locked HSK</p>
                        <p className="text-2xl font-bold text-blue-400">{lockedHsk.toFixed(4)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {milestones.map((m, i) => {
                        const votes = milestoneVotes[m.id] || { yes: 0, no: 0 }
                        return (
                            <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white font-semibold text-sm">Milestone #{i+1}: {m.title}</span>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">ACTIVE</span>
                                </div>
                                <VoteBar yes={votes.yes} no={votes.no} />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleVote(m.id, 'yes')}
                                        disabled={voteLoading}
                                        className="flex-1 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {voteLoading === m.id + 'yes' ? <Spinner /> : 'YES'}
                                    </button>
                                    <button
                                        onClick={() => handleVote(m.id, 'no')}
                                        disabled={voteLoading}
                                        className="flex-1 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {voteLoading === m.id + 'no' ? <Spinner /> : 'NO'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
        </div>
    )
}
