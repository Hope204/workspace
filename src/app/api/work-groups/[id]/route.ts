import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { workGroups } from "@/db/schema";
import { badRequest, noContent, notFound, ok, serverError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const patch = z.object({ name: z.string().trim().min(3).max(255).optional() });
export async function GET(request: NextRequest, { params }: Context) { const auth = requireAuth(request); if ("response" in auth) return auth.response; try { const { id } = await params; const [group] = await db.select().from(workGroups).where(eq(workGroups.id, id)); return group ? ok(group) : notFound("Nhóm công việc"); } catch (error) { return serverError(error); } }
export async function PATCH(request: NextRequest, { params }: Context) { const denied = requireManager(request); if (denied) return denied; try { const parsed = patch.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const { id } = await params; const [group] = await db.update(workGroups).set({ ...parsed.data, updatedAt: new Date() }).where(eq(workGroups.id, id)).returning(); return group ? ok(group) : notFound("Nhóm công việc"); } catch (error) { return serverError(error); } }
export async function DELETE(request: NextRequest, { params }: Context) { const denied = requireManager(request); if (denied) return denied; try { const { id } = await params; const [row] = await db.delete(workGroups).where(eq(workGroups.id, id)).returning({ id: workGroups.id }); return row ? noContent() : notFound("Nhóm công việc"); } catch (error) { return serverError(error); } }
