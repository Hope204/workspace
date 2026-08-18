import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { riskIssues } from "@/db/schema";
import { badRequest, noContent, notFound, ok, serverError } from "@/lib/api/response";
import { requireManager } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const patch = z.object({ title: z.string().trim().min(3).max(255).optional(), severity: z.enum(["Cao", "Trung bình", "Thấp"]).optional(), status: z.string().trim().min(1).max(30).optional() });
export async function PATCH(request: NextRequest, { params }: Context) { const denied = requireManager(request); if (denied) return denied; try { const parsed = patch.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const { id } = await params; const [item] = await db.update(riskIssues).set({ ...parsed.data, updatedAt: new Date() }).where(eq(riskIssues.id, id)).returning(); return item ? ok(item) : notFound("Rủi ro/vấn đề"); } catch (error) { return serverError(error); } }
export async function DELETE(request: NextRequest, { params }: Context) { const denied = requireManager(request); if (denied) return denied; try { const { id } = await params; const [item] = await db.delete(riskIssues).where(eq(riskIssues.id, id)).returning(); return item ? noContent() : notFound("Rủi ro/vấn đề"); } catch (error) { return serverError(error); } }
