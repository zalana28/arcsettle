import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Arc<span className="text-primary-600">Settle</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Cross-Border B2B Invoice Settlement on Arc Testnet
        </p>
        <p className="text-gray-500 mb-12">
          Settle invoices instantly with USDC. Low fees. Full transparency.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-white text-primary-600 border border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
