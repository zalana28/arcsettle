import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, getTokenCookieName } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { name, email, password, countryCode, industry, walletAddress } = parsed.data;

    // Check if company already exists
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("A company with this email already exists", 409);
    }

    // Hash password and create company
    const passwordHash = await hashPassword(password);
    const company = await prisma.company.create({
      data: {
        name,
        email,
        passwordHash,
        countryCode: countryCode.toUpperCase(),
        industry,
        walletAddress: walletAddress || null,
        kycStatus: "approved", // Mock KYC - auto-approve for MVP
      },
    });

    // Create JWT token
    const token = await createToken({
      sub: company.id,
      email: company.email,
      name: company.name,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(getTokenCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return successResponse(
      {
        id: company.id,
        name: company.name,
        email: company.email,
        countryCode: company.countryCode,
        industry: company.industry,
        kycStatus: company.kycStatus,
        walletAddress: company.walletAddress,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Internal server error", 500);
  }
}
