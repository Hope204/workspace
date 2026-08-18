import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { riskIssues } from "@/db/schema";
import { badRequest, created, ok, serverError } from "@/lib/api/response";
import { requireAuth, requireManager } from "@/lib/auth/request-auth";

const input = z.object({ planId: z.string().uuid(), title: z.string().trim().min(3).max(255), severity: z.enum(["Cao", "Trung bình", "Thấp"]).optional(), status: z.string().trim().min(1).max(30).optional() });
export async function GET(request: NextRequest) { const auth = requireAuth(request); if ("response" in auth) return auth.response; try { const planId = new URL(request.url).searchParams.get("planId"); return ok(await db.select().from(riskIssues).where(planId ? eq(riskIssues.planId, planId) : undefined)); } catch (error) { return serverError(error); } }
export async function POST(request: NextRequest) { const denied = requireManager(request); if (denied) return denied; try { const parsed = input.safeParse(await request.json()); if (!parsed.success) return badRequest(parsed.error); const [item] = await db.insert(riskIssues).values(parsed.data).returning(); return created(item); } catch (error) { return serverError(error); } }
