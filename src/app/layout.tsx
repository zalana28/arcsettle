import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Settlio — B2B Invoice Settlement with USDC on Arc",
  description: "Settle B2B invoices with USDC on Arc Testnet. Connected-wallet payments, on-chain receipts, and verifiable settlement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
