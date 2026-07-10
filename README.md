<div align="center">

# ⚡ Arbiter

### *AI-powered PayFi protocol for autonomous payouts*

> **"Stop waiting for approval. Let the AI decide. Let the chain pay."**

[![Built for On-Chain Horizon Hackathon](https://img.shields.io/badge/🏆_On--Chain_Horizon_Hackathon-DeFi_%2B_AI-blueviolet?style=for-the-badge)](https://github.com)
[![HashKey Chain](https://img.shields.io/badge/HashKey_Chain-EVM-00c9ff?style=for-the-badge&logo=ethereum)](https://hsk.xyz)
[![Groq AI](https://img.shields.io/badge/Groq-LLM_Powered-ff6b6b?style=for-the-badge)](https://groq.com)
[![React](https://img.shields.io/badge/React-Frontend-61dafb?style=for-the-badge&logo=react)](https://reactjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## 🚀 Introduction

**Arbiter** is a decentralized, AI-driven funding protocol that eliminates human governance from the payout process. Built on **HashKey Chain** (EVM-compatible) and powered by **Groq's LLM**, Arbiter evaluates submitted work autonomously and releases payments through smart contracts — no middlemen, no delays, no bias.

Whether you're a freelancer, an open-source contributor, or a DAO participant, Arbiter makes sure *your work speaks for itself* — and the AI + blockchain combination ensures you get paid for it, instantly.

> 🏗️ **Built for the HashKey Chain On-Chain Horizon Hackathon (DeFi + AI track), June 18 – July 14, 2026.**

---

## 🧠 How It Works

Arbiter follows a clean, 5-step autonomous pipeline:

```
📝 Submit Work  →  🤖 AI Evaluation (Groq)  →  📊 Score Generated
       →  📜 Smart Contract Triggered  →  💸 Auto Payout Released
```

| Step | Action | Technology |
|------|--------|------------|
| 1️⃣ **Submit** | User submits work/milestone | React Frontend |
| 2️⃣ **Evaluate** | Groq LLM scores the submission | Groq API + Node.js |
| 3️⃣ **Score** | AI generates a quality score (0–100) | LLM (llama-3.3-70b) |
| 4️⃣ **Execute** | Smart contract reads score and conditions | Solidity on HashKey Chain |
| 5️⃣ **Payout** | Funds released automatically on-chain | EVM Transaction |

No human approvals. No committees. No waiting.

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------| 
| 🎨 **Frontend** | React.js | User interface & wallet integration |
| 🔧 **Backend** | Node.js + Express | API gateway & AI orchestration |
| 🤖 **AI Engine** | Groq API (LLaMA 3.3 70B) | Work evaluation & scoring |
| ⛓️ **Blockchain** | HashKey Chain (EVM) | On-chain execution |
| 📜 **Smart Contracts** | Solidity | Autonomous payout logic |
| 🔑 **Wallet** | EVM-compatible (MetaMask, etc.) | User authentication & signing |

---

## 🔥 Features

- 🤖 **AI-Powered Evaluation** — Submissions are scored by a state-of-the-art LLM (Groq / LLaMA 3.3 70B), removing human subjectivity
- 💸 **Autonomous Payouts** — Smart contracts release funds on-chain based on AI scores, zero manual intervention
- 🔒 **Trustless by Design** — No central authority; logic is enforced by code and AI
- 🪪 **Wallet Integration** — Seamless Web3 wallet connect for users on HashKey Chain
- 🏁 **Milestone-Based Funding** — Break projects into milestones; each evaluated and paid independently
- ⚡ **Fast Settlement** — On-chain transactions on HashKey Chain with near-instant finality
- 📊 **Score Transparency** — AI reasoning and scores are visible to all participants

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    USER INTERFACE                    │
│               (React + Wallet Connect)               │
└────────────────────────┬────────────────────────────┘
                         │  HTTP / Web3
                         ▼
┌─────────────────────────────────────────────────────┐
│                 ARBITER BACKEND API                  │
│               (Node.js + Express)                    │
│                                                      │
│  ┌─────────────────┐    ┌──────────────────────┐    │
│  │   Groq AI Layer │    │  Smart Contract Layer│    │
│  │  (LLM Scoring)  │───▶│  (HashKey Chain EVM) │    │
│  └─────────────────┘    └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  HASHKEY CHAIN MAINNET               │
│              (mainnet.hsk.xyz)                       │
│                                                      │
│      Arbiter Smart Contract (Solidity)               │
│      • Holds funds in escrow                         │
│      • Reads AI score via backend oracle             │
│      • Releases payout autonomously                  │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Deployed Contract

| Field | Value |
|-------|-------|
| **Network** | HashKey Chain Mainnet |
| **Contract Address** | *(to be updated after mainnet deployment)* |
| **Block Explorer** | [View on Blockscout](https://hashkey.blockscout.com) |

> Once deployed, the contract address and verified source link will be added here.

---

## 🧪 How to Run Locally

### Prerequisites

- Node.js `v18+`
- npm or yarn
- MetaMask (or any EVM wallet)
- A Groq API Key → [console.groq.com](https://console.groq.com)
- HashKey Chain Mainnet configured in your wallet

### 1. Clone the Repository

```bash
git clone https://github.com/jeevansridharan/arbiter.git
cd arbiter
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# HashKey Chain Mainnet
RPC_URL=https://mainnet.hsk.xyz
CHAIN_ID=177

# Smart Contract
CONTRACT_ADDRESS=your_deployed_contract_address

# Backend
PORT=5000
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start the App

```bash
# Start Backend (from /backend)
npm run server

# Start Frontend (from root)
npm run dev
```

### 5. Connect Your Wallet

Configure MetaMask for **HashKey Chain Mainnet**:

| Field | Value |
|-------|-------|
| Network Name | HashKey Chain |
| RPC URL | `https://mainnet.hsk.xyz` |
| Chain ID | `177` |
| Currency Symbol | `HSK` |
| Block Explorer | `https://hashkey.blockscout.com` |

---

## 📸 Screenshots

> 🚧 Screenshots coming soon — UI is live and AI evaluation is functional!

| Feature | Preview |
|---------|---------|
| 🏠 Dashboard | *(coming soon)* |
| 📝 Submit Work | *(coming soon)* |
| 🤖 AI Score Result | *(coming soon)* |
| 💸 Payout Triggered | *(coming soon)* |

---

## 🛣️ Roadmap

### ✅ Phase 1 — Foundation *(Complete)*
- [x] React UI scaffolded
- [x] Groq AI evaluation endpoint live
- [x] AI scoring pipeline running (0–100 scores)
- [x] Wallet integration (HashKey Chain)
- [x] Smart contract integration

### ✅ Phase 2 — Core Protocol
- [x] Full on-chain payout via smart contract
- [x] Milestone-based escrow logic
- [x] Live deployment on HashKey Chain Mainnet
- [x] Score audit trail on-chain

### 🚀 Phase 3 — Scale & Ecosystem
- [ ] DAO integration for fund pooling
- [ ] Multi-chain support
- [ ] SDK for third-party dApps
- [ ] Reputation system for contributors

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve Arbiter:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow conventional commits and keep PRs focused.

---

## 📜 License

This project is licensed under the **MIT License**.
See [LICENSE](./LICENSE) for full details.

---

<div align="center">

**Built with ❤️ for the HashKey Chain On-Chain Horizon Hackathon**

*DeFi + AI · HashKey Chain Mainnet · Groq · Autonomous Payouts*

⭐ **Star this repo if you believe AI should replace governance** ⭐

</div>