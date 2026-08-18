import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { workspaceInputSchema } from "@/lib/api/schemas";

type Context = { params: Promise<{ id: string }> };
const patch = workspaceInputSchema.partial();

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try { const { id } = await params; const [item] = await db.select().from(workspaces).where(eq(workspaces.id, id)); return item ? ok(item) : notFound("Workspace"); } catch (error) { return serverError(error); }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = requireManager(request); if (denied) return denied;
  try { const parsed = patch.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const { id } = await params; const [item] = await db.update(workspaces).set({ ...parsed.data, updatedAt: new Date() }).where(eq(workspaces.id, id)).returning(); return item ? ok(item) : notFound("Workspace"); } catch (error) { return serverError(error); }
}
