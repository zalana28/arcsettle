"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface TransactionDetail {
  invoiceId: string;
  invoiceStatus: string;
  settlementHash: string | null;
  settlementDate: string | null;
  settlementFee: string | null;
  transaction: {
    id: string;
    transactionHash: string | null;
    status: string;
    chain: string;
    fromWallet: string;
    toWallet: string;
    amount: string;
    currency: string;
  } | null;
}

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The id here is the transaction id, but we'll use settlement-status endpoint
    // which is by invoice id. For the MVP, we'll search for the invoice.
    fetchTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTransaction = async () => {
    // First get all invoices, then find the one with matching transaction
    const invoicesRes = await fetch("/api/invoices");
    const invoicesData = await invoicesRes.json();

    if (invoicesData.success) {
      // Try each invoice to find the transaction
      for (const invoice of invoicesData.data) {
        const statusRes = await fetch(
          `/api/invoices/${invoice.id}/settlement-status`
        );
        const statusData = await statusRes.json();
        if (
          statusData.success &&
          statusData.data.transaction &&
          statusData.data.transaction.id === id
        ) {
          setData(statusData.data);
          break;
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="animate-pulse text-gray-500">Loading transaction...</div>;
  }

  if (!data || !data.transaction) {
    return (
      <div>
        <Link
          href="/dashboard/invoices"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Invoices
        </Link>
        <p className="mt-4 text-gray-500">Transaction not found</p>
      </div>
    );
  }

  const tx = data.transaction;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/invoices/${data.invoiceId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Invoice
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Transaction Details
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Settlement Transaction
          </h2>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              tx.status === "confirmed"
                ? "bg-green-100 text-green-800"
                : tx.status === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
          </span>
        </div>

        <div className="space-y-4">
          <DetailRow label="Transaction Hash" value={tx.transactionHash || "—"} mono />
          <DetailRow label="Chain" value={tx.chain === "arc_testnet" ? "Arc Testnet" : tx.chain} />
          <DetailRow
            label="Amount"
            value={`$${parseFloat(tx.amount).toLocaleString()} ${tx.currency}`}
          />
          <DetailRow label="From Wallet" value={tx.fromWallet} mono />
          <DetailRow label="To Wallet" value={tx.toWallet} mono />
          <DetailRow label="Currency" value={tx.currency} />
          {data.settlementFee && (
            <DetailRow
              label="Settlement Fee"
              value={`$${parseFloat(data.settlementFee).toFixed(2)} USDC (0.5%)`}
            />
          )}
          {data.settlementDate && (
            <DetailRow
              label="Settlement Date"
              value={new Date(data.settlementDate).toLocaleString()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm text-gray-900 break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
