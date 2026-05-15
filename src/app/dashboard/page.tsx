"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  seller: { name: string };
  buyer: { name: string };
  createdAt: string;
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvoices(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "pending_approval").length,
    approved: invoices.filter((i) => i.status === "approved").length,
    settled: invoices.filter((i) => i.status === "settled").length,
    totalVolume: invoices
      .filter((i) => i.status === "settled")
      .reduce((sum, i) => sum + parseFloat(i.amount), 0),
  };

  if (loading) {
    return <div className="animate-pulse text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your invoice activity</p>
        </div>
        <Link
          href="/dashboard/invoices/create"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Invoices" value={stats.total.toString()} />
        <StatCard label="Pending Approval" value={stats.pending.toString()} color="yellow" />
        <StatCard label="Ready to Settle" value={stats.approved.toString()} color="blue" />
        <StatCard
          label="Settled Volume"
          value={`$${stats.totalVolume.toLocaleString()}`}
          color="green"
        />
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No invoices yet.{" "}
            <Link href="/dashboard/invoices/create" className="text-primary-600 hover:underline">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Counterparty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.seller.name} → {invoice.buyer.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${parseFloat(invoice.amount).toLocaleString()} {invoice.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          INVOICE_STATUS_COLORS[invoice.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "gray",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    gray: "bg-white border-gray-200",
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
  };

  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color] || colorClasses.gray}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
