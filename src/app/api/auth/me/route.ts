import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const company = await prisma.company.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      countryCode: true,
      industry: true,
      kycStatus: true,
      walletAddress: true,
      createdAt: true,
    },
  });

  if (!company) {
    return unauthorizedResponse();
  }

  return successResponse(company);
}
