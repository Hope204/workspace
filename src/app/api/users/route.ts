import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { badRequest, created, ok, serverError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";

const input = z.object({ code: z.string().trim().min(2).max(30), name: z.string().trim().min(2).max(150), email: z.string().email(), role: z.enum(["OM", "Manager", "User"]), departmentId: z.string().uuid().nullable().optional() });
export async function GET(request: NextRequest) { const auth = requireAuth(request); if ("response" in auth) return auth.response; try { return ok(await db.select().from(users)); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest) { const denied = requireManager(request); if (denied) return denied; try { const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [user] = await db.insert(users).values(parsed.data).returning(); return created(user); } catch (error) { return serverError(error); } }
