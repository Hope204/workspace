import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { badRequest, noContent, notFound, ok, serverError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";

type Context = { params: Promise<{ id: string }> };
const patch = z.object({ name: z.string().trim().min(3).max(255).optional() });
export async function GET(request: NextRequest, { params }: Context) { const auth = requireAuth(request); if ("response" in auth) return auth.response; try { const { id } = await params; const [project] = await db.select().from(projects).where(eq(projects.id, id)); return project ? ok(project) : notFound("Dự án"); } catch (error) { return serverError(error); } }
export async function PATCH(request: NextRequest, { params }: Context) { const denied = requireManager(request); if (denied) return denied; try { const parsed = patch.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const { id } = await params; const [project] = await db.update(projects).set({ ...parsed.data, updatedAt: new Date() }).where(eq(projects.id, id)).returning(); return project ? ok(project) : notFound("Dự án"); } catch (error) { return serverError(error); } }
export async function DELETE(request: NextRequest, { params }: Context) { const denied = requireManager(request); if (denied) return denied; try { const { id } = await params; const [row] = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id }); return row ? noContent() : notFound("Dự án"); } catch (error) { return serverError(error); } }
