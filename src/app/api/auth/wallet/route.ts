import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { z } from "zod";

const walletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum wallet address"),
});

// POST /api/auth/wallet - Save wallet address to current company profile
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = walletSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid wallet address format", 422);
    }

    const { walletAddress } = parsed.data;

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
