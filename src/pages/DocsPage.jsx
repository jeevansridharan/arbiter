/**
 * pages/DocsPage.jsx
 * Arbit — In-app documentation site
 * Left sidebar with grouped nav sections + main content area
 */

import React, { useState, useEffect, useRef } from 'react'
import {
    BookOpen, Cpu, Code2, ChevronRight, ExternalLink,
    Layers, GitBranch, Shield, Zap, CheckCircle,
    AlertCircle, Clock, FileCode, Database, ArrowRight,
    Circle, Lock, Brain, Eye, Send
} from 'lucide-react'

// ── Contract address from the ABI artifact ────────────────────────────────────
const CONTRACT_ADDRESS = '0xaDf136F4277Cf63c14C429805169bDeD08fA8468'
const NETWORK_NAME = 'HashKey Chain (Testnet)'
const EXPLORER_BASE = 'https://testnet.hashkeyscan.io/address/'

// ── Docs content structure ────────────────────────────────────────────────────
const DOC_SECTIONS = [
    {
        group: 'Getting Started',
        icon: BookOpen,
        color: '#10b981',
        items: [
            { id: 'introduction', label: 'Introduction' },
            { id: 'how-it-works', label: 'How It Works' },
            { id: 'architecture', label: 'Architecture Overview' },
        ],
    },
    {
        group: 'Core Protocol',
        icon: Cpu,
        color: '#a78bfa',
        items: [
            { id: 'milestone-lifecycle', label: 'Milestone Lifecycle' },
            { id: 'ai-evaluation', label: 'AI Evaluation Criteria' },
            { id: 'on-chain-release', label: 'On-Chain Release' },
        ],
    },
    {
        group: 'Developer Guide',
        icon: Code2,
        color: '#06b6d4',
        items: [
            { id: 'contract-reference', label: 'Smart Contract Reference' },
            { id: 'deployed-contract', label: 'Deployed Contract' },
        ],
    },
]

const ALL_ITEMS = DOC_SECTIONS.flatMap(s => s.items)

// ── Shared style tokens ───────────────────────────────────────────────────────
const T = {
    h1: { fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: 1.2 },
    h2: { fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em', marginBottom: '8px', marginTop: '36px' },
    h3: { fontSize: '0.95rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', marginTop: '24px' },
    p: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: '14px' },
    code: {
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '5px',
        padding: '2px 7px',
        fontSize: '0.82rem',
        color: '#34d399',
    },
    card: {
        background: 'rgba(15,17,35,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '22px 24px',
        backdropFilter: 'blur(20px)',
        marginBottom: '20px',
    },
}

// ── Helper: tag badge ─────────────────────────────────────────────────────────
function Tag({ children, color = '#10b981' }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 10px', borderRadius: '999px',
            background: `${color}18`, border: `1px solid ${color}35`,
            fontSize: '0.72rem', fontWeight: 700, color,
            letterSpacing: '0.05em', marginRight: '6px',
        }}>
            {children}
        </span>
    )
}

// ── Helper: inline code ───────────────────────────────────────────────────────
function Code({ children }) {
    return <code style={T.code}>{children}</code>
}

// ── Helper: info callout ──────────────────────────────────────────────────────
function Callout({ icon: Icon = AlertCircle, color = '#a78bfa', title, children }) {
    return (
        <div style={{
            background: `${color}0d`,
            border: `1px solid ${color}30`,
            borderLeft: `3px solid ${color}`,
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
        }}>
            <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
                {title && <p style={{ color, fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{title}</p>}
                <p style={{ ...T.p, marginBottom: 0 }}>{children}</p>
            </div>
        </div>
    )
}

// ── Helper: function row in contract reference ────────────────────────────────
function FnRow({ name, sig, desc, type = 'write' }) {
    const typeColor = type === 'view' ? '#06b6d4' : type === 'admin' ? '#f59e0b' : '#10b981'
    const typeLabel = type === 'view' ? 'VIEW' : type === 'admin' ? 'ADMIN' : 'WRITE'
    return (
        <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
        }}>
            <div style={{ width: '52px', flexShrink: 0, marginTop: '2px' }}>
                <span style={{
                    padding: '2px 6px', borderRadius: '4px',
                    background: `${typeColor}15`, border: `1px solid ${typeColor}30`,
                    fontSize: '0.65rem', fontWeight: 800, color: typeColor, letterSpacing: '0.06em',
                }}>
                    {typeLabel}
                </span>
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '4px' }}>
                    {name}
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#475569', marginBottom: '6px' }}>
                    {sig}
                </p>
                <p style={{ fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    {desc}
                </p>
            </div>
        </div>
    )
}

