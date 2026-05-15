export const SETTLEMENT_FEE_PERCENT = 0.5;
export const DEFAULT_CURRENCY = "USDC";
export const DEFAULT_CHAIN = "arc_testnet";
export const APP_NAME = "ArcSettle";

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  processing: "Processing",
  settled: "Settled",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  settled: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-600",
};
