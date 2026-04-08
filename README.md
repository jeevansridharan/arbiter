<div align="center">

# ⚡ Arbit

### *AI-powered PayFi protocol for autonomous payouts*

> **"Stop waiting for approval. Let the AI decide. Let the chain pay."**

[![Built for BCH Hackathon](https://img.shields.io/badge/🏆_BCH_Hackathon-PayFi_%2B_AI-blueviolet?style=for-the-badge)](https://github.com)
[![HashKey Chain](https://img.shields.io/badge/HashKey_Chain-EVM-00c9ff?style=for-the-badge&logo=ethereum)](https://hsk.xyz)
[![Groq AI](https://img.shields.io/badge/Groq-LLM_Powered-ff6b6b?style=for-the-badge)](https://groq.com)
[![React](https://img.shields.io/badge/React-Frontend-61dafb?style=for-the-badge&logo=react)](https://reactjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## 🚀 Introduction

**Arbit** is a decentralized, AI-driven funding protocol that eliminates human governance from the payout process. Built on **HashKey Chain** (EVM-compatible) and powered by **Groq's LLM**, Arbit evaluates submitted work autonomously and releases payments through smart contracts — no middlemen, no delays, no bias.

Whether you're a freelancer, an open-source contributor, or a DAO participant, Arbit makes sure *your work speaks for itself* — and the AI + blockchain combination ensures you get paid for it, instantly.

> 🏗️ **Built for the BCH Hackathon** · Tracks: **PayFi + AI**

---

## 🧠 How It Works

Arbit follows a clean, 5-step autonomous pipeline:

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
│                  ARBIT BACKEND API                   │
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
│                  HASHKEY CHAIN                       │
│          (Testnet: testnet.hsk.xyz)                  │
│                                                      │
│      Arbit Smart Contract (Solidity)                 │
│      • Holds funds in escrow                         │
│      • Reads AI score via backend oracle             │
│      • Releases payout autonomously                  │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 How to Run Locally

### Prerequisites

- Node.js `v18+`
- npm or yarn
- MetaMask (or any EVM wallet)
- A Groq API Key → [console.groq.com](https://console.groq.com)
- HashKey Chain Testnet configured in your wallet

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/arbit.git
cd arbit
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# HashKey Chain
RPC_URL=https://testnet.hsk.xyz
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
npm run dev

# Start Frontend (from /frontend)
npm run dev
```

### 5. Connect Your Wallet

Configure MetaMask for **HashKey Chain Testnet**:

| Field | Value |
|-------|-------|
| Network Name | HashKey Chain Testnet |
| RPC URL | `https://testnet.hsk.xyz` |
| Chain ID | `177` |
| Currency Symbol | `HSK` |
| Block Explorer | `https://testnet-explorer.hsk.xyz` |

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

### ✅ Phase 1 — Foundation *(Current)*
- [x] React UI scaffolded
- [x] Groq AI evaluation endpoint live
- [x] AI scoring pipeline running (0–100 scores)
- [x] Wallet integration (HashKey Chain Testnet)
- [ ] Smart contract integration (in progress)

### 🔄 Phase 2 — Core Protocol
- [ ] Full on-chain payout via smart contract
- [ ] Milestone-based escrow logic
- [ ] Live deployment on HashKey Chain Mainnet
- [ ] Score audit trail on-chain

### 🚀 Phase 3 — Scale & Ecosystem
- [ ] DAO integration for fund pooling
- [ ] Multi-chain support
- [ ] SDK for third-party dApps
- [ ] Reputation system for contributors

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve Arbit:

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

**Built with ❤️ for the BCH Hackathon**

*PayFi + AI · HashKey Chain · Groq · Autonomous Payouts*

⭐ **Star this repo if you believe AI should replace governance** ⭐

</div>