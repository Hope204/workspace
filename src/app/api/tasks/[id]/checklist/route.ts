import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { badRequest, created, noContent, ok, serverError } from "@/lib/api/response";
import { requireTaskAccess } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const input = z.object({ content: z.string().trim().min(1).max(1000), required: z.boolean().optional() });
const patch = z.object({ completed: z.boolean().optional(), content: z.string().trim().min(1).max(1000).optional(), required: z.boolean().optional(), itemId: z.string().uuid() });
export async function GET(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id); if (denied) return denied; return ok(await db.select().from(checklistItems).where(eq(checklistItems.taskId, id))); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [item] = await db.insert(checklistItems).values({ taskId: id, ...parsed.data }).returning(); return created(item); } catch (error) { return serverError(error); } }
export async function PATCH(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const parsed = patch.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const { itemId, ...values } = parsed.data; const [item] = await db.update(checklistItems).set({ ...values, updatedAt: new Date() }).where(and(eq(checklistItems.id, itemId), eq(checklistItems.taskId, id))).returning(); return item ? ok(item) : badRequest("Checklist không thuộc công việc này."); } catch (error) { return serverError(error); } }
export async function DELETE(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const itemId = new URL(request.url).searchParams.get("itemId"); if (!itemId) return badRequest("Thiếu itemId."); await db.delete(checklistItems).where(and(eq(checklistItems.id, itemId), eq(checklistItems.taskId, id))); return noContent(); } catch (error) { return serverError(error); } }
