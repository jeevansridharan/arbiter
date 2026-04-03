// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title  ArbitCore — AI-Gated Milestone Funding Protocol
/// @notice Creators lock ETH; an AI oracle scores milestone proofs;
///         funds are automatically released or remain refundable.
/// @dev    Deployable on any EVM chain (HashKey Chain compatible).
contract ArbitCore {

    // ─────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────

    address public owner;        // Contract deployer / admin
    address public aiOracle;     // Trusted off-chain AI scorer
    uint256 public projectCount; // Auto-incrementing project ID counter

    // ─────────────────────────────────────────────────
    // STRUCT
    // ─────────────────────────────────────────────────

    struct Project {
        address creator;    // Who created & funded this project
        uint256 funds;      // ETH locked in escrow (wei)
        uint256 score;      // AI-assigned score (0–100)
        uint256 threshold;  // Minimum score needed to release funds
        string  proof;      // Milestone proof: plain text or IPFS CID
        bool    isScored;   // True after oracle submits a score
        bool    isReleased; // True after funds are released or refunded
    }

    mapping(uint256 => Project) public projects; // projectId => Project

    // ─────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────

    event ProjectCreated(uint256 indexed projectId, address indexed creator, uint256 funds, uint256 threshold);
    event ProofSubmitted(uint256 indexed projectId, string proof);
    event ScoreSubmitted(uint256 indexed projectId, uint256 score, bool passed);
    event FundsReleased(uint256 indexed projectId, address indexed creator, uint256 amount);
    event FundsRefunded(uint256 indexed projectId, address indexed creator, uint256 amount);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    // ─────────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ArbitCore: not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == aiOracle, "ArbitCore: not AI oracle");
        _;
    }

    modifier projectExists(uint256 projectId) {
        require(projectId > 0 && projectId <= projectCount, "ArbitCore: project not found");
        _;
    }

    modifier notReleased(uint256 projectId) {
        require(!projects[projectId].isReleased, "ArbitCore: funds already settled");
        _;
    }

    // ─────────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────────

    constructor(address _aiOracle) {
        require(_aiOracle != address(0), "ArbitCore: invalid oracle address");
        owner    = msg.sender;
        aiOracle = _aiOracle;
    }

    // =========================================================================
    // CORE FUNCTIONS
    // =========================================================================

    /// @notice Create a project by depositing ETH into escrow.
    /// @param  threshold AI score (1–100) required to release funds.
    /// @return projectId The newly assigned project ID.
    function createProject(uint256 threshold)
        external
        payable
        returns (uint256 projectId)
    {
        require(msg.value > 0, "ArbitCore: deposit required");
        require(threshold >= 1 && threshold <= 100, "ArbitCore: threshold must be 1–100");

        projectCount++;
        projectId = projectCount;

        projects[projectId] = Project({
            creator:    msg.sender,
            funds:      msg.value,
            score:      0,
            threshold:  threshold,
            proof:      "",
            isScored:   false,
            isReleased: false
        });

        emit ProjectCreated(projectId, msg.sender, msg.value, threshold);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Creator submits milestone proof (plain text or IPFS hash).
    /// @param  projectId Target project.
    /// @param  proof     Evidence string, e.g. "ipfs://bafybeig...".
    function submitMilestoneProof(uint256 projectId, string calldata proof)
        external
        projectExists(projectId)
        notReleased(projectId)
    {
        Project storage p = projects[projectId];

        require(msg.sender == p.creator, "ArbitCore: only creator can submit proof");
        require(!p.isScored,             "ArbitCore: already scored");
        require(bytes(proof).length > 0, "ArbitCore: proof cannot be empty");

        p.proof = proof;

        emit ProofSubmitted(projectId, proof);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /// @notice AI oracle submits a score for the milestone proof.
    /// @param  projectId Target project.
    /// @param  score     AI score in range 0–100.
    /// @param  signature Reserved for future ECDSA oracle auth; pass `0x` for now.
    function submitAIScore(
        uint256 projectId,
        uint256 score,
        bytes calldata signature
    )
        external
        onlyOracle
        projectExists(projectId)
        notReleased(projectId)
    {
        require(score <= 100, "ArbitCore: score must be 0–100");

        Project storage p = projects[projectId];

        require(!p.isScored,                 "ArbitCore: already scored");
        require(bytes(p.proof).length > 0,   "ArbitCore: proof not yet submitted");

        p.score    = score;
        p.isScored = true;

        bool passed = score >= p.threshold;

        emit ScoreSubmitted(projectId, score, passed);

        // `signature` stored on-chain for auditability; ECDSA enforcement in v2.
        // Suppress unused-variable warning without removing the parameter.
        (signature); // no-op reference
    }

    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Release funds to creator when AI score meets or exceeds threshold.
    ///         Anyone may call; contract enforces score check internally.
    /// @param  projectId Target project.
    function releaseFunds(uint256 projectId)
        external
        projectExists(projectId)
        notReleased(projectId)
    {
        Project storage p = projects[projectId];

        require(p.isScored,               "ArbitCore: not yet scored");
        require(p.score >= p.threshold,   "ArbitCore: score below threshold");

        uint256 amount  = p.funds;
        address creator = p.creator;

        // CEI: update state BEFORE external call to prevent reentrancy
        p.funds      = 0;
        p.isReleased = true;

        (bool ok, ) = payable(creator).call{value: amount}("");
        require(ok, "ArbitCore: ETH transfer failed");

        emit FundsReleased(projectId, creator, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Refund locked ETH to creator when score < threshold,
    ///         or before the oracle has scored (creator cancels early).
    /// @param  projectId Target project.
    function refund(uint256 projectId)
        external
        projectExists(projectId)
        notReleased(projectId)
    {
        Project storage p = projects[projectId];

        require(msg.sender == p.creator, "ArbitCore: only creator can refund");
        require(
            !p.isScored || p.score < p.threshold,
            "ArbitCore: score passed — call releaseFunds"
        );

        uint256 amount  = p.funds;
        address creator = p.creator;

        // CEI: update state BEFORE external call to prevent reentrancy
        p.funds      = 0;
        p.isReleased = true;

        (bool ok, ) = payable(creator).call{value: amount}("");
        require(ok, "ArbitCore: ETH transfer failed");

        emit FundsRefunded(projectId, creator, amount);
    }

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    /// @notice Owner can rotate the trusted AI oracle address.
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "ArbitCore: zero address");
        emit OracleUpdated(aiOracle, newOracle);
        aiOracle = newOracle;
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    /// @notice Fetch full project data by ID.
    function getProject(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (Project memory)
    {
        return projects[projectId];
    }

    /// @notice Returns true if the project is still active (funds not settled).
    function isActive(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (bool)
    {
        return !projects[projectId].isReleased;
    }

    // ─────────────────────────────────────────────────
    // Reject direct ETH sends to keep accounting clean
    // ─────────────────────────────────────────────────
    receive() external payable {
        revert("ArbitCore: use createProject()");
    }
}
