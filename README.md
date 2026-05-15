# ArcSettle — Cross-Border B2B Invoice Settlement on Arc Testnet

A production-ready MVP for settling B2B invoices using USDC on Arc Testnet. Companies can create, approve, and settle invoices through a clean dashboard with full transaction transparency.

---

## Overview

ArcSettle is a B2B invoice settlement portal where companies can register, create invoices, and settle payments using USDC on Arc Testnet. The current implementation uses a mock settlement provider, but the service layer is architected so that real Circle/Arc integration can be swapped in without changing the core workflow.

## Problem

Cross-border B2B payments are slow, expensive, and difficult to track. Traditional bank intermediaries add days of processing time, high fees, and limited visibility into payment status — making reconciliation painful for finance teams on both sides.

## Solution

ArcSettle replaces bank intermediaries with a simple, transparent invoice workflow:

```
Seller creates invoice → Buyer approves → Settlement processes on-chain → Invoice settled with receipt
```

Payments settle in seconds with a flat 0.5% fee, full audit trail, and a transaction hash for proof of settlement.

---

## MVP Features

- Company registration and login (JWT auth)
- Mock KYC auto-approval
- Invoice creation with buyer selection
- Buyer approval flow
- Mock settlement service (pluggable for real integration)
- Transaction hash generation (0x-prefixed)
- Settlement fee calculation (0.5%)
- Dashboard with stats and invoice status tracking
- Invoice detail page with approve/settle actions
- Settlement receipt with chain and fee info
- Transaction detail page
- Prisma seed data with demo accounts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Validation | Zod |
| Auth | JWT via `jose` + `bcryptjs` |
| Settlement | Mock provider (Circle/Arc-ready architecture) |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React / Next.js App Router)          │
│  Pages: auth, dashboard, invoices, transactions │
├─────────────────────────────────────────────────┤
│  API Routes (Next.js Route Handlers)            │
│  Auth, Invoices, Companies, Settlement          │
├─────────────────────────────────────────────────┤
│  Service Layer                                  │
│  settlementService → mockProvider (swappable)   │
├─────────────────────────────────────────────────┤
│  Database (PostgreSQL + Prisma)                 │
│  companies, invoices, transactions, audit_logs  │
└─────────────────────────────────────────────────┘
```

The settlement service is the integration point. Today it runs `executeMockSettlement()`. Tomorrow it can run `executeArcSettlement()` or `executeCircleSettlement()` — same interface, real on-chain execution.

## Invoice Flow

```
draft → pending_approval → approved → processing → settled
                                                  → failed
       → cancelled
```

| Status | Meaning |
|--------|---------|
| `pending_approval` | Invoice created, waiting for buyer |
| `approved` | Buyer approved, ready to settle |
| `processing` | Settlement in progress on-chain |
| `settled` | Payment confirmed with transaction hash |
| `failed` | Settlement failed (retryable) |

---

## Local Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Set up database
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arcsettle?schema=public"
JWT_SECRET="change-this-in-production"
NEXT_PUBLIC_APP_NAME="ArcSettle"
SETTLEMENT_PROVIDER="mock"
```

## Current Settlement Mode

ArcSettle uses a pluggable settlement provider architecture:

| Provider | Status | Description |
|----------|--------|-------------|
| `mock` | **Active (default)** | Simulates settlement with 1s delay and fake tx hash |
| `arc-wallet` | Scaffolded | Validates inputs, not yet executing real transfers |

The `arc-wallet` provider performs full input validation (wallet addresses, currency, chain, USDC token config) but throws a clear error before any real transaction signing. Once the official USDC contract is deployed on Arc Testnet and client-side signing is integrated, it will execute real ERC-20 transfers.

To switch providers, set `SETTLEMENT_PROVIDER` in `.env`:
```env
SETTLEMENT_PROVIDER=mock        # Default — fake tx hashes
SETTLEMENT_PROVIDER=arc-wallet  # Validates but does not execute yet
```

## Demo Accounts

After running `npx prisma db seed`:

| Role | Email | Password |
|------|-------|----------|
| Seller | `seller@arcsettle.dev` | `password123` |
| Buyer | `buyer@arcsettle.dev` | `password123` |

The seed creates 3 invoices (pending, approved, settled) and a confirmed transaction record.

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit    # TypeScript type check
npm run db:seed      # Seed database
npx prisma studio   # Visual database browser
```

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Mock settlement MVP | ✅ Complete |
| 1.5 | README, seed data, deployment prep | ✅ Complete |
| 2 | Wallet connect (MetaMask / WalletConnect) | Planned |
| 3 | Real Arc Testnet transaction adapter | Planned |
| 4 | Circle Wallets / Paymaster integration | Planned |
| 5 | Multi-currency, compliance, cross-chain (CCTP) | Planned |

---

## Disclaimer

This is an MVP running with **mock settlement**. It is not production financial software. No real funds are transferred. The mock provider generates simulated transaction hashes for demonstration purposes only.

---

## License

MIT