// ── Architecture diagram (pure CSS/SVG) ──────────────────────────────────────
function ArchitectureDiagram() {
    const nodes = [
        { label: 'Frontend', sub: 'React + Vite', icon: '⚛', color: '#06b6d4', x: 0 },
        { label: 'AI Relayer', sub: 'Node.js + Groq', icon: '🧠', color: '#a78bfa', x: 1 },
        { label: 'ArbitCore', sub: 'Solidity · HashKey', icon: '⛓', color: '#10b981', x: 2 },
        { label: 'Supabase', sub: 'Metadata · DB', icon: '🗄', color: '#f59e0b', x: 3 },
    ]
    return (
        <div style={{ marginBottom: '24px', marginTop: '12px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                overflowX: 'auto',
                padding: '24px 0',
            }}>
                {nodes.map((node, i) => (
                    <React.Fragment key={node.label}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '120px',
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '16px',
                                background: `${node.color}15`,
                                border: `1px solid ${node.color}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.6rem',
                                marginBottom: '10px',
                                boxShadow: `0 0 20px ${node.color}20`,
                            }}>
                                {node.icon}
                            </div>
                            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', marginBottom: '2px' }}>
                                {node.label}
                            </p>
                            <p style={{ color: '#475569', fontSize: '0.7rem', textAlign: 'center' }}>
                                {node.sub}
                            </p>
                        </div>
                        {i < nodes.length - 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', paddingBottom: '32px' }}>
                                <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.12)' }} />
                                <ArrowRight size={12} color="#334155" />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
            <p style={{ ...T.p, fontSize: '0.78rem', color: '#475569', textAlign: 'center', marginTop: '-8px' }}>
                Data flow: user actions traverse Frontend → AI Relayer → Smart Contract, with off-chain metadata persisted in Supabase.
            </p>
        </div>
    )
}

// ── Milestone lifecycle visual ────────────────────────────────────────────────
function MilestoneFlow() {
    const states = [
        { label: 'Pending', desc: 'Created, awaiting proof', color: '#f59e0b', Icon: Clock },
        { label: 'Proof Submitted', desc: 'Creator submits evidence', color: '#a78bfa', Icon: Send },
        { label: 'AI Evaluated', desc: 'Oracle scores 0–100', color: '#06b6d4', Icon: Brain },
        { label: 'Approved / Rejected', desc: 'Score vs threshold', color: '#10b981', Icon: Eye },
        { label: 'Released / Refunded', desc: 'Funder triggers on-chain tx', color: '#34d399', Icon: CheckCircle },
    ]
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', marginTop: '12px' }}>
            {states.map((s, i) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: `${s.color}15`, border: `1.5px solid ${s.color}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <s.Icon size={15} color={s.color} />
                        </div>
                        {i < states.length - 1 && (
                            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
                        )}
                    </div>
                    <div style={{ paddingTop: '6px' }}>
                        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>{s.label}</p>
                        <p style={{ color: '#64748b', fontSize: '0.78rem' }}>{s.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Score criteria grid ───────────────────────────────────────────────────────
function ScoreCriteria() {
    const criteria = [
        { label: 'Innovation', desc: 'Novelty and creativity of the solution', color: '#a78bfa', weight: '25%' },
        { label: 'Feasibility', desc: 'Technical viability and implementation clarity', color: '#06b6d4', weight: '25%' },
        { label: 'Impact', desc: 'Potential positive effect on target users or ecosystem', color: '#10b981', weight: '25%' },
        { label: 'Clarity', desc: 'Quality of the proof submission and documentation', color: '#f59e0b', weight: '25%' },
    ]
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px', marginTop: '12px' }}>
            {criteria.map(c => (
                <div key={c.label} style={{
                    background: `${c.color}08`,
                    border: `1px solid ${c.color}25`,
                    borderRadius: '12px',
                    padding: '16px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <p style={{ color: c.color, fontWeight: 700, fontSize: '0.85rem' }}>{c.label}</p>
                        <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>{c.weight}</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>{c.desc}</p>
                </div>
            ))}
        </div>
    )
}

// ── Individual doc content renderers ─────────────────────────────────────────
const DOC_CONTENT = {
    introduction: () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#10b981">Getting Started</Tag>
            </div>
            <h1 style={T.h1}>Introduction</h1>
            <p style={{ ...T.p, fontSize: '0.95rem', color: '#cbd5e1' }}>
                Arbit is an AI-assisted milestone escrow protocol deployed on HashKey Chain.
                It allows creators to lock HSK tokens into an on-chain escrow and receive funds
                only after an AI oracle evaluates their milestone proof against a pre-agreed score threshold.
            </p>
            <div style={T.card}>
                <p style={{ ...T.p, marginBottom: 0 }}>
                    Arbit bridges traditional milestone-based funding with blockchain-enforced transparency.
                    A creator deposits HSK, defines a score threshold (1–100), and submits a milestone proof
                    once work is complete. An AI oracle (powered by Groq) evaluates the proof across four
                    dimensions and produces a score. The funder then reviews the AI recommendation and
                    manually triggers the on-chain fund release — or refunds the creator if the score falls
                    below threshold.
                </p>
            </div>
            <Callout icon={Shield} color="#10b981" title="Manual approval by design">
                Arbit's AI oracle recommends — it never auto-releases funds. A funder must submit an
                explicit on-chain transaction to move value, preserving human oversight at every step.
            </Callout>
            <h2 style={T.h2}>Key characteristics</h2>
            <ul style={{ ...T.p, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#e2e8f0' }}>EVM-native</strong> — deployed on HashKey Chain as a standard Solidity smart contract (ArbitCore.sol)
                </li>
                <li style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#e2e8f0' }}>AI-assisted evaluation</strong> — Groq LLM scores proofs; the score is committed on-chain via the oracle wallet
                </li>
                <li style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#e2e8f0' }}>Human-approved releases</strong> — fund release requires a manual transaction from the funder wallet
                </li>
                <li style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#e2e8f0' }}>Trustless accounting</strong> — all escrow state (funds, score, threshold, proof) lives on-chain
                </li>
                <li style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#e2e8f0' }}>Off-chain metadata</strong> — project names, descriptions, and milestone text are stored in Supabase for UX
                </li>
            </ul>
        </div>
    ),

    'how-it-works': () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#10b981">Getting Started</Tag>
            </div>
            <h1 style={T.h1}>How It Works</h1>
            <p style={T.p}>
                Arbit follows a six-step lifecycle from project creation to fund settlement.
                Each step has a clear on-chain or off-chain owner.
            </p>

            {[
                {
                    step: '01', title: 'Project Creation', color: '#10b981', Icon: Lock,
                    desc: 'The creator calls createProject(threshold) on ArbitCore.sol with a HSK deposit attached as msg.value. The contract stores the creator address, locked funds, score threshold, and mints a projectId. Off-chain metadata (name, description, milestones) is written to Supabase.',
                },
                {
                    step: '02', title: 'Funds Locked On-Chain', color: '#06b6d4', Icon: Shield,
                    desc: 'HSK stays in the contract\'s escrow until either releaseFunds() or refund() is called. No party — including the owner — can unilaterally move funds before the score logic is satisfied.',
                },
                {
                    step: '03', title: 'Proof Submission', color: '#a78bfa', Icon: Send,
                    desc: 'When milestone work is done, the creator calls submitMilestoneProof(projectId, proof). The proof is a plain text description or an IPFS CID stored on-chain. Each project supports one proof submission per scoring cycle.',
                },
                {
                    step: '04', title: 'AI Evaluation', color: '#f59e0b', Icon: Brain,
                    desc: 'The backend AI relayer (Node.js + Groq) reads the on-chain proof, evaluates it across four dimensions (Innovation, Feasibility, Impact, Clarity), and submits the resulting score (0–100) on-chain via submitAIScore(). Only the designated oracle wallet may call this function.',
                },
                {
                    step: '05', title: 'Funder Review', color: '#34d399', Icon: Eye,
                    desc: 'The funder (or any party) can view the score in the Arbit UI. The interface shows the AI score alongside the threshold. If score ≥ threshold, the "Release Funds" button becomes active. If score < threshold, only "Refund" is available.',
                },
                {
                    step: '06', title: 'Manual Release', color: '#10b981', Icon: CheckCircle,
                    desc: 'The funder sends a releaseFunds(projectId) transaction. The contract verifies score ≥ threshold and transfers the full escrow balance to the creator address. If the score failed, the creator can call refund() to reclaim their deposit.',
                },
            ].map(({ step, title, color, Icon, desc }) => (
                <div key={step} style={{ ...T.card, display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0 }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: `${color}15`, border: `1px solid ${color}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon size={18} color={color} />
                        </div>
                        <p style={{ fontSize: '0.6rem', fontWeight: 800, color, letterSpacing: '0.1em', textAlign: 'center', marginTop: '6px' }}>
                            STEP {step}
                        </p>
                    </div>
                    <div>
                        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>{title}</p>
                        <p style={{ ...T.p, marginBottom: 0 }}>{desc}</p>
                    </div>
                </div>
            ))}
        </div>
    ),

    architecture: () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#10b981">Getting Started</Tag>
            </div>
            <h1 style={T.h1}>Architecture Overview</h1>
            <p style={T.p}>
                Arbit is composed of four layers that communicate in a well-defined order.
                The frontend never writes directly to the smart contract for AI scores — that
                path is reserved for the trusted oracle wallet.
            </p>
            <div style={T.card}>
                <ArchitectureDiagram />
            </div>

            <h2 style={T.h2}>Layer breakdown</h2>

            {[
                {
                    label: 'Frontend', sub: 'React + Vite', color: '#06b6d4', Icon: Layers,
                    desc: 'Built with React 18 and Vite. Connects to the user\'s MetaMask (or compatible EVM wallet) via ethers.js. Reads on-chain state from ArbitCore via view functions, and writes via the user\'s own signer. Calls the AI relayer over HTTP to trigger evaluations. Off-chain project metadata is fetched from Supabase.',
                },
                {
                    label: 'Backend AI Relayer', sub: 'Node.js + Express + Groq', color: '#a78bfa', Icon: Brain,
                    desc: 'A lightweight Express server that exposes a single evaluation endpoint. It reads the milestone proof, sends it to the Groq LLM with a structured prompt, parses the score, then submits it on-chain using the designated oracle private key. It never holds user funds.',
                },
                {
                    label: 'ArbitCore.sol', sub: 'Solidity 0.8.20 · HashKey Chain', color: '#10b981', Icon: FileCode,
                    desc: 'The single-file smart contract that owns all escrow logic. It stores the Project struct (creator, funds, score, threshold, proof, isScored, isReleased) in a mapping. Access control is enforced with onlyOwner and onlyOracle modifiers. Deployed at the address shown in the Deployed Contract section.',
                },
                {
                    label: 'Supabase', sub: 'PostgreSQL · REST API', color: '#f59e0b', Icon: Database,
                    desc: 'Stores off-chain metadata that would be expensive to put on-chain: project names, descriptions, milestone text, and evaluation summaries. The frontend queries Supabase for display purposes only — Supabase has no authority over fund movements.',
                },
            ].map(({ label, sub, color, Icon, desc }) => (
                <div key={label} style={{ ...T.card, display: 'flex', gap: '18px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: `${color}15`, border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Icon size={18} color={color} />
                    </div>
                    <div>
                        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px' }}>{label}</p>
                        <p style={{ color, fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px' }}>{sub}</p>
                        <p style={{ ...T.p, marginBottom: 0 }}>{desc}</p>
                    </div>
                </div>
            ))}
        </div>
    ),

    'milestone-lifecycle': () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#a78bfa">Core Protocol</Tag>
            </div>
            <h1 style={T.h1}>Milestone Lifecycle</h1>
            <p style={T.p}>
                Every project in Arbit moves through a fixed sequence of states.
                State transitions are enforced by the smart contract — invalid transitions revert.
            </p>
            <div style={T.card}>
                <MilestoneFlow />
            </div>

            <h2 style={T.h2}>State details</h2>

            {[
                {
                    state: 'Pending', color: '#f59e0b',
                    onChain: 'isScored = false, isReleased = false, proof = ""',
                    desc: 'The project exists on-chain with funds locked. The creator has not yet submitted a proof. The score is 0 and no oracle action has occurred.',
                },
                {
                    state: 'Proof Submitted', color: '#a78bfa',
                    onChain: 'isScored = false, isReleased = false, proof ≠ ""',
                    desc: 'The creator has called submitMilestoneProof(). The proof string is stored on-chain. The oracle may now call submitAIScore().',
                },
                {
                    state: 'AI Evaluated', color: '#06b6d4',
                    onChain: 'isScored = true, isReleased = false, score = N',
                    desc: 'The oracle has submitted a score (0–100). The ScoreSubmitted event is emitted on-chain with the score and a passed boolean (score ≥ threshold).',
                },
                {
                    state: 'Approved', color: '#10b981',
                    onChain: 'isScored = true, score ≥ threshold',
                    desc: 'Score meets or exceeds the creator\'s threshold. releaseFunds() is now callable. The funder reviews the AI recommendation and may execute the transaction.',
                },
                {
                    state: 'Rejected', color: '#ef4444',
                    onChain: 'isScored = true, score < threshold',
                    desc: 'Score falls below threshold. releaseFunds() will revert. The creator may call refund() to reclaim the escrowed HSK.',
                },
                {
                    state: 'Released', color: '#34d399',
                    onChain: 'isReleased = true, funds = 0',
                    desc: 'Funds have been transferred to the creator via releaseFunds(). The FundsReleased event is emitted. isActive() returns false.',
                },
                {
                    state: 'Refunded', color: '#64748b',
                    onChain: 'isReleased = true, funds = 0',
                    desc: 'Creator reclaimed their deposit via refund(). The FundsRefunded event is emitted. isActive() returns false. The same isReleased flag covers both terminal states.',
                },
            ].map(({ state, color, onChain, desc }) => (
                <div key={state} style={{ ...T.card, marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>{state}</p>
                        <code style={{ ...T.code, fontSize: '0.72rem', color }}>{onChain}</code>
                    </div>
                    <p style={{ ...T.p, marginBottom: 0 }}>{desc}</p>
                </div>
            ))}
        </div>
    ),

    'ai-evaluation': () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#a78bfa">Core Protocol</Tag>
            </div>
            <h1 style={T.h1}>AI Evaluation Criteria</h1>
            <p style={T.p}>
                When the AI relayer evaluates a milestone proof, it instructs the Groq LLM to score
                the submission across four equally-weighted dimensions. The aggregate score (0–100)
                is then committed on-chain via the oracle wallet.
            </p>

            <Callout icon={Brain} color="#a78bfa" title="What the AI reads">
                The oracle receives the raw proof string stored on-chain — either plain text or an
                IPFS CID that resolves to documentation. The quality and specificity of the proof
                directly influence the score.
            </Callout>

            <h2 style={T.h2}>Scoring dimensions</h2>
            <ScoreCriteria />

            <h2 style={T.h2}>Threshold logic</h2>
            <p style={T.p}>
                Each project has a creator-defined <Code>threshold</Code> (1–100) stored on-chain at creation.
                The relationship is simple:
            </p>
            <div style={{ ...T.card, fontFamily: "'JetBrains Mono', monospace" }}>
                <p style={{ color: '#34d399', fontSize: '0.88rem', marginBottom: '8px' }}>
                    {'score >= threshold  →  releaseFunds() callable'}
                </p>
                <p style={{ color: '#f87171', fontSize: '0.88rem', marginBottom: 0 }}>
                    {'score <  threshold  →  refund() callable'}
                </p>
            </div>
            <p style={T.p}>
                The contract enforces this check inside <Code>releaseFunds()</Code>. Calling it with a failing
                score will revert with <Code>"ArbitCore: score below threshold"</Code>.
            </p>

            <h2 style={T.h2}>Oracle access control</h2>
            <p style={T.p}>
                Only the wallet address stored in <Code>aiOracle</Code> may call <Code>submitAIScore()</Code>.
                Any other caller receives: <Code>"ArbitCore: not AI oracle"</Code>.
                The owner may rotate the oracle address via <Code>setOracle()</Code>.
            </p>

            <Callout icon={Shield} color="#10b981" title="Signature parameter">
                The <Code>signature</Code> parameter in <Code>submitAIScore()</Code> is reserved for future
                ECDSA oracle authentication. In the current version it is accepted but not verified —
                pass <Code>0x</Code> from the relayer.
            </Callout>
        </div>
    ),

    'on-chain-release': () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#a78bfa">Core Protocol</Tag>
            </div>
            <h1 style={T.h1}>On-Chain Release</h1>
            <p style={T.p}>
                A core design principle of Arbit is that <strong style={{ color: '#e2e8f0' }}>the AI oracle never automatically
                releases funds</strong>. Score submission and fund release are two distinct on-chain operations,
                each requiring a separate transaction.
            </p>

            <Callout icon={AlertCircle} color="#f59e0b" title="Human in the loop">
                The AI evaluates and recommends. A human (the funder) retains full authority to
                decide whether to release or reject — no automatic fund movements occur.
            </Callout>

            <h2 style={T.h2}>Release flow</h2>
            <div style={{ ...T.card }}>
                {[
                    { n: '1', text: 'Oracle calls submitAIScore() → score stored on-chain, ScoreSubmitted event emitted', color: '#a78bfa' },
                    { n: '2', text: 'Funder sees score ≥ threshold in the Arbit UI', color: '#06b6d4' },
                    { n: '3', text: 'Funder connects wallet and clicks "Release Funds"', color: '#f59e0b' },
                    { n: '4', text: 'Frontend sends releaseFunds(projectId) tx — contract verifies score ≥ threshold', color: '#10b981' },
                    { n: '5', text: 'Contract sets funds = 0, isReleased = true, transfers HSK to creator.address', color: '#34d399' },
                    { n: '6', text: 'FundsReleased event emitted on-chain; UI updates', color: '#10b981' },
                ].map(({ n, text, color }) => (
                    <div key={n} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: `${color}20`, border: `1px solid ${color}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color,
                        }}>{n}</div>
                        <p style={{ ...T.p, marginBottom: 0, paddingTop: '2px' }}>{text}</p>
                    </div>
                ))}
            </div>

            <h2 style={T.h2}>Refund flow</h2>
            <p style={T.p}>
                If the AI score is below threshold — or if the creator wants to cancel before scoring —
                they may call <Code>refund()</Code>. Requirements:
            </p>
            <ul style={{ ...T.p, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '6px' }}><Code>msg.sender == creator</Code> — only the project creator may refund</li>
                <li style={{ marginBottom: '6px' }}><Code>!isScored || score &lt; threshold</Code> — cannot refund if score already passed</li>
                <li style={{ marginBottom: '6px' }}><Code>!isReleased</Code> — funds must not have already been settled</li>
            </ul>
            <p style={T.p}>
                The contract follows CEI (Checks-Effects-Interactions): state is updated before the ETH
                transfer to prevent reentrancy attacks.
            </p>

            <h2 style={T.h2}>Who can call releaseFunds?</h2>
            <p style={T.p}>
                The <Code>releaseFunds()</Code> function has no caller restriction — any connected wallet
                can submit the transaction. However, it will revert unless the score already meets the
                threshold. In practice, the funder reviews the AI score via the Arbit UI and initiates
                the call from their connected MetaMask wallet.
            </p>
        </div>
    ),

    'contract-reference': () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#06b6d4">Developer Guide</Tag>
            </div>
            <h1 style={T.h1}>Smart Contract Reference</h1>
            <p style={T.p}>
                All functions listed below are pulled directly from{' '}
                <Code>contracts/ArbitCore.sol</Code> as deployed. No aspirational functions are included.
            </p>

            <Callout icon={FileCode} color="#06b6d4" title="Source of truth">
                Cross-reference with <Code>src/abi/ArbitCore.json</Code> for the full ABI,
                or <Code>src/services/arbitContract.js</Code> for the JavaScript wrappers used by the frontend.
            </Callout>

            <h2 style={T.h2}>Write functions</h2>
            <div style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
                <FnRow
                    name="createProject"
                    sig="createProject(uint256 threshold) external payable → uint256 projectId"
                    desc="Creates a new escrow project. msg.value is the HSK deposit locked on-chain. threshold (1–100) is the minimum AI score required to release funds. Returns the auto-incremented projectId. Emits ProjectCreated."
                    type="write"
                />
                <FnRow
                    name="submitMilestoneProof"
                    sig="submitMilestoneProof(uint256 projectId, string proof) external"
                    desc="Called by the project creator to submit their milestone evidence. proof is stored on-chain verbatim (plain text or IPFS CID). Reverts if caller is not creator, project is already scored, or proof is empty. Emits ProofSubmitted."
                    type="write"
                />
                <FnRow
                    name="submitAIScore"
                    sig="submitAIScore(uint256 projectId, uint256 score, bytes signature) external"
                    desc="Called exclusively by the aiOracle wallet (onlyOracle). Stores score (0–100) and sets isScored = true. signature is reserved for future ECDSA oracle auth; pass 0x currently. Emits ScoreSubmitted with a passed boolean."
                    type="write"
                />
                <FnRow
                    name="releaseFunds"
                    sig="releaseFunds(uint256 projectId) external"
                    desc="Transfers the full escrowed HSK to the creator. Requires isScored = true and score ≥ threshold. No caller restriction — any wallet may submit the transaction. Sets funds = 0, isReleased = true before transfer (CEI pattern). Emits FundsReleased."
                    type="write"
                />
                <FnRow
                    name="refund"
                    sig="refund(uint256 projectId) external"
                    desc="Returns escrowed HSK to the creator. Caller must be the creator. Callable if not yet scored, or if score < threshold. Cannot refund after a passing score. Emits FundsRefunded."
                    type="write"
                />
            </div>

            <h2 style={T.h2}>Admin functions</h2>
            <div style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
                <FnRow
                    name="setOracle"
                    sig="setOracle(address newOracle) external"
                    desc="Replaces the trusted AI oracle address. Restricted to the contract owner (onlyOwner). Emits OracleUpdated. Use to rotate the oracle wallet without redeploying."
                    type="admin"
                />
            </div>

            <h2 style={T.h2}>View functions</h2>
            <div style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
                <FnRow
                    name="getProject"
                    sig="getProject(uint256 projectId) external view → Project"
                    desc="Returns the full Project struct: (creator, funds, score, threshold, proof, isScored, isReleased). Reverts if projectId does not exist."
                    type="view"
                />
                <FnRow
                    name="isActive"
                    sig="isActive(uint256 projectId) external view → bool"
                    desc="Returns true if the project's funds have not yet been settled (isReleased = false). Returns false after either releaseFunds() or refund() has been called."
                    type="view"
                />
                <FnRow
                    name="projects"
                    sig="projects(uint256) public view → (creator, funds, score, threshold, proof, isScored, isReleased)"
                    desc="Public mapping accessor. Returns the Project struct for any given index. Equivalent to getProject() without the existence check modifier."
                    type="view"
                />
                <FnRow
                    name="projectCount"
                    sig="projectCount() public view → uint256"
                    desc="Returns the total number of projects created so far. Used to iterate or paginate on-chain projects."
                    type="view"
                />
                <FnRow
                    name="aiOracle"
                    sig="aiOracle() public view → address"
                    desc="Returns the current oracle wallet address that is authorized to call submitAIScore()."
                    type="view"
                />
                <FnRow
                    name="owner"
                    sig="owner() public view → address"
                    desc="Returns the contract deployer / admin address that is authorized to call setOracle()."
                    type="view"
                />
            </div>

            <h2 style={T.h2}>Events</h2>
            <div style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
                {[
                    { name: 'ProjectCreated', sig: 'ProjectCreated(uint256 indexed projectId, address indexed creator, uint256 funds, uint256 threshold)', desc: 'Emitted when a new project is created via createProject().' },
                    { name: 'ProofSubmitted', sig: 'ProofSubmitted(uint256 indexed projectId, string proof)', desc: 'Emitted when the creator submits their milestone proof.' },
                    { name: 'ScoreSubmitted', sig: 'ScoreSubmitted(uint256 indexed projectId, uint256 score, bool passed)', desc: 'Emitted when the oracle submits an AI score. passed = score >= threshold.' },
                    { name: 'FundsReleased', sig: 'FundsReleased(uint256 indexed projectId, address indexed creator, uint256 amount)', desc: 'Emitted when funds are successfully released to the creator.' },
                    { name: 'FundsRefunded', sig: 'FundsRefunded(uint256 indexed projectId, address indexed creator, uint256 amount)', desc: 'Emitted when the creator reclaims their deposit via refund().' },
                    { name: 'OracleUpdated', sig: 'OracleUpdated(address indexed oldOracle, address indexed newOracle)', desc: 'Emitted when the owner rotates the oracle address via setOracle().' },
                ].map(e => (
                    <FnRow key={e.name} name={e.name} sig={e.sig} desc={e.desc} type="view" />
                ))}
            </div>
        </div>
    ),

    'deployed-contract': () => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Tag color="#06b6d4">Developer Guide</Tag>
            </div>
            <h1 style={T.h1}>Deployed Contract</h1>
            <p style={T.p}>
                The contract address below is read from <Code>src/abi/ArbitCore.json</Code>,
                which is generated by the Hardhat deploy script after each deployment.
                The <Code>VITE_CONTRACT_ADDRESS</Code> environment variable takes priority if set.
            </p>

            <div style={{ ...T.card, border: '1px solid rgba(16,185,129,0.25)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Deployment
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', alignItems: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Network</p>
                    <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>{NETWORK_NAME}</p>

                    <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Address</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ ...T.code, wordBreak: 'break-all' }}>{CONTRACT_ADDRESS}</code>
                    </div>

                    <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Explorer</p>
                    <a
                        href={`${EXPLORER_BASE}${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                        View on HashKey Scan <ExternalLink size={12} />
                    </a>

                    <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Standard</p>
                    <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>EVM · Solidity 0.8.20</p>
                </div>
            </div>

            <h2 style={T.h2}>Environment variables</h2>
            <p style={T.p}>The following variables affect contract connectivity:</p>
            <div style={{ ...T.card, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem' }}>
                {[
                    { key: 'VITE_CONTRACT_ADDRESS', desc: 'Override the ABI artifact address (frontend only). Optional.' },
                    { key: 'VITE_SUPABASE_URL', desc: 'Supabase project URL for off-chain metadata.' },
                    { key: 'VITE_SUPABASE_ANON_KEY', desc: 'Public Supabase anon key.' },
                    { key: 'RPC_URL', desc: 'HashKey Chain RPC endpoint used by the backend relayer.' },
                    { key: 'GROQ_API_KEY', desc: 'Groq API key for AI evaluation (backend only).' },
                    { key: 'PORT', desc: 'Express server port (default: 5000).' },
                ].map(({ key, desc }) => (
                    <div key={key} style={{ display: 'flex', gap: '16px', marginBottom: '12px', alignItems: 'flex-start' }}>
                        <code style={{ ...T.code, minWidth: '220px', flexShrink: 0 }}>{key}</code>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 0, fontFamily: 'inherit' }}>{desc}</p>
                    </div>
                ))}
            </div>

            <h2 style={T.h2}>Hardhat configuration</h2>
            <p style={T.p}>
                Deployment scripts live in <Code>hardhat/scripts/deploy.js</Code>.
                After a successful deployment, the script writes the new address and ABI to{' '}
                <Code>src/abi/ArbitCore.json</Code>, which is then picked up by <Code>arbitContract.js</Code>{' '}
                at runtime. Network configuration is in <Code>hardhat/hardhat.config.js</Code>.
            </p>

            <Callout icon={AlertCircle} color="#f59e0b" title="Testnet contract">
                The address above is on HashKey Chain Testnet. Do not send real funds to testnet addresses.
                For production deployment, update <Code>VITE_CONTRACT_ADDRESS</Code> in your environment and
                re-run the deploy script against HashKey Chain Mainnet.
            </Callout>
        </div>
    ),
}

// ── Sidebar item ──────────────────────────────────────────────────────────────
function SidebarItem({ item, isActive, onClick }) {
    return (
        <button
            onClick={() => onClick(item.id)}
            style={{
                width: '100%',
                textAlign: 'left',
                background: isActive
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.10))'
                    : 'transparent',
                border: isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: isActive ? '#e2e8f0' : '#64748b',
                fontSize: '0.83rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
            }}
            onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = '#94a3b8'
            }}
            onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = '#64748b'
            }}
        >
            {isActive && (
                <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '2px', height: '60%',
                    background: 'linear-gradient(180deg, #10b981, #059669)',
                    borderRadius: '0 2px 2px 0',
                }} />
            )}
            {item.label}
        </button>
    )
}

// ── Main DocsPage ─────────────────────────────────────────────────────────────
export default function DocsPage() {
    const [activeId, setActiveId] = useState('introduction')
    const contentRef = useRef(null)

    const navigate = (id) => {
        setActiveId(id)
        if (contentRef.current) contentRef.current.scrollTop = 0
    }

    const currentIdx = ALL_ITEMS.findIndex(i => i.id === activeId)
    const prevItem = ALL_ITEMS[currentIdx - 1] ?? null
    const nextItem = ALL_ITEMS[currentIdx + 1] ?? null

    const ContentComponent = DOC_CONTENT[activeId]

    return (
        <div style={{ display: 'flex', gap: '0', minHeight: 'calc(100vh - 64px)', margin: '-32px -36px' }}>

            {/* ── Docs sidebar ─────────────────────────────────────────────── */}
            <aside style={{
                width: '240px',
                flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.06)',
                padding: '28px 16px',
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto',
                background: 'rgba(10,11,20,0.6)',
            }}>
                {/* Docs header */}
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <BookOpen size={15} color="#10b981" />
                        <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>Documentation</span>
                    </div>
                    <p style={{ color: '#475569', fontSize: '0.72rem' }}>v1.0 · HashKey Chain</p>
                </div>

                {/* Nav groups */}
                {DOC_SECTIONS.map(({ group, icon: GroupIcon, color, items }) => (
                    <div key={group} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 4px' }}>
                            <GroupIcon size={12} color={color} />
                            <p style={{
                                fontSize: '0.68rem', fontWeight: 800, color: '#475569',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}>
                                {group}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {items.map(item => (
                                <SidebarItem
                                    key={item.id}
                                    item={item}
                                    isActive={activeId === item.id}
                                    onClick={navigate}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </aside>

            {/* ── Main content ─────────────────────────────────────────────── */}
            <main
                ref={contentRef}
                style={{
                    flex: 1,
                    padding: '40px 52px',
                    overflowY: 'auto',
                    maxWidth: '820px',
                }}
            >
                {ContentComponent ? <ContentComponent /> : (
                    <p style={T.p}>Section not found.</p>
                )}

                {/* ── Prev / Next navigation ───────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '52px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    gap: '12px',
                }}>
                    {prevItem ? (
                        <button
                            onClick={() => navigate(prevItem.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px 18px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer', color: '#94a3b8',
                                fontSize: '0.83rem', fontWeight: 600,
                                transition: 'all 0.2s',
                                flex: 1, maxWidth: '280px',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.color = '#e2e8f0' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}
                        >
                            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '2px' }}>Previous</p>
                                <p style={{ fontSize: '0.83rem' }}>{prevItem.label}</p>
                            </div>
                        </button>
                    ) : <div />}

                    {nextItem ? (
                        <button
                            onClick={() => navigate(nextItem.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px 18px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer', color: '#94a3b8',
                                fontSize: '0.83rem', fontWeight: 600,
                                transition: 'all 0.2s',
                                flex: 1, maxWidth: '280px',
                                justifyContent: 'flex-end',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.color = '#e2e8f0' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}
                        >
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '2px' }}>Next</p>
                                <p style={{ fontSize: '0.83rem' }}>{nextItem.label}</p>
                            </div>
                            <ChevronRight size={14} />
                        </button>
                    ) : <div />}
                </div>
            </main>
        </div>
    )
}
