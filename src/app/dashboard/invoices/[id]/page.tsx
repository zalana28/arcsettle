"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants";

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

  const handleSettle = async () => {
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

  if (loading) {
    return <div className="animate-pulse text-gray-500">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="text-red-500">Invoice not found</div>;
  }

  const isBuyer = currentUserId === invoice.buyer.id;
  const isSeller = currentUserId === invoice.seller.id;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/invoices"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
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
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
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
          <h3 className="text-sm font-medium text-gray-500 mb-3">Seller (From)</h3>
          <p className="font-medium text-gray-900">{invoice.seller.name}</p>
          <p className="text-sm text-gray-600">{invoice.seller.email}</p>
          {invoice.seller.walletAddress && (
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {invoice.seller.walletAddress}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Buyer (To)</h3>
          <p className="font-medium text-gray-900">{invoice.buyer.name}</p>
          <p className="text-sm text-gray-600">{invoice.buyer.email}</p>
          {invoice.buyer.walletAddress && (
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {invoice.buyer.walletAddress}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {invoice.status === "pending_approval" && isBuyer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Action Required
          </h3>
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
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Ready for Settlement
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            This invoice has been approved and is ready for settlement on Arc Testnet.
          </p>
          <p className="text-sm text-blue-700 mb-4">
            Settlement fee: <strong>0.5%</strong> (${(parseFloat(invoice.amount) * 0.005).toFixed(2)} USDC)
          </p>
          <button
            onClick={handleSettle}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Settling..." : "Settle Invoice"}
          </button>
        </div>
      )}

      {/* Settlement Receipt */}
      {invoice.status === "settled" && invoice.settlementHash && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-green-800 mb-4">
            Settlement Receipt
          </h3>
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
          {invoice.transactions[0] && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <Link
                href={`/dashboard/transactions/${invoice.transactions[0].id}`}
                className="text-sm text-green-700 hover:text-green-900 hover:underline"
              >
                View Transaction Details →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Processing state */}
      {invoice.status === "processing" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-purple-800 mb-2">
            Settlement in Progress
          </h3>
          <p className="text-sm text-purple-700">
            Your invoice is being settled on Arc Testnet. This usually takes a few seconds.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-3 text-sm">
          <TimelineItem
            label="Created"
            date={invoice.createdAt}
          />
          {invoice.approvedAt && (
            <TimelineItem label="Approved" date={invoice.approvedAt} />
          )}
          {invoice.settlementDate && (
            <TimelineItem label="Settled" date={invoice.settlementDate} />
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary-500" />
      <span className="font-medium text-gray-900">{label}</span>
      <span className="text-gray-500">
        {new Date(date).toLocaleString()}
      </span>
    </div>
  );
}
