/**
 * MilestoneCard.jsx — Per-milestone AI evaluation (Arbit)
 *
 * Each card exposes:
 *   • Proof textarea  — what the creator submits
 *   • "Evaluate with AI" button
 *   • Score bar (animated)
 *   • Status badge: Pending / AI Passed / Funds Released / Rejected
 *
 * Props:
 *   milestone      — { id, title, description?, amount?, score, status, proof, reason?, tx_hash? }
 *   index          — display number
 *   onEvaluate     — async (milestoneId, proof) => void  (provided by Dashboard)
 *   onReleaseFunds — async (milestoneId) => string txHash  (provided by Dashboard)
 *   noOnChainId    — boolean: project was not created on-chain, disable release
 *   walletConnected — boolean: whether a wallet is currently connected
 */
import React, { useState } from 'react'
import { Brain, CheckCircle, XCircle, Clock, Loader2, Send, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { getExplorerUrl } from '../services/evmWallet'

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    if (status === 'approved') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                borderRadius: '999px', whiteSpace: 'nowrap',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399',
            }}>
                <CheckCircle size={11} /> Funds Released
            </span>
        )
    }
    if (status === 'ai_passed') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                borderRadius: '999px', whiteSpace: 'nowrap',
                background: 'rgba(20,184,166,0.12)',
                border: '1px solid rgba(20,184,166,0.35)',
                color: '#2dd4bf',
            }}>
                <Zap size={11} /> AI Passed
            </span>
        )
    }
    if (status === 'rejected') {
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
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
            borderRadius: '999px', whiteSpace: 'nowrap',
            background: 'rgba(234,179,8,0.12)',
            border: '1px solid rgba(234,179,8,0.3)',
            color: '#fbbf24',
        }}>
            <Clock size={11} /> Pending
        </span>
    )
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
    const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'
    return (
        <div style={{ margin: '14px 0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Score</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{score} / 100</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: '999px', width: `${score}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: `0 0 10px ${color}80`,
                }} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MilestoneCard({ milestone, index, onEvaluate, onReleaseFunds, noOnChainId, walletConnected }) {
    const { id, title, description, score, status, amount, reason, tx_hash } = milestone

    // Local state
    const [proof, setProof]           = useState(milestone.proof ?? '')
    const [evaluating, setEvaluating] = useState(false)
    const [evalError, setEvalError]   = useState('')
    const [expanded, setExpanded]     = useState(status === 'pending')
    const [releasing, setReleasing]   = useState(false)
    const [releaseError, setReleaseError] = useState('')

    const isApproved = status === 'approved'
    const isAIPassed = status === 'ai_passed'
    const isRejected = status === 'rejected'
    const isScored   = typeof score === 'number'

    // Border glow per status
    const borderColor = isApproved
        ? 'rgba(16,185,129,0.35)'
        : isAIPassed
            ? 'rgba(20,184,166,0.3)'
            : isRejected
                ? 'rgba(239,68,68,0.25)'
                : 'rgba(255,255,255,0.06)'

    const cardBg = isApproved
        ? 'rgba(16,185,129,0.04)'
        : isAIPassed
            ? 'rgba(20,184,166,0.03)'
            : isRejected
                ? 'rgba(239,68,68,0.03)'
                : 'rgba(15,17,35,0.7)'

    // ── Evaluate handler ──────────────────────────────────────────────────────
    const handleEvaluate = async () => {
        if (!proof.trim()) {
            setEvalError('Please describe your proof before evaluating.')
            return
        }
        setEvaluating(true)
        setEvalError('')
        setReleaseError('')
        try {
            await onEvaluate(id, proof)
        } catch (e) {
            setEvalError(e.message || 'Evaluation failed. Is the backend running?')
        } finally {
            setEvaluating(false)
        }
    }

    // ── Release funds handler ─────────────────────────────────────────────────
    const handleRelease = async () => {
        setReleasing(true)
        setReleaseError('')
        try {
            await onReleaseFunds(id)
        } catch (e) {
            if (e.message === 'NO_ONCHAIN_ID') {
                setReleaseError('This project was not created on-chain — funds cannot be released.')
            } else if (e.message === 'WALLET_NOT_CONNECTED') {
                setReleaseError('Please connect your wallet first, then click Release Funds.')
            } else {
                setReleaseError(e.reason || e.message || 'Transaction failed. Please try again.')
            }
        } finally {
            setReleasing(false)
        }
    }

    return (
        <div style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            padding: '20px 22px',
            transition: 'border-color 0.3s, background 0.3s',
        }}>

            {/* ── Header row ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    {/* Index badge */}
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, marginTop: '2px',
                        background: isApproved ? 'rgba(16,185,129,0.2)' : isAIPassed ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.06)',
                        color: isApproved ? '#10b981' : isAIPassed ? '#2dd4bf' : '#64748b',
                    }}>
                        {isApproved ? '✓' : isAIPassed ? '★' : index + 1}
                    </div>

                    {/* Title + subtitle */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px' }}>
                            {title}
                        </h3>
                        <p style={{ color: '#475569', fontSize: '0.75rem' }}>
                            {description || (isScored
                                ? `AI evaluated — ${score}/100`
                                : 'Submit proof to trigger AI evaluation')}
                        </p>
                    </div>
                </div>

                {/* Right: amount + badge + toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {amount != null && (
                        <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                            {parseFloat(amount).toFixed(2)} HSK
                        </span>
                    )}
                    <StatusBadge status={status ?? 'pending'} />
                    <button
                        onClick={() => setExpanded(x => !x)}
                        style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', color: '#64748b', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', padding: '4px 6px',
                            transition: 'all 0.2s',
                        }}
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* ── Score bar (if scored) ────────────────────────────────────── */}
            {isScored && <ScoreBar score={score} />}

            {/* ── Expandable panel ────────────────────────────────────────── */}
            {expanded && (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>

                    {/* Proof textarea */}
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '8px' }}>
                        Milestone Proof
                    </label>
                    <textarea
                        value={proof}
                        onChange={e => { setProof(e.target.value); setEvalError('') }}
                        placeholder={`Describe what you achieved for "${title}"…\nEx: Deployed the smart contract at 0x… Tested with 500 transactions…`}
                        disabled={isApproved || isAIPassed || evaluating}
                        rows={4}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            background: 'rgba(5,7,20,0.5)',
                            border: `1px solid ${evalError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: '10px',
                            padding: '12px 14px',
                            color: '#f1f5f9',
                            fontSize: '0.85rem',
                            lineHeight: '1.65',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.2s',
                            opacity: (isApproved || isAIPassed) ? 0.6 : 1,
                        }}
                        onFocus={e => { if (!isApproved && !isAIPassed) e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)' }}
                        onBlur={e => e.currentTarget.style.borderColor = evalError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}
                    />

                    {evalError && (
                        <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '6px', fontWeight: 500 }}>
                            ⚠ {evalError}
                        </p>
                    )}

                    {/* Evaluate button — hidden once approved */}
                    {!isApproved && !isAIPassed && (
                        <button
                            onClick={handleEvaluate}
                            disabled={evaluating || !proof.trim()}
                            style={{
                                marginTop: '12px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', borderRadius: '10px',
                                cursor: evaluating || !proof.trim() ? 'not-allowed' : 'pointer',
                                background: evaluating
                                    ? 'rgba(167,139,250,0.08)'
                                    : !proof.trim()
                                        ? 'rgba(255,255,255,0.04)'
                                        : 'linear-gradient(135deg,#a78bfa,#7c3aed)',
                                border: evaluating || !proof.trim()
                                    ? '1px solid rgba(167,139,250,0.15)'
                                    : 'none',
                                color: evaluating || !proof.trim() ? '#a78bfa' : '#fff',
                                fontSize: '0.85rem', fontWeight: 700,
                                transition: 'all 0.2s',
                                boxShadow: !evaluating && proof.trim() ? '0 0 20px rgba(167,139,250,0.3)' : 'none',
                            }}
                            onMouseEnter={e => {
                                if (!evaluating && proof.trim()) {
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(167,139,250,0.5)'
                                    e.currentTarget.style.transform = 'translateY(-1px)'
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = !evaluating && proof.trim() ? '0 0 20px rgba(167,139,250,0.3)' : 'none'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            {evaluating ? (
                                <>
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    Evaluating…
                                </>
                            ) : (
                                <>
                                    <Brain size={16} />
                                    Evaluate with AI
                                    <Send size={14} />
                                </>
                            )}
                        </button>
                    )}

                    {/* ── AI Result Panel ──────────────────────────────────── */}
                    {isScored && (
                        <div style={{ marginTop: '16px' }}>

                            {/* ── REJECTED ───────────────────────────────────── */}
                            {isRejected && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: '12px',
                                    background: 'rgba(239,68,68,0.06)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: reason ? '8px' : 0 }}>
                                        <XCircle size={14} color="#f87171" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>
                                            AI Recommendation: Rejected
                                        </span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                                            Score: {score}/100
                                        </span>
                                    </div>
                                    {reason && (
                                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.55, marginTop: '4px' }}>
                                            {reason}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                                        Score must be ≥ 80 to approve. Improve your proof and re-evaluate.
                                    </p>
                                </div>
                            )}

                            {/* ── AI PASSED — awaiting manual release ────────── */}
                            {isAIPassed && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: '12px',
                                    background: 'rgba(20,184,166,0.06)',
                                    border: '1px solid rgba(20,184,166,0.25)',
                                }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <CheckCircle size={14} color="#2dd4bf" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2dd4bf' }}>
                                            ✅ AI Recommendation: Approved
                                        </span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: '#2dd4bf' }}>
                                            Score: {score}/100
                                        </span>
                                    </div>

                                    {/* Reasoning */}
                                    {reason && (
                                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.55, marginBottom: '14px' }}>
                                            {reason}
                                        </p>
                                    )}

                                    {/* No on-chain ID warning */}
                                    {noOnChainId ? (
                                        <div style={{
                                            padding: '10px 14px', borderRadius: '10px',
                                            background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)',
                                        }}>
                                            <p style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                                                ⚠ This project was not created on-chain — funds cannot be released.
                                            </p>
                                        </div>
                                    ) : (
                                        /* Release Funds button */
                                        <div>
                                            <button
                                                id={`release-funds-${id}`}
                                                onClick={handleRelease}
                                                disabled={releasing}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                    padding: '12px 20px', borderRadius: '11px',
                                                    cursor: releasing ? 'not-allowed' : 'pointer',
                                                    background: releasing
                                                        ? 'rgba(16,185,129,0.08)'
                                                        : 'linear-gradient(135deg, #10b981, #059669)',
                                                    border: releasing
                                                        ? '1px solid rgba(16,185,129,0.2)'
                                                        : '1px solid rgba(16,185,129,0.4)',
                                                    color: releasing ? '#10b981' : '#fff',
                                                    fontSize: '0.88rem', fontWeight: 800,
                                                    letterSpacing: '0.02em',
                                                    transition: 'all 0.2s',
                                                    boxShadow: releasing ? 'none' : '0 0 24px rgba(16,185,129,0.35)',
                                                }}
                                                onMouseEnter={e => {
                                                    if (!releasing) {
                                                        e.currentTarget.style.boxShadow = '0 4px 28px rgba(16,185,129,0.55)'
                                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.boxShadow = releasing ? 'none' : '0 0 24px rgba(16,185,129,0.35)'
                                                    e.currentTarget.style.transform = 'translateY(0)'
                                                }}
                                            >
                                                {releasing ? (
                                                    <>
                                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                                        Releasing Funds…
                                                    </>
                                                ) : (
                                                    '💸 Release Funds'
                                                )}
                                            </button>

                                            {!walletConnected && !releasing && (
                                                <p style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', marginTop: '6px' }}>
                                                    Connect your wallet above, then click Release Funds.
                                                </p>
                                            )}

                                            {releaseError && (
                                                <div style={{
                                                    marginTop: '10px', padding: '10px 14px', borderRadius: '10px',
                                                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                                                }}>
                                                    <p style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                                                        ⚠ {releaseError}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── APPROVED (funds released on-chain) ─────────── */}
                            {isApproved && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: '12px',
                                    background: 'rgba(16,185,129,0.07)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={14} color="#10b981" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', flex: 1 }}>
                                            ✅ Funds Released — Score: {score}/100
                                        </span>
                                        {tx_hash && (
                                            <a
                                                href={getExplorerUrl(tx_hash)}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    fontSize: '0.7rem', color: '#10b981',
                                                    textDecoration: 'underline', whiteSpace: 'nowrap', opacity: 0.8,
                                                }}
                                            >
                                                View Tx ↗
                                            </a>
                                        )}
                                    </div>
                                    {tx_hash && (
                                        <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: '6px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                            {tx_hash}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '0.65rem', color: '#10b981', opacity: 0.5, textAlign: 'center', marginTop: '10px', fontWeight: 700, letterSpacing: '0.08em' }}>
                                        🤖 SECURED BY AI ORACLE · HASHKEY CHAIN
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}


            {/* Spin keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
