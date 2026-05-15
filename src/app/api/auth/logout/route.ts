import { getTokenCookieName } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getTokenCookieName());
  return successResponse({ message: "Logged out" });
}
