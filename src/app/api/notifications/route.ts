import { and, desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { badRequest, ok, serverError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/request-auth";

const patch = z.object({ id: z.string().uuid(), read: z.boolean() });
export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try { return ok(await db.select().from(notifications).where(eq(notifications.userId, auth.session.id)).orderBy(desc(notifications.createdAt))); } catch (error) { return serverError(error); }
}
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request); if ("response" in auth) return auth.response;
  try { const parsed = patch.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [item] = await db.update(notifications).set({ read: parsed.data.read, updatedAt: new Date() }).where(and(eq(notifications.id, parsed.data.id), eq(notifications.userId, auth.session.id))).returning(); return item ? ok(item) : badRequest("Thông báo không tồn tại hoặc không thuộc tài khoản này."); } catch (error) { return serverError(error); }
}
