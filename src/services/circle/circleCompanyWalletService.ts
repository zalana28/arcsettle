/**
 * Circle Company Wallet Service — Server-Side Only
 *
 * Creates and manages Circle developer-controlled wallets for companies.
 * Uses the @circle-fin/developer-controlled-wallets SDK.
 *
 * IMPORTANT: This module must only be imported in server-side code.
 */

import { prisma } from "@/lib/prisma";
import { getCircleDeveloperWalletsClient, isCircleSdkConfigured } from "./circleDeveloperWalletsSdk";
import { randomUUID } from "crypto";

export interface CreateCompanyWalletInput {
  companyId: string;
  blockchain?: string;
  accountType?: string;
}

export interface CompanyWalletResult {
  success: boolean;
  data?: {
    walletId: string;
    walletSetId: string;
    address: string;
    blockchain: string;
    accountType: string;
  };
  error?: string;
  alreadyExists?: boolean;
}

/**
 * Create a Circle developer-controlled wallet for a company.
 *
 * Flow:
 * 1. Check if company already has a Circle wallet
 * 2. Create a wallet set for the company
 * 3. Create a wallet within that wallet set
 * 4. Store wallet metadata on the company record
 */
export async function createCompanyCircleWallet(
  input: CreateCompanyWalletInput
): Promise<CompanyWalletResult> {
  if (!isCircleSdkConfigured()) {
    return {
      success: false,
      error: "Circle SDK is not configured. Set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET.",
    };
  }

  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
  });

  if (!company) {
    return { success: false, error: "Company not found" };
  }

  // If company already has a Circle wallet, return existing metadata
  if (company.circleWalletId) {
    return {
      success: true,
      alreadyExists: true,
      data: {
        walletId: company.circleWalletId,
        walletSetId: company.circleWalletSetId || "",
        address: company.circleWalletAddress || "",
        blockchain: company.circleWalletBlockchain || "",
        accountType: "EOA",
      },
    };
  }

  try {
    const client = getCircleDeveloperWalletsClient();
    const blockchain = input.blockchain || "ETH-SEPOLIA";
    const accountType = input.accountType || "EOA";

    // Step 1: Create wallet set for the company
    const walletSetResponse = await client.createWalletSet({
      idempotencyKey: randomUUID(),
      name: `ArcSettle - ${company.name}`,
    });

    const walletSet = walletSetResponse.data?.walletSet;
    if (!walletSet?.id) {
      return { success: false, error: "Failed to create Circle wallet set" };
    }

    // Step 2: Create wallet in the wallet set
    const walletResponse = await client.createWallets({
      idempotencyKey: randomUUID(),
      walletSetId: walletSet.id,
      blockchains: [blockchain as never],
      count: 1,
      accountType: accountType as never,
    });

    const wallets = walletResponse.data?.wallets;
    if (!wallets || wallets.length === 0) {
      return { success: false, error: "Failed to create Circle wallet" };
    }

    const wallet = wallets[0];

    // Step 3: Store wallet metadata on the company
    await prisma.company.update({
      where: { id: input.companyId },
      data: {
        circleWalletId: wallet.id,
        circleWalletSetId: walletSet.id,
        circleWalletAddress: wallet.address || null,
        circleWalletBlockchain: wallet.blockchain || blockchain,
        circleWalletCreatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        walletId: wallet.id,
        walletSetId: walletSet.id,
        address: wallet.address || "",
        blockchain: wallet.blockchain || blockchain,
        accountType,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create Circle wallet",
    };
  }
}
