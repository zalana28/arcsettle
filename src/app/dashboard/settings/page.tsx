"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  walletAddress: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { address: connectedAddress } = useAccount();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setWalletInput(data.data.walletAddress || "");
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWallet = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: walletInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setSuccess("Wallet address saved successfully.");
      } else {
        setError(data.error || "Failed to save wallet address");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleUseConnected = () => {
    if (connectedAddress) {
      setWalletInput(connectedAddress);
      setError("");
      setSuccess("");
    }
  };

  if (loading) {
    return <div className="animate-pulse text-gray-500">Loading settings...</div>;
  }

  if (!profile) {
    return <div className="text-red-500">Failed to load profile.</div>;
  }

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletInput.trim());
  const hasChanged =
    walletInput.trim().toLowerCase() !== (profile.walletAddress || "").toLowerCase();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Settings</h1>

      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Company Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Company Name</p>
            <p className="text-base font-medium text-gray-900">{profile.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-base font-medium text-gray-900">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Wallet Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Wallet Address</h2>
        <p className="text-sm text-gray-600 mb-4">
          This is the wallet address used for settling invoices on Arc Testnet.
          Each company must have a unique wallet address.
        </p>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Current wallet */}
          {profile.walletAddress && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Wallet Address</p>
              <p className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded-lg break-all">
                {profile.walletAddress}
              </p>
            </div>
          )}

          {/* Connected wallet indicator */}
          {connectedAddress && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Connected Wallet (via browser)</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg break-all flex-1">
                  {connectedAddress}
                </p>
                <button
                  type="button"
                  onClick={handleUseConnected}
                  className="px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors whitespace-nowrap"
                >
                  Use connected wallet
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Address
            </label>
            <input
              type="text"
              value={walletInput}
              onChange={(e) => {
                setWalletInput(e.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono text-sm"
            />
            {walletInput && !isValidAddress && (
              <p className="text-xs text-red-500 mt-1">
                Invalid format. Must be 0x followed by 40 hex characters.
              </p>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveWallet}
            disabled={saving || !isValidAddress || !hasChanged}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Wallet Address"}
          </button>
        </div>
      </div>
    </div>
  );
}
