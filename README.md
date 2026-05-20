# Settlio — B2B Invoice Settlement with USDC on Arc Testnet

Settlio is a demo-ready B2B invoice settlement MVP using USDC on Arc Testnet. It supports invoice creation, buyer approval, connected-wallet settlement, settlement receipts, and Circle-powered developer wallet scaffolding.

> **Note:** This project was originally developed under the ArcSettle repository name. The public product name is **Settlio**.

---

## Live Demo

> **Live Demo:** https://arcsettle-three.vercel.app/

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Seller | `seller@arcsettle.dev` | `password123` |
| Buyer | `buyer@arcsettle.dev` | `password123` |

These accounts are created by `npx prisma db seed`. The login page includes quick-fill buttons so you can sign in with one click.

---

## Demo Flow

1. **Seller logs in** — Use `seller@arcsettle.dev` / `password123`
2. **Seller creates an invoice** — Go to Invoices > New Invoice, select the Buyer company, enter an amount
3. **Buyer logs in** — Sign out, then use `buyer@arcsettle.dev` / `password123`
4. **Buyer approves the invoice** — Open the pending invoice and click Approve
5. **Buyer connects wallet** — Click "Connect Wallet" in the header, switch to Arc Testnet
6. **Buyer saves wallet** — Go to Settings if the wallet is not already saved
7. **Buyer pays with connected wallet** — Click "Pay with Connected Wallet" on the approved invoice
8. **Receipt appears** — After on-chain confirmation, the settlement receipt shows transaction hash, fee, and chain info

> **Public production** uses real wallet settlement (testnet USDC transfer on Arc Testnet).
> **Local development** can use "Demo Mock Settlement" if `ENABLE_MOCK_SETTLEMENT=true`.

---

## Features

- Company registration and login (JWT auth)
- Demo accounts with quick-fill login
- Company wallet settings with uniqueness enforcement
- Invoice creation with buyer selection
- Buyer approval flow
- **Real Arc Testnet wallet settlement** (connected-wallet ERC-20 USDC transfer)
- On-chain receipt verification (Transfer event decode + from/to/amount match)
- Settlement fee calculation (0.5%)
- Buyer/seller same-wallet self-settlement prevention
- Dashboard with stats and invoice status tracking
- Invoice detail page with approve/settle actions
- Settlement receipt with chain and fee info
- Transaction detail page
- Demo mock settlement mode (local/dev only)
- Circle developer-controlled wallet scaffolding (dev/admin)
- Circle transfer preview/execution (dev/admin)
- Circle transaction status sync
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
| Wallet | wagmi + viem (injected connector) |
| Settlement | Real wallet-signed Arc Testnet settlement + demo mock provider + Circle SDK scaffolding |

## Architecture

```
+---------------------------------------------------+
|  Frontend (React / Next.js App Router)            |
|  Pages: auth, dashboard, invoices, transactions   |
+---------------------------------------------------+
|  API Routes (Next.js Route Handlers)              |
|  Auth, Invoices, Companies, Settlement, Circle    |
+---------------------------------------------------+
|  Service Layer                                    |
|  settlementService -> mockProvider (swappable)    |
|  arc-settlement-client -> real ERC-20 transfer    |
|  circleTransactionService -> Circle SDK           |
+---------------------------------------------------+
|  Database (PostgreSQL + Prisma)                   |
|  companies, invoices, transactions, audit_logs    |
+---------------------------------------------------+
```

## Invoice Flow

