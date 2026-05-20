import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden">
      {/* Background grid pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold">Sett<span className="text-indigo-400">lio</span></span>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it Works</a>
                <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#demo" className="text-sm text-gray-400 hover:text-white transition-colors">Demo</a>
                <a href="#security" className="text-sm text-gray-400 hover:text-white transition-colors">Security</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://github.com/zalana28/arcsettle" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-all">
                <GitHubIcon />
                GitHub
              </a>
              <Link href="/auth/login" className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 sm:pt-32 sm:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Built for USDC settlement on Arc Testnet
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Settle B2B invoices{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  with USDC on Arc.
                </span>
              </h1>
              <p className="text-lg text-gray-400 mb-8 max-w-lg">
                Create invoices, approve payments, pay with connected wallets, and generate verifiable settlement receipts on Arc Testnet.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-500/25">
                  Launch App
                  <ArrowIcon />
                </Link>
                <a href="https://github.com/zalana28/arcsettle" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-all">
                  View GitHub
                </a>
              </div>
            </div>

            {/* Product Mockup Card */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Invoice</p>
                      <p className="text-lg font-semibold text-white">INV-ARC-2026</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                      Ready for Settlement
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <p className="text-3xl font-bold text-white">1,250.00 <span className="text-lg text-gray-400">USDC</span></p>
                    <p className="text-sm text-gray-500 mt-1">Arc Testnet &middot; 0.5% fee</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <span className="text-sm text-gray-300">Buyer approved</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <span className="text-sm text-gray-300">Wallet verified</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <span className="text-sm text-gray-300">Receipt generated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="relative z-10 py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Live on Vercel", sub: "Demo-ready MVP" },
              { label: "Arc Testnet", sub: "Chain ID 5042002" },
              { label: "USDC Settlement", sub: "Testnet payments" },
              { label: "Wallet Verified", sub: "Buyer/seller guard" },
              { label: "Receipt Ready", sub: "On-chain proof" },
            ].map((m) => (
              <div key={m.label} className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-xl p-4 text-center hover:border-indigo-500/30 transition-colors">
                <p className="text-sm font-semibold text-white">{m.label}</p>
                <p className="text-xs text-gray-500 mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">From invoice to receipt in <span className="text-indigo-400">4 steps</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">The complete settlement flow — from creation to on-chain verification.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Seller creates invoice", desc: "Set amount, currency, and buyer company. Invoice enters pending approval.", icon: <InvoiceIcon /> },
              { step: "02", title: "Buyer approves", desc: "Buyer reviews and approves the invoice. It becomes ready for settlement.", icon: <ApproveIcon /> },
              { step: "03", title: "Buyer pays with wallet", desc: "Connected wallet signs a USDC transfer on Arc Testnet. Real on-chain transaction.", icon: <WalletIcon /> },
              { step: "04", title: "Receipt verified", desc: "Backend verifies the Transfer event on-chain. Settlement receipt generated.", icon: <ReceiptIcon /> },
            ].map((s) => (
              <div key={s.step} className="group relative bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all">
                <div className="absolute top-4 right-4 text-5xl font-black text-white/[0.03] group-hover:text-indigo-500/10 transition-colors">{s.step}</div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Everything needed for testnet B2B invoice settlement.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Invoice Creation & Approval", desc: "Create invoices with buyer selection. Buyers review and approve before settlement." },
              { title: "Connected-Wallet USDC Settlement", desc: "Pay with Connected Wallet button appears when buyer wallet conditions are met. Real ERC-20 transfer." },
              { title: "Company Wallet Settings", desc: "Manage wallet addresses in Settings. Addresses normalized and unique per company." },
              { title: "Buyer/Seller Wallet Guard", desc: "Self-settlement blocked. Buyer and seller must have different wallet addresses." },
              { title: "On-Chain Receipt Verification", desc: "Backend fetches transaction receipt, decodes Transfer event, verifies from/to/amount match." },
              { title: "Circle Developer Wallet Scaffolding", desc: "Circle SDK integrated. Dev/admin can create wallets, preview transfers, and sync transaction status." },
            ].map((f) => (
              <div key={f.title} className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all">
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Settlement Layer</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Pluggable architecture — from mock to real wallet to Circle.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Seller Invoice", color: "from-indigo-500/20 to-indigo-600/10" },
              { label: "Buyer Approval", color: "from-cyan-500/20 to-cyan-600/10" },
              { label: "Wallet Payment", color: "from-violet-500/20 to-violet-600/10" },
              { label: "Receipt Verification", color: "from-green-500/20 to-green-600/10" },
            ].map((s, i) => (
              <div key={s.label} className="relative">
                <div className={`bg-gradient-to-br ${s.color} border border-white/5 rounded-xl p-5 text-center`}>
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                </div>
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-white/10" />}
              </div>
            ))}
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-indigo-400 font-medium mb-1">Primary</p>
              <p className="text-sm text-gray-300">Real wallet-signed Arc Testnet settlement</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-amber-400 font-medium mb-1">Demo</p>
              <p className="text-sm text-gray-300">Mock provider for local testing</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-cyan-400 font-medium mb-1">Scaffolded</p>
              <p className="text-sm text-gray-300">Circle-powered wallet scaffolding &amp; status sync</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Accounts */}
      <section id="demo" className="relative z-10 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Demo Accounts</h2>
            <p className="text-gray-400">Public seed accounts for reviewers and testers.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-indigo-300">S</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Seller</h3>
              <p className="text-sm text-gray-400 font-mono">seller@arcsettle.dev</p>
              <p className="text-sm text-gray-500 font-mono">password123</p>
            </div>
            <div className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-cyan-300">B</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Buyer</h3>
              <p className="text-sm text-gray-400 font-mono">buyer@arcsettle.dev</p>
              <p className="text-sm text-gray-500 font-mono">password123</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-500/25">
              Launch Demo
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Security & MVP Notes</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              "Testnet MVP — not mainnet financial software",
              "Mock settlement disabled for public production",
              "Real settlement requires buyer auth + matching wallet + tx hash + receipt verification",
              "Buyer and seller wallets must be different",
              "Circle dev tools disabled in production",
              "On-chain Transfer event decoded and verified",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="w-3 h-3 text-green-400" />
                </div>
                <p className="text-sm text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to test B2B settlement on Arc?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">Connect your wallet, approve an invoice, and settle with USDC on Arc Testnet.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-500/25">
              Launch App
              <ArrowIcon />
            </Link>
            <a href="https://github.com/zalana28/arcsettle" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-all">
              View GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">Settlio — B2B invoice settlement with USDC on Arc Testnet.</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/zalana28/arcsettle" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors">GitHub</a>
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-white transition-colors">Launch App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Inline Icons ────────────────────────────────────────────────────────── */

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ApproveIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}
