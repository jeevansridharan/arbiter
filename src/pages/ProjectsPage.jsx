/**
 * src/pages/ProjectsPage.jsx
 *
 * ── WHAT THIS FILE DOES ──────────────────────────────────────────────────────
 * 1. On page load (useEffect), fetches all rows from the Supabase `projects`
 *    table, ordered by newest first.
 * 2. Stores fetched data in React state (useState).
 * 3. Handles three UI states: loading → error → data (or empty).
 * 4. Renders a responsive grid of ProjectCard components.
 * 5. Provides a "Create Project" panel that switches to the form.
 *
 * ── FILE LOCATION ────────────────────────────────────────────────────────────
 * src/pages/ProjectsPage.jsx
 * Rendered by App.jsx at the /projects route.
 *
 * ── REQUIRED IMPORTS ─────────────────────────────────────────────────────────
 * supabase        → from '../lib/supabase'    (Supabase client singleton)
 * ProjectCard     → from '../components/ProjectCard'
 * ProjectForm     → from '../components/ProjectForm'
 * Dashboard       → from '../components/Dashboard'
 * React hooks     → useState, useEffect, useCallback from 'react'
 *
 * ── RLS NOTE ─────────────────────────────────────────────────────────────────
 * The `projects` table has a PUBLIC READ policy:
 *   CREATE POLICY "projects: public read" ON projects FOR SELECT USING (true);
 * This means anyone — even without a wallet — can read project data.
 * If you see an empty list when data exists, check:
 *   1. Supabase dashboard → Table Editor → projects → is data there?
 *   2. Supabase dashboard → Auth → Policies → "projects" → is public read on?
 *   3. Your .env VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are correct.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
    FolderKanban, Plus, RefreshCw,
    AlertCircle, Inbox,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import { createProject, deleteProject, updateRaisedAmount } from '../lib/db/projects'
import { insertTransaction } from '../lib/db/transactions'
import ProjectCard from '../components/ProjectCard'
import ProjectForm from '../components/ProjectForm'
import Dashboard from '../components/Dashboard'

// ── TODO: Replace with the currently connected wallet address ─────────────────
// If you have a wallet context/hook, import it here and pass the address down.
// For now we use a placeholder so the owner_wallet field is never empty.
const PLACEHOLDER_WALLET = 'bchtest:qp0000000000000000000000000000000000000000'

// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {

    // ── State ─────────────────────────────────────────────────────────────────

    /** All projects fetched from Supabase */
    const [projects, setProjects] = useState([])

    /** true while the Supabase request is in-flight */
    const [loading, setLoading] = useState(true)

    /** Non-null string if the fetch failed */
    const [error, setError] = useState(null)

    /** Controls "Create new project" form vs list view */
    const [showForm, setShowForm] = useState(false)

    /** Active project (once created/selected by user) */
    const [activeProject, setActiveProject] = useState(null)

    // ── Fetch projects from Supabase ──────────────────────────────────────────

    /**
     * fetchProjects()
     *
     * Sends a SELECT query to Supabase:
     *   SELECT * FROM projects ORDER BY created_at DESC
     *
     * Uses useCallback so it can be passed to the refresh button
     * without causing re-render loops.
     */
    const fetchProjects = useCallback(async () => {
        setLoading(true)   // show spinner
        setError(null)     // clear any previous error

        const { data, error: sbError } = await supabase
            .from('projects')          // target table
            .select('*')               // all columns
            .order('created_at', { ascending: false })  // newest first
            .limit(50)                 // safety limit

        if (sbError) {
            // Supabase returned an error (RLS block, network issue, etc.)
            console.error('[ProjectsPage] Supabase error:', sbError)
            setError(sbError.message)
            setProjects([])
        } else {
            setProjects(data ?? [])    // `data` is null if table is empty
        }

        setLoading(false)  // hide spinner
    }, [])

    /**
     * useEffect — runs once when the component mounts (page loads).
     * Equivalent to componentDidMount in class components.
     * The empty dependency array [] means "run only on first render".
     */
    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    // ── Handlers ──────────────────────────────────────────────────────────────

    /**
     * handleProjectCreate
     *
     * Called by ProjectForm when the user submits the form.
     *
     * BUG FIX: was NOT async, never actually called Supabase.
     * Now: awaits createProject(), throws on error (form shows it),
     * sets local state only AFTER a confirmed DB insert.
     *
     * @param {object} projectData — from ProjectForm (goal_amount, owner_wallet, etc.)
     */
    const handleProjectCreate = async (projectData) => {
        console.log('[ProjectsPage] handleProjectCreate: received formData =', projectData)
        console.log('[ProjectsPage] handleProjectCreate: calling Supabase insert…')

        // ── Real Supabase INSERT ──────────────────────────────────────────────
        const { data: newProject, error: insertError } = await createProject({
            title: projectData.title,
            description: projectData.description ?? '',
            goal_amount: projectData.goal_amount,
            owner_wallet: projectData.owner_wallet ?? PLACEHOLDER_WALLET,
            status: 'active',
        })

        if (insertError) {
            console.error('[ProjectsPage] handleProjectCreate: INSERT FAILED:', insertError)
            // Throw so ProjectForm catches it and shows the error to the user
            throw new Error(insertError.message ?? 'Supabase insert failed')
        }

        console.log('[ProjectsPage] handleProjectCreate: ✓ project inserted:', newProject)

        // ── Update UI after confirmed insert ──────────────────────────────────
        const fullProject = {
            ...newProject,
            milestones: projectData.milestones ?? [],
            raised_amount: 0,
        }

        // Prepend to list so it appears immediately (optimistic UI)
        setProjects(prev => [fullProject, ...prev])
        setActiveProject(fullProject)
        setShowForm(false)
    }

    const handleTransaction = async (amount, txHash, type = 'funding', walletAddress) => {
        if (!activeProject) return
        const finalWallet = walletAddress || PLACEHOLDER_WALLET
        console.log(`[ProjectsPage] handleTransaction: ${type} of ${amount} BCH (${txHash}) by ${finalWallet}`)

        // 1. Record in transactions table
        if (txHash) {
            try {
                await insertTransaction({
                    projectId: activeProject.id,
                    txHash,
                    amount,
                    type,
                    walletAddress: finalWallet,
                })
                console.log(`[ProjectsPage] ✓ ${type} recorded in database`)
            } catch (err) {
                console.error(`[ProjectsPage] Database error for ${type}:`, err.message)
            }
        }

        // 2. If it's a funding transaction, increment the project's raised_amount
        if (type === 'funding') {
            try {
                await updateRaisedAmount(activeProject.id, amount)
                console.log('[ProjectsPage] ✓ raised_amount incremented in projects table')
            } catch (err) {
                console.error('[ProjectsPage] Failed to update project total:', err.message)
            }

            // Update local state for immediate UI feedback
            setActiveProject(prev => ({
                ...prev,
                raised_amount: (parseFloat(prev.raised_amount) + amount).toFixed(8)
            }))
        }
    }

    const handleFund = (amount, txHash, walletAddress) => handleTransaction(amount, txHash, 'funding', walletAddress)

    const handleVote = (milestoneId, voteType) =>
        setActiveProject(prev => ({
            ...prev,
            milestones: prev.milestones?.map(m =>
                m.id !== milestoneId ? m : {
                    ...m,
                    votes: { ...m.votes, [voteType]: m.votes[voteType] + 1 },
                    status: m.votes.yes + 1 > m.votes.no ? 'Approved' : 'Pending',
                }
            ),
        }))

    const handleProjectDelete = async (projectId) => {
        const { error } = await deleteProject(projectId)
        if (error) {
            alert(`Failed to delete project: ${error.message}`)
            return
        }
        // Remove from local state
        setProjects(prev => prev.filter(p => p.id !== projectId))
    }

    const handleReset = () => {
        setActiveProject(null)
        setShowForm(false)
        fetchProjects() // Refresh the list so totals are accurate when returning
    }

    // ── Route: show Dashboard if a project is active ──────────────────────────
    if (activeProject) {
        return (
            <Dashboard
                project={activeProject}
                onFund={handleFund}
                onVote={handleVote}
                onTransaction={handleTransaction}
                onReset={handleReset}
            />
        )
    }

    // ── Route: show create form ───────────────────────────────────────────────
    if (showForm) {
        return (
            <div>
                <button
                    onClick={() => setShowForm(false)}
                    style={{
                        marginBottom: '20px', padding: '8px 16px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                >
                    ← Back to Projects
                </button>
                <ProjectForm
                    onProjectCreate={handleProjectCreate}
                    walletAddress={PLACEHOLDER_WALLET}
                />
            </div>
        )
    }

    // ── Main view: project list ───────────────────────────────────────────────
    return (
        <div>

            {/* ── Page header ────────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
            }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: '4px' }}>
                        Projects
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {loading ? 'Loading…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} on Chipnet`}
                    </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Refresh */}
                    <button
                        onClick={fetchProjects}
                        disabled={loading}
                        title="Refresh list"
                        style={{
                            padding: '9px 14px', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>

                    {/* Create */}
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            padding: '9px 18px', borderRadius: '10px', cursor: 'pointer',
                            background: 'linear-gradient(135deg,#10b981,#059669)',
                            border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', gap: '7px',
                            boxShadow: '0 0 20px rgba(16,185,129,0.3)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 28px rgba(16,185,129,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.3)'}
                    >
                        <Plus size={16} /> New Project
                    </button>
                </div>
            </div>

            {/* ── Loading state ───────────────────────────────────────────────── */}
            {loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            background: 'rgba(15,17,35,0.9)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '16px', padding: '24px', height: '260px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }}>
                            {/* Skeleton lines */}
                            {[100, 60, 80, 40].map((w, j) => (
                                <div key={j} style={{
                                    height: '12px', width: `${w}%`, borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.04)', marginBottom: '14px',
                                }} />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Error state ─────────────────────────────────────────────────── */}
            {!loading && error && (
                <div style={{
                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '14px', padding: '28px', display: 'flex', alignItems: 'flex-start', gap: '14px',
                }}>
                    <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ color: '#f87171', fontWeight: 700, marginBottom: '6px' }}>Failed to load projects</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.83rem', marginBottom: '14px' }}>{error}</p>
                        <p style={{ color: '#64748b', fontSize: '0.78rem' }}>
                            ⚠ Common causes: schema.sql not run yet · RLS policy missing · wrong .env keys
                        </p>
                        <button
                            onClick={fetchProjects}
                            style={{
                                marginTop: '14px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                color: '#f87171', fontWeight: 700, fontSize: '0.8rem',
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────────────── */}
            {!loading && !error && projects.length === 0 && (
                <div style={{
                    background: 'rgba(15,17,35,0.85)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px', padding: '60px 40px', textAlign: 'center',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 20px',
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Inbox size={28} color="#10b981" />
                    </div>
                    <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.05rem', marginBottom: '8px' }}>
                        No projects yet
                    </p>
                    <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '24px' }}>
                        Be the first to create a milestone-based funding project on Chipnet.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            padding: '10px 24px', borderRadius: '10px', cursor: 'pointer',
                            background: 'linear-gradient(135deg,#10b981,#059669)',
                            border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                        }}
                    >
                        <Plus size={16} /> Create First Project
                    </button>
                </div>
            )}

            {/* ── Projects grid ───────────────────────────────────────────────── */}
            {!loading && !error && projects.length > 0 && (
                <>
                    {/* Count + filter bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <div style={{
                            padding: '4px 12px', borderRadius: '999px',
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                        }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
                                {projects.length} PROJECT{projects.length !== 1 ? 'S' : ''}
                            </span>
                        </div>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        <span style={{ fontSize: '0.72rem', color: '#334155' }}>Sorted: Newest first</span>
                    </div>

                    {/* Responsive card grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px',
                    }}>
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onView={(p) => setActiveProject(p)}
                                onDelete={handleProjectDelete}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Spinner keyframe */}
            <style>{`
                @keyframes spin   { to { transform: rotate(360deg); } }
                @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
            `}</style>

        </div>
    )
}
