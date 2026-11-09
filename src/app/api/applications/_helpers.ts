import { auth } from "@clerk/nextjs/server";

import { isAllowedEmail } from "@/lib/allowed-emails";

export function errorResponse(status: number, error: string) {
  return Response.json({ error }, { status });
}

// Every endpoint runs through here, so none can skip the sign-in and invite checks.
export async function withUser(handler: (userId: string) => Promise<Response>) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return errorResponse(401, "You need to sign in.");
  if (!isAllowedEmail(sessionClaims?.email)) return errorResponse(403, "You aren't invited.");

  try {
    return await handler(userId);
  } catch (error) {
    console.error("Applications API error", error);
    return errorResponse(500, "Something went wrong. Try again.");
  }
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
