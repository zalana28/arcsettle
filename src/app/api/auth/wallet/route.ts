import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { isValidEvmAddress, normalizeWalletAddress } from "@/lib/wallet";
import { z } from "zod";

const walletSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
});

// POST /api/auth/wallet - Save wallet address to current company profile
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = walletSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Wallet address is required", 422);
    }

    const rawAddress = parsed.data.walletAddress.trim();

    if (!isValidEvmAddress(rawAddress)) {
      return errorResponse(
        "Invalid wallet address format. Must be 0x followed by 40 hex characters.",
        422
      );
    }

    const walletAddress = normalizeWalletAddress(rawAddress);

    // Check uniqueness: no other company should have this wallet
    const existing = await prisma.company.findFirst({
      where: {
        walletAddress: { equals: walletAddress, mode: "insensitive" },
        id: { not: session.sub },
      },
    });

    if (existing) {
      return errorResponse(
        "This wallet is already used by another company.",
        409
      );
    }

    const updated = await prisma.company.update({
      where: { id: session.sub },
      data: { walletAddress },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("Save wallet error:", error);
    return errorResponse("Internal server error", 500);
  }
}
