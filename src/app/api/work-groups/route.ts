import { z } from "zod";
import { db } from "@/db";
import { workGroups } from "@/db/schema";
import { badRequest, created, ok, serverError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";

const input = z.object({ code: z.string().trim().min(3).max(50), name: z.string().trim().min(3).max(255), planId: z.string().uuid() });
export async function GET(request: NextRequest) { const auth = requireAuth(request); if ("response" in auth) return auth.response; try { return ok(await db.select().from(workGroups)); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest) { const denied = requireManager(request); if (denied) return denied; try { const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [group] = await db.insert(workGroups).values(parsed.data).returning(); return created(group); } catch (error) { return serverError(error); } }
