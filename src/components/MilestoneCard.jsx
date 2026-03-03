import React from 'react'

export default function MilestoneCard({ milestone, index, onVote }) {
    const { title, status, approved } = milestone

    // Source of Truth: On-Chain vs Database
    // If onChainVotes exists (from a scan), we prioritize it as it represents real governance power.
    const isOnChain = !!milestone.onChainVotes
    const votes = milestone.onChainVotes ?? milestone.votes ?? { yes: milestone.voteYes ?? 0, no: milestone.voteNo ?? 0 }

    // Approved if: DB flag set, status string says so, or vote tally says so
    const totalVotes = (votes.yes ?? 0) + (votes.no ?? 0)
    const isApproved =
        approved === true ||
        status === 'Approved' || status === 'approved' ||
        (totalVotes > 0 && (votes.yes ?? 0) / totalVotes > 0.5)

    const yesPercent = totalVotes > 0 ? Math.round(((votes.yes ?? 0) / totalVotes) * 100) : 0
    const noPercent = totalVotes > 0 ? Math.round(((votes.no ?? 0) / totalVotes) * 100) : 0

    return (
        <div className={`milestone-card p-5 ${isApproved ? 'milestone-approved' : ''}`}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1">
                    {/* Index badge */}
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                        style={{
                            background: isApproved
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(52,211,153,0.15)',
                            color: isApproved ? '#10b981' : '#34d399',
                        }}
                    >
                        {isApproved ? '✓' : index + 1}
                    </div>
                    {/* Title */}
                    <div>
                        <h3 className="text-white font-semibold text-sm">{title}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">
                            {totalVotes === 0
                                ? 'No votes cast yet'
                                : `${totalVotes.toLocaleString()} ${isOnChain ? 'Tokens' : 'Votes'} cast`}
                        </p>
                    </div>
                </div>
                {/* Status badge */}
                <span className={isApproved ? 'badge-approved' : 'badge-pending'}>
                    {isApproved ? '✓ Approved' : '⏳ Pending'}
                </span>
            </div>

            {/* Vote bar */}
            {totalVotes > 0 && (
                <div className="mb-4">
                    <div className="flex rounded-full overflow-hidden h-2 mb-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${yesPercent}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}
                        />
                        <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${noPercent}%`, background: 'linear-gradient(90deg, #be123c, #e11d48)' }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span className="text-emerald-400 font-medium">Yes {yesPercent}%</span>
                        <span className="text-rose-400 font-medium">No {noPercent}%</span>
                    </div>
                </div>
            )}

            {/* Vote buttons row */}
            <div className="flex items-center gap-3">
                <button
                    id={`vote-yes-${index}`}
                    onClick={() => onVote(milestone.id, 'yes')}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', cursor: 'pointer' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 10l5-5 5 5M7 15l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Yes
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        {votes.yes}
                    </span>
                </button>

                <button
                    id={`vote-no-${index}`}
                    onClick={() => onVote(milestone.id, 'no')}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: 'none', cursor: 'pointer' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 9l5 5 5-5M7 14l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    No
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        {votes.no.toLocaleString()}
                    </span>
                </button>
            </div>
            {isOnChain && (
                <p className="text-[10px] text-emerald-500/60 mt-3 text-center font-semibold tracking-tight">
                    🔒 SECURED BY ON-CHAIN CASHTOKENS
                </p>
            )}
        </div>
    )
}
