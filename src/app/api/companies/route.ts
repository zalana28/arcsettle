import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";

// GET /api/companies - List companies (for buyer selection in invoice creation)
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const companies = await prisma.company.findMany({
    where: {
      id: { not: session.sub }, // Exclude current company
      kycStatus: "approved",
    },
    select: {
      id: true,
      name: true,
      email: true,
      countryCode: true,
      industry: true,
    },
    orderBy: { name: "asc" },
  });

  return successResponse(companies);
}
