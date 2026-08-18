import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { badRequest, created, ok, serverError } from "@/lib/api/response";
import { getSession, requireTaskAccess } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const input = z.object({ content: z.string().trim().min(1).max(5000) });
export async function GET(request: NextRequest, { params }: Context) {
  try { const { id } = await params; const denied = await requireTaskAccess(request, id); if (denied) return denied; const rows = await db.select({ id: comments.id, content: comments.content, createdAt: comments.createdAt, authorId: users.id, authorName: users.name }).from(comments).leftJoin(users, eq(comments.authorId, users.id)).where(eq(comments.taskId, id)); return ok(rows); } catch (error) { return serverError(error); }
}
export async function POST(request: NextRequest, { params }: Context) {
  try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const session = getSession(request); if (!session) return badRequest("Phiên đăng nhập không hợp lệ."); const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [comment] = await db.insert(comments).values({ taskId: id, authorId: session.id, content: parsed.data.content }).returning(); return created(comment); } catch (error) { return serverError(error); }
}
