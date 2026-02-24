/**
 * src/lib/db/index.js
 *
 * Barrel export — import everything from one place.
 *
 * Usage in components:
 *   import { createProject, voteOnMilestone, insertTransaction } from '../lib/db'
 *
 * Never import directly from individual db files in components.
 * Always go through this index for clean dependency tracking.
 *
 * BUG FIX: updateFundedAmount is now correctly exported from projects.js
 * (it was previously listed here but missing from projects.js — name mismatch fixed)
 */

export { upsertUser, getUserByWallet } from './users'
export {
    createProject,
    fetchProjects,
    fetchProjectById,
    updateRaisedAmount,
    updateFundedAmount,   // ← alias of updateRaisedAmount, both available
    updateProjectStatus,
    testInsertProject,    // ← dev/debug helper
} from './projects'
export {
    createMilestone, createMilestoneBatch,
    fetchMilestonesByProject, updateMilestoneStatus
} from './milestones'
export { voteOnMilestone, getVotesByMilestone, hasUserVoted } from './votes'
export {
    insertTransaction, fetchTransactionsByProject,
    getProjectFundingTotal
} from './transactions'
