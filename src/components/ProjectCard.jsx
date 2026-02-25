/**
 * src/components/ProjectCard.jsx
 *
 * Reusable card for displaying a single project from Supabase.
 * Used by ProjectsPage to render the projects list.
 */

import React from 'react'
import { Calendar, Target, TrendingUp, Wallet, ArrowRight, Trash2 } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a BCH numeric value to 8 decimal places.
 * e.g. 0.005 → "0.00500000 BCH"
 */
function formatBCH(value) {
    return `${parseFloat(value || 0).toFixed(8)} BCH`
}

/**
 * Shortens a BCH cashaddr for display.
 * e.g. "bchtest:qp...abcd"
 */
function shortWallet(addr) {
    if (!addr || !addr.includes(':')) return addr
    const [prefix, body] = addr.split(':')
    return `${prefix}:${body.slice(0, 4)}...${body.slice(-4)}`
}

/**
 * Formats a UTC timestamp to a readable local date.
 * e.g. "2026-02-21T10:30:00Z" → "Feb 21, 2026"
 */
function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Returns the correct badge color based on the project status string.
 */
function statusStyle(status) {
    const map = {
        active: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#34d399' },
        funded: { bg: 'rgba(5,150,105,0.1)', border: 'rgba(5,150,105,0.3)', color: '#10b981' },
        completed: { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', color: '#06b6d4' },
        cancelled: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: '#f87171' },
    }
    return map[status] ?? map.active
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectCard({ project, onView, onDelete }) {
    const {
        title,
        description,
        goal_amount,
        raised_amount,
        owner_wallet,
        status,
        created_at,
    } = project

    // Progress percentage (capped at 100%)
    const goal = parseFloat(goal_amount || 0)
    const raised = parseFloat(raised_amount || 0)
    const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0

    const badge = statusStyle(status)

    return (
        <div
            style={{
                background: 'rgba(15,17,35,0.9)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backdropFilter: 'blur(20px)',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(16,185,129,0.12)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.boxShadow = 'none'
            }}
        >

            {/* ── Header row: title + status badge ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', lineHeight: 1.3, margin: 0 }}>
                    {title}
                </h3>
                <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                    borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0,
                    background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                    {status}
                </span>
            </div>

            {/* ── Description ── */}
            <p style={{
                color: '#64748b', fontSize: '0.83rem', lineHeight: 1.6, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
                {description || 'No description provided.'}
            </p>

            {/* ── Progress bar ── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>FUNDING PROGRESS</span>
                    <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 800 }}>{percent.toFixed(1)}%</span>
                </div>
                {/* Track */}
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    {/* Fill */}
                    <div style={{
                        height: '100%', borderRadius: '999px', width: `${percent}%`,
                        background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                        minWidth: percent > 0 ? '6px' : '0',
                    }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                        {formatBCH(raised_amount)} raised
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                        Goal: {formatBCH(goal_amount)}
                    </span>
                </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 -4px' }} />

            {/* ── Meta row ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                {/* Goal amount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Target size={13} color="#10b981" />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {formatBCH(goal_amount)}
                    </span>
                </div>

                {/* Raised */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <TrendingUp size={13} color="#34d399" />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {formatBCH(raised_amount)} raised
                    </span>
                </div>

                {/* Owner wallet */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Wallet size={13} color="#06b6d4" />
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace' }}>
                        {shortWallet(owner_wallet)}
                    </span>
                </div>

                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                    <Calendar size={13} color="#475569" />
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                        {formatDate(created_at)}
                    </span>
                </div>
            </div>

            {/* ── Action buttons row ── */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>

                {/* View button */}
                <button
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        color: '#34d399',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'
                    }}
                    onClick={() => onView && onView(project)}
                >
                    View Project <ArrowRight size={14} />
                </button>

                {/* Delete button */}
                {onDelete && (
                    <button
                        title="Delete project"
                        style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(239,68,68,0.07)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
                        }}
                        onClick={() => {
                            if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
                                onDelete(project.id)
                            }
                        }}
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

        </div>
    )
}
