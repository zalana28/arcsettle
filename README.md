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

The `arc-wallet` provider performs full input validation (wallet addresses, currency, chain, USDC token config) but throws a clear error before any real transaction signing. Once client-side wallet signing is integrated, it will execute real ERC-20 transfers on Arc Testnet.

Arc Testnet USDC ERC-20 interface is configured at `0x3600000000000000000000000000000000000000` (6 decimals). Arc uses USDC as the native gas token with 18 decimals for gas accounting, while the linked ERC-20 interface uses 6 decimals.

To switch providers, set `SETTLEMENT_PROVIDER` in `.env`:
```env
SETTLEMENT_PROVIDER=mock        # Default — fake tx hashes
SETTLEMENT_PROVIDER=arc-wallet  # Validates but does not execute yet
```

## Real Arc Settlement (Experimental)

A client-side wallet-signed USDC settlement flow is available behind a feature flag:

```env
NEXT_PUBLIC_ENABLE_REAL_ARC_SETTLEMENT=true
```

**Disabled by default.** When enabled:
- The buyer sees a "Pay with Connected Wallet" button on approved invoices
- Requires a connected wallet on Arc Testnet (chain ID 5042002)
- Executes a real ERC-20 USDC transfer from buyer → seller
- Uses the Arc Testnet USDC interface at `0x3600000000000000000000000000000000000000`
- After on-chain confirmation, the frontend calls `/api/invoices/:id/record-settlement` to persist the result
- The mock "Settle Invoice" button remains available as a fallback

**Backend verification:** The `/record-settlement` endpoint now includes on-chain receipt verification. It fetches the transaction receipt from Arc Testnet RPC, decodes the ERC-20 Transfer event, and verifies that from/to/amount match the expected values before marking the invoice as settled. Production use still requires additional monitoring and compliance checks (e.g., block confirmation depth, transaction age limits, rate limiting).

## Testing Real Arc Settlement in Preview

For Vercel Preview deployments or local testing:

| Environment | `NEXT_PUBLIC_ENABLE_REAL_ARC_SETTLEMENT` |
|-------------|------------------------------------------|
| **Production** | `false` (default, mock only) |
| **Preview** | `true` (enables real wallet signing) |

When enabled in Preview:
- Buyer must have a connected wallet on Arc Testnet (chain ID 5042002)
- Connected wallet must match the saved buyer wallet address
- Buyer wallet needs Arc Testnet USDC balance to cover the invoice amount
- A confirmation modal shows transaction details before signing
- After on-chain confirmation, the backend verifies the transaction receipt before recording settlement
- An "Experimental" banner is shown to indicate real mode is active

## Circle API Integration Status

Circle API key verification is supported for future Circle Wallets / Paymaster integration:

| Feature | Status |
|---------|--------|
| API key verification | ✅ Supported (`GET /api/dev/circle/verify`) |
| Circle Wallets | ✅ Scaffolded (dev endpoints) |
| Circle Paymaster | Not enabled yet |
| Circle Payments | Not enabled yet |

**Important:**
- The Circle API key (`CIRCLE_API_KEY`) must remain server-side only — never exposed to the frontend
- Existing settlement modes (mock + Arc wallet-signed) remain unchanged
- Circle payments will be added in a future phase once the API key is verified and Circle services are configured

To verify your Circle API key:
```bash
curl http://localhost:3000/api/dev/circle/verify
```

## Circle Wallets Service

A server-side Circle Wallets service scaffold exists for managing developer-controlled wallets:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dev/circle/wallets` | GET | List wallets |
| `/api/dev/circle/wallets/:id` | GET | Get wallet by ID |
| `/api/dev/circle/wallets` | POST | Create wallet (dev-only, protected) |

**Dev endpoints are for testing only.** The POST endpoint is protected:
- In production (`NODE_ENV=production`), wallet creation is disabled unless `CIRCLE_DEV_TOOLS_ENABLED=true`
- These endpoints are not meant for public users
- Circle payments and settlement via Circle Wallets are not enabled yet
- The API key remains server-side only

## Circle SDK Integration

The official `@circle-fin/developer-controlled-wallets` SDK is integrated for future wallet operations:

| Component | Status |
|-----------|--------|
| SDK installed | ✅ |
| SDK client helper | ✅ (`getCircleDeveloperWalletsClient()`) |
| Config status endpoint | ✅ (`GET /api/dev/circle/sdk/status`) |
| Wallet creation via SDK | Not enabled yet |
| Transactions via SDK | Not enabled yet |

**Why the SDK?** Circle's entity secret ciphertext is single-use. The SDK generates fresh ciphertext automatically for each sensitive request, so you don't need to manage `CIRCLE_ENTITY_SECRET_CIPHERTEXT` manually.

**Required environment variables:**
- `CIRCLE_API_KEY` — Circle API key (server-only)
- `CIRCLE_ENTITY_SECRET` — 32-byte hex entity secret (server-only)

**Important:**
- Both secrets must remain server-side — never exposed to frontend or logs
- Circle wallet creation is not enabled yet
- Existing settlement modes (mock + Arc wallet-signed) remain unchanged

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
