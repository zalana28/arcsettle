"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import {
  validateWalletForSettlement,
  executeUsdcTransfer,
  recordSettlementOnBackend,
  type ArcSettlementStatus,
} from "@/lib/arc-settlement-client";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  description: string;
  dueDate: string;
  status: string;
  approvedAt: string | null;
  settlementHash: string | null;
  settlementDate: string | null;
  settlementFee: string | null;
  createdAt: string;
  seller: { id: string; name: string; email: string; walletAddress: string | null };
  buyer: { id: string; name: string; email: string; walletAddress: string | null };
  transactions: {
    id: string;
    transactionHash: string | null;
    status: string;
    chain: string;
    amount: string;
  }[];
}

const ARC_SETTLEMENT_STATUS_LABELS: Record<ArcSettlementStatus, string> = {
  idle: "",
  awaiting_signature: "Waiting for wallet signature...",
  submitted: "Transaction submitted to Arc Testnet...",
  confirming: "Waiting for on-chain confirmation...",
  confirmed: "Transaction confirmed! Recording settlement...",
  recording: "Recording settlement on backend...",
  complete: "Settlement complete!",
  error: "Settlement failed",
};

function getArcScanTxUrl(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Real settlement state
  const [arcStatus, setArcStatus] = useState<ArcSettlementStatus>("idle");
  const [arcTxHash, setArcTxHash] = useState<string | null>(null);

  // Wagmi hooks for real settlement
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();

  const mockSettlementEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_SETTLEMENT !== "false";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCurrentUserId(data.data.id);
      });
  }, []);

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    if (data.success) {
      setInvoice(data.data);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Approval failed");
      } else {
        await fetchInvoice();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMockSettle = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${id}/settle`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Settlement failed");
      } else {
        await fetchInvoice();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRealSettle = useCallback(async () => {
    if (!invoice) return;

    setShowConfirmModal(false);
    setError("");
    setArcStatus("idle");
    setArcTxHash(null);
    setActionLoading(true);

    try {
      const toAddress = invoice.seller.walletAddress as `0x${string}`;
      const amount = parseFloat(invoice.amount);

      const { txHash } = await executeUsdcTransfer({
        toAddress,
        amount,
        onStatusChange: setArcStatus,
      });

      setArcTxHash(txHash);
      setArcStatus("recording");

      const result = await recordSettlementOnBackend({
        invoiceId: id,
        transactionHash: txHash,
        fromWallet: connectedAddress!,
        toWallet: toAddress,
        amount,
      });

      if (!result.success) {
        setError(result.error || "Failed to record settlement");
        setArcStatus("error");
      } else {
        setArcStatus("complete");
        await fetchInvoice();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Settlement failed";
      setError(message);
      setArcStatus("error");
    } finally {
      setActionLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, id, connectedAddress]);

  if (loading) {
    return <div className="animate-pulse text-gray-500">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="text-red-500">Invoice not found</div>;
  }

  const isBuyer = currentUserId === invoice.buyer.id;
  const isSeller = currentUserId === invoice.seller.id;
  const walletsReady = !!invoice.seller.walletAddress && !!invoice.buyer.walletAddress;
  const sameWallet =
    !!invoice.seller.walletAddress &&
    !!invoice.buyer.walletAddress &&
    invoice.seller.walletAddress.toLowerCase() === invoice.buyer.walletAddress.toLowerCase();

  // Wallet settlement readiness — always computed from wagmi state (same source as header)
  const walletValidationError = isBuyer
    ? validateWalletForSettlement(connectedAddress, invoice.buyer.walletAddress || undefined, chainId)
    : null;

  // Determine wallet-aware settlement status for the buyer
  const buyerWalletConnected = !!connectedAddress;
  const buyerWalletMatchesSaved =
    buyerWalletConnected &&
    !!invoice.buyer.walletAddress &&
    connectedAddress!.toLowerCase() === invoice.buyer.walletAddress.toLowerCase();
  const buyerWalletSaved = !!invoice.buyer.walletAddress;

  // Detailed disabled reasons for real settlement
  const getDisabledReasons = (): string[] => {
    const reasons: string[] = [];
    if (!connectedAddress) reasons.push("Wallet not connected");
    else if (chainId !== ARC_TESTNET_CHAIN_ID) reasons.push("Wrong network — switch to Arc Testnet");
    else if (
      invoice.buyer.walletAddress &&
      connectedAddress.toLowerCase() !== invoice.buyer.walletAddress.toLowerCase()
    )
      reasons.push("Connected wallet does not match buyer wallet");
    if (!invoice.buyer.walletAddress) reasons.push("Missing buyer wallet address");
    if (!invoice.seller.walletAddress) reasons.push("Missing seller wallet address");
    if (invoice.status !== "approved") reasons.push("Invoice is not in approved status");
    return reasons;
  };

  // Dev-only wallet state debug logging
  if (process.env.NODE_ENV === "development" && invoice.status === "approved" && isBuyer) {
    console.log("[wallet-debug]", {
      connectedWalletAddress: connectedAddress || null,
      buyerWalletAddress: invoice.buyer.walletAddress || null,
      walletsMatch: buyerWalletMatchesSaved,
      chain: chainId,
      mockSettlementEnabled,
    });
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/invoices" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Invoices
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Invoice Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-gray-500 mt-1">{invoice.description}</p>
          </div>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              INVOICE_STATUS_COLORS[invoice.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              ${parseFloat(invoice.amount).toLocaleString()} {invoice.currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Chain</p>
            <p className="text-lg font-medium text-gray-900">Arc Testnet</p>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Seller / Receiver</h3>
          <p className="font-medium text-gray-900">{invoice.seller.name}</p>
          <p className="text-sm text-gray-600">{invoice.seller.email}</p>
          {invoice.seller.walletAddress ? (
            <p className="text-xs text-gray-500 mt-2 font-mono break-all">
              {invoice.seller.walletAddress}
            </p>
          ) : (
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Wallet not connected
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Buyer / Payer</h3>
          <p className="font-medium text-gray-900">{invoice.buyer.name}</p>
          <p className="text-sm text-gray-600">{invoice.buyer.email}</p>
          {invoice.buyer.walletAddress ? (
            <p className="text-xs text-gray-500 mt-2 font-mono break-all">
              {invoice.buyer.walletAddress}
            </p>
          ) : (
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Wallet not connected
            </span>
          )}
        </div>
      </div>

      {/* Same wallet warning */}
      {sameWallet && invoice.status === "approved" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <strong>Invalid invoice:</strong> buyer and seller wallets are the same.
          Update wallet settings before settlement.
        </div>
      )}

      {/* Actions */}
      {invoice.status === "pending_approval" && isBuyer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Action Required</h3>
          <p className="text-sm text-yellow-700 mb-4">
            This invoice is waiting for your approval before it can be settled.
          </p>
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Approving..." : "Approve Invoice"}
          </button>
        </div>
      )}

      {invoice.status === "approved" && (isBuyer || isSeller) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Ready for Settlement</h3>
          <p className="text-sm text-blue-700 mb-2">
            This invoice has been approved and is ready for settlement on Arc Testnet.
          </p>
          <p className="text-sm text-blue-700 mb-4">
            Settlement fee: <strong>0.5%</strong> ($
            {(parseFloat(invoice.amount) * 0.005).toFixed(2)} USDC)
          </p>

          {!walletsReady || sameWallet ? (
            <div>
              <p className="text-sm text-amber-700 mb-3 font-medium">
                {sameWallet
                  ? "Buyer and seller wallets are the same. Update wallet settings before settlement."
                  : "Both parties must connect wallets before settlement."}
              </p>
              <button
                disabled
                className="px-6 py-2.5 bg-blue-300 text-white rounded-lg font-medium cursor-not-allowed opacity-60"
              >
                Settle Invoice
              </button>
            </div>
          ) : isBuyer && buyerWalletConnected && buyerWalletSaved && buyerWalletMatchesSaved ? (
            <RealSettlementSection
              walletError={walletValidationError}
              disabledReasons={getDisabledReasons()}
              arcStatus={arcStatus}
              arcTxHash={arcTxHash}
              actionLoading={actionLoading}
              onSettle={() => setShowConfirmModal(true)}
              onMockSettle={mockSettlementEnabled ? handleMockSettle : undefined}
              mockSettlementEnabled={mockSettlementEnabled}
            />
          ) : isBuyer && buyerWalletConnected ? (
            <div>
              {!buyerWalletSaved ? (
                <p className="text-sm text-amber-700 mb-3 font-medium">
                  Save your connected wallet in Settings before settlement.
                </p>
              ) : !buyerWalletMatchesSaved ? (
                <p className="text-sm text-amber-700 mb-3 font-medium">
                  Connected wallet does not match the buyer wallet.
                </p>
              ) : null}
              {mockSettlementEnabled && (
                <div className="mb-3">
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">
                      Demo mode: no wallet transaction will be sent. This uses mock settlement for demonstration only.
                    </p>
                  </div>
                  <button
                    onClick={handleMockSettle}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? "Settling..." : "Demo Mock Settlement"}
                  </button>
                </div>
              )}
            </div>
          ) : mockSettlementEnabled ? (
            <div>
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 font-medium">
                  Demo mode: no wallet transaction will be sent. This uses mock settlement for demonstration only.
                </p>
              </div>
              <button
                onClick={handleMockSettle}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Settling..." : "Demo Mock Settlement"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Connect your wallet to settle this invoice on-chain.
              </p>
              <button
                disabled
                className="px-6 py-2.5 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed opacity-60"
              >
                Connect wallet before settlement
              </button>
            </div>
          )}
        </div>
      )}

      {/* Real settlement progress indicator */}
      {arcStatus !== "idle" && arcStatus !== "complete" && arcStatus !== "error" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-purple-800 mb-2">On-Chain Settlement</h3>
          <div className="flex items-center gap-3">
            <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
            <p className="text-sm text-purple-700">{ARC_SETTLEMENT_STATUS_LABELS[arcStatus]}</p>
          </div>
          {arcTxHash && (
            <p className="text-xs text-purple-600 font-mono mt-2 break-all">TX: {arcTxHash}</p>
          )}
        </div>
      )}

      {/* Settlement Receipt */}
      {invoice.status === "settled" && invoice.settlementHash && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-green-800 mb-4">Settlement Receipt</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-green-700">Transaction Hash</span>
              <span className="text-sm font-mono text-green-900 break-all">
                {invoice.settlementHash}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-700">Settlement Date</span>
              <span className="text-sm text-green-900">
                {invoice.settlementDate
                  ? new Date(invoice.settlementDate).toLocaleString()
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-700">Settlement Fee</span>
              <span className="text-sm text-green-900">
                {invoice.settlementFee
                  ? `$${parseFloat(invoice.settlementFee).toFixed(2)} USDC`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-700">Chain</span>
              <span className="text-sm text-green-900">Arc Testnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-700">Currency</span>
              <span className="text-sm text-green-900">USDC</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 flex flex-wrap gap-4">
            {invoice.settlementHash.match(/^0x[a-fA-F0-9]{64}$/) && (
              <a
                href={getArcScanTxUrl(invoice.settlementHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 hover:text-green-900 hover:underline"
              >
                View on ArcScan →
              </a>
            )}
            {invoice.transactions[0] && (
              <Link
                href={`/dashboard/transactions/${invoice.transactions[0].id}`}
                className="text-sm text-green-700 hover:text-green-900 hover:underline"
              >
                View Transaction Details →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Processing state with Circle status check */}
      {invoice.status === "processing" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-purple-800 mb-2">Settlement in Progress</h3>
          <p className="text-sm text-purple-700 mb-4">
            Your invoice is being settled on Arc Testnet. This usually takes a few seconds.
          </p>
          {invoice.transactions.some((t) => t.status === "pending") && (
            <CheckCircleStatusButton invoiceId={id} onStatusChecked={fetchInvoice} />
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-3 text-sm">
          <TimelineItem label="Created" date={invoice.createdAt} />
          {invoice.approvedAt && <TimelineItem label="Approved" date={invoice.approvedAt} />}
          {invoice.settlementDate && <TimelineItem label="Settled" date={invoice.settlementDate} />}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && invoice && (
        <ConfirmSettlementModal
          invoice={invoice}
          connectedAddress={connectedAddress}
          onConfirm={handleRealSettle}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}

function ConfirmSettlementModal({
  invoice,
  connectedAddress,
  onConfirm,
  onCancel,
}: {
  invoice: InvoiceDetail;
  connectedAddress: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Settlement</h3>
        <div className="space-y-3 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Invoice</span>
            <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium text-gray-900">
              ${parseFloat(invoice.amount).toLocaleString()} {invoice.currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Currency</span>
            <span className="font-medium text-gray-900">USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">From (Buyer)</span>
            <span className="font-mono text-xs text-gray-700">
              {connectedAddress ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">To (Seller)</span>
            <span className="font-mono text-xs text-gray-700">
              {invoice.seller.walletAddress
                ? `${invoice.seller.walletAddress.slice(0, 8)}...${invoice.seller.walletAddress.slice(-6)}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Network</span>
            <span className="font-medium text-gray-900">Arc Testnet</span>
          </div>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <p className="text-xs text-amber-800 font-medium">
            This action submits a real testnet transaction. Your wallet will request a signature.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Confirm &amp; Sign
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RealSettlementSection({
  walletError,
  disabledReasons,
  arcStatus,
  arcTxHash,
  actionLoading,
  onSettle,
  onMockSettle,
  mockSettlementEnabled,
}: {
  walletError: string | null;
  disabledReasons: string[];
  arcStatus: ArcSettlementStatus;
  arcTxHash: string | null;
  actionLoading: boolean;
  onSettle: () => void;
  onMockSettle?: () => void;
  mockSettlementEnabled: boolean;
}) {
  if (arcStatus === "complete") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-700">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium">Settlement recorded successfully!</span>
        </div>
        {arcTxHash && (
          <a
            href={getArcScanTxUrl(arcTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline"
          >
            View on ArcScan →
          </a>
        )}
      </div>
    );
  }

  const isDisabled = actionLoading || !!walletError || disabledReasons.length > 0;

  return (
    <div className="space-y-3">
      {walletError && <p className="text-sm text-amber-700 font-medium">{walletError}</p>}
      {!walletError && disabledReasons.length > 0 && (
        <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
          {disabledReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        <button
          onClick={onSettle}
          disabled={isDisabled}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading ? "Processing..." : "Pay with Connected Wallet"}
        </button>
        {mockSettlementEnabled && onMockSettle && (
          <button
            onClick={onMockSettle}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Settling..." : "Demo Mock Settlement"}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        &quot;Pay with Connected Wallet&quot; executes a real USDC transfer on Arc Testnet.
      </p>
      {mockSettlementEnabled && (
        <p className="text-xs text-amber-600">
          &quot;Demo Mock Settlement&quot; is for demonstration only — no real transaction is sent.
        </p>
      )}
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary-500" />
      <span className="font-medium text-gray-900">{label}</span>
      <span className="text-gray-500">{new Date(date).toLocaleString()}</span>
    </div>
  );
}

function CheckCircleStatusButton({
  invoiceId,
  onStatusChecked,
}: {
  invoiceId: string;
  onStatusChecked: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    circleState?: string;
    stateCategory?: string;
    note?: string;
    error?: string;
  } | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(`/api/dev/invoices/${invoiceId}/check-circle-status`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        // Refresh invoice data after status change
        onStatusChecked();
      } else {
        setResult({ error: data.error || "Failed to check status" });
      }
    } catch {
      setResult({ error: "Network error while checking Circle status" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleCheck}
        disabled={checking}
        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checking ? "Checking..." : "Check Circle Status"}
      </button>
      {result && (
        <div
          className={`text-sm p-3 rounded-lg ${
            result.error
              ? "bg-red-50 border border-red-200 text-red-700"
              : result.stateCategory === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : result.stateCategory === "failure"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-yellow-50 border border-yellow-200 text-yellow-700"
          }`}
        >
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <div className="space-y-1">
              <p>
                <strong>Circle State:</strong> {result.circleState || "Unknown"}
              </p>
              <p>
                <strong>Category:</strong> {result.stateCategory || "unknown"}
              </p>
              {result.note && <p className="text-xs mt-1">{result.note}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
