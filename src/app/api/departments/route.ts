import { z } from "zod";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { badRequest, created, ok, serverError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";

const input = z.object({ code: z.string().trim().min(2).max(30), name: z.string().trim().min(2).max(150) });
export async function GET(request: NextRequest) { const auth = requireAuth(request); if ("response" in auth) return auth.response; try { return ok(await db.select().from(departments)); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest) { const denied = requireManager(request); if (denied) return denied; try { const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [department] = await db.insert(departments).values(parsed.data).returning(); return created(department); } catch (error) { return serverError(error); } }
