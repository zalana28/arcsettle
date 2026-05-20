"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEMO_ACCOUNTS = [
  { label: "Seller", email: "seller@arcsettle.dev", password: "password123" },
  { label: "Buyer", email: "buyer@arcsettle.dev", password: "password123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setForm({ email, password });
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sett<span className="text-primary-600">lio</span>
          </h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="company@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary-600 hover:underline">
              Register
            </Link>
          </p>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            Demo Accounts
          </h2>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email, account.password)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-200 rounded-lg transition-colors text-left group"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary-700">
                    {account.label}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">{account.email}</span>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-primary-500">
                  Click to fill
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Mode Note */}
        <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
            Demo Flow
          </h3>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Create an invoice as the <strong>Seller</strong></li>
            <li>Log out, then approve it as the <strong>Buyer</strong></li>
            <li>Settle the invoice (mock on-chain settlement)</li>
            <li>View the settlement receipt &amp; transaction details</li>
          </ol>
          <p className="text-xs text-blue-500 mt-2">
            No real funds are transferred. This demo uses mock settlement.
          </p>
        </div>
      </div>
    </div>
  );
}
