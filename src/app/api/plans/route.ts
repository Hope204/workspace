import { NextRequest } from "next/server";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";
import { badRequest, created, ok, serverError } from "@/lib/api/response";
import { planInputSchema } from "@/lib/api/schemas";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try { return ok(await db.select().from(plans)); } catch (error) { return serverError(error); }
}

export async function POST(request: NextRequest) {
  const denied = requireManager(request); if (denied) return denied;
  try {
    const parsed = planInputSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const [plan] = await db.insert(plans).values(parsed.data).returning();
    return created(plan);
  } catch (error) { return serverError(error); }
}
