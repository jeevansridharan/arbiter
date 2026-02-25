/**
 * pages/DashboardPage.jsx
 * Overview stats + quick-access cards for the Milestara dashboard.
 * Stats are live-fetched from Supabase on mount.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    FolderKanban, Vote, ArrowUpRight,
    TrendingUp, Zap, Shield, ChevronRight,
    Bitcoin, RefreshCw,
} from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accentColor, Icon, loading }) {
    return (
        <div style={{
            background: 'rgba(15,17,35,0.85)',
            border: `1px solid ${accentColor}30`,
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(20px)',
            transition: 'transform 0.2s, box-shadow 0.2s',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${accentColor}20` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${accentColor}15`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={accentColor} />
                </div>
            </div>
            <div>
                {loading ? (
                    <div style={{ width: '60px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ) : (
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{value}</p>
                )}
                <p style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 600, marginTop: '4px' }}>{sub}</p>
            </div>
        </div>
    )
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({ to, Icon, title, description, color }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <div style={{
                background: 'rgba(15,17,35,0.85)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40'; e.currentTarget.style.background = `rgba(15,17,35,0.95)` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(15,17,35,0.85)' }}
            >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>{title}</p>
                    <p style={{ color: '#475569', fontSize: '0.78rem' }}>{description}</p>
                </div>
                <ChevronRight size={16} color="#334155" />
            </div>
        </Link>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const [stats, setStats] = useState({ projects: 0, bchRaised: '0.000', votes: 0 })
    const [loading, setLoading] = useState(true)

    async function loadStats() {
        if (!supabaseConfigured || !supabase) {
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            // Fetch all three counts in parallel
            const [projRes, txRes, voteRes] = await Promise.all([
                supabase.from('projects').select('raised_amount', { count: 'exact' }),
                supabase.from('transactions').select('amount', { count: 'exact' }),
                supabase.from('votes').select('id', { count: 'exact' }),
            ])

            // Total project count
            const projectCount = projRes.count ?? 0

            // Sum of all raised_amount across projects
            const totalRaised = (projRes.data ?? []).reduce(
                (sum, p) => sum + parseFloat(p.raised_amount || 0), 0
            )

            // Total votes cast
            const voteCount = voteRes.count ?? 0

            setStats({
                projects: projectCount,
                bchRaised: totalRaised.toFixed(3),
                votes: voteCount,
            })
        } catch (e) {
            console.error('[DashboardPage] Failed to load stats:', e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadStats() }, [])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div style={{ marginBottom: '36px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '4px 12px', borderRadius: '999px', marginBottom: '12px',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.06em' }}>LIVE · CHIPNET TESTNET</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: '6px' }}>
                            Welcome to Milestara
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                            Milestone-based funding platform on Bitcoin Cash Chipnet
                        </p>
                    </div>
                    {/* Refresh button */}
                    <button
                        onClick={loadStats}
                        title="Refresh stats"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#64748b', fontSize: '0.78rem', fontWeight: 600,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    >
                        <RefreshCw size={13} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Total Funded', value: stats.bchRaised, unit: 'BCH', color: '#10b981' },
                    { label: 'Active Projects', value: stats.projects, unit: 'PROJ', color: '#34d399' },
                    { label: 'Community Members', value: '852', unit: 'USERS', color: '#06b6d4' },
                    { label: 'Votes Cast', value: stats.votes, unit: 'VOTES', color: '#a78bfa' },
                ].map(({ label, value, unit, color }) => (
                    <div key={label} style={{
                        background: 'rgba(15,17,35,0.85)',
                        border: `1px solid ${color}30`,
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        backdropFilter: 'blur(20px)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${color}20` }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {label === 'Total Funded' ? <Bitcoin size={16} color={color} /> :
                                    label === 'Active Projects' ? <FolderKanban size={16} color={color} /> :
                                        label === 'Community Members' ? <TrendingUp size={16} color={color} /> :
                                            <Vote size={16} color={color} />}
                            </div>
                        </div>
                        <div>
                            {loading ? (
                                <div style={{ width: '60px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            ) : (
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{value}</p>
                            )}
                            <p style={{ fontSize: '0.75rem', color: color, fontWeight: 600, marginTop: '4px' }}>{unit}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
                    Quick Actions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
                    <button style={{
                        padding: '16px', borderRadius: '14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', cursor: 'pointer', textAlign: 'left'
                    }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)'}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={20} color="#10b981" />
                        </div>
                        <div>
                            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>Fast Funding</p>
                            <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Send BCH Chipnet to active projects</p>
                        </div>
                    </button>
                    <QuickAction to="/projects" Icon={FolderKanban} title="Create or Browse Projects" description="Fund a milestone-based project on Chipnet" color="#10b981" />
                    <QuickAction to="/governance" Icon={Vote} title="Governance Voting" description="Use GOV tokens to vote on milestones" color="#34d399" />
                    <QuickAction to="/transactions" Icon={ArrowUpRight} title="Transaction History" description="View all on-chain BCH transactions" color="#06b6d4" />
                </div>
            </div>

            {/* ── How it works ──────────────────────────────────────────────── */}
            <div style={{ background: 'rgba(15,17,35,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', backdropFilter: 'blur(20px)' }}>
                <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} color="#10b981" /> How Milestara Works
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                    {[
                        { step: '01', title: 'Create Project', desc: 'Define milestones and funding target in BCH', color: '#10b981', Icon: FolderKanban },
                        { step: '02', title: 'Fund & Get Tokens', desc: 'Lock BCH → receive governance tokens (1 = 1 vote)', color: '#34d399', Icon: TrendingUp },
                        { step: '03', title: 'Vote & Release', desc: 'Approve milestones via token voting → release funds', color: '#06b6d4', Icon: Shield },
                    ].map(({ step, title, desc, color, Icon }) => (
                        <div key={step}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                <Icon size={18} color={color} />
                            </div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: color, letterSpacing: '0.1em', marginBottom: '4px' }}>STEP {step}</div>
                            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px' }}>{title}</p>
                            <p style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
