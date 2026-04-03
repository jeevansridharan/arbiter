import React from 'react'
import { Brain, CheckCircle, XCircle, Clock } from 'lucide-react'

// ── AI Status badge helper ────────────────────────────────────────────────────
function AIStatusBadge({ score, isScored }) {
    if (!isScored) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                borderRadius: '999px', whiteSpace: 'nowrap',
                background: 'rgba(234,179,8,0.12)',
                border: '1px solid rgba(234,179,8,0.3)',
                color: '#fbbf24',
            }}>
                <Clock size={11} /> Pending AI Evaluation
            </span>
        )
    }
    if (score >= 60) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                borderRadius: '999px', whiteSpace: 'nowrap',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399',
            }}>
                <CheckCircle size={11} /> AI Approved
            </span>
        )
    }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
            borderRadius: '999px', whiteSpace: 'nowrap',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
        }}>
            <XCircle size={11} /> AI Rejected
        </span>
    )
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>AI SCORE</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{score} / 100</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: '999px', width: `${score}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MilestoneCard({ milestone, index }) {
    const { title, approved, score } = milestone

    // Resolve score and approval state
    const aiScore   = typeof score === 'number' ? score : (approved === true ? 80 : 0)
    const isScored  = typeof score === 'number' || approved === true
    const isApproved = approved === true || (isScored && aiScore >= 60)

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
                            {isScored
                                ? `AI evaluated — score ${aiScore}/100`
                                : 'Awaiting AI evaluation'}
                        </p>
                    </div>
                </div>
                {/* AI Status badge */}
                <AIStatusBadge score={aiScore} isScored={isScored} />
            </div>

            {/* Score bar (only if scored) */}
            {isScored && <ScoreBar score={aiScore} />}

            {/* AI evaluation note */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '10px',
                background: isApproved
                    ? 'rgba(16,185,129,0.07)'
                    : isScored
                        ? 'rgba(239,68,68,0.06)'
                        : 'rgba(234,179,8,0.06)',
                border: isApproved
                    ? '1px solid rgba(16,185,129,0.2)'
                    : isScored
                        ? '1px solid rgba(239,68,68,0.2)'
                        : '1px solid rgba(234,179,8,0.2)',
            }}>
                <Brain size={14} color={isApproved ? '#10b981' : isScored ? '#f87171' : '#fbbf24'} />
                <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: isApproved ? '#34d399' : isScored ? '#f87171' : '#fbbf24',
                }}>
                    {isApproved
                        ? 'AI Approved — funds will be released automatically'
                        : isScored
                            ? 'AI Rejected — score below threshold'
                            : 'Pending AI Evaluation — submit proof to trigger scoring'}
                </span>
            </div>

            {isApproved && (
                <p className="text-[10px] text-emerald-500/60 mt-3 text-center font-semibold tracking-tight">
                    🤖 SECURED BY AI ORACLE · HASHKEY CHAIN
                </p>
            )}
        </div>
    )
}