```
draft -> pending_approval -> approved -> processing -> settled
                                                    -> failed
         -> cancelled
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

## Settlement Modes

| Mode | When | How it works |
|------|------|-------------|
| **Real wallet settlement** | Buyer wallet connected + matches saved address + different from seller | ERC-20 USDC transfer on Arc Testnet, verified on-chain |
| **Demo mock settlement** | `ENABLE_MOCK_SETTLEMENT=true` (local/dev) | Simulates settlement with 1s delay and fake tx hash |
| **Circle transfer** | `CIRCLE_DEV_TOOLS_ENABLED=true` (dev/admin) | Creates Circle developer-controlled wallet transfer |

### Real Wallet Settlement

The "Pay with Connected Wallet" button appears automatically when:
- The buyer has a connected wallet on Arc Testnet (chain ID 5042002)
- The connected wallet matches the buyer's saved wallet address
- Buyer and seller wallets are different
- The invoice is in `approved` status

No feature flag is required. The button appears based on actual wallet safety conditions.

**Backend verification:** The `/record-settlement` endpoint fetches the transaction receipt from Arc Testnet RPC, decodes the ERC-20 Transfer event, and verifies that from/to/amount match the expected values before marking the invoice as settled.

### Demo Mock Settlement (Local Only)

For local development and demo purposes only. Controlled by:
- `SETTLEMENT_PROVIDER="mock"`
- `ENABLE_MOCK_SETTLEMENT="true"` (backend)
- `NEXT_PUBLIC_ENABLE_MOCK_SETTLEMENT="true"` (frontend button)

In production, set both mock flags to `"false"`.

### Circle Settlement (Dev/Admin)

Circle developer-controlled wallet features are scaffolded for dev/admin use:

| Feature | Status |
|---------|--------|
| API key verification | Supported (`GET /api/dev/circle/verify`) |
| Company Circle wallet creation | Supported (dev/admin, `CIRCLE_DEV_TOOLS_ENABLED=true`) |
| Circle transfer preview | Supported (dev/admin) |
| Circle transfer execution | Supported (dev/admin) |
| Circle transaction status sync | Supported (manual poll via endpoint) |
| Public user Circle payments | Not enabled |
| Production webhook/polling | Planned |

Circle settlement only marks an invoice as settled after Circle reports status `COMPLETE`, `CONFIRMED`, or `SUCCESS` via the status sync endpoint.

---

## Circle Configuration

| Variable | Purpose |
|----------|---------|
| `CIRCLE_API_KEY` | Circle API key (server-only, NEVER expose) |
| `CIRCLE_ENTITY_SECRET` | Raw 32-byte hex entity secret (server-only) |
| `CIRCLE_ENTITY_SECRET_CIPHERTEXT` | RSA-encrypted form (manual fallback) |
| `CIRCLE_DEV_TOOLS_ENABLED` | Enable dev/admin Circle endpoints |
| `CIRCLE_API_BASE_URL` | Circle API base URL |

The official `@circle-fin/developer-controlled-wallets` SDK is integrated. It generates fresh entity secret ciphertext automatically for each sensitive request.

---

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
| 1 | Mock settlement MVP | Complete |
| 1.5 | README, seed data, deployment prep | Complete |
| 2 | Wallet connect + company wallet settings | Complete |
| 3 | Real Arc Testnet wallet settlement + on-chain verification | Complete / demo-ready |
| 4 | Circle Wallets / transaction status sync | Scaffolded / dev-ready |
| 5 | Production webhook/polling automation | Planned |
| 6 | PDF receipts / invoice export | Planned |
| 7 | Compliance / business onboarding | Planned |
| 8 | Multi-currency, cross-chain (CCTP) | Planned |

---

## Security Notes

### Environment

- `.env` is gitignored and never committed
- All secrets (`JWT_SECRET`, `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`) are server-only
- `NEXT_PUBLIC_*` variables contain no secrets — only UI feature flags

### Mock Settlement

- Mock settlement is disabled in production (`ENABLE_MOCK_SETTLEMENT="false"`)
- The "Demo Mock Settlement" button only appears when explicitly enabled
- Mock settlement generates simulated transaction hashes — no real funds move

### Real Wallet Settlement

The `/api/invoices/:id/record-settlement` endpoint requires ALL of:
- Authenticated user who is the **buyer** (payer) of the invoice
- Valid `transactionHash` (0x-prefixed, 64 hex chars)
- Valid `fromWallet` matching the buyer's wallet address on record
- Valid `toWallet` matching the seller's wallet address on record
- `amount` matching the invoice amount
- `chain` identifier
- On-chain receipt verification (Transfer event decode)

If any validation fails, settlement is rejected.

### Self-Settlement Prevention

- **Buyer and seller wallets must be different** — enforced at invoice creation, mock settlement, wallet settlement, and Circle transfer endpoints
- The frontend shows a red warning and disables settlement buttons when wallets match

### Company Wallets

- Managed in Dashboard > Settings
- Normalized to lowercase, validated as EVM addresses
- Must be unique per company (backend rejects duplicates)

### Circle Dev Endpoints

- All Circle dev endpoints require `CIRCLE_DEV_TOOLS_ENABLED="true"`
- In production, set to `"false"` to disable entirely
- Secrets are never returned in API responses or logged

### Production Configuration

```env
SETTLEMENT_PROVIDER="mock"
ENABLE_MOCK_SETTLEMENT="false"
NEXT_PUBLIC_ENABLE_MOCK_SETTLEMENT="false"
CIRCLE_DEV_TOOLS_ENABLED="false"
```

---

## Disclaimer

This is an MVP/testnet application. Real wallet settlement submits testnet transactions on Arc Testnet using testnet USDC. It is not production financial software and should not be used for mainnet funds.

---

## License

MIT
