import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { badRequest, created, noContent, ok, serverError } from "@/lib/api/response";
import { requireTaskAccess } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const input = z.object({ fileName: z.string().trim().min(1).max(255), url: z.string().url().nullable().optional() });
export async function GET(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id); if (denied) return denied; return ok(await db.select().from(attachments).where(and(eq(attachments.entityType, "task"), eq(attachments.entityId, id)))); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [row] = await db.insert(attachments).values({ entityType: "task", entityId: id, ...parsed.data }).returning(); return created(row); } catch (error) { return serverError(error); } }
export async function DELETE(request: NextRequest, { params }: Context) { try { const { id } = await params; const denied = await requireTaskAccess(request, id, true); if (denied) return denied; const attachmentId = new URL(request.url).searchParams.get("attachmentId"); if (!attachmentId) return badRequest("Thiếu attachmentId."); await db.delete(attachments).where(and(eq(attachments.id, attachmentId), eq(attachments.entityType, "task"), eq(attachments.entityId, id))); return noContent(); } catch (error) { return serverError(error); } }
