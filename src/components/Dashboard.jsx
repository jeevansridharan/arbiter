/**
 * Dashboard.jsx  —  Milestara Project Dashboard (Fully Database-Driven)
 *
 * This version uses useEffect to fetch the latest project data from Supabase,
 * ensuring that the "Raised Amount" and "Milestones" are always accurate
 * and persist across page navigation.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { fetchProjectById } from '../lib/db/projects'
import ProgressBar from './ProgressBar'
import MilestoneCard from './MilestoneCard'
import WalletPanel from './WalletPanel'
import GovernancePanel from './GovernancePanel'

// ── Spinner Helper ─────────────────────────────────────────────────────────
function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-400 font-medium animate-pulse">Synchronizing with blockchain...</p>
        </div>
    )
}

export default function Dashboard({ project: initialProject, onFund, onVote, onTransaction, onReset }) {
    // ── State ────────────────────────────────────────────────────────────────
    const [project, setProject] = useState(initialProject)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [connectedWallet, setConnectedWallet] = useState(null)

    // ── Fetch Logic ──────────────────────────────────────────────────────────

    /**
     * fetchProjectData()
     * 
     * Refetches the project from Supabase. This is the source of truth.
     * We call this on mount and after every transaction.
     */
    const fetchProjectData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true)
        console.log(`[Dashboard] 🔄 Fetching latest project data for ID: ${initialProject.id}`)

        try {
            const { data, error: fetchError } = await fetchProjectById(initialProject.id)
            if (fetchError) throw fetchError

            if (data) {
                console.log(`[Dashboard] ✓ Data fetched. Raised: ${data.raised_amount} BCH`)
                setProject(data)
            }
        } catch (err) {
            console.error('[Dashboard] Fetch error:', err.message)
            setError(err.message)
        } finally {
            if (!isSilent) setLoading(false)
        }
    }, [initialProject.id])

    // Load data on mount
    useEffect(() => {
        fetchProjectData()
    }, [fetchProjectData])

    // ── Handlers ──────────────────────────────────────────────────────────────

    /**
     * handleFundComplete()
     * 
     * Wrapper for the onFund prop.
     * After the parent handles the transaction and DB update, we refetch.
     */
    const handleFundComplete = async (amount, txHash) => {
        console.log(`[Dashboard] Funding complete. Refreshing UI...`)
        // 1. Notify parent (which records tx and updates DB)
        if (onFund) await onFund(amount, txHash)

        // 2. Refresh local data from DB to reflect the new raised_amount
        await fetchProjectData(true)
    }

    const handleGovApproval = useCallback((milestoneId) => {
        if (onVote) onVote(milestoneId, 'yes')
    }, [onVote])

    // ── Derived Values ────────────────────────────────────────────────────────

    // Support both Supabase and fallback naming
    const title = project?.title ?? 'Untitled Project'
    const description = project?.description ?? ''
    const fundingTarget = parseFloat(project?.goal_amount ?? project?.fundingTarget ?? 0)
    const fundedAmount = parseFloat(project?.raised_amount ?? project?.fundedAmount ?? 0)
    const milestones = Array.isArray(project?.milestones) ? project.milestones : []
    const approvedCount = milestones.filter(m => m.status === 'Approved' || m.status === 'approved').length

    // ── Render Logic ──────────────────────────────────────────────────────────

    if (loading && !project) return <LoadingSpinner />

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold"
                        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 5px rgba(52,211,153,0.9)' }} />
                        Live Dashboard · Chipnet
                    </div>
                    <h1 className="text-3xl font-bold text-white">{title}</h1>
                </div>
                <button
                    id="reset-project-btn"
                    onClick={onReset}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    ← All Projects
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    ⚠️ Error updating project data: {error}
                </div>
            )}

            {/* ── Stats Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card-glass rounded-2xl p-5">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Target</p>
                    <p className="text-2xl font-bold text-white">{fundingTarget.toFixed(2)}</p>
                    <p className="text-emerald-400 text-sm font-semibold mt-0.5">BCH</p>
                </div>
                <div className="card-glass rounded-2xl p-5 glow-green relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Raised</p>
                    <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{fundedAmount.toFixed(8)}</p>
                    <p className="text-emerald-400 text-sm font-semibold mt-0.5">BCH</p>
                </div>
                <div className="card-glass rounded-2xl p-5">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Milestones</p>
                    <p className="text-2xl font-bold text-white">{approvedCount}/{milestones.length}</p>
                    <p className="text-cyan-400 text-sm font-semibold mt-0.5">Approved</p>
                </div>
            </div>

            {/* ── Project info + progress ────────────────────────────────────── */}
            <div className="card-glass rounded-2xl p-8 mb-6">
                <div className="mb-6">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">About</h2>
                    <p className="text-slate-300 leading-relaxed">{description}</p>
                </div>
                <hr className="section-divider" />
                <ProgressBar current={fundedAmount} target={fundingTarget} />
                <p className="text-[10px] text-slate-500 mt-3 text-center italic">
                    All data fetched live from Supabase PostgreSQL
                </p>
            </div>

            {/* ── Wallet Panel ───────────────────────────────────── */}
            <WalletPanel
                onRealFund={handleFundComplete}
                onWalletConnect={setConnectedWallet}
            />

            {/* ── Governance + Milestone Locking Panel ──────────────── */}
            <GovernancePanel
                wallet={connectedWallet}
                milestones={milestones}
                onMilestoneApproved={handleGovApproval}
                onTransaction={async (amt, hash, type) => {
                    if (onTransaction) await onTransaction(amt, hash, type)
                    await fetchProjectData(true)
                }}
            />

            {/* ── Milestones Section ────────────────────────────────────────── */}
            <div className="card-glass rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Milestones</h2>
                        <p className="text-slate-500 text-sm mt-0.5">Vote to approve or reject each milestone</p>
                    </div>
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}
                    >
                        {approvedCount}/{milestones.length} done
                    </div>
                </div>

                <div className="space-y-4">
                    {milestones.length > 0 ? (
                        milestones.map((milestone, index) => (
                            <MilestoneCard
                                key={milestone.id}
                                milestone={milestone}
                                index={index}
                                onVote={async (id, type) => {
                                    if (onVote) await onVote(id, type)
                                    await fetchProjectData(true)
                                }}
                            />
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-4">No milestones defined for this project.</p>
                    )}
                </div>

                {approvedCount === milestones.length && milestones.length > 0 && (
                    <div
                        className="mt-6 p-4 rounded-xl text-center"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                        <p className="text-emerald-400 font-bold text-lg">🎉 All milestones approved!</p>
                        <p className="text-slate-400 text-sm mt-1">The project is governance-complete.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
