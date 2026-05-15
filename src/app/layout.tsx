import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArcSettle - Cross-Border B2B Invoice Settlement",
  description: "Settle B2B invoices on Arc Testnet with USDC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
