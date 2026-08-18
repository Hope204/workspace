import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { badRequest, created, noContent, ok, serverError } from "@/lib/api/response";
import { uuidSchema, workspaceInputSchema } from "@/lib/api/schemas";
import { requireManager } from "@/lib/auth/request-auth";
import { requireAuth } from "@/lib/auth/request-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try { return ok(await db.select().from(workspaces)); } catch (error) { return serverError(error); }
}
export async function POST(request: NextRequest) {
  const denied = requireManager(request); if (denied) return denied;
  try { const parsed = workspaceInputSchema.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [workspace] = await db.insert(workspaces).values(parsed.data).returning(); return created(workspace); } catch (error) { return serverError(error); }
}
export async function DELETE(request: NextRequest) {
  const denied = requireManager(request); if (denied) return denied;
  try { const parsed = uuidSchema.safeParse(new URL(request.url).searchParams.get("id")); if (!parsed.success) return badRequest("id không hợp lệ."); await db.delete(workspaces).where(eq(workspaces.id, parsed.data)); return noContent(); } catch (error) { return serverError(error); }
}
