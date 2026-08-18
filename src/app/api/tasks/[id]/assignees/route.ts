import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { taskAssignees, users } from "@/db/schema";
import { badRequest, created, noContent, ok, serverError } from "@/lib/api/response";
import { requireTaskCreator, requireTaskAccess } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const input = z.object({ userId: z.string().uuid(), role: z.enum(["Chịu trách nhiệm", "Phối hợp", "Theo dõi"]).default("Phối hợp") });
export async function GET(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id); if (denied) return denied; const rows = await db.select({ id: taskAssignees.id, userId: users.id, code: users.code, name: users.name, role: taskAssignees.role }).from(taskAssignees).innerJoin(users, eq(taskAssignees.userId, users.id)).where(eq(taskAssignees.taskId, id)); return ok(rows); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest, { params }: Context) { const denied = requireTaskCreator(request); if (denied) return denied; try { const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const { id } = await params; const [row] = await db.insert(taskAssignees).values({ taskId: id, ...parsed.data }).returning(); return created(row); } catch (error) { return serverError(error); } }
export async function DELETE(request: NextRequest, { params }: Context) { const denied = requireTaskCreator(request); if (denied) return denied; try { const userId = new URL(request.url).searchParams.get("userId"); if (!userId) return badRequest("Thiếu userId."); const { id } = await params; await db.delete(taskAssignees).where(and(eq(taskAssignees.taskId, id), eq(taskAssignees.userId, userId))); return noContent(); } catch (error) { return serverError(error); } }
