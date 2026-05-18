import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCompanyCircleWallet } from "@/services/circle/circleCompanyWalletService";

/**
 * GET /api/dev/companies/:id/circle-wallet
 *
 * Returns stored Circle wallet metadata for a company.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      circleWalletId: true,
      circleWalletSetId: true,
      circleWalletAddress: true,
      circleWalletBlockchain: true,
      circleWalletCreatedAt: true,
    },
  });

  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      companyId: company.id,
      companyName: company.name,
      circleWalletId: company.circleWalletId,
      circleWalletSetId: company.circleWalletSetId,
      circleWalletAddress: company.circleWalletAddress,
      circleWalletBlockchain: company.circleWalletBlockchain,
      circleWalletCreatedAt: company.circleWalletCreatedAt,
    },
  });
}

/**
 * POST /api/dev/companies/:id/circle-wallet
 *
 * Creates a Circle developer-controlled wallet for a company.
 * Protected: requires CIRCLE_DEV_TOOLS_ENABLED=true.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const devToolsEnabled = process.env.CIRCLE_DEV_TOOLS_ENABLED === "true";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !devToolsEnabled) {
    return NextResponse.json(
      {
        success: false,
        error: "Circle dev tools are disabled in production. Set CIRCLE_DEV_TOOLS_ENABLED=true to enable.",
      },
      { status: 403 }
    );
  }

  const { id } = await params;

  let body: { blockchain?: string; accountType?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine, use defaults
  }

  const result = await createCompanyCircleWallet({
    companyId: id,
    blockchain: body.blockchain,
    accountType: body.accountType,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      alreadyExists: result.alreadyExists || false,
      data: result.data,
    },
    { status: result.alreadyExists ? 200 : 201 }
  );
}
