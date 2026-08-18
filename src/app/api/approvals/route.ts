import { and, desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { approvals } from "@/db/schema";
import { ok, serverError } from "@/lib/api/response";
import { requireManager } from "@/lib/auth/request-auth";

export async function GET(request: NextRequest) {
  const denied = requireManager(request); if (denied) return denied;
  try {
    const url = new URL(request.url); const entityId = url.searchParams.get("entityId"); const entityType = url.searchParams.get("entityType");
    const filters = [entityId ? eq(approvals.entityId, entityId) : undefined, entityType ? eq(approvals.entityType, entityType) : undefined].filter(Boolean);
    return ok(await db.select().from(approvals).where(filters.length ? and(...filters) : undefined).orderBy(desc(approvals.createdAt)));
  } catch (error) { return serverError(error); }
}
