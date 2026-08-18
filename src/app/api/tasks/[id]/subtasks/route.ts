import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { subtasks } from "@/db/schema";
import { badRequest, created, noContent, ok, serverError } from "@/lib/api/response";
import { requireTaskAccess } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const input = z.object({ name: z.string().trim().min(1).max(255) }); const patch = z.object({ subtaskId: z.string().uuid(), completed: z.boolean() });
export async function GET(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id); if (denied) return denied; return ok(await db.select().from(subtasks).where(eq(subtasks.taskId, id))); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [row] = await db.insert(subtasks).values({ taskId: id, ...parsed.data }).returning(); return created(row); } catch (error) { return serverError(error); } }
export async function PATCH(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const parsed = patch.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [row] = await db.update(subtasks).set({ completed: parsed.data.completed, updatedAt: new Date() }).where(and(eq(subtasks.id, parsed.data.subtaskId), eq(subtasks.taskId, id))).returning(); return row ? ok(row) : badRequest("Công việc con không thuộc công việc này."); } catch (error) { return serverError(error); } }
export async function DELETE(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const subtaskId = new URL(request.url).searchParams.get("subtaskId"); if (!subtaskId) return badRequest("Thiếu subtaskId."); await db.delete(subtasks).where(and(eq(subtasks.id, subtaskId), eq(subtasks.taskId, id))); return noContent(); } catch (error) { return serverError(error); } }
