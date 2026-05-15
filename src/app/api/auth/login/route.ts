import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, getTokenCookieName } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { email, password } = parsed.data;

    // Find company
    const company = await prisma.company.findUnique({ where: { email } });
    if (!company) {
      return errorResponse("Invalid email or password", 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, company.passwordHash);
    if (!isValid) {
      return errorResponse("Invalid email or password", 401);
    }

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

    return successResponse({
      id: company.id,
      name: company.name,
      email: company.email,
      countryCode: company.countryCode,
      industry: company.industry,
      kycStatus: company.kycStatus,
      walletAddress: company.walletAddress,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
